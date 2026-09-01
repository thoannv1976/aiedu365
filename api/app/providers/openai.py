"""OpenAI — gọi thẳng HTTP API.

Không thêm SDK vào phụ thuộc: hai endpoint cần dùng đều đơn giản, và giữ số
thư viện bên thứ ba ở mức tối thiểu giúp việc vá lỗi bảo mật nhẹ hơn.
"""

from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from app.core.config import Settings
from app.providers.base import LlmProvider, LlmRequest, LlmUsage

_CHAT_URL = "https://api.openai.com/v1/chat/completions"
_EMBED_URL = "https://api.openai.com/v1/embeddings"


class OpenAIProvider(LlmProvider):
    name = "openai"

    def __init__(self, settings: Settings, api_key: str = "") -> None:
        self.settings = settings
        self.api_key = api_key or settings.openai_api_key
        self._last_usage = LlmUsage()

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise RuntimeError("Chưa cấu hình khóa API của OpenAI.")
        return {
            "authorization": f"Bearer {self.api_key}",
            "content-type": "application/json",
        }

    def _payload(self, request: LlmRequest, stream: bool) -> dict:
        return {
            "model": request.model or self.settings.openai_model,
            "messages": [
                {"role": "system", "content": request.system},
                *({"role": m.role, "content": m.content} for m in request.messages),
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
            "stream": stream,
            **({"stream_options": {"include_usage": True}} if stream else {}),
        }

    async def stream(self, request: LlmRequest) -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST", _CHAT_URL, headers=self._headers(), json=self._payload(request, True)
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    body = line[6:].strip()
                    if body == "[DONE]":
                        break
                    event = json.loads(body)
                    for choice in event.get("choices", []):
                        text = choice.get("delta", {}).get("content")
                        if text:
                            yield text
                    usage = event.get("usage")
                    if usage:
                        self._last_usage = LlmUsage(
                            input_tokens=usage.get("prompt_tokens", 0),
                            output_tokens=usage.get("completion_tokens", 0),
                        )

    async def complete(self, request: LlmRequest) -> str:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                _CHAT_URL, headers=self._headers(), json=self._payload(request, False)
            )
            response.raise_for_status()
            data = response.json()
            usage = data.get("usage", {})
            self._last_usage = LlmUsage(
                input_tokens=usage.get("prompt_tokens", 0),
                output_tokens=usage.get("completion_tokens", 0),
            )
            choices = data.get("choices", [])
            return choices[0]["message"]["content"] if choices else ""

    async def embed(
        self, texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT"
    ) -> list[list[float]]:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                _EMBED_URL,
                headers=self._headers(),
                json={
                    "model": self.settings.openai_embedding_model,
                    "input": texts,
                    "dimensions": self.settings.embedding_dimensions,
                },
            )
            response.raise_for_status()
            data = response.json()
            return [item["embedding"] for item in sorted(data["data"], key=lambda d: d["index"])]
