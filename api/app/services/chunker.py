"""Tách nội dung khóa học thành chunk theo cấu trúc mục.

Cắt theo mục nghiệp vụ chứ không theo số ký tự: mỗi chunk là một đơn vị ý
nghĩa trọn vẹn (một ngày học, một bảng module, một bộ KPI...) nên khi trích
dẫn vẫn đọc được và không bị đứt giữa câu.
"""

from __future__ import annotations

import hashlib
from typing import Any, Iterator

from app.models.schemas import Course, Faq, KbChunk


def _chunk_id(source: str, section: str) -> str:
    digest = hashlib.sha1(f"{source}::{section}".encode()).hexdigest()[:16]
    return f"{source.lower()}-{digest}"


def _estimate_tokens(text: str) -> int:
    # Tiếng Việt trung bình ~1 token cho 3 ký tự với tokenizer của Gemini.
    return max(1, len(text) // 3)


def _mk(course: Course | None, source: str, section: str, title: str, body: str) -> KbChunk:
    content = body.strip()
    return KbChunk(
        id=_chunk_id(source, section),
        courseCode=course.code if course else None,
        courseGroup=course.group if course else None,
        sourceDoc=source,
        section=section,
        title=title,
        content=content,
        tokens=_estimate_tokens(content),
    )


def _bullets(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items if item)


def chunk_course(course: Course) -> Iterator[KbChunk]:
    """Sinh các chunk cho một khóa học."""
    src = course.code
    name = f"Khóa {course.code[1:]}"
    header = (
        f"{name} (khóa tập huấn chuyên sâu số {course.legacyNumber} trong thư mời) — "
        f"{course.title}."
    )

    yield _mk(
        course,
        src,
        "tong-quan",
        f"{name} — Tổng quan",
        f"{header}\n"
        f"Tên ngắn: {course.shortTitle}. Chủ đề: {course.tagline}.\n"
        f"Thời lượng: {course.duration}. Phương pháp: {course.method}.\n"
        f"Đầu ra: {course.outputSummary}.\n"
        f"Nhóm khóa học: {course.group}.\n"
        f"Đối tượng nhận thư mời: {course.recipients}\n"
        + "\n".join(course.intro),
    )

    if course.coreGoal:
        yield _mk(
            course, src, "muc-tieu", f"{name} — Mục tiêu cốt lõi",
            f"{header}\nMục tiêu cốt lõi: {course.coreGoal}",
        )

    if course.objectives:
        yield _mk(
            course, src, "muc-tieu-trong-tam", f"{name} — Mục tiêu trọng tâm",
            f"{header}\nMục tiêu trọng tâm của khóa học:\n{_bullets(course.objectives)}",
        )

    if course.highlight:
        yield _mk(
            course, src, "chuyen-giao-noi-bat", f"{name} — Điểm đặc biệt",
            f"{header}\n{course.highlight.get('label', 'ĐẶC BIỆT')}: {course.highlight.get('text', '')}",
        )

    if course.values:
        body = "\n".join(f"- {v.get('title')}: {v.get('description')}" for v in course.values)
        yield _mk(
            course, src, "gia-tri", f"{name} — Giá trị thu được",
            f"{header}\nGiá trị thu được sau khóa tập huấn:\n{body}",
        )

    audience = course.audience or {}
    if audience:
        rows = "\n".join(
            f"- {r.get('role')}: {r.get('duty')}" for r in audience.get("rows", []) or []
        )
        extra = audience.get("priorityUnits", "")
        yield _mk(
            course, src, "doi-tuong", f"{name} — Đối tượng nên cử đi học",
            f"{header}\n{audience.get('note', '')}\n"
            f"Số người khuyến nghị: {audience.get('headcount', '')}.\n{rows}\n{extra}",
        )

    for day in course.days:
        yield _mk(
            course, src, f"ngay-{day.no}", f"{name} — Ngày {day.no}: {day.title}",
            f"{header}\nNgày {day.no} — {day.title}. {day.subtitle}\n"
            f"{_bullets(day.topics)}\nKết quả đầu ra ngày {day.no}: {day.output}",
        )

    if course.deliverables:
        yield _mk(
            course, src, "ket-qua-dau-ra", f"{name} — Kết quả đầu ra mang về",
            f"{header}\nKết quả đầu ra cụ thể mỗi đơn vị mang về:\n{_bullets(course.deliverables)}",
        )

    software = course.software or {}
    modules = software.get("modules", []) or []
    if modules:
        listing = "\n".join(f"{m['no']}. {m['name']}: {m['description']}" for m in modules)
        yield _mk(
            course, src, "phan-mem", f"{name} — Phần mềm chuyển giao: {software.get('name', '')}",
            f"{header}\nPhần mềm được chuyển giao miễn phí: {software.get('name', '')}.\n"
            f"{software.get('intro', '')}\nGồm {len(modules)} module:\n{listing}",
        )
        scope_note = software.get("note", "")
        yield _mk(
            course, src, "pham-vi-chuyen-giao", f"{name} — Phạm vi chuyển giao",
            f"{header}\nPhạm vi chuyển giao: {software.get('scope', '')}\n{scope_note}",
        )

    kpis = course.kpis or {}
    if kpis.get("rows"):
        rows = "\n".join(f"- {r['metric']}: {r['target']}" for r in kpis["rows"])
        yield _mk(
            course, src, "kpi", f"{name} — Hiệu quả kỳ vọng khi pilot",
            f"{header}\n{kpis.get('note', '')}\n{rows}\n"
            f"LƯU Ý QUAN TRỌNG: {kpis.get('caveat', '')}",
        )

    if course.dataToBring:
        yield _mk(
            course, src, "du-lieu-mang-theo", f"{name} — Dữ liệu khuyến khích mang theo",
            f"{header}\nDữ liệu/học liệu khuyến khích mang theo để thực hành:\n"
            f"{_bullets(course.dataToBring)}",
        )

    if course.responsibleAi:
        yield _mk(
            course, src, "ai-co-trach-nhiem", f"{name} — Nguyên tắc AI có trách nhiệm",
            f"{header}\nNguyên tắc bắt buộc khi sử dụng AI trong khóa này:\n"
            f"{_bullets(course.responsibleAi)}",
        )

    if course.roadmap or course.longTermGoal:
        yield _mk(
            course, src, "lo-trinh", f"{name} — Lộ trình sau khóa tập huấn",
            f"{header}\nLộ trình: {' → '.join(course.roadmap)}\n"
            f"Mục tiêu dài hạn: {course.longTermGoal}\nThông điệp: {course.motto}",
        )

    for related in course.relatedCourses:
        rc = related.get("code", "")
        yield _mk(
            course, src, f"phan-biet-{rc.lower()}",
            f"{name} — Phân biệt với Khóa {rc[1:] if rc else ''}",
            f"So sánh {name} với Khóa {rc[1:] if rc else ''}: {related.get('reason', '')}",
        )


def chunk_faq(faq: Faq) -> KbChunk:
    codes = ", ".join(faq.courseCodes) if faq.courseCodes else "chung"
    return KbChunk(
        id=f"faq-{faq.id}",
        courseCode=faq.courseCodes[0] if len(faq.courseCodes) == 1 else None,
        courseGroup=None,
        sourceDoc="FAQ",
        section=faq.category or "faq",
        title=f"Hỏi đáp — {faq.question}",
        content=f"Câu hỏi: {faq.question}\nTrả lời: {faq.answer}\n(Liên quan: {codes})",
        tokens=_estimate_tokens(faq.answer),
    )


_CONTACT_LABELS = [
    ("unit", "Đơn vị đầu mối"),
    ("address", "Địa chỉ"),
    ("email", "Email"),
    ("phone", "Điện thoại"),
    ("registrationDeadline", "Hạn đăng ký"),
]

_SCHEDULE_STATUS = {
    "planned": "dự kiến",
    "open": "đang nhận đăng ký",
    "closed": "đã đóng đăng ký",
    "done": "đã tổ chức",
}


def _format_date(value: str) -> str:
    """2026-10-15 → 15/10/2026. Giá trị khác giữ nguyên."""
    parts = str(value or "").split("-")
    if len(parts) == 3 and all(p.isdigit() for p in parts):
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return str(value or "")


def chunk_site(site: dict[str, Any]) -> Iterator[KbChunk]:
    contact = site.get("contact", {}) or {}
    lines = [f"{label}: {contact[key]}" for key, label in _CONTACT_LABELS if contact.get(key)]
    organizer = site.get("organizer", "")
    if organizer:
        lines.insert(0, f"Đơn vị tổ chức: {organizer}")

    if lines:
        body = "Thông tin tổ chức và đầu mối đăng ký của chương trình.\n" + "\n".join(lines)
    else:
        body = (
            "Thông tin tổ chức chương trình.\n"
            "Ban tổ chức CHƯA công bố thời gian, địa điểm, hạn đăng ký và đầu mối liên hệ. "
            "Khi được hỏi về các thông tin này, phải trả lời rằng ban tổ chức sẽ cung cấp, "
            "TUYỆT ĐỐI không tự suy đoán."
        )

    yield KbChunk(
        id="site-lien-he",
        sourceDoc="Thông tin tổ chức",
        section="lien-he",
        title="Thông tin tổ chức và đầu mối liên hệ",
        content=body,
        tokens=_estimate_tokens(body),
    )

    ra = site.get("responsibleAi", {}) or {}
    if ra:
        rules = "\n".join(
            f"- Khóa {r['courseCode'][1:]}: {r['text']}" for r in ra.get("rules", []) or []
        )
        content = f"{ra.get('intro', '')}\n{rules}\n{ra.get('kpiNote', '')}"
        yield KbChunk(
            id="site-ai-trach-nhiem",
            sourceDoc="Nguyên tắc chung",
            section="ai-co-trach-nhiem",
            title="Nguyên tắc sử dụng AI có trách nhiệm của cả chương trình",
            content=content,
            tokens=_estimate_tokens(content),
        )


def chunk_schedules(schedules: list[dict[str, Any]], courses: list[Course]) -> Iterator[KbChunk]:
    """Lịch khai giảng ban tổ chức nhập trong trang quản trị.

    Không có lịch thì không sinh chunk nào — chatbot rơi về chunk thông tin tổ
    chức, vốn nói rõ là chưa công bố. Như vậy nó không bao giờ bịa ra ngày.
    """
    by_code: dict[str, list[dict[str, Any]]] = {}
    for row in schedules:
        if row.get("status") == "cancelled":
            continue
        code = str(row.get("courseCode", "")).upper()
        if code:
            by_code.setdefault(code, []).append(row)

    names = {c.code: c.shortTitle for c in courses}

    for code, rows in by_code.items():
        name = f"Khóa {code[1:]}"
        lines: list[str] = []
        for row in rows:
            start = _format_date(row.get("startDate", ""))
            end = _format_date(row.get("endDate", ""))
            when = f"{start} đến {end}" if end and end != start else start or "chưa xác định ngày"
            parts = [f"- Từ {when}"]
            if row.get("location"):
                parts.append(f"tại {row['location']}")
            if row.get("format"):
                parts.append(f"hình thức {row['format']}")
            if row.get("capacity"):
                parts.append(f"{row['capacity']} chỗ")
            if row.get("registrationDeadline"):
                parts.append(f"hạn đăng ký {_format_date(row['registrationDeadline'])}")
            status = _SCHEDULE_STATUS.get(str(row.get("status", "")), "")
            if status:
                parts.append(f"trạng thái {status}")
            contact = ", ".join(
                str(row[k]) for k in ("contactName", "contactEmail", "contactPhone") if row.get(k)
            )
            if contact:
                parts.append(f"đầu mối {contact}")
            lines.append(", ".join(parts) + ".")

        content = (
            f"Lịch khai giảng {name} — {names.get(code, '')}.\n" + "\n".join(lines)
        )
        yield KbChunk(
            id=f"schedule-{code.lower()}",
            courseCode=code,
            sourceDoc="Lịch khai giảng",
            section="lich-khai-giang",
            title=f"{name} — Lịch khai giảng",
            content=content,
            tokens=_estimate_tokens(content),
        )


def build_corpus(
    courses: list[Course],
    faqs: list[Faq],
    site: dict[str, Any],
    schedules: list[dict[str, Any]] | None = None,
) -> list[KbChunk]:
    chunks: list[KbChunk] = []
    for course in courses:
        chunks.extend(chunk_course(course))
    chunks.extend(chunk_faq(f) for f in faqs)
    chunks.extend(chunk_site(site))
    chunks.extend(chunk_schedules(schedules or [], courses))
    return chunks
