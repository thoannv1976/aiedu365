"""Endpoint quản trị. Yêu cầu Firebase ID token của tài khoản có quyền."""

from __future__ import annotations

import csv
import io
import logging
from collections import Counter
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.config import get_settings
from app.core.security import AdminIdentity, require_editor, require_super_admin, require_viewer
from app.services import firestore as fs
from app.services.retrieval import get_retrieval
from app.services.store import get_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


# --------------------------------------------------------------------------
# Bảng điều khiển
# --------------------------------------------------------------------------


@router.get("/analytics")
def analytics(identity: AdminIdentity = Depends(require_viewer)) -> dict[str, Any]:
    messages = fs.list_documents("chat_messages", limit=2000)
    leads = fs.list_documents("leads", limit=2000)
    store = get_store()

    intents = Counter(m.get("intent", "unknown") for m in messages)
    unanswered = [m for m in messages if not m.get("answered", True)]
    feedback = Counter(m.get("feedback") for m in messages if m.get("feedback"))

    course_interest: Counter[str] = Counter()
    for m in messages:
        for code in m.get("courseCodes", []) or []:
            course_interest[code] += 1
    for lead in leads:
        for c in lead.get("courses", []) or []:
            course_interest[c.get("code", "")] += 3  # đăng ký nặng ký hơn câu hỏi

    tokens_in = sum(int(m.get("tokensIn", 0) or 0) for m in messages)
    tokens_out = sum(int(m.get("tokensOut", 0) or 0) for m in messages)

    top_questions = Counter(
        (m.get("question") or "").strip().lower() for m in messages if m.get("question")
    )

    return {
        "totals": {
            "messages": len(messages),
            "leads": len(leads),
            "sessions": len({m.get("sessionId") for m in messages if m.get("sessionId")}),
            "unanswered": len(unanswered),
            "unansweredRate": round(len(unanswered) / len(messages), 4) if messages else 0.0,
            "violations": sum(1 for m in messages if m.get("violations")),
        },
        "intents": dict(intents),
        "feedback": {"up": feedback.get("up", 0), "down": feedback.get("down", 0)},
        "courseInterest": [
            {
                "code": code,
                "name": f"Khóa {code[1:]}" if code.startswith("K") else code,
                "count": count,
            }
            for code, count in course_interest.most_common()
        ],
        "topQuestions": [{"question": q, "count": c} for q, c in top_questions.most_common(10)],
        "tokens": {"in": tokens_in, "out": tokens_out},
        "knowledgeBase": {"chunks": get_retrieval().size, "ready": get_retrieval().ready},
        "catalog": store.stats(),
    }


# --------------------------------------------------------------------------
# Hội thoại
# --------------------------------------------------------------------------


@router.get("/conversations")
def conversations(
    limit: int = Query(default=100, le=500),
    only_unanswered: bool = Query(default=False),
    course: str | None = Query(default=None),
    identity: AdminIdentity = Depends(require_viewer),
) -> list[dict[str, Any]]:
    rows = fs.list_documents("chat_messages", limit=limit * 3)
    if only_unanswered:
        rows = [r for r in rows if not r.get("answered", True)]
    if course:
        code = course.upper()
        rows = [r for r in rows if code in (r.get("courseCodes") or [])]
    return rows[:limit]


@router.post("/conversations/{message_id}/to-faq")
def promote_to_faq(
    message_id: str,
    answer: str = Body(embed=True),
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    """Biến một câu trả lời kém thành FAQ chính thức.

    Đây là vòng lặp cải tiến: câu hỏi bot trả lời sai được ban tổ chức viết lại,
    đưa vào FAQ ở độ ưu tiên cao, rồi index lại — chatbot tốt dần lên mà không
    cần lập trình viên can thiệp.
    """
    message = fs.get_document("chat_messages", message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin nhắn.")
    faq_id = fs.add_document(
        "faqs",
        {
            "question": message.get("question", ""),
            "answer": answer,
            "category": "Bổ sung từ hội thoại",
            "courseCodes": message.get("courseCodes", []) or [],
            "priority": 95,
            "published": True,
            "order": 900,
        },
    )
    fs.write_audit(identity.email, "faq.create_from_conversation", faq_id, after={"answer": answer})
    return {"faqId": faq_id, "message": "Đã tạo FAQ. Bấm “Cập nhật Knowledge Base” để áp dụng."}


# --------------------------------------------------------------------------
# Knowledge Base
# --------------------------------------------------------------------------


@router.get("/kb/chunks")
def kb_chunks(
    course: str | None = Query(default=None),
    identity: AdminIdentity = Depends(require_viewer),
) -> list[dict[str, Any]]:
    chunks = get_retrieval().build_chunks()
    if course:
        code = course.upper()
        chunks = [c for c in chunks if c.courseCode == code]
    return [c.model_dump() for c in chunks]


@router.post("/kb/reindex")
async def kb_reindex(identity: AdminIdentity = Depends(require_editor)) -> dict[str, Any]:
    count = await get_retrieval().reindex()
    fs.write_audit(identity.email, "kb.reindex", "knowledge_base", after={"chunks": count})
    return {"chunks": count, "message": f"Đã index lại {count} chunk."}


@router.post("/kb/test-retrieval")
async def kb_test(
    query: str = Body(embed=True),
    top_k: int = Body(default=8, embed=True),
    identity: AdminIdentity = Depends(require_viewer),
) -> dict[str, Any]:
    """Thử một câu hỏi và xem bot lấy chunk nào — công cụ chẩn đoán cho ban tổ chức."""
    hits = await get_retrieval().search(query, top_k=top_k)
    settings = get_settings()
    return {
        "query": query,
        "threshold": settings.similarity_threshold,
        "wouldAnswer": bool(hits) and hits[0].score >= settings.similarity_threshold,
        "hits": [
            {
                "chunkId": h.chunk.id,
                "courseCode": h.chunk.courseCode,
                "title": h.chunk.title,
                "section": h.chunk.section,
                "score": h.score,
                "preview": h.chunk.content[:300],
            }
            for h in hits
        ],
    }


# --------------------------------------------------------------------------
# Lead
# --------------------------------------------------------------------------


@router.get("/leads")
def list_leads(
    status: str | None = Query(default=None),
    limit: int = Query(default=200, le=1000),
    identity: AdminIdentity = Depends(require_viewer),
) -> list[dict[str, Any]]:
    rows = fs.list_documents("leads", limit=limit)
    if status:
        rows = [r for r in rows if r.get("status") == status]
    return rows


@router.patch("/leads/{lead_id}")
def update_lead(
    lead_id: str,
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    allowed = {"status", "assignedTo", "notes"}
    update = {k: v for k, v in payload.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="Không có trường hợp lệ để cập nhật.")
    before = fs.get_document("leads", lead_id)
    if not before:
        raise HTTPException(status_code=404, detail="Không tìm thấy đăng ký.")
    fs.update_document("leads", lead_id, update)
    fs.write_audit(identity.email, "lead.update", lead_id, before=before, after=update)
    return {"ok": True}


# Excel và LibreOffice coi ô bắt đầu bằng các ký tự này là công thức và THỰC THI
# nó khi mở file. Người đăng ký nhập được tên và đơn vị, nên nếu xuất thẳng thì
# file gửi cho ban tổ chức trở thành đường tấn công.
_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _csv_safe(value: Any) -> str:
    """Vô hiệu hóa công thức trong ô CSV mà vẫn giữ nguyên nội dung đọc được."""
    text = "" if value is None else str(value)
    if text.startswith(_FORMULA_PREFIXES):
        # Dấu nháy đơn đầu ô là quy ước "đây là văn bản" của Excel; nó không
        # hiện khi xem, và giá trị gốc vẫn nguyên vẹn.
        return "'" + text
    return text


@router.get("/leads/export")
def export_leads(identity: AdminIdentity = Depends(require_viewer)) -> StreamingResponse:
    rows = fs.list_documents("leads", limit=5000)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["Mã", "Họ tên", "Đơn vị", "Chức vụ", "Email", "Điện thoại",
         "Khóa quan tâm", "Tổng số người", "Nguồn", "Trạng thái", "Ghi chú", "Thời điểm"]
    )
    for r in rows:
        courses = r.get("courses", []) or []
        writer.writerow([
            _csv_safe(r.get("id", "")),
            _csv_safe(r.get("fullName", "")),
            _csv_safe(r.get("organization", "")),
            _csv_safe(r.get("position", "")),
            _csv_safe(r.get("email", "")),
            _csv_safe(r.get("phone", "")),
            "; ".join(
                f"Khóa {c.get('code', '')[1:]} ({c.get('attendees', 0)} người)" for c in courses
            ),
            sum(int(c.get("attendees", 0) or 0) for c in courses),
            _csv_safe(r.get("source", "")),
            _csv_safe(r.get("status", "")),
            _csv_safe(r.get("message", "")),
            _csv_safe(r.get("_createdAt", "")),
        ])
    buffer.seek(0)
    # BOM để Excel trên Windows đọc đúng tiếng Việt.
    content = "﻿" + buffer.getvalue()
    return StreamingResponse(
        iter([content]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="dang-ky-aiedu365.csv"'},
    )


# --------------------------------------------------------------------------
# Cấu hình AI
# --------------------------------------------------------------------------


@router.get("/config")
def get_config(identity: AdminIdentity = Depends(require_viewer)) -> dict[str, Any]:
    """Tham số truy hồi và sinh câu trả lời.

    Việc chọn nhà cung cấp và tên model nằm ở ``/admin/providers`` — giữ một
    nguồn sự thật duy nhất cho mỗi thứ, tránh hai màn hình cùng sửa một giá trị.
    """
    from app.services.llm_settings import PROVIDERS, get_config as get_llm_config

    settings = get_settings()
    stored = fs.get_document("app_config", "chat") or {}
    llm = get_llm_config()
    return {
        "provider": llm.chat_provider,
        "providerLabel": PROVIDERS.get(llm.chat_provider, {}).get("label", llm.chat_provider),
        "embeddingProvider": llm.embedding_provider,
        "chatModel": llm.chat_model,
        "reasoningModel": llm.reasoning_model,
        "embeddingModel": llm.embedding_model,
        "temperature": stored.get("temperature", settings.temperature),
        "topK": stored.get("topK", settings.retrieval_top_k),
        "topKCompare": stored.get("topKCompare", settings.retrieval_top_k_compare),
        "similarityThreshold": stored.get("similarityThreshold", settings.similarity_threshold),
        "maxOutputTokens": stored.get("maxOutputTokens", settings.max_output_tokens),
        "dailyTokenBudget": settings.daily_token_budget,
    }


@router.put("/config")
def update_config(
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_super_admin),
) -> dict[str, Any]:
    settings = get_settings()
    before = fs.get_document("app_config", "chat") or {}
    # Tên model không sửa ở đây: chúng thuộc về cấu hình nhà cung cấp.
    allowed = {
        "temperature", "topK", "topKCompare", "similarityThreshold", "maxOutputTokens",
    }
    update = {k: v for k, v in payload.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="Không có trường hợp lệ để cập nhật.")

    fs.add_document("app_config", {**before, **update}, doc_id="chat")

    # Áp dụng ngay cho tiến trình đang chạy.
    for key, attr in (
        ("temperature", "temperature"),
        ("topK", "retrieval_top_k"),
        ("topKCompare", "retrieval_top_k_compare"),
        ("similarityThreshold", "similarity_threshold"),
        ("maxOutputTokens", "max_output_tokens"),
    ):
        if key in update:
            setattr(settings, attr, update[key])

    fs.write_audit(identity.email, "config.update", "app_config/chat", before=before, after=update)
    return {"ok": True, "applied": update}


@router.get("/prompts")
def list_prompts(identity: AdminIdentity = Depends(require_viewer)) -> dict[str, Any]:
    from app.services.prompts import BASE_SYSTEM

    versions = fs.list_documents("prompt_versions", limit=50)
    active = fs.get_document("app_config", "prompt") or {}
    return {
        "default": BASE_SYSTEM,
        "active": active.get("text", BASE_SYSTEM),
        "activeVersion": active.get("version", "default"),
        "versions": versions,
    }


@router.put("/prompts")
def update_prompt(
    text: str = Body(embed=True),
    label: str = Body(default="", embed=True),
    identity: AdminIdentity = Depends(require_super_admin),
) -> dict[str, Any]:
    before = fs.get_document("app_config", "prompt") or {}
    version_id = fs.add_document(
        "prompt_versions", {"text": text, "label": label, "author": identity.email}
    )
    fs.add_document("app_config", {"text": text, "version": version_id}, doc_id="prompt")
    fs.write_audit(identity.email, "prompt.update", "app_config/prompt", before=before,
                   after={"version": version_id, "label": label})
    return {"ok": True, "version": version_id}


@router.get("/audit-logs")
def audit_logs(
    limit: int = Query(default=200, le=1000),
    identity: AdminIdentity = Depends(require_viewer),
) -> list[dict[str, Any]]:
    return fs.list_documents("audit_logs", limit=limit, order_by="at")
