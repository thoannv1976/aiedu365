"""Phân loại ý định câu hỏi.

Với 08 khóa, câu "khóa nào phù hợp với chúng tôi?" cần luồng truy hồi khác
hẳn câu "khóa 27 học mấy ngày?". Phân loại chạy bằng luật trước — nhanh, rẻ,
tất định — và chỉ nhờ tới mô hình khi luật không quyết được.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.models.schemas import Intent
from app.services.aliases import get_resolver, normalize

_COMPARE_HINTS = (
    "so sanh", "khac nhau", "khac gi", "phan biet", "nen chon", "chon khoa nao",
    "giong nhau", "doi chieu", "hon kem", "va khoa", "hay khoa",
)
_ROUTING_HINTS = (
    "phu hop", "nen hoc", "nen tham du", "nen cu", "don vi toi", "truong toi",
    "phong toi", "khoa toi", "bo mon toi", "chung toi", "don vi chung toi",
    "goi y khoa", "tu van khoa", "hop voi", "nen chon khoa nao", "chon khoa nao",
    "khoa nao",
)
_REGISTER_HINTS = (
    "dang ky", "ghi danh", "dang ki", "muon tham du", "lien he", "hoc phi",
    "chi phi", "le phi", "han dang ky", "con cho", "khai giang", "to chuc khi nao",
    "o dau", "dia diem", "thoi gian to chuc", "dau moi",
)
_OUT_OF_SCOPE_HINTS = (
    "thoi tiet", "bong da", "chung khoan", "gia vang", "ty gia", "chinh tri",
    "bau cu", "cach chua", "trieu chung", "don thuoc", "ma so thue ca nhan",
)


@dataclass
class IntentResult:
    intent: Intent
    course_codes: list[str] = field(default_factory=list)
    ambiguous_number: bool = False
    confidence: float = 1.0


def classify(message: str, course_context: str | None = None) -> IntentResult:
    text = normalize(message)
    resolver = get_resolver()
    matches = resolver.find(message)
    codes = [m.code for m in matches]
    if course_context and course_context.upper() not in codes:
        codes.insert(0, course_context.upper())
    ambiguous = resolver.is_ambiguous(message)

    if any(hint in text for hint in _OUT_OF_SCOPE_HINTS):
        return IntentResult(Intent.OUT_OF_SCOPE, codes, ambiguous, 0.9)

    # Nêu đích danh khóa nào thì câu hỏi thuộc về khóa đó, không phải nhờ gợi ý.
    # "Khóa 27 phù hợp với ai?" là tra cứu đối tượng, không phải định tuyến.
    explicit = [m for m in matches if m.how in ("official", "legacy")]

    if any(hint in text for hint in _COMPARE_HINTS) or len(set(codes)) >= 2:
        # "nên chọn khóa nào" là định tuyến chứ không phải so sánh: người hỏi
        # chưa nêu khóa nào để đem ra đối chiếu.
        if len(set(codes)) < 2 and any(h in text for h in ("khoa nao", "chon khoa nao")):
            return IntentResult(Intent.ROUTING, codes, ambiguous, 0.8)
        return IntentResult(Intent.COMPARE, codes, ambiguous, 0.85)

    if any(hint in text for hint in _ROUTING_HINTS) and not explicit:
        return IntentResult(Intent.ROUTING, codes, ambiguous, 0.8)

    if any(hint in text for hint in _REGISTER_HINTS):
        return IntentResult(Intent.REGISTER, codes, ambiguous, 0.8)

    return IntentResult(Intent.LOOKUP, codes, ambiguous, 0.6)


def retrieval_plan(result: IntentResult, settings_top_k: int, compare_top_k: int) -> tuple[int, bool]:
    """Trả về (top_k, ensure_coverage) tương ứng với ý định."""
    if result.intent in (Intent.COMPARE, Intent.ROUTING):
        return compare_top_k, True
    return settings_top_k, False
