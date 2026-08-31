"""Nhà cung cấp giả lập, không gọi mạng.

Dùng cho kiểm thử và chạy cục bộ khi chưa có quyền GCP: trả lời bằng cách
tóm lược chính ngữ cảnh đã truy hồi, nhờ đó vẫn kiểm tra được toàn bộ luồng
RAG, trích dẫn và guardrail.
"""

from __future__ import annotations

import hashlib
import math
import re
from typing import AsyncIterator

from app.core.config import Settings
from app.providers.base import LlmProvider, LlmRequest, LlmUsage

_CONTEXT_RE = re.compile(r"\[NGUỒN \d+ \| [^\]]+\]\n(.+?)(?=\n\[NGUỒN |\Z)", re.DOTALL)


class EchoProvider(LlmProvider):
    """Trả lời bằng trích đoạn ngữ cảnh, embedding bằng hash tất định."""

    name = "echo"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._last_usage = LlmUsage()

    def _answer(self, request: LlmRequest) -> str:
        last_user = next(
            (m.content for m in reversed(request.messages) if m.role == "user"), ""
        )
        passages = _CONTEXT_RE.findall(last_user)
        if not passages:
            return "Chưa có ngữ cảnh phù hợp để trả lời."
        lines: list[str] = []
        for passage in passages[:3]:
            for sentence in passage.strip().split("\n"):
                sentence = sentence.strip()
                if len(sentence) > 30:
                    lines.append(sentence)
                    break
        self._last_usage = LlmUsage(
            input_tokens=len(last_user) // 3, output_tokens=sum(len(x) for x in lines) // 3
        )
        return "\n".join(f"- {line}" for line in lines[:5])

    async def stream(self, request: LlmRequest) -> AsyncIterator[str]:
        for token in self._answer(request).split(" "):
            yield token + " "

    async def complete(self, request: LlmRequest) -> str:
        return self._answer(request)

    async def embed(
        self, texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT"
    ) -> list[list[float]]:
        """Embedding tất định dựa trên bag-of-words đã hash.

        Không thay được mô hình thật, nhưng đủ để kiểm thử luồng truy hồi:
        hai đoạn văn dùng chung nhiều từ sẽ có cosine similarity cao.
        """
        dim = self.settings.embedding_dimensions
        vectors: list[list[float]] = []
        for text in texts:
            vec = [0.0] * dim
            for word in re.findall(r"\w+", text.lower()):
                idx = int(hashlib.md5(word.encode()).hexdigest(), 16) % dim
                vec[idx] += 1.0
            norm = math.sqrt(sum(v * v for v in vec)) or 1.0
            vectors.append([v / norm for v in vec])
        return vectors
