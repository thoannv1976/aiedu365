"""Công cụ "Chọn khóa phù hợp" — chấm điểm bằng luật, không gọi mô hình.

Với 08 khóa trải trên nhiều lĩnh vực, đây là bài toán định tuyến chứ không
phải bài toán sinh văn bản: một bảng luật tường minh cho kết quả tất định,
giải thích được và không tốn token.
"""

from __future__ import annotations

from app.models.schemas import RecommendItem, RecommendResponse
from app.services.store import ContentStore, get_store

# Điểm theo loại đơn vị. Điểm cao = khớp trực tiếp.
UNIT_SCORES: dict[str, dict[str, int]] = {
    "dao-tao": {"K23": 100, "K21": 55, "K22": 35},
    "dam-bao-chat-luong": {"K22": 100, "K21": 55, "K23": 35},
    "khoa-hoc": {"K24": 100, "K28": 65, "K21": 50},
    "tap-chi": {"K28": 100, "K24": 60, "K21": 40},
    "nhan-su": {"K27": 100, "K21": 50},
    "khoa-bo-mon-kinh-doanh": {"K25": 100, "K21": 35},
    "khoa-bo-mon-ngoai-ngu": {"K26": 100, "K22": 40, "K21": 35},
    "cntt": {"K21": 100, "K27": 45, "K23": 40},
    "khac": {"K21": 70},
}

UNIT_LABELS: dict[str, str] = {
    "dao-tao": "Phòng Quản lý đào tạo / Chương trình đào tạo / Cố vấn học tập",
    "dam-bao-chat-luong": "Phòng Đảm bảo chất lượng / Khảo thí / Kiểm định",
    "khoa-hoc": "Phòng Quản lý khoa học / Nghiên cứu",
    "tap-chi": "Tạp chí khoa học / Tòa soạn / Xuất bản",
    "nhan-su": "Tổ chức cán bộ / Hành chính – Tổng hợp / Văn phòng",
    "khoa-bo-mon-kinh-doanh": "Khoa/Bộ môn Thương mại điện tử, Kinh doanh số, Marketing số",
    "khoa-bo-mon-ngoai-ngu": "Khoa/Bộ môn Ngoại ngữ",
    "cntt": "Trung tâm CNTT / Chuyển đổi số / Ban giám hiệu",
    "khac": "Đơn vị khác",
}

# Điểm cộng theo ưu tiên nghiệp vụ.
PRIORITY_SCORES: dict[str, dict[str, int]] = {
    "tra-cuu": {"K23": 20, "K22": 20, "K27": 25, "K24": 18, "K28": 18},
    "tu-dong-hoa": {"K27": 30, "K28": 22, "K23": 18, "K22": 15},
    "phan-tich-du-lieu": {"K24": 25, "K28": 25, "K23": 22, "K27": 15},
    "day-hoc": {"K26": 35, "K25": 35, "K22": 12},
    "nen-tang-chung": {"K21": 45},
}

# Viết sẵn ở dạng dùng được giữa câu — không hạ chữ thường khi ghép, vì
# "AI" sẽ thành "ai".
PRIORITY_LABELS: dict[str, str] = {
    "tra-cuu": "tra cứu quy định, biểu mẫu, hồ sơ nhanh hơn",
    "tu-dong-hoa": "tự động hóa quy trình lặp lại",
    "phan-tich-du-lieu": "phân tích dữ liệu và dashboard cho lãnh đạo",
    "day-hoc": "đưa AI vào giảng dạy và đánh giá sinh viên",
    "nen-tang-chung": "xây nền tảng AI dùng chung toàn trường",
}

# Số người cử được. Khóa 25 và Khóa 26 khuyến nghị 05–10 người nên đoàn nhỏ
# sẽ khó tạo ra sản phẩm hoàn chỉnh; Khóa 21 kéo dài 05 ngày nên cần đoàn
# liên phòng ban.
HEADCOUNT_ADJUST: dict[str, dict[str, int]] = {
    "1-2": {"K25": -25, "K26": -25, "K21": -15},
    "3-5": {"K25": -10, "K26": -10},
    "6-10": {"K25": 10, "K26": 10, "K21": 10},
    "tren-10": {"K25": 15, "K26": 15, "K21": 15},
}

HEADCOUNT_LABELS: dict[str, str] = {
    "1-2": "01–02 người",
    "3-5": "03–05 người",
    "6-10": "06–10 người",
    "tren-10": "trên 10 người",
}


class RecommendService:
    def __init__(self, store: ContentStore | None = None) -> None:
        self.store = store or get_store()

    def recommend(
        self, unit_type: str, priority: str, headcount: str, note: str = ""
    ) -> RecommendResponse:
        scores: dict[str, int] = {}
        reasons: dict[str, list[str]] = {}

        unit_map = UNIT_SCORES.get(unit_type, UNIT_SCORES["khac"])
        unit_label = UNIT_LABELS.get(unit_type, "đơn vị của anh/chị")
        for code, points in unit_map.items():
            scores[code] = scores.get(code, 0) + points
            if points >= 60:
                reasons.setdefault(code, []).append(f"Đúng nghiệp vụ của {unit_label}.")
            elif points >= 40:
                reasons.setdefault(code, []).append(f"Có phần liên quan tới {unit_label}.")

        prio_map = PRIORITY_SCORES.get(priority, {})
        prio_label = PRIORITY_LABELS.get(priority, "")
        for code, points in prio_map.items():
            scores[code] = scores.get(code, 0) + points
            if points >= 20 and prio_label:
                reasons.setdefault(code, []).append(f"Phù hợp với ưu tiên: {prio_label}.")

        head_map = HEADCOUNT_ADJUST.get(headcount, {})
        for code, points in head_map.items():
            if code in scores:
                scores[code] += points

        # Bổ sung lý do về quy mô đoàn và ranh giới giữa các khóa chồng lấn.
        for code in list(scores):
            course = self.store.course_by_code(code)
            if not course:
                scores.pop(code, None)
                continue
            recommended = (course.audience or {}).get("headcount", "")
            if headcount == "1-2" and code in ("K25", "K26"):
                reasons.setdefault(code, []).append(
                    f"Lưu ý: khóa này khuyến nghị {recommended}; đoàn 01–02 người khó hoàn thành "
                    "trọn bộ sản phẩm của Khoa/Bộ môn."
                )
            if code == "K28" and unit_type == "khoa-hoc":
                reasons.setdefault(code, []).append(
                    "Chọn Khóa 28 thay Khóa 24 nếu đơn vị có tạp chí khoa học riêng."
                )
            if code == "K24" and unit_type == "tap-chi":
                reasons.setdefault(code, []).append(
                    "Chọn Khóa 24 nếu chỉ quản lý đề tài và công bố, không vận hành tòa soạn."
                )

        ranked = sorted(scores.items(), key=lambda pair: pair[1], reverse=True)
        items: list[RecommendItem] = []
        for code, score in ranked:
            course = self.store.course_by_code(code)
            if not course:
                continue
            items.append(
                RecommendItem(
                    code=code,
                    slug=course.slug,
                    shortTitle=course.shortTitle,
                    duration=course.duration,
                    score=score,
                    reasons=reasons.get(code, ["Có thể phù hợp với nhu cầu của đơn vị."]),
                    headcount=str((course.audience or {}).get("headcount", "")),
                )
            )

        primary = [i for i in items if i.score >= 70][:2]
        if not primary and items:
            primary = items[:1]
        alternatives = [i for i in items if i not in primary][:3]

        note_out = (
            "Gợi ý dựa trên nghiệp vụ, ưu tiên và quy mô đoàn mà anh/chị chọn. "
            "Nếu muốn xây nền tảng AI dùng chung cho toàn trường, nên cử thêm một đoàn "
            "liên phòng ban dự Khóa 21."
        )
        if headcount in ("6-10", "tren-10"):
            note_out += " Với đoàn đông, có thể chia nhóm dự nhiều khóa trong cùng một đợt."
        return RecommendResponse(primary=primary, alternatives=alternatives, note=note_out)


_service: RecommendService | None = None


def get_recommend_service() -> RecommendService:
    global _service
    if _service is None:
        _service = RecommendService()
    return _service
