"""Gợi ý câu hỏi trên màn hình chat.

Đây là dữ liệu người dùng gõ vào được hiện lại cho người khác xem, nên phần
lớn test ở đây là về quyền riêng tư chứ không phải về chức năng.
"""

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app
from app.services import firestore as fs
from app.services.question_digest import get_digest, is_publishable, privacy_reason


@pytest.fixture(scope="module")
def client():
    settings = get_settings()
    settings.environment = "development"
    settings.dev_admin_token = "test-token"
    with TestClient(create_app()) as c:
        yield c


@pytest.fixture
def auth():
    return {"authorization": "Bearer test-token"}


@pytest.fixture(autouse=True)
def _clean():
    fs._memory["chat_messages"] = {}
    get_digest().invalidate()
    yield
    fs._memory["chat_messages"] = {}
    get_digest().invalidate()


def _ask(question: str, session: str, **overrides):
    fs.add_document(
        "chat_messages",
        {
            "sessionId": session,
            "question": question,
            "answered": True,
            "violations": [],
            "courseCodes": overrides.pop("courseCodes", []),
            **overrides,
        },
    )
    get_digest().invalidate()


# --- Lọc riêng tư ---------------------------------------------------------


@pytest.mark.parametrize(
    "question,expected",
    [
        ("Liên hệ tôi qua an.nguyen@dhsp.edu.vn nhé", "email"),
        ("Số của tôi là 0912345678, gọi giúp", "điện thoại"),
        ("Gọi mình 024 3456 7890 để trao đổi thêm", "điện thoại"),
        ("Mã sinh viên 20215678 có tra cứu được không", "chuỗi số dài"),
        ("Xem tại https://truong-toi.edu.vn/thongbao có đúng không", "đường dẫn"),
        ("Tôi là Nguyễn Văn A ở phòng đào tạo, muốn hỏi thêm", "tự giới thiệu"),
        ("Tên tôi là Bình, cho hỏi khóa 22", "tự giới thiệu"),
    ],
)
def test_personal_information_is_never_shown(question, expected):
    reason = privacy_reason(question)
    assert reason, f"Không chặn được: {question}"
    assert expected in reason


def test_tax_code_is_blocked_even_if_labelled_as_phone():
    """Mã số thuế bắt đầu bằng 0 nên khớp mẫu điện thoại trước.

    Nhãn khác nhau không quan trọng — điều quan trọng là câu bị chặn.
    """
    assert privacy_reason("Mã số thuế đơn vị là 0101234567 có cần không")


@pytest.mark.parametrize(
    "question",
    [
        "Khóa 22 có bao nhiêu module phần mềm?",
        "Mỗi đơn vị nên cử bao nhiêu người tham dự?",
        "Khóa 24 và Khóa 28 khác nhau thế nào?",
        "Phần mềm được chuyển giao gồm những gì?",
    ],
)
def test_ordinary_questions_pass(question):
    assert privacy_reason(question) == ""


def test_too_short_and_too_long_are_rejected():
    assert privacy_reason("ok") == "quá ngắn"
    assert "quá dài" in privacy_reason("Khóa 22 " + "nội dung rất dài " * 12)


# --- Điều kiện được hiện --------------------------------------------------


def test_unanswered_question_is_not_shown():
    """Câu chatbot không trả lời được mà đem đi gợi ý thì người sau bấm vào cũng thất vọng."""
    assert not is_publishable({"question": "Giá vàng hôm nay bao nhiêu vậy?", "answered": False})


def test_question_with_guardrail_violation_is_not_shown():
    assert not is_publishable(
        {"question": "AI có tự quyết định tuyển dụng không?", "answered": True,
         "violations": ["AI tự quyết định nhân sự"]}
    )


def test_question_rated_down_is_not_shown():
    assert not is_publishable(
        {"question": "Khóa 25 dạy những gì trong ngày 2?", "answered": True, "feedback": "down"}
    )


def test_manually_hidden_question_is_not_shown():
    assert not is_publishable(
        {"question": "Khóa 25 dạy những gì trong ngày 2?", "answered": True,
         "hiddenFromDigest": True}
    )


# --- Tổng hợp -------------------------------------------------------------


def test_frequent_requires_multiple_sessions():
    """Câu chỉ một người hỏi thường mang tình huống riêng, chưa phải câu hỏi chung."""
    _ask("Khóa 22 có bao nhiêu module phần mềm?", "s1")
    _ask("Khóa 22 có bao nhiêu module phần mềm?", "s1")  # cùng một phiên
    digest = get_digest().build()
    assert digest["frequent"] == []

    _ask("Khóa 22 có bao nhiêu module phần mềm?", "s2")
    digest = get_digest().build()
    assert digest["frequent"][0]["question"] == "Khóa 22 có bao nhiêu module phần mềm?"
    assert digest["frequent"][0]["count"] == 3


def test_variants_of_the_same_question_are_merged():
    _ask("khóa 22 có mấy module", "s1")
    _ask("Khóa 22 có mấy module?", "s2")
    _ask("Khóa 22  có  mấy  module", "s3")
    digest = get_digest().build()
    assert len(digest["frequent"]) == 1
    assert digest["frequent"][0]["count"] == 3


def test_recent_does_not_repeat_frequent():
    """Hai danh sách giống hệt nhau thì mục thứ hai vô dụng."""
    for session in ("s1", "s2", "s3"):
        _ask("Khóa 22 có bao nhiêu module phần mềm?", session)
    _ask("Cần chuẩn bị dữ liệu gì trước khi đến?", "s4")

    digest = get_digest().build()
    frequent = {q["question"] for q in digest["frequent"]}
    recent = {q["question"] for q in digest["recent"]}
    assert frequent & recent == set()
    assert "Cần chuẩn bị dữ liệu gì trước khi đến?" in recent


def test_display_form_is_tidied():
    _ask("khóa 27 dành cho đơn vị nào?", "s1")
    assert get_digest().build()["recent"][0]["question"] == "Khóa 27 dành cho đơn vị nào?"


# --- Endpoint công khai ---------------------------------------------------


def test_public_endpoint_hides_personal_questions(client):
    _ask("Tôi là Nguyễn Văn A, cho hỏi khóa 22 học gì", "s1")
    _ask("Tôi là Nguyễn Văn A, cho hỏi khóa 22 học gì", "s2")
    _ask("Khóa 22 có bao nhiêu module phần mềm?", "s3")
    _ask("Khóa 22 có bao nhiêu module phần mềm?", "s4")

    body = client.get("/api/chat/questions").json()
    text = str(body)
    assert "Nguyễn Văn A" not in text
    assert any("module phần mềm" in q["question"] for q in body["frequent"])


def test_admin_can_hide_a_question(client, auth):
    for session in ("s1", "s2"):
        _ask("Khóa 22 có bao nhiêu module phần mềm?", session)
    message_id = next(iter(fs._memory["chat_messages"]))

    assert client.get("/api/chat/questions").json()["frequent"]

    res = client.post(
        f"/api/admin/conversations/{message_id}/hide-from-digest",
        json={"hidden": True},
        headers=auth,
    )
    assert res.status_code == 200
    remaining = client.get("/api/chat/questions").json()["frequent"]
    assert all(q["count"] < 2 for q in remaining) or remaining == []


def test_feature_can_be_switched_off(client):
    from app.services.store import get_store

    store = get_store()
    store.load()
    store._site["chat"]["showPopularQuestions"] = False
    try:
        body = client.get("/api/chat/questions").json()
        assert body["enabled"] is False
        assert body["frequent"] == []
    finally:
        store._site["chat"]["showPopularQuestions"] = True


def test_admin_conversation_list_explains_why_a_question_is_hidden(client, auth):
    """Bộ lọc riêng tư không được là hộp đen với người vận hành."""
    _ask("Số của tôi là 0912345678, gọi giúp nhé", "s1")
    rows = client.get("/api/admin/conversations", headers=auth).json()
    row = next(r for r in rows if "0912345678" in r["question"])
    assert row["inDigest"] is False
    assert "điện thoại" in row["digestBlockedBy"]
