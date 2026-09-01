"""Endpoint công khai: khóa học, nhóm, FAQ, nội dung trang."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import Course, CourseGroup, CourseSummary, Faq
from app.services.store import get_store

router = APIRouter(tags=["content"])


@router.get("/courses", response_model=list[CourseSummary])
def list_courses(group: str | None = Query(default=None)) -> list[CourseSummary]:
    items = get_store().summaries()
    if group:
        items = [c for c in items if c.group == group]
    return items


@router.get("/courses/compare", response_model=list[Course])
def compare_courses(codes: str = Query(description="Danh sách mã, ví dụ K24,K28")) -> list[Course]:
    store = get_store()
    wanted = [c.strip().upper() for c in codes.split(",") if c.strip()]
    if not wanted:
        raise HTTPException(status_code=400, detail="Cần ít nhất một mã khóa.")
    if len(wanted) > 3:
        raise HTTPException(status_code=400, detail="So sánh tối đa 03 khóa một lần.")
    result: list[Course] = []
    for code in wanted:
        course = store.course_by_code(code)
        if not course:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy khóa {code}.")
        result.append(course)
    return result


@router.get("/courses/{identifier}", response_model=Course)
def get_course(identifier: str) -> Course:
    """Nhận mã (K23), slug, hoặc số hiệu trong thư mời (3)."""
    store = get_store()
    course = store.course_by_code(identifier) or store.course_by_slug(identifier)
    if course is None and identifier.isdigit():
        course = store.course_by_legacy_number(int(identifier))
    if course is None:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy khóa “{identifier}”.")
    return course


@router.get("/groups", response_model=list[CourseGroup])
def list_groups() -> list[CourseGroup]:
    return get_store().groups


@router.get("/faqs", response_model=list[Faq])
def list_faqs(course: str | None = Query(default=None)) -> list[Faq]:
    faqs = get_store().faqs
    if course:
        code = course.upper()
        faqs = [f for f in faqs if not f.courseCodes or code in f.courseCodes]
    return faqs


@router.get("/site")
def get_site() -> dict:
    """Nội dung trang chủ, với các ô số liệu được điền từ dữ liệu thật.

    Số khóa, số ngày và số module không viết cứng trong nội dung: thêm hay bớt
    một khóa là các con số trên trang tự đúng theo.
    """
    store = get_store()
    site = {**store.site}
    catalog = store.stats()
    site["stats"] = [
        {**stat, "value": catalog.get(stat["source"], stat["value"])}
        if stat.get("source")
        else stat
        for stat in site.get("stats", [])
    ]
    site["catalog"] = catalog
    return site


@router.get("/schedules")
def list_schedules(course: str | None = Query(default=None)) -> list[dict]:
    """Lịch khai giảng đã công bố.

    Ban tổ chức nhập trong trang quản trị; chừng nào chưa có đợt nào thì danh
    sách rỗng và giao diện hiển thị “sẽ được thông báo” thay vì bịa ra ngày.
    """
    from app.services import firestore as fs

    rows = fs.list_documents(
        "sessions_schedule", limit=200, order_by="startDate", descending=False
    )
    rows = [r for r in rows if r.get("status") != "cancelled"]
    if course:
        code = course.upper()
        rows = [r for r in rows if r.get("courseCode") == code]
    return rows


@router.get("/software")
def list_software() -> list[dict]:
    """Toàn bộ module phần mềm được chuyển giao, gom theo khóa."""
    out = []
    for course in get_store().courses:
        software = course.software or {}
        out.append(
            {
                "courseCode": course.code,
                "courseSlug": course.slug,
                "courseName": f"Khóa {course.code[1:]}",
                "shortTitle": course.shortTitle,
                "suiteName": software.get("name", ""),
                "intro": software.get("intro", ""),
                "scope": software.get("scope", ""),
                "note": software.get("note", ""),
                "modules": software.get("modules", []),
            }
        )
    return out
