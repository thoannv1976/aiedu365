"""Endpoint hội thoại: stream SSE và ghi nhận phản hồi."""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.core.config import get_settings
from app.models.schemas import ChatFeedback, ChatRequest
from app.services import firestore as fs
from app.services.chat import get_chat_service
from app.services.client_ip import client_key
from app.services.rate_limit import SlidingWindowLimiter

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])

_settings = get_settings()
_session_limiter = SlidingWindowLimiter(_settings.rate_limit_messages_per_session_hour)
_ip_limiter = SlidingWindowLimiter(_settings.rate_limit_requests_per_ip_hour)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/chat")
async def chat(payload: ChatRequest, request: Request) -> StreamingResponse:
    ip_hash = client_key(request)
    session_id = payload.sessionId or uuid.uuid4().hex[:20]

    allowed_ip, _ = _ip_limiter.allow(ip_hash)
    allowed_session, remaining = _session_limiter.allow(session_id)
    if not allowed_ip or not allowed_session:
        raise HTTPException(
            status_code=429,
            detail="Anh/chị đã gửi khá nhiều câu hỏi trong một giờ. "
            "Vui lòng thử lại sau hoặc liên hệ trực tiếp ban tổ chức.",
        )

    service = get_chat_service()

    async def event_stream():
        yield _sse("meta", {"sessionId": session_id, "remaining": remaining})
        outcome = None
        try:
            async for kind, data, result in service.stream(
                payload.message, payload.history, payload.courseContext
            ):
                if kind == "delta" and data:
                    yield _sse("delta", {"text": data})
                elif kind == "done":
                    outcome = result
        except Exception as exc:  # pragma: no cover
            logger.exception("Lỗi luồng chat: %s", exc)
            yield _sse("error", {"message": "Hệ thống đang bận, xin thử lại."})
            return

        if outcome is not None:
            yield _sse(
                "done",
                {
                    "messageId": outcome.message_id,
                    "intent": outcome.intent.value,
                    "answered": outcome.answered,
                    "courseCodes": outcome.course_codes,
                    "citations": [c.model_dump() for c in outcome.citations],
                },
            )
            _log_turn(session_id, ip_hash, payload, outcome)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _log_turn(session_id: str, ip_hash: str, payload: ChatRequest, outcome) -> None:
    try:
        fs.add_document(
            "chat_messages",
            {
                "sessionId": session_id,
                "ipHash": ip_hash,
                "question": payload.message,
                "intent": outcome.intent.value,
                "answered": outcome.answered,
                "fallbackReason": outcome.fallback_reason,
                "courseCodes": outcome.course_codes,
                "citations": [c.model_dump() for c in outcome.citations],
                "topScore": outcome.top_score,
                "violations": outcome.violations,
                "tokensIn": outcome.tokens_in,
                "tokensOut": outcome.tokens_out,
                "locale": payload.locale,
            },
            doc_id=outcome.message_id,
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("Không ghi được log hội thoại: %s", exc)


@router.post("/chat/feedback")
def chat_feedback(payload: ChatFeedback) -> dict:
    ok = fs.update_document(
        "chat_messages",
        payload.messageId,
        {"feedback": payload.value, "feedbackNote": payload.note},
    )
    if not ok:
        # Tin nhắn có thể đã bị dọn khỏi bộ nhớ tạm; vẫn ghi nhận để không mất dữ liệu.
        fs.add_document(
            "chat_messages",
            {"sessionId": payload.sessionId, "feedback": payload.value, "feedbackNote": payload.note},
            doc_id=payload.messageId,
        )
    return {"ok": True}
