"""Cấu hình nhà cung cấp mô hình do ban tổ chức chọn trong trang quản trị.

Tách khỏi ``Settings`` (vốn đọc biến môi trường lúc khởi động) vì đây là thứ
đổi được lúc đang chạy. Biến môi trường trở thành giá trị mặc định cho lần đầu.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from app.core.config import get_settings
from app.services import firestore as fs
from app.services import secrets

logger = logging.getLogger(__name__)

CONFIG_DOC = "llm_providers"

# Nhà cung cấp và khả năng của từng bên. Bảng này là nguồn sự thật cho cả API
# lẫn giao diện quản trị.
PROVIDERS: dict[str, dict[str, Any]] = {
    "vertex": {
        "label": "Google Vertex AI",
        "description": "Gemini chạy trong chính project GCP, xác thực bằng IAM. Không cần khóa API.",
        "needsKey": False,
        "chat": True,
        "embedding": True,
        "defaultChatModel": "gemini-2.5-flash",
        "defaultReasoningModel": "gemini-2.5-pro",
        "defaultEmbeddingModel": "text-embedding-004",
        "keyHint": "",
    },
    "gemini": {
        "label": "Google Gemini (AI Studio)",
        "description": "Gemini qua khóa API của Google AI Studio. Dùng khi chưa bật Vertex AI.",
        "needsKey": True,
        "chat": True,
        "embedding": True,
        "defaultChatModel": "gemini-2.5-flash",
        "defaultReasoningModel": "gemini-2.5-pro",
        "defaultEmbeddingModel": "text-embedding-004",
        "keyHint": "Lấy tại aistudio.google.com/apikey. Khóa thường bắt đầu bằng AIza.",
    },
    "anthropic": {
        "label": "Claude (Anthropic)",
        "description": "Chất lượng tiếng Việt tốt cho câu so sánh và tư vấn chọn khóa.",
        "needsKey": True,
        "chat": True,
        "embedding": False,
        "defaultChatModel": "claude-sonnet-5",
        "defaultReasoningModel": "claude-sonnet-5",
        "defaultEmbeddingModel": "",
        "keyHint": "Lấy tại console.anthropic.com. Khóa bắt đầu bằng sk-ant-.",
    },
    "openai": {
        "label": "OpenAI",
        "description": "GPT cho hội thoại và text-embedding-3 cho truy hồi.",
        "needsKey": True,
        "chat": True,
        "embedding": True,
        "defaultChatModel": "gpt-4o-mini",
        "defaultReasoningModel": "gpt-4o",
        "defaultEmbeddingModel": "text-embedding-3-small",
        "keyHint": "Lấy tại platform.openai.com/api-keys. Khóa bắt đầu bằng sk-.",
    },
    "echo": {
        "label": "Chế độ thử (không gọi mạng)",
        "description": "Trả lời bằng chính đoạn tài liệu truy hồi được. Dùng để kiểm thử, không dùng cho người thật.",
        "needsKey": False,
        "chat": True,
        "embedding": True,
        "defaultChatModel": "echo",
        "defaultReasoningModel": "echo",
        "defaultEmbeddingModel": "echo",
        "keyHint": "",
    },
}

CHAT_PROVIDERS = [k for k, v in PROVIDERS.items() if v["chat"]]
EMBEDDING_PROVIDERS = [k for k, v in PROVIDERS.items() if v["embedding"]]


@dataclass
class LlmConfig:
    chat_provider: str
    embedding_provider: str
    chat_model: str
    reasoning_model: str
    embedding_model: str
    updated_at: str = ""
    updated_by: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "chatProvider": self.chat_provider,
            "embeddingProvider": self.embedding_provider,
            "chatModel": self.chat_model,
            "reasoningModel": self.reasoning_model,
            "embeddingModel": self.embedding_model,
            "updatedAt": self.updated_at,
            "updatedBy": self.updated_by,
        }


_cache: LlmConfig | None = None
_on_change: list = []


def default_config() -> LlmConfig:
    settings = get_settings()
    provider = settings.llm_provider if settings.llm_provider in PROVIDERS else "vertex"
    spec = PROVIDERS[provider]
    embedding = provider if spec["embedding"] else "vertex"
    return LlmConfig(
        chat_provider=provider,
        embedding_provider=embedding,
        chat_model=settings.chat_model if provider.startswith(("vertex", "gemini")) else spec["defaultChatModel"],
        reasoning_model=settings.reasoning_model
        if provider.startswith(("vertex", "gemini"))
        else spec["defaultReasoningModel"],
        embedding_model=PROVIDERS[embedding]["defaultEmbeddingModel"],
    )


def get_config() -> LlmConfig:
    global _cache
    if _cache is not None:
        return _cache

    stored = fs.get_document("app_config", CONFIG_DOC)
    base = default_config()
    if stored:
        base = LlmConfig(
            chat_provider=stored.get("chatProvider", base.chat_provider),
            embedding_provider=stored.get("embeddingProvider", base.embedding_provider),
            chat_model=stored.get("chatModel", base.chat_model),
            reasoning_model=stored.get("reasoningModel", base.reasoning_model),
            embedding_model=stored.get("embeddingModel", base.embedding_model),
            updated_at=stored.get("updatedAt", ""),
            updated_by=stored.get("updatedBy", ""),
        )
    _cache = base
    return _cache


def save_config(config: LlmConfig) -> None:
    global _cache
    fs.add_document("app_config", config.as_dict(), doc_id=CONFIG_DOC)
    _cache = config
    invalidate()


def invalidate() -> None:
    """Buộc tầng provider dựng lại client với cấu hình và khóa mới."""
    global _cache
    _cache = None
    for callback in _on_change:
        try:
            callback()
        except Exception as exc:  # pragma: no cover
            logger.warning("Lỗi khi làm mới provider: %s", exc)


def on_change(callback) -> None:
    _on_change.append(callback)


def validate(chat_provider: str, embedding_provider: str) -> list[str]:
    """Trả về danh sách lý do cấu hình không dùng được. Rỗng nghĩa là hợp lệ."""
    problems: list[str] = []

    if chat_provider not in CHAT_PROVIDERS:
        problems.append(f"Nhà cung cấp hội thoại không hợp lệ: {chat_provider}")
    if embedding_provider not in EMBEDDING_PROVIDERS:
        problems.append(
            f"“{PROVIDERS.get(embedding_provider, {}).get('label', embedding_provider)}” "
            "không có dịch vụ embedding, không dùng cho truy hồi được."
        )

    for provider, role in ((chat_provider, "hội thoại"), (embedding_provider, "truy hồi")):
        spec = PROVIDERS.get(provider)
        if spec and spec["needsKey"] and not secrets.get_secret(provider):
            problems.append(
                f"Chưa nhập khóa API cho {spec['label']} — không dùng cho {role} được."
            )

    return problems
