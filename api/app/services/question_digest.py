"""Tổng hợp câu hỏi được hỏi nhiều nhất và mới nhất để hiện trên màn hình chat.

Đây là dữ liệu do người dùng gõ vào, và việc hiện lại nó cho người khác xem là
một quyết định về quyền riêng tư, không chỉ là một truy vấn. Vì vậy mỗi câu
phải qua ba lớp trước khi được hiện:

1. **Chất lượng** — chỉ lấy câu chatbot đã trả lời được, không vi phạm guardrail.
2. **Riêng tư** — loại bỏ câu chứa email, số điện thoại, chuỗi số dài, đường
   dẫn, hoặc lời tự giới thiệu bản thân.
3. **Kiểm duyệt** — ban tổ chức ẩn được bất kỳ câu nào từ trang quản trị.

Riêng mục "được hỏi nhiều nhất" còn yêu cầu câu đó đến từ nhiều phiên khác
nhau: một câu chỉ một người hỏi thì nhiều khả năng mang tình huống riêng của
họ, không phải câu hỏi chung.
"""

from __future__ import annotations

import re
import threading
import time
from dataclasses import dataclass
from typing import Any

from app.services import firestore as fs
from app.services.aliases import normalize

# Ngưỡng độ dài: quá ngắn thì vô nghĩa ("ok", "cảm ơn"), quá dài thì gần như
# chắc chắn là mô tả tình huống riêng của một đơn vị cụ thể.
MIN_LENGTH = 10
MAX_LENGTH = 120

MIN_SESSIONS_FOR_FREQUENT = 2
"""Câu chỉ một phiên hỏi thì chưa phải câu hỏi chung."""

CACHE_TTL_SECONDS = 60

_PII_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"), "email"),
    # Số điện thoại Việt Nam: 09xx, 03xx, +84…, kể cả khi có dấu cách hay chấm.
    (re.compile(r"(?:\+?84|0)\s*\d[\d\s.\-]{7,}\d"), "điện thoại"),
    # Chuỗi số dài: mã số thuế, số quyết định, CCCD, mã sinh viên.
    (re.compile(r"\d{7,}"), "chuỗi số dài"),
    (re.compile(r"https?://|www\.", re.IGNORECASE), "đường dẫn"),
    # Lời tự giới thiệu — thường kèm tên người hoặc tên đơn vị cụ thể.
    (re.compile(r"\bt[oô]i\s+(l[aà]|t[eê]n)\b", re.IGNORECASE), "tự giới thiệu"),
    (re.compile(r"\bt[eê]n\s+t[oô]i\b", re.IGNORECASE), "tự giới thiệu"),
    (re.compile(r"\bm[iì]nh\s+l[aà]\s+\w+\s+\w+", re.IGNORECASE), "tự giới thiệu"),
]


@dataclass(frozen=True)
class DigestQuestion:
    question: str
    count: int = 1
    courseCodes: tuple[str, ...] = ()


def privacy_reason(text: str) -> str:
    """Lý do câu hỏi không nên hiện công khai. Chuỗi rỗng nghĩa là hiện được."""
    stripped = text.strip()
    if len(stripped) < MIN_LENGTH:
        return "quá ngắn"
    if len(stripped) > MAX_LENGTH:
        return "quá dài, có thể chứa tình huống riêng"
    for pattern, label in _PII_PATTERNS:
        if pattern.search(stripped):
            return f"chứa {label}"
    return ""


def is_publishable(row: dict[str, Any]) -> bool:
    """Câu hỏi có đủ điều kiện hiện trên màn hình chat hay không."""
    if not row.get("answered", False):
        return False
    if row.get("violations"):
        return False
    if row.get("hiddenFromDigest"):
        return False
    if row.get("feedback") == "down":
        return False
    return not privacy_reason(row.get("question", ""))


def _display_form(text: str) -> str:
    """Chuẩn hóa hình thức hiển thị: bỏ khoảng trắng thừa, viết hoa chữ đầu."""
    cleaned = re.sub(r"\s+", " ", text.strip())
    return cleaned[0].upper() + cleaned[1:] if cleaned else cleaned


class QuestionDigest:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._cache: dict[str, Any] | None = None
        self._cached_at = 0.0

    def invalidate(self) -> None:
        with self._lock:
            self._cache = None

    def build(self, limit: int = 5) -> dict[str, list[dict[str, Any]]]:
        rows = fs.list_documents("chat_messages", limit=1000)
        publishable = [r for r in rows if is_publishable(r)]

        # Gom theo dạng đã chuẩn hóa để "Khóa 22 học gì?" và "khóa 22 học gì"
        # được tính là một câu.
        grouped: dict[str, dict[str, Any]] = {}
        for row in publishable:
            key = normalize(row["question"]).rstrip("?.! ")
            entry = grouped.setdefault(
                key,
                {
                    "question": _display_form(row["question"]),
                    "sessions": set(),
                    "count": 0,
                    "courseCodes": set(),
                    "latest": "",
                },
            )
            entry["count"] += 1
            if row.get("sessionId"):
                entry["sessions"].add(row["sessionId"])
            for code in row.get("courseCodes") or []:
                entry["courseCodes"].add(code)
            created = str(row.get("_createdAt", ""))
            if created > entry["latest"]:
                entry["latest"] = created

        frequent = sorted(
            (
                e
                for e in grouped.values()
                if len(e["sessions"]) >= MIN_SESSIONS_FOR_FREQUENT
            ),
            key=lambda e: (-e["count"], e["question"]),
        )[:limit]

        # Mới nhất: mỗi câu chỉ hiện một lần, và không lặp lại câu đã nằm ở mục
        # "được hỏi nhiều nhất" — hai danh sách giống hệt nhau thì vô ích.
        frequent_keys = {normalize(e["question"]).rstrip("?.! ") for e in frequent}
        recent = sorted(
            (e for key, e in grouped.items() if key not in frequent_keys),
            key=lambda e: e["latest"],
            reverse=True,
        )[:limit]

        def to_public(entry: dict[str, Any]) -> dict[str, Any]:
            return {
                "question": entry["question"],
                "count": entry["count"],
                "courseCodes": sorted(entry["courseCodes"]),
            }

        return {
            "frequent": [to_public(e) for e in frequent],
            "recent": [to_public(e) for e in recent],
        }

    def get(self, limit: int = 5) -> dict[str, list[dict[str, Any]]]:
        """Bản tổng hợp có bộ đệm — endpoint này bị gọi mỗi lần ai đó mở chat."""
        now = time.time()
        with self._lock:
            if self._cache is not None and now - self._cached_at < CACHE_TTL_SECONDS:
                return self._cache
        digest = self.build(limit)
        with self._lock:
            self._cache = digest
            self._cached_at = now
        return digest


_digest: QuestionDigest | None = None


def get_digest() -> QuestionDigest:
    global _digest
    if _digest is None:
        _digest = QuestionDigest()
    return _digest
