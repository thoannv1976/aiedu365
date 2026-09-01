"""LLM Gateway — chọn nhà cung cấp theo cấu hình ban tổ chức đặt trong trang quản trị.

Client được dựng lại mỗi khi cấu hình hoặc khóa API thay đổi, nên đổi nhà cung
cấp có hiệu lực ngay, không cần khởi động lại service.
"""

from __future__ import annotations

import logging
import threading

from app.core.config import Settings, get_settings
from app.providers.base import LlmMessage, LlmProvider, LlmRequest, LlmUsage

logger = logging.getLogger(__name__)

__all__ = [
    "LlmMessage",
    "LlmProvider",
    "LlmRequest",
    "LlmUsage",
    "build_provider",
    "get_provider",
    "get_embedder",
    "reset_providers",
]

_lock = threading.Lock()
_chat_cache: tuple[str, LlmProvider] | None = None
_embed_cache: tuple[str, LlmProvider] | None = None


def build_provider(name: str, settings: Settings | None = None) -> LlmProvider:
    """Dựng một provider theo tên, lấy khóa API từ kho bí mật."""
    from app.services import secrets

    settings = settings or get_settings()

    if name in ("vertex", "gemini"):
        from app.providers.google import GoogleProvider

        return GoogleProvider(settings, api_key=secrets.get_secret("gemini") if name == "gemini" else "")
    if name == "anthropic":
        from app.providers.anthropic import AnthropicProvider

        return AnthropicProvider(settings, api_key=secrets.get_secret("anthropic"))
    if name == "openai":
        from app.providers.openai import OpenAIProvider

        return OpenAIProvider(settings, api_key=secrets.get_secret("openai"))
    if name == "echo":
        from app.providers.echo import EchoProvider

        return EchoProvider(settings)

    raise ValueError(f"Nhà cung cấp mô hình không hỗ trợ: {name}")


def _apply_models(settings: Settings) -> None:
    """Đồng bộ tên model từ cấu hình quản trị sang settings dùng chung."""
    from app.services.llm_settings import get_config

    config = get_config()
    settings.chat_model = config.chat_model
    settings.reasoning_model = config.reasoning_model
    settings.embedding_model = config.embedding_model
    settings.openai_model = config.chat_model if config.chat_provider == "openai" else settings.openai_model
    settings.anthropic_model = (
        config.chat_model if config.chat_provider == "anthropic" else settings.anthropic_model
    )
    settings.openai_embedding_model = (
        config.embedding_model
        if config.embedding_provider == "openai"
        else settings.openai_embedding_model
    )


def get_provider() -> LlmProvider:
    """Provider dùng để sinh câu trả lời."""
    global _chat_cache
    from app.services.llm_settings import get_config

    settings = get_settings()
    _apply_models(settings)
    name = get_config().chat_provider

    with _lock:
        if _chat_cache and _chat_cache[0] == name:
            return _chat_cache[1]
        try:
            provider = build_provider(name, settings)
        except Exception as exc:  # pragma: no cover
            logger.error("Không khởi tạo được %s (%s), tạm dùng chế độ thử.", name, exc)
            provider = build_provider("echo", settings)
        _chat_cache = (name, provider)
        return provider


def get_embedder() -> LlmProvider:
    """Provider dùng để tạo vector truy hồi.

    Tách riêng vì Claude không có dịch vụ embedding: ban tổ chức có thể dùng
    Claude cho hội thoại và Gemini hoặc OpenAI cho truy hồi.
    """
    global _embed_cache
    from app.services.llm_settings import get_config

    settings = get_settings()
    _apply_models(settings)
    name = get_config().embedding_provider

    with _lock:
        if _embed_cache and _embed_cache[0] == name:
            return _embed_cache[1]
        try:
            provider = build_provider(name, settings)
        except Exception as exc:  # pragma: no cover
            logger.error("Không khởi tạo được embedder %s (%s), tạm dùng chế độ thử.", name, exc)
            provider = build_provider("echo", settings)
        _embed_cache = (name, provider)
        return provider


def reset_providers() -> None:
    """Xóa client đã dựng — gọi sau khi đổi cấu hình hoặc khóa API."""
    global _chat_cache, _embed_cache
    with _lock:
        _chat_cache = None
        _embed_cache = None
