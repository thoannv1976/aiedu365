"""Nhà cung cấp thay thế: Claude API.

Không dùng cho embedding — khi chọn provider này, phần embedding vẫn đi qua
Vertex AI hoặc một provider có hỗ trợ.
"""

from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from app.core.config import Settings
from app.providers.base import LlmProvider, LlmRequest, LlmUsage

_API_URL = "https://api.anthropic.com/v1/messages"
_VERSION = "2023-06-01"


class AnthropicProvider(LlmProvider):
    name = "anthropic"

    def __init__(self, settings: Settings, api_key: str = "") -> None:
        self.settings = settings
        self.api_key = api_key or settings.anthropic_api_key
        self._last_usage = LlmUsage()

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise RuntimeError("Chưa cấu hình khóa API của Claude.")
        return {
            "x-api-key": self.api_key,
            "anthropic-version": _VERSION,
            "content-type": "application/json",
        }

    def _payload(self, request: LlmRequest, stream: bool) -> dict:
        return {
            "model": request.model or self.settings.anthropic_model,
            "max_tokens": request.max_output_tokens,
            "temperature": request.temperature,
            "system": request.system,
            "messages": [{"role": m.role, "content": m.content} for m in request.messages],
            "stream": stream,
        }

    async def stream(self, request: LlmRequest) -> AsyncIterator[str]:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST", _API_URL, headers=self._headers(), json=self._payload(request, True)
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    event = json.loads(line[6:])
                    if event.get("type") == "content_block_delta":
                        text = event.get("delta", {}).get("text")
                        if text:
                            yield text
                    elif event.get("type") == "message_delta":
                        usage = event.get("usage", {})
                        self._last_usage = LlmUsage(
                            input_tokens=self._last_usage.input_tokens,
                            output_tokens=usage.get("output_tokens", 0),
                        )

    async def complete(self, request: LlmRequest) -> str:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                _API_URL, headers=self._headers(), json=self._payload(request, False)
            )
            response.raise_for_status()
            data = response.json()
            usage = data.get("usage", {})
            self._last_usage = LlmUsage(
                input_tokens=usage.get("input_tokens", 0),
                output_tokens=usage.get("output_tokens", 0),
            )
            return "".join(
                block.get("text", "") for block in data.get("content", []) if block.get("type") == "text"
            )
