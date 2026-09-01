"""Luồng hội thoại đầu-cuối, chạy với provider echo (không gọi mạng)."""

import json
from pathlib import Path

import pytest

from app.models.schemas import Intent
from app.services.chat import get_chat_service
from app.services.intent import classify
from app.services.retrieval import get_retrieval

EVAL = json.loads(
    (Path(__file__).resolve().parents[2] / "data/eval/questions.json").read_text(encoding="utf-8")
)


@pytest.fixture(scope="module")
def cases():
    return EVAL["cases"]


@pytest.mark.parametrize("case", EVAL["cases"], ids=lambda c: c["q"][:40])
def test_intent_classification(case):
    expected = case.get("intent")
    if not expected:
        return
    result = classify(case["q"])
    assert result.intent.value == expected, f"{case['q']} → {result.intent.value}"


@pytest.mark.parametrize(
    "case", [c for c in EVAL["cases"] if c.get("codes")], ids=lambda c: c["q"][:40]
)
def test_course_codes_detected(case):
    result = classify(case["q"])
    assert set(case["codes"]) <= set(result.course_codes), (
        f"{case['q']} → {result.course_codes}, cần {case['codes']}"
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("case", EVAL["cases"], ids=lambda c: c["q"][:40])
async def test_answer_or_refuse(case):
    """Bot phải trả lời câu trong phạm vi và từ chối câu ngoài phạm vi."""
    text, outcome = await get_chat_service().answer(case["q"], [], None)
    assert outcome.answered == case["answered"], (
        f"{case['q']}: answered={outcome.answered} "
        f"(top={outcome.top_score:.3f}, reason={outcome.fallback_reason})"
    )
    assert text.strip()


@pytest.mark.asyncio
async def test_refusal_has_no_citations():
    """Từ chối thì không được kèm nguồn — tránh gợi ý sai rằng có tài liệu."""
    _, outcome = await get_chat_service().answer("Giá vàng hôm nay?", [], None)
    assert not outcome.answered
    assert outcome.citations == []


@pytest.mark.asyncio
async def test_compare_retrieves_both_courses():
    """Câu so sánh phải có chunk của cả hai khóa, nếu không câu trả lời sẽ phiến diện."""
    _, outcome = await get_chat_service().answer(
        "Khóa 24 và Khóa 28 khác nhau thế nào?", [], None
    )
    codes = {c.courseCode for c in outcome.citations}
    assert {"K24", "K28"} <= codes
    assert outcome.intent is Intent.COMPARE


@pytest.mark.asyncio
async def test_course_context_narrows_retrieval():
    _, outcome = await get_chat_service().answer("Cử bao nhiêu người?", [], "K25")
    assert "K25" in outcome.course_codes


@pytest.mark.asyncio
async def test_index_covers_every_course():
    retrieval = get_retrieval()
    await retrieval.ensure_index()
    covered = {c.chunk.courseCode for c in retrieval._index if c.chunk.courseCode}
    assert covered == {f"K2{i}" for i in range(1, 9)}


@pytest.mark.asyncio
async def test_schedule_is_pinned_for_logistics_questions(monkeypatch):
    """Chunk lịch ngắn nên không bao giờ thắng điểm; phải được ghim.

    Nếu không, người hỏi "khóa 22 khai giảng khi nào" sẽ nhận về phần giới
    thiệu khóa học thay vì ngày cụ thể ban tổ chức đã nhập.
    """
    from app.services import firestore as fs

    fs._memory["sessions_schedule"] = {}
    fs.add_document(
        "sessions_schedule",
        {
            "courseCode": "K22",
            "startDate": "2026-10-15",
            "endDate": "2026-10-16",
            "location": "Hà Nội",
            "status": "open",
        },
    )
    retrieval = get_retrieval()
    await retrieval.reindex()
    try:
        _, outcome = await get_chat_service().answer(
            "Khóa 22 khai giảng khi nào và ở đâu?", [], None
        )
        assert outcome.intent is Intent.REGISTER
        assert "schedule-k22" in {c.chunkId for c in outcome.citations}
    finally:
        fs._memory["sessions_schedule"] = {}
        await retrieval.reindex()
