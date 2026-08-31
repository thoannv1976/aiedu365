"""Giao diện chung cho các nhà cung cấp mô hình.

Lớp trừu tượng này là "LLM Gateway" thu nhỏ: đổi nhà cung cấp chỉ cần đổi
biến môi trường ``LLM_PROVIDER``, phần còn lại của hệ thống không đổi.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from typing import AsyncIterator


@dataclass
class LlmMessage:
    role: str  # "user" | "assistant"
    content: str


@dataclass
class LlmRequest:
    system: str
    messages: list[LlmMessage]
    model: str | None = None
    temperature: float = 0.2
    max_output_tokens: int = 1400
    metadata: dict[str, str] = field(default_factory=dict)


@dataclass
class LlmUsage:
    input_tokens: int = 0
    output_tokens: int = 0


class LlmProvider(abc.ABC):
    name: str = "base"

    @abc.abstractmethod
    async def stream(self, request: LlmRequest) -> AsyncIterator[str]:
        """Sinh câu trả lời theo từng đoạn."""
        raise NotImplementedError

    @abc.abstractmethod
    async def complete(self, request: LlmRequest) -> str:
        """Sinh câu trả lời một lần, dùng cho các tác vụ nội bộ như phân loại ý định."""
        raise NotImplementedError

    async def embed(self, texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
        raise NotImplementedError(f"{self.name} không hỗ trợ embedding.")

    @property
    def last_usage(self) -> LlmUsage:
        return getattr(self, "_last_usage", LlmUsage())
