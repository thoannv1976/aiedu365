"""Kho dữ liệu nội dung.

Đọc từ file JSON trong ``data/`` làm nguồn mặc định; khi bật Firestore thì
Firestore là nguồn ưu tiên và JSON chỉ còn là phương án dự phòng. Nhờ vậy
frontend chạy được ngay từ lúc chưa có hạ tầng GCP.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Any

from app.core.config import Settings, get_settings
from app.models.schemas import Course, CourseGroup, CourseSummary, Faq

logger = logging.getLogger(__name__)


def _read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


class ContentStore:
    """Nguồn dữ liệu khóa học, nhóm, FAQ và nội dung trang."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._lock = threading.RLock()
        self._courses: dict[str, Course] = {}
        self._groups: list[CourseGroup] = []
        self._faqs: list[Faq] = []
        self._site: dict[str, Any] = {}
        self._loaded = False

    # -- nạp dữ liệu ------------------------------------------------------

    def load(self, force: bool = False) -> None:
        with self._lock:
            if self._loaded and not force:
                return
            base = self.settings.data_dir
            courses: dict[str, Course] = {}
            for path in sorted((base / "courses").glob("*.json")):
                course = Course.model_validate(_read_json(path))
                courses[course.code] = course
            self._courses = courses
            self._groups = [CourseGroup.model_validate(g) for g in _read_json(base / "groups.json")]
            self._faqs = [Faq.model_validate(f) for f in _read_json(base / "faqs.json")]
            self._site = _read_json(base / "site.json")
            self._loaded = True
            logger.info("Đã nạp %d khóa học từ %s", len(courses), base)
            self._overlay_stored()

    def _overlay_stored(self) -> None:
        """Ghi đè bằng nội dung ban tổ chức đã sửa trong trang quản trị.

        Đọc qua lớp ``firestore`` chứ không qua client Firestore trực tiếp: lớp
        đó tự chuyển sang bộ nhớ tiến trình khi chưa bật Firestore, nên môi
        trường phát triển hành xử giống hệt production — sửa nội dung là thấy
        ngay, thay vì im lặng biến mất.
        """
        try:
            from app.services import firestore as fs

            for data in fs.list_documents("courses", limit=100):
                if not data.get("code"):
                    continue
                try:
                    course = Course.model_validate(data)
                except Exception:
                    logger.warning("Bỏ qua khóa %s: dữ liệu đã lưu không hợp lệ", data.get("id"))
                    continue
                self._courses[course.code] = course

            stored_faqs = {}
            for data in fs.list_documents("faqs", limit=500):
                try:
                    faq = Faq.model_validate(data)
                except Exception:
                    logger.warning("Bỏ qua FAQ %s: dữ liệu không hợp lệ", data.get("id"))
                    continue
                stored_faqs[faq.id] = faq
            if stored_faqs:
                merged = {f.id: f for f in self._faqs}
                merged.update(stored_faqs)
                self._faqs = list(merged.values())

            site = fs.get_document("site_content", "main")
            if site:
                self._site = {**self._site, **{k: v for k, v in site.items()
                                               if not k.startswith("_")}}
        except Exception as exc:  # pragma: no cover - phụ thuộc hạ tầng
            logger.warning("Không nạp được nội dung đã sửa, dùng dữ liệu gốc: %s", exc)

    # -- truy vấn ---------------------------------------------------------

    @property
    def courses(self) -> list[Course]:
        self.load()
        return sorted(
            (c for c in self._courses.values() if c.published),
            key=lambda c: c.order,
        )

    def course_by_code(self, code: str) -> Course | None:
        self.load()
        return self._courses.get(code.upper())

    def course_by_slug(self, slug: str) -> Course | None:
        self.load()
        return next((c for c in self._courses.values() if c.slug == slug), None)

    def course_by_legacy_number(self, number: int) -> Course | None:
        self.load()
        return next((c for c in self._courses.values() if c.legacyNumber == number), None)

    @property
    def groups(self) -> list[CourseGroup]:
        self.load()
        return sorted(self._groups, key=lambda g: g.order)

    @property
    def faqs(self) -> list[Faq]:
        self.load()
        return sorted(
            (f for f in self._faqs if f.published),
            key=lambda f: (f.order, -f.priority),
        )

    @property
    def site(self) -> dict[str, Any]:
        self.load()
        return self._site

    def summaries(self) -> list[CourseSummary]:
        out: list[CourseSummary] = []
        for c in self.courses:
            software = c.software or {}
            out.append(
                CourseSummary(
                    code=c.code,
                    legacyNumber=c.legacyNumber,
                    slug=c.slug,
                    group=c.group,
                    order=c.order,
                    featured=c.featured,
                    title=c.title,
                    shortTitle=c.shortTitle,
                    tagline=c.tagline,
                    duration=c.duration,
                    durationDays=c.durationDays,
                    outputSummary=c.outputSummary,
                    headcount=str((c.audience or {}).get("headcount", "")),
                    softwareName=str(software.get("name", "")),
                    moduleCount=len(software.get("modules", []) or []),
                    recipients=c.recipients,
                )
            )
        return out

    def stats(self) -> dict[str, int]:
        courses = self.courses
        return {
            "courseCount": len(courses),
            "totalDays": sum(c.durationDays for c in courses),
            "moduleCount": sum(len((c.software or {}).get("modules", []) or []) for c in courses),
        }


_store: ContentStore | None = None
_store_lock = threading.Lock()


def get_store() -> ContentStore:
    global _store
    if _store is None:
        with _store_lock:
            if _store is None:
                _store = ContentStore()
                _store.load()
    return _store
