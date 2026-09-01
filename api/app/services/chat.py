"""Luồng xử lý hội thoại: kiểm duyệt → phân loại ý định → truy hồi → sinh."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from typing import AsyncIterator

from app.core.config import Settings, get_settings
from app.models.schemas import ChatMessage, Citation, Intent, RetrievalHit
from app.providers import LlmMessage, LlmRequest, get_provider
from app.services import guardrails
from app.services.aliases import get_resolver
from app.services.intent import classify, retrieval_plan
from app.services.prompts import build_system_prompt, build_user_turn
from app.services.retrieval import RetrievalService, get_retrieval
from app.services.store import ContentStore, get_store

logger = logging.getLogger(__name__)


@dataclass
class ChatOutcome:
    message_id: str
    intent: Intent
    citations: list[Citation] = field(default_factory=list)
    course_codes: list[str] = field(default_factory=list)
    top_score: float = 0.0
    answered: bool = True
    fallback_reason: str = ""
    violations: list[str] = field(default_factory=list)
    tokens_in: int = 0
    tokens_out: int = 0


def _citations(hits: list[RetrievalHit]) -> list[Citation]:
    return [
        Citation(
            chunkId=h.chunk.id,
            courseCode=h.chunk.courseCode,
            section=h.chunk.section,
            title=h.chunk.title,
            score=h.score,
        )
        for h in hits
    ]


class ChatService:
    def __init__(
        self,
        settings: Settings | None = None,
        store: ContentStore | None = None,
        retrieval: RetrievalService | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.store = store or get_store()
        self.retrieval = retrieval or get_retrieval()

    def _fallback_text(self, reason: str) -> str:
        site_fallback = (self.store.site.get("chat", {}) or {}).get(
            "fallback",
            "Thông tin này chưa có trong bộ tài liệu của chương trình. "
            "Anh/chị vui lòng liên hệ ban tổ chức để được trả lời chính xác.",
        )
        if reason == "out_of_scope":
            return (
                "Xin lỗi, tôi chỉ tư vấn về nội dung 08 khóa tập huấn AI của chương trình "
                "(Khóa 21 – Khóa 28). Anh/chị muốn tìm hiểu khóa nào ạ?"
            )
        return site_fallback

    async def prepare(
        self, message: str, history: list[ChatMessage], course_context: str | None
    ) -> tuple[ChatOutcome, LlmRequest | None, str]:
        """Chạy toàn bộ phần trước khi gọi mô hình.

        Trả về (kết quả, yêu cầu gửi mô hình, câu trả lời sẵn có). Khi câu trả
        lời sẵn có khác rỗng thì không gọi mô hình — đây là chốt chặn để bot
        không bịa khi thiếu ngữ cảnh.
        """
        message_id = uuid.uuid4().hex[:16]
        check = guardrails.check_input(message, self.settings.max_message_length)
        if not check.ok:
            return (
                ChatOutcome(message_id, Intent.LOOKUP, answered=False, fallback_reason=check.reason),
                None,
                check.reason,
            )
        injection_flagged = bool(check.reason)

        intent_result = classify(message, course_context)
        outcome = ChatOutcome(
            message_id=message_id,
            intent=intent_result.intent,
            course_codes=intent_result.course_codes,
        )

        if intent_result.intent is Intent.OUT_OF_SCOPE:
            outcome.answered = False
            outcome.fallback_reason = "out_of_scope"
            return outcome, None, self._fallback_text("out_of_scope")

        resolver = get_resolver()
        query = resolver.rewrite(message)
        if history:
            recent = " ".join(m.content for m in history[-2:])
            query = f"{recent}\n{query}"

        top_k, coverage = retrieval_plan(
            intent_result, self.settings.retrieval_top_k, self.settings.retrieval_top_k_compare
        )
        hits = await self.retrieval.search(
            query,
            top_k=top_k,
            course_codes=intent_result.course_codes or None,
            ensure_coverage=coverage,
        )

        if intent_result.intent is Intent.REGISTER:
            # Câu hỏi về thời gian, địa điểm, học phí, đầu mối luôn có câu trả
            # lời đúng — hoặc là lịch cụ thể ban tổ chức đã nhập, hoặc là "ban
            # tổ chức sẽ cung cấp". Ghim thẳng các chunk đó thay vì trông chờ
            # điểm tương đồng: chunk lịch ngắn nên luôn thua các chunk nội dung
            # dài của cùng khóa, dù câu hỏi nói rõ "khai giảng khi nào".
            pinned = ["site-lien-he"]
            if intent_result.course_codes:
                pinned += [f"schedule-{c.lower()}" for c in intent_result.course_codes]
            else:
                pinned += [
                    item.chunk.id
                    for item in self.retrieval._index
                    if item.chunk.section == "lich-khai-giang"
                ]
            hits = self.retrieval.with_pinned(hits, pinned)

        outcome.citations = _citations(hits)
        outcome.top_score = self.retrieval.top_score(hits)

        sufficient = guardrails.has_sufficient_context(
            hits, self.settings.similarity_threshold, intent_result.course_codes
        ) or intent_result.intent is Intent.REGISTER
        if not sufficient:
            outcome.answered = False
            outcome.fallback_reason = "low_similarity"
            outcome.citations = []
            return outcome, None, self._fallback_text("low_similarity")

        system = build_system_prompt(intent_result.intent, intent_result.ambiguous_number, self.store)
        turns = [
            LlmMessage(role=m.role, content=m.content)
            for m in history[-self.settings.max_history_turns :]
        ]
        turns.append(
            LlmMessage(role="user", content=build_user_turn(message, hits, injection_flagged))
        )
        model = (
            self.settings.reasoning_model
            if intent_result.intent in (Intent.COMPARE, Intent.ROUTING)
            else self.settings.chat_model
        )
        request = LlmRequest(
            system=system,
            messages=turns,
            model=model,
            temperature=self.settings.temperature,
            max_output_tokens=self.settings.max_output_tokens,
        )
        return outcome, request, ""

    async def answer(
        self, message: str, history: list[ChatMessage], course_context: str | None
    ) -> tuple[str, ChatOutcome]:
        """Sinh câu trả lời một lần (không stream) — dùng cho test và eval."""
        outcome, request, ready = await self.prepare(message, history, course_context)
        if request is None:
            return ready, outcome

        provider = get_provider()
        text = await provider.complete(request)
        usage = provider.last_usage
        outcome.tokens_in, outcome.tokens_out = usage.input_tokens, usage.output_tokens

        hits = [
            RetrievalHit(
                chunk=next(
                    c.chunk for c in self.retrieval._index if c.chunk.id == cit.chunkId
                ),
                score=cit.score,
            )
            for cit in outcome.citations
            if any(c.chunk.id == cit.chunkId for c in self.retrieval._index)
        ]
        verdict = guardrails.check_output(text, hits)
        if not verdict.ok:
            outcome.violations = verdict.violations
            logger.warning("Guardrail chặn câu trả lời: %s", verdict.violations)
            text = text + guardrails.REPLACEMENT_NOTE
        return text, outcome

    async def stream(
        self, message: str, history: list[ChatMessage], course_context: str | None
    ) -> AsyncIterator[tuple[str, str, ChatOutcome | None]]:
        """Sinh (loại sự kiện, dữ liệu, kết quả) cho Server-Sent Events."""
        outcome, request, ready = await self.prepare(message, history, course_context)
        if request is None:
            yield "delta", ready, None
            yield "done", "", outcome
            return

        provider = get_provider()
        buffer: list[str] = []
        try:
            async for piece in provider.stream(request):
                buffer.append(piece)
                yield "delta", piece, None
        except Exception as exc:  # pragma: no cover - phụ thuộc mạng
            logger.exception("Lỗi khi gọi mô hình: %s", exc)
            yield "delta", "\n\n_Xin lỗi, hệ thống đang bận. Anh/chị thử lại sau ít phút._", None
            outcome.answered = False
            outcome.fallback_reason = "provider_error"
            yield "done", "", outcome
            return

        usage = provider.last_usage
        outcome.tokens_in, outcome.tokens_out = usage.input_tokens, usage.output_tokens

        full_text = "".join(buffer)
        index_map = {c.chunk.id: c.chunk for c in self.retrieval._index}
        hits = [
            RetrievalHit(chunk=index_map[cit.chunkId], score=cit.score)
            for cit in outcome.citations
            if cit.chunkId in index_map
        ]
        verdict = guardrails.check_output(full_text, hits)
        if not verdict.ok:
            outcome.violations = verdict.violations
            logger.warning("Guardrail phát hiện vi phạm: %s", verdict.violations)
            yield "delta", guardrails.REPLACEMENT_NOTE, None

        yield "done", "", outcome


_chat: ChatService | None = None


def get_chat_service() -> ChatService:
    global _chat
    if _chat is None:
        _chat = ChatService()
    return _chat
