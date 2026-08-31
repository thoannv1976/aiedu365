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

            if self.settings.use_firestore:
                self._overlay_firestore()

    def _overlay_firestore(self) -> None:
        """Ghi đè bằng dữ liệu Firestore nếu có — cho phép admin sửa nội dung."""
        try:
            from app.services.firestore import get_firestore

            db = get_firestore()
            if db is None:
                return
            for doc in db.collection("courses").stream():
                data = doc.to_dict() or {}
                if not data.get("code"):
                    continue
                try:
                    course = Course.model_validate(data)
                except Exception:  # nội dung admin nhập có thể thiếu trường
                    logger.warning("Bỏ qua khóa %s: dữ liệu Firestore không hợp lệ", doc.id)
                    continue
                self._courses[course.code] = course
            faqs = [Faq.model_validate(d.to_dict()) for d in db.collection("faqs").stream()]
            if faqs:
                self._faqs = faqs
            site_doc = db.collection("site_content").document("main").get()
            if site_doc.exists:
                self._site = {**self._site, **(site_doc.to_dict() or {})}
        except Exception as exc:  # pragma: no cover - phụ thuộc hạ tầng
            logger.warning("Không đọc được Firestore, dùng dữ liệu JSON: %s", exc)

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
