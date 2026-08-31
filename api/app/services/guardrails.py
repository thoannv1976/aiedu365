"""Rào chắn an toàn.

Ba loại kiểm tra:
1. Đầu vào — độ dài, prompt injection.
2. Ngưỡng truy hồi — không đủ ngữ cảnh thì không gọi mô hình sinh.
3. Đầu ra — chặn các khẳng định bị cấm và mã khóa không khớp ngữ cảnh.

Danh sách khẳng định bị cấm lấy trực tiếp từ ràng buộc ghi trong thư mời
của Khóa 26, 27, 28 — đây là điều kiện nghiệp vụ, không phải tùy chọn.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.models.schemas import RetrievalHit
from app.services.aliases import get_resolver, normalize

MAX_MESSAGE_LENGTH = 1500

_INJECTION_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bignore (all|any|previous|above)\b",
        r"\bdisregard (all|any|previous|the) (above|instructions)\b",
        r"\bb[oỏ] qua (m[oọ]i|t[aấ]t c[aả]|c[aá]c) (h[uư][oớ]ng d[aẫ]n|ch[iỉ] d[aẫ]n|quy t[aắ]c)\b",
        r"\byou are now\b.{0,40}\b(dan|developer mode|jailbreak)\b",
        r"\bsystem prompt\b.{0,20}\b(reveal|show|print|in ra)\b",
        r"\bqu[eê]n (h[eế]t )?(nh[uữ]ng g[iì]|m[oọ]i th[uứ]) (tr[uư][oớ]c|[oở] tr[eê]n)\b",
        r"\b(act as|đóng vai) .{0,30}(kh[oô]ng c[oó] gi[oớ]i h[aạ]n|unrestricted)\b",
    )
]

# Các khẳng định bị cấm, lấy trực tiếp từ ràng buộc ghi trong thư mời Khóa 26,
# 27, 28. Mỗi mục là một chuỗi "cụm từ phải xuất hiện gần nhau": cách này bền
# hơn một biểu thức chính quy dài, vì câu do mô hình sinh ra có vô số cách diễn
# đạt xen giữa (ví dụ "AI sẽ tự động quyết định việc tuyển dụng cán bộ").
@dataclass(frozen=True)
class BannedClaim:
    label: str
    course: str
    groups: tuple[tuple[str, ...], ...]
    """Mỗi phần tử là một nhóm từ đồng nghĩa; câu vi phạm phải chứa đủ mọi nhóm."""
    window: int = 90
    """Khoảng cách tối đa (ký tự) giữa nhóm đầu và nhóm cuối."""


BANNED_CLAIMS: list[BannedClaim] = [
    BannedClaim(
        label="AI tự quyết định nhân sự",
        course="K27",
        groups=(
            ("ai", "phan mem", "he thong", "cong cu"),
            ("tu dong quyet dinh", "tu quyet dinh", "quyet dinh thay", "tu dong xet duyet"),
            ("tuyen dung", "bo nhiem", "ky luat", "danh gia can bo", "danh gia nhan su"),
        ),
    ),
    BannedClaim(
        label="AI thay giảng viên chấm điểm",
        course="K26",
        groups=(
            ("ai", "phan mem", "he thong", "cong cu"),
            ("thay the", "thay cho", "khong can", "thay"),
            ("giang vien", "giao vien"),
        ),
    ),
    BannedClaim(
        label="AI tự quyết định bản thảo",
        course="K28",
        groups=(
            ("ai", "phan mem", "he thong", "cong cu"),
            ("tu dong quyet dinh", "tu quyet dinh", "quyet dinh", "tu dong chap nhan", "tu dong tu choi"),
            ("ban thao", "bai bao", "bai gui dang"),
        ),
    ),
    BannedClaim(
        label="Biến chỉ số tham chiếu thành cam kết",
        course="",
        groups=(
            ("cam ket", "dam bao", "chac chan", "guarantee"),
            ("giam", "tang", "dat"),
            ("%",),
        ),
        window=60,
    ),
]


def _violates(claim: BannedClaim, norm: str) -> bool:
    """True khi mọi nhóm từ của ``claim`` cùng xuất hiện trong một cửa sổ hẹp."""
    positions: list[tuple[int, int]] = []
    for group in claim.groups:
        found = [(norm.find(term), term) for term in group]
        hits = [(pos, len(term)) for pos, term in found if pos >= 0]
        if not hits:
            return False
        positions.append(min(hits))
    starts = [p for p, _ in positions]
    ends = [p + length for p, length in positions]
    # Phải đúng thứ tự và nằm gọn trong cửa sổ, để tránh bắt nhầm hai câu rời rạc.
    if starts != sorted(starts):
        return False
    return max(ends) - min(starts) <= claim.window


REPLACEMENT_NOTE = (
    "\n\n_Lưu ý: theo quy định trong thư mời, AI chỉ đóng vai trò hỗ trợ; "
    "người có thẩm quyền chịu trách nhiệm quyết định cuối cùng._"
)


@dataclass
class InputCheck:
    ok: bool
    reason: str = ""
    sanitized: str = ""


@dataclass
class OutputCheck:
    ok: bool
    violations: list[str] = field(default_factory=list)
    text: str = ""


def check_input(message: str, max_length: int = MAX_MESSAGE_LENGTH) -> InputCheck:
    text = message.strip()
    if not text:
        return InputCheck(False, "Câu hỏi trống.")
    if len(text) > max_length:
        return InputCheck(False, f"Câu hỏi vượt quá {max_length} ký tự.")
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            # Không từ chối hẳn: vẫn trả lời phần nội dung, chỉ đánh dấu để
            # prompt biết mà bỏ qua chỉ dẫn nhúng trong câu hỏi.
            return InputCheck(True, "Phát hiện chỉ dẫn nhúng, đã vô hiệu hóa.", text)
    return InputCheck(True, "", text)


def has_sufficient_context(
    hits: list[RetrievalHit],
    threshold: float,
    course_codes: list[str] | None = None,
) -> bool:
    """Quyết định có đủ ngữ cảnh để gọi mô hình sinh hay không.

    Một ngưỡng cứng áp lên điểm hỗn hợp rất giòn: giá trị tuyệt đối của nó
    phụ thuộc mô hình embedding đang dùng, nên đổi provider là chặn oan hàng
    loạt câu hợp lệ. Vì vậy quyết định dựa trên nhiều tín hiệu:

    * điểm cao nhất vượt ngưỡng, hoặc
    * câu hỏi nêu đích danh một khóa và ta có chunk của đúng khóa đó ở mức
      điểm gần ngưỡng — trường hợp này chắc chắn có tài liệu để trả lời.

    Câu hỏi ngoài phạm vi không thỏa cả hai vì không khớp mã khóa nào và
    điểm cũng thấp hẳn.
    """
    if not hits:
        return False
    top = max(h.score for h in hits)
    if top >= threshold:
        return True
    if course_codes:
        wanted = {c.upper() for c in course_codes}
        near = threshold * 0.8
        if any(h.chunk.courseCode in wanted and h.score >= near for h in hits):
            return True
    return False


def check_output(text: str, hits: list[RetrievalHit]) -> OutputCheck:
    """Quét câu trả lời trước khi gửi cho người dùng."""
    violations: list[str] = []
    norm = normalize(text)

    for claim in BANNED_CLAIMS:
        if _violates(claim, norm):
            violations.append(claim.label)

    # Mã khóa nêu trong câu trả lời phải có căn cứ trong ngữ cảnh đã truy hồi.
    # Căn cứ không chỉ là nhãn khóa của chunk: một chunk của Khóa 22 nói về
    # ranh giới với Khóa 21 là căn cứ hợp lệ để nhắc Khóa 21, nên phải xét cả
    # nội dung chunk.
    grounded: set[str] = {h.chunk.courseCode for h in hits if h.chunk.courseCode}
    resolver = get_resolver()
    for hit in hits:
        for match in resolver.find(hit.chunk.content):
            if match.how in ("official", "legacy"):
                grounded.add(match.code)

    mentioned = {m.code for m in resolver.find(text) if m.how in ("official", "legacy")}
    stray = mentioned - grounded
    if grounded and stray:
        violations.append(f"Nhắc tới khóa ngoài ngữ cảnh: {', '.join(sorted(stray))}")

    return OutputCheck(ok=not violations, violations=violations, text=text)
