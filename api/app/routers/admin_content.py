"""Quản trị nội dung: khóa học, lịch khai giảng, FAQ, nội dung trang, người dùng.

Tách khỏi ``admin.py`` (vốn lo phần vận hành: thống kê, hội thoại, Knowledge
Base, đăng ký) để mỗi file giữ một trách nhiệm rõ ràng.

Mọi thao tác ghi đều đi qua Firestore rồi nạp lại kho nội dung trong bộ nhớ,
nên nội dung mới có hiệu lực ngay — không cần khởi động lại service.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query

from app.core.security import AdminIdentity, require_editor, require_super_admin, require_viewer
from app.models.schemas import Course, Faq
from app.services import firestore as fs
from app.services.aliases import get_resolver
from app.services.store import get_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin-content"])


def _refresh_content() -> None:
    """Nạp lại nội dung và bảng alias sau khi ghi.

    Chỉ mục vector KHÔNG được dựng lại ở đây: việc đó tốn thời gian và gọi
    embedding, nên để ban tổ chức chủ động bấm “Cập nhật Knowledge Base” sau
    khi sửa xong toàn bộ nội dung, thay vì chạy lại sau từng thao tác nhỏ.
    """
    get_store().load(force=True)
    get_resolver()._build()


# --------------------------------------------------------------------------
# Khóa học
# --------------------------------------------------------------------------

# Các trường ban tổ chức được sửa. Không cho sửa `code`, `legacyNumber`,
# `slug`, `group`: đổi chúng sẽ phá liên kết, mã khóa trong bảng quy đổi và
# các URL đã phát hành.
EDITABLE_COURSE_FIELDS = {
    "title", "shortTitle", "tagline", "duration", "durationDays", "method",
    "outputSummary", "aliases", "recipients", "intro", "coreGoal", "highlight",
    "objectives", "values", "audience", "days", "deliverables", "software",
    "kpis", "dataToBring", "roadmap", "longTermGoal", "motto", "responsibleAi",
    "relatedCourses", "order", "featured", "published",
}


@router.get("/courses")
def admin_list_courses(identity: AdminIdentity = Depends(require_viewer)) -> list[dict[str, Any]]:
    return [c.model_dump() for c in get_store().courses]


@router.get("/courses/{code}")
def admin_get_course(code: str, identity: AdminIdentity = Depends(require_viewer)) -> dict[str, Any]:
    course = get_store().course_by_code(code)
    if course is None:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy khóa {code}.")
    return course.model_dump()


@router.patch("/courses/{code}")
def admin_update_course(
    code: str,
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    store = get_store()
    course = store.course_by_code(code)
    if course is None:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy khóa {code}.")

    rejected = sorted(set(payload) - EDITABLE_COURSE_FIELDS)
    update = {k: v for k, v in payload.items() if k in EDITABLE_COURSE_FIELDS}
    if not update:
        raise HTTPException(
            status_code=400,
            detail=f"Không có trường hợp lệ để cập nhật. Bị bỏ qua: {', '.join(rejected) or 'không có'}",
        )

    before = course.model_dump()
    merged = {**before, **update}
    try:
        validated = Course.model_validate(merged)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Dữ liệu không hợp lệ: {exc}") from exc

    fs.add_document("courses", validated.model_dump(mode="json"), doc_id=validated.code)
    fs.write_audit(
        identity.email, "course.update", f"courses/{validated.code}",
        before={k: before.get(k) for k in update},
        after=update,
    )
    _refresh_content()
    return {
        "ok": True,
        "course": validated.model_dump(),
        "ignoredFields": rejected,
        "message": "Đã lưu. Bấm “Cập nhật Knowledge Base” để chatbot áp dụng nội dung mới.",
    }


# --------------------------------------------------------------------------
# Lịch khai giảng
# --------------------------------------------------------------------------

_SCHEDULE_FIELDS = {
    "courseCode", "startDate", "endDate", "location", "format",
    "registrationDeadline", "capacity", "contactName", "contactEmail",
    "contactPhone", "status", "note",
}


def _validate_schedule(payload: dict[str, Any]) -> dict[str, Any]:
    data = {k: v for k, v in payload.items() if k in _SCHEDULE_FIELDS}
    code = str(data.get("courseCode", "")).upper()
    if not code:
        raise HTTPException(status_code=400, detail="Thiếu mã khóa.")
    if get_store().course_by_code(code) is None:
        raise HTTPException(status_code=400, detail=f"Mã khóa không hợp lệ: {code}")
    data["courseCode"] = code
    data.setdefault("status", "planned")
    capacity = data.get("capacity")
    if capacity not in (None, ""):
        try:
            data["capacity"] = int(capacity)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Số chỗ phải là số nguyên.") from None
    return data


@router.get("/schedules")
def list_schedules(identity: AdminIdentity = Depends(require_viewer)) -> list[dict[str, Any]]:
    return fs.list_documents("sessions_schedule", limit=500, order_by="startDate", descending=False)


@router.post("/schedules", status_code=201)
def create_schedule(
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    data = _validate_schedule(payload)
    schedule_id = fs.add_document("sessions_schedule", data)
    fs.write_audit(identity.email, "schedule.create", f"sessions_schedule/{schedule_id}", after=data)
    return {"id": schedule_id, "message": "Đã thêm đợt khai giảng."}


@router.put("/schedules/{schedule_id}")
def update_schedule(
    schedule_id: str,
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    before = fs.get_document("sessions_schedule", schedule_id)
    if before is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt khai giảng.")
    data = _validate_schedule(payload)
    fs.update_document("sessions_schedule", schedule_id, data)
    fs.write_audit(
        identity.email, "schedule.update", f"sessions_schedule/{schedule_id}",
        before=before, after=data,
    )
    return {"ok": True}


@router.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: str,
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    before = fs.get_document("sessions_schedule", schedule_id)
    if before is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy đợt khai giảng.")
    fs.delete_document("sessions_schedule", schedule_id)
    fs.write_audit(
        identity.email, "schedule.delete", f"sessions_schedule/{schedule_id}", before=before
    )
    return {"ok": True}


# --------------------------------------------------------------------------
# FAQ
# --------------------------------------------------------------------------


def _slugify(text: str) -> str:
    from app.services.aliases import normalize

    slug = re.sub(r"[^a-z0-9]+", "-", normalize(text)).strip("-")
    return slug[:60] or "faq"


@router.get("/faqs")
def admin_list_faqs(identity: AdminIdentity = Depends(require_viewer)) -> list[dict[str, Any]]:
    """Trả về mọi FAQ, kể cả bản chưa publish — khác endpoint công khai."""
    store = get_store()
    store.load()
    return [f.model_dump() for f in sorted(store._faqs, key=lambda f: (f.order, -f.priority))]


@router.post("/faqs", status_code=201)
def create_faq(
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    question = str(payload.get("question", "")).strip()
    answer = str(payload.get("answer", "")).strip()
    if not question or not answer:
        raise HTTPException(status_code=400, detail="Cần có cả câu hỏi và câu trả lời.")

    valid_codes = {c.code for c in get_store().courses}
    codes = [str(c).upper() for c in payload.get("courseCodes", []) or []]
    invalid = [c for c in codes if c not in valid_codes]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Mã khóa không hợp lệ: {', '.join(invalid)}")

    faq = Faq(
        id=str(payload.get("id") or f"faq-{_slugify(question)}"),
        question=question,
        answer=answer,
        category=str(payload.get("category", "")).strip(),
        courseCodes=codes,
        priority=int(payload.get("priority", 50)),
        published=bool(payload.get("published", True)),
        order=int(payload.get("order", 500)),
    )
    fs.add_document("faqs", faq.model_dump(mode="json"), doc_id=faq.id)
    fs.write_audit(identity.email, "faq.create", f"faqs/{faq.id}", after=faq.model_dump())
    _refresh_content()
    return {
        "id": faq.id,
        "message": "Đã tạo FAQ. Bấm “Cập nhật Knowledge Base” để chatbot áp dụng.",
    }


@router.put("/faqs/{faq_id}")
def update_faq(
    faq_id: str,
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    before = fs.get_document("faqs", faq_id) or next(
        (f.model_dump() for f in get_store().faqs if f.id == faq_id), None
    )
    if before is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy FAQ.")

    merged = {**before, **{k: v for k, v in payload.items() if k != "id"}, "id": faq_id}
    try:
        faq = Faq.model_validate(merged)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Dữ liệu không hợp lệ: {exc}") from exc

    fs.add_document("faqs", faq.model_dump(mode="json"), doc_id=faq_id)
    fs.write_audit(identity.email, "faq.update", f"faqs/{faq_id}", before=before, after=faq.model_dump())
    _refresh_content()
    return {"ok": True, "message": "Đã lưu. Bấm “Cập nhật Knowledge Base” để chatbot áp dụng."}


@router.delete("/faqs/{faq_id}")
def delete_faq(faq_id: str, identity: AdminIdentity = Depends(require_editor)) -> dict[str, Any]:
    before = fs.get_document("faqs", faq_id)
    if before is None:
        # FAQ gốc nằm trong file JSON: không xóa được file, nhưng ghi đè bản
        # Firestore ở trạng thái ẩn để nó không còn xuất hiện.
        original = next((f for f in get_store().faqs if f.id == faq_id), None)
        if original is None:
            raise HTTPException(status_code=404, detail="Không tìm thấy FAQ.")
        hidden = {**original.model_dump(mode="json"), "published": False}
        fs.add_document("faqs", hidden, doc_id=faq_id)
        fs.write_audit(identity.email, "faq.hide", f"faqs/{faq_id}", before=original.model_dump())
        _refresh_content()
        return {"ok": True, "message": "Đã ẩn FAQ mặc định (không xóa vĩnh viễn được)."}

    fs.delete_document("faqs", faq_id)
    fs.write_audit(identity.email, "faq.delete", f"faqs/{faq_id}", before=before)
    _refresh_content()
    return {"ok": True, "message": "Đã xóa FAQ."}


# --------------------------------------------------------------------------
# Nội dung trang
# --------------------------------------------------------------------------

_SITE_FIELDS = {
    "programName", "organizer", "hero", "stats", "differentiators",
    "roadmap", "responsibleAi", "contact", "chat",
}


@router.get("/site")
def admin_get_site(identity: AdminIdentity = Depends(require_viewer)) -> dict[str, Any]:
    return get_store().site


@router.put("/site")
def admin_update_site(
    payload: dict[str, Any] = Body(...),
    identity: AdminIdentity = Depends(require_editor),
) -> dict[str, Any]:
    update = {k: v for k, v in payload.items() if k in _SITE_FIELDS}
    if not update:
        raise HTTPException(status_code=400, detail="Không có trường hợp lệ để cập nhật.")

    before = get_store().site
    merged = {**before, **update}
    fs.add_document("site_content", merged, doc_id="main")
    fs.write_audit(
        identity.email, "site.update", "site_content/main",
        before={k: before.get(k) for k in update}, after=update,
    )
    _refresh_content()
    return {
        "ok": True,
        "message": "Đã lưu. Bấm “Cập nhật Knowledge Base” để chatbot biết thông tin liên hệ mới.",
    }


# --------------------------------------------------------------------------
# Người dùng quản trị
# --------------------------------------------------------------------------

_ROLES = {"super_admin", "editor", "viewer"}


@router.get("/users")
def list_users(identity: AdminIdentity = Depends(require_super_admin)) -> dict[str, Any]:
    from app.core.config import get_settings

    return {
        "users": fs.list_documents("admin_users", limit=200),
        "bootstrapEmails": get_settings().admin_email_list,
        "currentUser": {"email": identity.email, "role": identity.role},
    }


@router.post("/users", status_code=201)
def add_user(
    email: str = Body(embed=True),
    role: str = Body(embed=True),
    displayName: str = Body(default="", embed=True),
    identity: AdminIdentity = Depends(require_super_admin),
) -> dict[str, Any]:
    email = email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Email không hợp lệ.")
    if role not in _ROLES:
        raise HTTPException(status_code=400, detail=f"Vai trò không hợp lệ: {role}")

    fs.add_document(
        "admin_users",
        {"email": email, "role": role, "displayName": displayName, "active": True},
        doc_id=email.replace("/", "_"),
    )
    fs.write_audit(identity.email, "user.add", f"admin_users/{email}", after={"role": role})
    return {
        "ok": True,
        "message": (
            "Đã ghi nhận. Người này còn cần được gán custom claim “role” trong Firebase "
            "Authentication thì mới đăng nhập được."
        ),
    }


@router.delete("/users/{email}")
def remove_user(
    email: str, identity: AdminIdentity = Depends(require_super_admin)
) -> dict[str, Any]:
    email = email.strip().lower()
    if email == identity.email:
        raise HTTPException(status_code=400, detail="Không thể tự gỡ quyền của chính mình.")
    before = fs.get_document("admin_users", email.replace("/", "_"))
    if before is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")
    fs.update_document("admin_users", email.replace("/", "_"), {"active": False})
    fs.write_audit(identity.email, "user.deactivate", f"admin_users/{email}", before=before)
    return {"ok": True, "message": "Đã vô hiệu hóa tài khoản."}
