"""LLM Gateway — chọn nhà cung cấp theo cấu hình."""

from __future__ import annotations

import logging
from functools import lru_cache

from app.core.config import Settings, get_settings
from app.providers.base import LlmMessage, LlmProvider, LlmRequest, LlmUsage

logger = logging.getLogger(__name__)

__all__ = ["LlmMessage", "LlmProvider", "LlmRequest", "LlmUsage", "get_provider", "get_embedder"]


def _build(name: str, settings: Settings) -> LlmProvider:
    if name == "vertex":
        from app.providers.vertex import VertexProvider

        return VertexProvider(settings)
    if name == "anthropic":
        from app.providers.anthropic import AnthropicProvider

        return AnthropicProvider(settings)
    if name == "echo":
        from app.providers.echo import EchoProvider

        return EchoProvider(settings)
    raise ValueError(f"Nhà cung cấp mô hình không hỗ trợ: {name}")


@lru_cache
def get_provider() -> LlmProvider:
    settings = get_settings()
    try:
        return _build(settings.llm_provider, settings)
    except Exception as exc:  # pragma: no cover
        logger.warning("Không khởi tạo được provider %s (%s), chuyển sang echo.",
                       settings.llm_provider, exc)
        return _build("echo", settings)


@lru_cache
def get_embedder() -> LlmProvider:
    """Provider dùng cho embedding.

    Claude API không có embedding nên khi chọn provider đó, phần embedding
    tự động quay về Vertex AI.
    """
    settings = get_settings()
    if settings.llm_provider == "anthropic":
        try:
            return _build("vertex", settings)
        except Exception:  # pragma: no cover
            return _build("echo", settings)
    return get_provider()
