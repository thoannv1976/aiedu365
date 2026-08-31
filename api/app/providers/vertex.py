"""Nhà cung cấp mặc định: Vertex AI (Gemini) trong cùng project GCP."""

from __future__ import annotations

import logging
from typing import Any, AsyncIterator

from app.core.config import Settings
from app.providers.base import LlmProvider, LlmRequest, LlmUsage

logger = logging.getLogger(__name__)


class VertexProvider(LlmProvider):
    name = "vertex"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._client: Any | None = None
        self._last_usage = LlmUsage()

    def _get_client(self) -> Any:
        if self._client is None:
            from google import genai

            self._client = genai.Client(
                vertexai=True,
                project=self.settings.gcp_project,
                location=self.settings.gcp_location,
            )
        return self._client

    def _config(self, request: LlmRequest) -> Any:
        from google.genai import types

        return types.GenerateContentConfig(
            system_instruction=request.system,
            temperature=request.temperature,
            max_output_tokens=request.max_output_tokens,
        )

    @staticmethod
    def _contents(request: LlmRequest) -> list[Any]:
        from google.genai import types

        return [
            types.Content(
                role="model" if m.role == "assistant" else "user",
                parts=[types.Part.from_text(text=m.content)],
            )
            for m in request.messages
        ]

    async def stream(self, request: LlmRequest) -> AsyncIterator[str]:
        client = self._get_client()
        model = request.model or self.settings.chat_model
        stream = await client.aio.models.generate_content_stream(
            model=model,
            contents=self._contents(request),
            config=self._config(request),
        )
        async for chunk in stream:
            if getattr(chunk, "text", None):
                yield chunk.text
            usage = getattr(chunk, "usage_metadata", None)
            if usage:
                self._last_usage = LlmUsage(
                    input_tokens=getattr(usage, "prompt_token_count", 0) or 0,
                    output_tokens=getattr(usage, "candidates_token_count", 0) or 0,
                )

    async def complete(self, request: LlmRequest) -> str:
        client = self._get_client()
        model = request.model or self.settings.chat_model
        response = await client.aio.models.generate_content(
            model=model,
            contents=self._contents(request),
            config=self._config(request),
        )
        usage = getattr(response, "usage_metadata", None)
        if usage:
            self._last_usage = LlmUsage(
                input_tokens=getattr(usage, "prompt_token_count", 0) or 0,
                output_tokens=getattr(usage, "candidates_token_count", 0) or 0,
            )
        return response.text or ""

    async def embed(
        self, texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT"
    ) -> list[list[float]]:
        from google.genai import types

        client = self._get_client()
        response = await client.aio.models.embed_content(
            model=self.settings.embedding_model,
            contents=texts,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=self.settings.embedding_dimensions,
            ),
        )
        return [list(e.values) for e in response.embeddings]
