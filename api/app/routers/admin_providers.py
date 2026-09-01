"""Quản trị nhà cung cấp mô hình: nhập khóa API, chọn bên dùng, kiểm tra kết nối.

Nguyên tắc xuyên suốt: khóa API **chỉ ghi vào**. Không endpoint nào trả khóa
ra, kể cả cho Super Admin. Trang quản trị chỉ thấy trạng thái và 4 ký tự cuối.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException

from app.core.security import AdminIdentity, require_super_admin, require_viewer
from app.providers import LlmMessage, LlmRequest, build_provider, reset_providers
from app.services import firestore as fs
from app.services import secrets
from app.services.llm_settings import (
    CHAT_PROVIDERS,
    EMBEDDING_PROVIDERS,
    PROVIDERS,
    LlmConfig,
    get_config,
    save_config,
    validate,
)
from app.services.retrieval import get_retrieval

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/providers", tags=["admin-providers"])


def _provider_view(name: str) -> dict[str, Any]:
    spec = PROVIDERS[name]
    status = secrets.status(name) if spec["needsKey"] else None
    return {
        "id": name,
        "label": spec["label"],
        "description": spec["description"],
        "needsKey": spec["needsKey"],
        "supportsChat": spec["chat"],
        "supportsEmbedding": spec["embedding"],
        "keyHint": spec["keyHint"],
        "defaultChatModel": spec["defaultChatModel"],
        "defaultReasoningModel": spec["defaultReasoningModel"],
        "defaultEmbeddingModel": spec["defaultEmbeddingModel"],
        "keyConfigured": bool(status and status.configured),
        "keyPreview": status.preview if status else "",
        "keySource": status.source if status else "not_needed",
        "keyUpdatedAt": status.updated_at.isoformat() if status and status.updated_at else "",
    }


@router.get("")
def list_providers(identity: AdminIdentity = Depends(require_viewer)) -> dict[str, Any]:
    config = get_config()
    return {
        "providers": [_provider_view(name) for name in PROVIDERS],
        "active": config.as_dict(),
        "chatProviders": CHAT_PROVIDERS,
        "embeddingProviders": EMBEDDING_PROVIDERS,
        "problems": validate(config.chat_provider, config.embedding_provider),
        "knowledgeBase": {"chunks": get_retrieval().size, "ready": get_retrieval().ready},
    }


@router.put("/{provider}/key")
def set_key(
    provider: str,
    apiKey: str = Body(embed=True),
    identity: AdminIdentity = Depends(require_super_admin),
) -> dict[str, Any]:
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Không có nhà cung cấp {provider}.")
    if not PROVIDERS[provider]["needsKey"]:
        raise HTTPException(
            status_code=400,
            detail=f"{PROVIDERS[provider]['label']} dùng IAM của project, không cần khóa API.",
        )

    value = apiKey.strip()
    if len(value) < 12:
        raise HTTPException(status_code=400, detail="Khóa API quá ngắn, có vẻ chưa dán đủ.")

    status = secrets.set_secret(provider, value)
    reset_providers()
    # Ghi nhật ký nhưng KHÔNG bao giờ ghi giá trị khóa.
    fs.write_audit(
        identity.email,
        "provider.key_set",
        f"providers/{provider}",
        after={"configured": True, "preview": status.preview, "source": status.source},
    )

    message = f"Đã lưu khóa cho {PROVIDERS[provider]['label']}."
    if status.source == "memory":
        message += (
            " Lưu ý: hiện lưu trong bộ nhớ tiến trình nên sẽ mất khi service khởi động lại. "
            "Trên GCP cần cấp quyền Secret Manager cho service account."
        )
    return {"ok": True, "message": message, "provider": _provider_view(provider)}


@router.delete("/{provider}/key")
def delete_key(
    provider: str, identity: AdminIdentity = Depends(require_super_admin)
) -> dict[str, Any]:
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Không có nhà cung cấp {provider}.")

    config = get_config()
    if provider in (config.chat_provider, config.embedding_provider):
        raise HTTPException(
            status_code=400,
            detail=(
                f"{PROVIDERS[provider]['label']} đang được dùng. "
                "Hãy chuyển sang nhà cung cấp khác trước khi xóa khóa."
            ),
        )

    secrets.delete_secret(provider)
    reset_providers()
    fs.write_audit(identity.email, "provider.key_deleted", f"providers/{provider}")
    return {"ok": True, "message": f"Đã xóa khóa của {PROVIDERS[provider]['label']}."}


@router.post("/{provider}/test")
async def test_provider(
    provider: str, identity: AdminIdentity = Depends(require_super_admin)
) -> dict[str, Any]:
    """Gọi thử một câu ngắn để xác nhận khóa dùng được.

    Chạy trực tiếp trên provider vừa dựng, không đụng tới cấu hình đang chạy,
    nên kiểm tra được khóa mới trước khi chuyển sang dùng nó.
    """
    if provider not in PROVIDERS:
        raise HTTPException(status_code=404, detail=f"Không có nhà cung cấp {provider}.")

    spec = PROVIDERS[provider]
    result: dict[str, Any] = {"provider": provider, "label": spec["label"]}

    try:
        instance = build_provider(provider)
    except Exception as exc:
        return {**result, "ok": False, "error": f"Không khởi tạo được: {exc}"}

    # Thử sinh văn bản
    started = time.perf_counter()
    try:
        answer = await instance.complete(
            LlmRequest(
                system="Trả lời đúng một từ.",
                messages=[LlmMessage(role="user", content="Nói: xong")],
                model=spec["defaultChatModel"],
                max_output_tokens=16,
                temperature=0,
            )
        )
        result["chat"] = {
            "ok": True,
            "latencyMs": round((time.perf_counter() - started) * 1000),
            "sample": (answer or "").strip()[:80],
        }
    except Exception as exc:
        result["chat"] = {"ok": False, "error": _readable_error(exc)}

    # Thử embedding nếu bên đó có
    if spec["embedding"]:
        started = time.perf_counter()
        try:
            vectors = await instance.embed(["kiểm tra kết nối"], "RETRIEVAL_QUERY")
            result["embedding"] = {
                "ok": bool(vectors and vectors[0]),
                "latencyMs": round((time.perf_counter() - started) * 1000),
                "dimensions": len(vectors[0]) if vectors else 0,
            }
        except Exception as exc:
            result["embedding"] = {"ok": False, "error": _readable_error(exc)}
    else:
        result["embedding"] = {"ok": False, "unsupported": True}

    result["ok"] = result["chat"].get("ok", False)
    return result


def _readable_error(exc: Exception) -> str:
    """Thông báo lỗi gọn cho người vận hành, không lộ khóa hay nội dung request."""
    text = str(exc)
    if "401" in text or "invalid_api_key" in text or "authentication" in text.lower():
        return "Khóa API không hợp lệ hoặc đã bị thu hồi."
    if "429" in text:
        return "Nhà cung cấp báo vượt hạn mức. Kiểm tra hạn mức của tài khoản."
    if "404" in text and "model" in text.lower():
        return "Không tìm thấy model. Kiểm tra lại tên model."
    if "PERMISSION_DENIED" in text:
        return "Tài khoản chưa được cấp quyền gọi dịch vụ này."
    return text[:200]


@router.put("/active")
async def set_active(
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_super_admin),
) -> dict[str, Any]:
    current = get_config()
    chat_provider = str(payload.get("chatProvider", current.chat_provider))
    embedding_provider = str(payload.get("embeddingProvider", current.embedding_provider))

    problems = validate(chat_provider, embedding_provider)
    if problems:
        raise HTTPException(status_code=400, detail=" ".join(problems))

    chat_spec = PROVIDERS[chat_provider]
    embed_spec = PROVIDERS[embedding_provider]
    new_config = LlmConfig(
        chat_provider=chat_provider,
        embedding_provider=embedding_provider,
        chat_model=str(payload.get("chatModel") or chat_spec["defaultChatModel"]),
        reasoning_model=str(payload.get("reasoningModel") or chat_spec["defaultReasoningModel"]),
        embedding_model=str(payload.get("embeddingModel") or embed_spec["defaultEmbeddingModel"]),
        updated_at=__import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
        updated_by=identity.email,
    )

    # Đổi bên tạo embedding là đổi hẳn không gian vector: mọi vector cũ trở nên
    # vô nghĩa và truy hồi sẽ trả về kết quả ngẫu nhiên. Phải index lại ngay,
    # không để ban tổ chức tự nhớ.
    embedding_changed = (
        embedding_provider != current.embedding_provider
        or new_config.embedding_model != current.embedding_model
    )

    save_config(new_config)
    fs.write_audit(
        identity.email,
        "provider.active_changed",
        "app_config/llm_providers",
        before=current.as_dict(),
        after=new_config.as_dict(),
    )

    message = f"Đã chuyển sang {chat_spec['label']} cho hội thoại."
    reindexed = 0
    if embedding_changed:
        reindexed = await get_retrieval().reindex()
        message += (
            f" Vì đổi bên tạo embedding, Knowledge Base đã được index lại "
            f"({reindexed} chunk) — nếu không, truy hồi sẽ trả về kết quả sai."
        )

    return {
        "ok": True,
        "message": message,
        "active": new_config.as_dict(),
        "reindexed": reindexed,
    }
