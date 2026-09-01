"""Quản trị nội dung: khóa học, lịch khai giảng, FAQ, nội dung trang, người dùng."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app
from app.services import firestore as fs
from app.services.store import get_store


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
def _reset_store():
    """Mỗi test bắt đầu từ dữ liệu JSON gốc, không dính ghi của test trước."""
    yield
    for collection in ("courses", "faqs", "site_content", "sessions_schedule", "admin_users"):
        fs._memory[collection] = {}
    get_store().load(force=True)


def test_admin_endpoints_require_auth(client):
    for method, path in [
        ("get", "/api/admin/courses"),
        ("get", "/api/admin/site"),
        ("get", "/api/admin/schedules"),
        ("get", "/api/admin/faqs"),
    ]:
        assert getattr(client, method)(path).status_code == 401


# --- Khóa học -------------------------------------------------------------


def test_update_course_content(client, auth):
    res = client.patch(
        "/api/admin/courses/K23", json={"tagline": "Bản thử nghiệm"}, headers=auth
    )
    assert res.status_code == 200, res.text
    assert res.json()["course"]["tagline"] == "Bản thử nghiệm"
    assert client.get("/api/courses/K23").json()["tagline"] == "Bản thử nghiệm"


def test_course_identity_fields_cannot_be_changed(client, auth):
    """Đổi mã, slug hay số hiệu sẽ phá URL đã phát hành và bảng quy đổi mã khóa."""
    res = client.patch(
        "/api/admin/courses/K23",
        json={"code": "K99", "slug": "khac", "legacyNumber": 9, "tagline": "Giữ lại"},
        headers=auth,
    )
    assert res.status_code == 200
    course = res.json()["course"]
    assert course["code"] == "K23"
    assert course["slug"] == "ai-quan-ly-dao-tao"
    assert course["legacyNumber"] == 3
    assert course["tagline"] == "Giữ lại"
    assert set(res.json()["ignoredFields"]) == {"code", "legacyNumber", "slug"}


def test_update_unknown_course_is_404(client, auth):
    assert client.patch("/api/admin/courses/K99", json={"tagline": "x"}, headers=auth).status_code == 404


def test_invalid_course_payload_is_rejected(client, auth):
    res = client.patch("/api/admin/courses/K23", json={"days": "không phải danh sách"}, headers=auth)
    assert res.status_code == 422


# --- Lịch khai giảng ------------------------------------------------------


def test_schedule_lifecycle(client, auth):
    created = client.post(
        "/api/admin/schedules",
        json={
            "courseCode": "K22",
            "startDate": "2026-10-15",
            "endDate": "2026-10-16",
            "location": "Hà Nội",
            "capacity": "40",
            "contactEmail": "bantochuc@example.edu.vn",
        },
        headers=auth,
    )
    assert created.status_code == 201
    schedule_id = created.json()["id"]

    public = client.get("/api/schedules").json()
    assert any(s["id"] == schedule_id and s["capacity"] == 40 for s in public)

    assert client.get("/api/schedules?course=K25").json() == []

    client.put(
        f"/api/admin/schedules/{schedule_id}",
        json={"courseCode": "K22", "startDate": "2026-11-01", "location": "Đà Nẵng"},
        headers=auth,
    )
    assert client.get("/api/schedules").json()[0]["location"] == "Đà Nẵng"

    assert client.delete(f"/api/admin/schedules/{schedule_id}", headers=auth).status_code == 200
    assert client.get("/api/schedules").json() == []


def test_schedule_rejects_unknown_course(client, auth):
    res = client.post("/api/admin/schedules", json={"courseCode": "K99"}, headers=auth)
    assert res.status_code == 400


def test_cancelled_schedule_hidden_from_public(client, auth):
    client.post(
        "/api/admin/schedules",
        json={"courseCode": "K21", "startDate": "2026-09-01", "status": "cancelled"},
        headers=auth,
    )
    assert client.get("/api/schedules").json() == []


# --- FAQ ------------------------------------------------------------------


def test_faq_lifecycle(client, auth):
    created = client.post(
        "/api/admin/faqs",
        json={"question": "Có cấp chứng nhận không?", "answer": "Có.", "category": "Tổng quan"},
        headers=auth,
    )
    assert created.status_code == 201
    faq_id = created.json()["id"]
    assert any(f["id"] == faq_id for f in client.get("/api/faqs").json())

    client.put(f"/api/admin/faqs/{faq_id}", json={"answer": "Có, cấp sau khi hoàn thành."}, headers=auth)
    updated = next(f for f in client.get("/api/faqs").json() if f["id"] == faq_id)
    assert updated["answer"] == "Có, cấp sau khi hoàn thành."

    client.delete(f"/api/admin/faqs/{faq_id}", headers=auth)
    assert not any(f["id"] == faq_id for f in client.get("/api/faqs").json())


def test_faq_requires_question_and_answer(client, auth):
    assert client.post("/api/admin/faqs", json={"question": "Chỉ có câu hỏi"}, headers=auth).status_code == 400


def test_faq_rejects_unknown_course_code(client, auth):
    res = client.post(
        "/api/admin/faqs",
        json={"question": "Hỏi", "answer": "Đáp", "courseCodes": ["K99"]},
        headers=auth,
    )
    assert res.status_code == 400


def test_deleting_builtin_faq_hides_it(client, auth):
    """FAQ mặc định nằm trong file JSON nên chỉ ẩn được, không xóa vĩnh viễn."""
    builtin = client.get("/api/faqs").json()[0]["id"]
    res = client.delete(f"/api/admin/faqs/{builtin}", headers=auth)
    assert res.status_code == 200
    assert not any(f["id"] == builtin for f in client.get("/api/faqs").json())


# --- Nội dung trang -------------------------------------------------------


def test_update_site_contact(client, auth):
    contact = {
        "unit": "Trường Đại học Thử Nghiệm",
        "email": "bantochuc@example.edu.vn",
        "phone": "0900000000",
        "address": "",
        "registrationDeadline": "30/09/2026",
        "note": "",
    }
    assert client.put("/api/admin/site", json={"contact": contact, "organizer": "ĐH Thử Nghiệm"},
                      headers=auth).status_code == 200

    site = client.get("/api/site").json()
    assert site["organizer"] == "ĐH Thử Nghiệm"
    assert site["contact"]["email"] == "bantochuc@example.edu.vn"
    # Số liệu vẫn được tính lại từ dữ liệu thật, không bị ghi đè.
    assert site["catalog"]["courseCount"] == 8


def test_site_rejects_unknown_fields(client, auth):
    assert client.put("/api/admin/site", json={"khong_ton_tai": 1}, headers=auth).status_code == 400


def test_contact_reaches_knowledge_base(client, auth):
    """Sau khi điền đầu mối, chatbot phải trả lời được thay vì nói “sẽ cung cấp”."""
    from app.services.chunker import chunk_site

    client.put(
        "/api/admin/site",
        json={"contact": {"unit": "Phòng Đào tạo", "email": "dt@example.edu.vn",
                          "phone": "", "address": "", "registrationDeadline": "", "note": ""}},
        headers=auth,
    )
    content = next(chunk_site(get_store().site)).content
    assert "dt@example.edu.vn" in content
    assert "TUYỆT ĐỐI không tự suy đoán" not in content


# --- Người dùng -----------------------------------------------------------


def test_user_management_requires_super_admin(client, auth):
    res = client.post("/api/admin/users", json={"email": "moi@example.vn", "role": "editor"}, headers=auth)
    assert res.status_code == 201
    assert any(u["email"] == "moi@example.vn" for u in client.get("/api/admin/users", headers=auth).json()["users"])


def test_cannot_remove_self(client, auth):
    me = client.get("/api/admin/users", headers=auth).json()["currentUser"]["email"]
    assert client.delete(f"/api/admin/users/{me}", headers=auth).status_code == 400


def test_invalid_role_rejected(client, auth):
    res = client.post("/api/admin/users", json={"email": "a@b.vn", "role": "sieu_nhan"}, headers=auth)
    assert res.status_code == 400


# --- Lịch khai giảng đi vào Knowledge Base --------------------------------


def test_schedule_reaches_knowledge_base(client, auth):
    """Nhập lịch trong trang quản trị thì chatbot phải trả lời được ngày cụ thể."""
    from app.services.chunker import chunk_schedules
    from app.services.store import get_store as _store

    client.post(
        "/api/admin/schedules",
        json={
            "courseCode": "K22",
            "startDate": "2026-10-15",
            "endDate": "2026-10-16",
            "location": "Hà Nội",
            "capacity": 40,
            "status": "open",
        },
        headers=auth,
    )
    schedules = fs.list_documents("sessions_schedule", limit=10)
    chunks = list(chunk_schedules(schedules, _store().courses))

    assert len(chunks) == 1
    chunk = chunks[0]
    assert chunk.courseCode == "K22"
    assert "15/10/2026" in chunk.content  # ngày hiển thị theo định dạng Việt Nam
    assert "Hà Nội" in chunk.content
    assert "đang nhận đăng ký" in chunk.content


def test_cancelled_schedule_not_in_knowledge_base(client, auth):
    from app.services.chunker import chunk_schedules
    from app.services.store import get_store as _store

    client.post(
        "/api/admin/schedules",
        json={"courseCode": "K23", "startDate": "2026-10-01", "status": "cancelled"},
        headers=auth,
    )
    schedules = fs.list_documents("sessions_schedule", limit=10)
    assert list(chunk_schedules(schedules, _store().courses)) == []


def test_contact_chunk_uses_vietnamese_labels(client, auth):
    """Knowledge Base là tiếng Việt; tên trường tiếng Anh lọt vào sẽ khó đọc."""
    from app.services.chunker import chunk_site

    client.put(
        "/api/admin/site",
        json={
            "contact": {
                "unit": "Phòng Đào tạo", "email": "dt@example.vn", "phone": "0900",
                "address": "", "registrationDeadline": "30/09/2026", "note": "",
            }
        },
        headers=auth,
    )
    content = next(chunk_site(get_store().site)).content
    assert "Đơn vị đầu mối: Phòng Đào tạo" in content
    assert "Hạn đăng ký: 30/09/2026" in content
    assert "registrationDeadline" not in content
    assert "unit:" not in content
