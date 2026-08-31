"""Chuẩn hóa mọi cách gọi tên khóa học về mã chính thức K21–K28.

Mã chính thức của chương trình là K21–K28, nhưng thân thư mời lại ghi
"khóa tập huấn chuyên sâu số 1" đến "số 8". Người hỏi dùng lẫn cả hai cách,
nên bước chuẩn hóa này phải chạy trước khi truy hồi — không phó mặc cho mô hình.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from app.services.store import ContentStore, get_store

# Các mẫu chạy trên chuỗi ĐÃ BỎ DẤU (xem ``normalize``) nên không cần liệt kê
# mọi biến thể dấu của "khóa"/"khoá".
_OFFICIAL_RE = re.compile(r"\bk\s*-?\s*(2[1-8])\b")
_COURSE_NUM_RE = re.compile(
    r"\bkhoa\s*(?:tap\s*huan\s*)?(?:chuyen\s*sau\s*)?(?:so\s*)?(\d{1,2})\b"
)


# NFD chỉ tách được dấu thanh và dấu mũ; chữ đ/Đ là ký tự riêng (U+0111/U+0110)
# nên phải quy đổi thủ công, nếu không "đào tạo" sẽ thành "đao tao" và mọi
# từ khóa gõ không dấu đều trượt.
_DSTROKE = str.maketrans({"đ": "d", "Đ": "D"})


def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text.translate(_DSTROKE))
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", strip_accents(text).lower()).strip()


@dataclass(frozen=True)
class CourseMatch:
    code: str
    matched_text: str
    how: str
    """official | legacy | ambiguous_number | alias"""


class CourseAliasResolver:
    def __init__(self, store: ContentStore | None = None) -> None:
        self.store = store or get_store()
        self._alias_index: list[tuple[str, str]] = []
        self._build()

    def _build(self) -> None:
        index: list[tuple[str, str]] = []
        for course in self.store.courses:
            terms = {
                course.shortTitle,
                course.title,
                course.tagline,
                *(course.aliases or []),
                *( (course.software or {}).get("name", ""), ),
            }
            for module in (course.software or {}).get("modules", []) or []:
                terms.add(module.get("name", ""))
            for term in terms:
                term = (term or "").strip()
                if len(term) < 4:
                    continue
                index.append((normalize(term), course.code))
        # Cụm dài khớp trước để "AI Research Copilot" thắng "Copilot".
        index.sort(key=lambda pair: len(pair[0]), reverse=True)
        self._alias_index = index

    # -- API công khai ----------------------------------------------------

    def resolve_number(self, number: int) -> str | None:
        """21–28 là mã chính thức; 1–8 là số hiệu trong thân thư mời."""
        if 21 <= number <= 28:
            return f"K{number}"
        course = self.store.course_by_legacy_number(number)
        return course.code if course else None

    def find(self, text: str) -> list[CourseMatch]:
        """Trả về các khóa được nhắc tới trong câu, theo thứ tự xuất hiện."""
        matches: list[CourseMatch] = []
        seen: set[str] = set()
        norm = normalize(text)

        def add(code: str | None, matched: str, how: str) -> None:
            if code and code not in seen:
                seen.add(code)
                matches.append(CourseMatch(code=code, matched_text=matched, how=how))

        for m in _OFFICIAL_RE.finditer(norm):
            add(f"K{m.group(1)}", m.group(0), "official")

        for m in _COURSE_NUM_RE.finditer(norm):
            raw = int(m.group(1))
            if 21 <= raw <= 28:
                add(f"K{raw}", m.group(0), "official")
            elif 1 <= raw <= 8:
                # "khóa 3" gần như chắc chắn là khóa số 3 = K23, nhưng vẫn đánh
                # dấu để tầng trên quyết định có cần hỏi lại hay không.
                add(self.resolve_number(raw), m.group(0), "legacy")

        for alias, code in self._alias_index:
            if alias in norm:
                add(code, alias, "alias")

        return matches

    def is_ambiguous(self, text: str) -> bool:
        """True khi người dùng nói một con số 1–8 trần trụi, không kèm ngữ cảnh.

        Ví dụ "khóa 8" có thể là Khóa 28 (mã) hoặc khóa chuyên sâu số 8 —
        vốn cũng là Khóa 28, nên thực tế không mơ hồ. Mơ hồ chỉ xảy ra khi
        số vừa hợp lệ ở cả hai hệ và trỏ tới hai khóa khác nhau.
        """
        for m in _COURSE_NUM_RE.finditer(normalize(text)):
            raw = int(m.group(1))
            if 1 <= raw <= 8:
                legacy = self.resolve_number(raw)
                official = f"K{raw + 20}"
                if legacy and legacy != official:
                    return True
        return False

    def rewrite(self, text: str) -> str:
        """Chèn mã chính thức vào câu để bước truy hồi bắt được từ khóa."""
        codes = [m.code for m in self.find(text)]
        if not codes:
            return text
        hint = " ".join(f"{code} (Khóa {code[1:]})" for code in codes)
        return f"{text}\n[Khóa được nhắc tới: {hint}]"

    def display_name(self, code: str) -> str:
        course = self.store.course_by_code(code)
        if not course:
            return code
        return f"Khóa {course.code[1:]}"

    def full_label(self, code: str) -> str:
        course = self.store.course_by_code(code)
        if not course:
            return code
        return (
            f"Khóa {course.code[1:]} (khóa chuyên sâu số {course.legacyNumber} "
            f"trong thư mời) — {course.shortTitle}"
        )


_resolver: CourseAliasResolver | None = None


def get_resolver() -> CourseAliasResolver:
    global _resolver
    if _resolver is None:
        _resolver = CourseAliasResolver()
    return _resolver
