"""Lưu và đọc khóa API của các nhà cung cấp mô hình.

Nguyên tắc: khóa chỉ **ghi vào**, không bao giờ đọc ngược ra qua API. Trang
quản trị chỉ thấy trạng thái "đã cấu hình" kèm 4 ký tự cuối, đủ để đối chiếu
mà không lộ khóa.

Nơi lưu:
* **Secret Manager** khi chạy trên GCP — đúng chỗ dành cho bí mật, có phiên
  bản và kiểm soát truy cập riêng.
* **Bộ nhớ tiến trình** khi chưa có Secret Manager (phát triển cục bộ). Không
  bao giờ ghi khóa xuống đĩa hay vào Firestore: Firestore có nhiều tài khoản
  đọc được, còn khóa API thì không nên nằm cạnh dữ liệu nghiệp vụ.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from datetime import datetime, timezone

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Tên bí mật cho từng nhà cung cấp. Chỉ những tên trong bảng này được chấp nhận,
# nên không thể dùng endpoint quản trị để đọc/ghi bí mật tùy ý trong project.
SECRET_NAMES: dict[str, str] = {
    "anthropic": "aiedu365-anthropic-api-key",
    "openai": "aiedu365-openai-api-key",
    "gemini": "aiedu365-gemini-api-key",
}

_memory: dict[str, str] = {}
_meta: dict[str, datetime] = {}
_lock = threading.Lock()


@dataclass(frozen=True)
class SecretStatus:
    configured: bool
    preview: str = ""
    """4 ký tự cuối, đủ để đối chiếu mà không lộ khóa."""
    updated_at: datetime | None = None
    source: str = "none"
    """secret_manager | memory | env | none"""


def _mask(value: str) -> str:
    return f"…{value[-4:]}" if len(value) >= 4 else "…"


def _client():
    try:
        from google.cloud import secretmanager

        return secretmanager.SecretManagerServiceClient()
    except Exception as exc:  # pragma: no cover - phụ thuộc hạ tầng
        logger.debug("Không dùng được Secret Manager: %s", exc)
        return None


def _env_fallback(provider: str) -> str:
    """Khóa đặt sẵn bằng biến môi trường, dùng khi chưa nhập qua trang quản trị."""
    settings = get_settings()
    return {
        "anthropic": settings.anthropic_api_key,
        "openai": settings.openai_api_key,
        "gemini": settings.gemini_api_key,
    }.get(provider, "")


def set_secret(provider: str, value: str) -> SecretStatus:
    """Lưu khóa. Giá trị rỗng tương đương xóa."""
    if provider not in SECRET_NAMES:
        raise ValueError(f"Nhà cung cấp không hợp lệ: {provider}")

    value = value.strip()
    if not value:
        return delete_secret(provider)

    settings = get_settings()
    name = SECRET_NAMES[provider]
    client = _client()

    if client is not None:
        try:
            parent = f"projects/{settings.gcp_project}"
            secret_path = f"{parent}/secrets/{name}"
            try:
                client.get_secret(request={"name": secret_path})
            except Exception:
                client.create_secret(
                    request={
                        "parent": parent,
                        "secret_id": name,
                        "secret": {"replication": {"automatic": {}}},
                    }
                )
            client.add_secret_version(
                request={"parent": secret_path, "payload": {"data": value.encode()}}
            )
            logger.info("Đã lưu khóa %s vào Secret Manager", provider)
            with _lock:
                _memory[provider] = value  # dùng ngay, không đợi vòng đọc sau
                _meta[provider] = datetime.now(timezone.utc)
            return SecretStatus(True, _mask(value), _meta[provider], "secret_manager")
        except Exception as exc:  # pragma: no cover - phụ thuộc hạ tầng
            logger.error("Ghi Secret Manager thất bại (%s): %s", provider, exc)

    with _lock:
        _memory[provider] = value
        _meta[provider] = datetime.now(timezone.utc)
    logger.warning(
        "Đã lưu khóa %s trong bộ nhớ tiến trình (mất khi khởi động lại). "
        "Trên GCP hãy cấp quyền Secret Manager cho service account.",
        provider,
    )
    return SecretStatus(True, _mask(value), _meta[provider], "memory")


def get_secret(provider: str) -> str:
    """Đọc khóa để gọi mô hình. Không dùng cho bất kỳ đường trả về API nào."""
    if provider not in SECRET_NAMES:
        return ""

    with _lock:
        cached = _memory.get(provider)
    if cached:
        return cached

    settings = get_settings()
    client = _client()
    if client is not None:
        try:
            path = f"projects/{settings.gcp_project}/secrets/{SECRET_NAMES[provider]}/versions/latest"
            payload = client.access_secret_version(request={"name": path})
            value = payload.payload.data.decode()
            with _lock:
                _memory[provider] = value
            return value
        except Exception as exc:  # pragma: no cover
            logger.debug("Chưa có khóa %s trong Secret Manager: %s", provider, exc)

    return _env_fallback(provider)


def delete_secret(provider: str) -> SecretStatus:
    if provider not in SECRET_NAMES:
        raise ValueError(f"Nhà cung cấp không hợp lệ: {provider}")

    settings = get_settings()
    client = _client()
    if client is not None:
        try:
            client.delete_secret(
                request={
                    "name": f"projects/{settings.gcp_project}/secrets/{SECRET_NAMES[provider]}"
                }
            )
        except Exception as exc:  # pragma: no cover
            logger.debug("Không xóa được bí mật %s: %s", provider, exc)

    with _lock:
        _memory.pop(provider, None)
        _meta.pop(provider, None)
    return SecretStatus(False)


def status(provider: str) -> SecretStatus:
    """Trạng thái khóa, an toàn để trả về trang quản trị."""
    if provider not in SECRET_NAMES:
        return SecretStatus(False)

    with _lock:
        cached = _memory.get(provider)
        updated = _meta.get(provider)
    if cached:
        source = "secret_manager" if _client() is not None else "memory"
        return SecretStatus(True, _mask(cached), updated, source)

    stored = get_secret(provider)
    if stored:
        source = "env" if stored == _env_fallback(provider) else "secret_manager"
        return SecretStatus(True, _mask(stored), None, source)

    return SecretStatus(False)


def all_status() -> dict[str, SecretStatus]:
    return {provider: status(provider) for provider in SECRET_NAMES}
