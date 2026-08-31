"""Chuẩn hóa mã khóa — điểm dễ sai nhất của hệ thống này.

Mã chính thức là K21–K28 nhưng thân thư mời gọi là "khóa số 1–8", nên người
dùng hỏi lẫn cả hai cách. Trả lời nhầm khóa là lỗi nghiêm trọng nhất.
"""

import pytest

from app.services.aliases import get_resolver, normalize


@pytest.mark.parametrize(
    "text,expected",
    [
        ("Khóa 23 học gì?", "K23"),
        ("khóa số 3 học gì?", "K23"),
        ("K23 học gì?", "K23"),
        ("k-27 dành cho ai", "K27"),
        ("khoa 8 co phan mem gi", "K28"),
        ("Khóa tập huấn chuyên sâu số 1", "K21"),
        ("khoá 21 gồm mấy ngày", "K21"),
    ],
)
def test_resolve_course_reference(text, expected):
    codes = [m.code for m in get_resolver().find(text)]
    assert expected in codes


def test_legacy_number_maps_to_official_code():
    resolver = get_resolver()
    assert resolver.resolve_number(3) == "K23"
    assert resolver.resolve_number(23) == "K23"
    assert resolver.resolve_number(8) == "K28"
    assert resolver.resolve_number(28) == "K28"


def test_alias_by_subject_matter():
    resolver = get_resolver()
    assert "K26" in [m.code for m in resolver.find("khoa tôi dạy tiếng Hàn")]
    assert "K22" in [m.code for m in resolver.find("chúng tôi chuẩn bị kiểm định AUN-QA")]
    assert "K27" in [m.code for m in resolver.find("cần chuẩn hóa vị trí việc làm")]


def test_compare_question_finds_both_courses():
    codes = [m.code for m in get_resolver().find("Khóa 24 và khóa 28 khác nhau thế nào?")]
    assert {"K24", "K28"} <= set(codes)


def test_normalize_handles_d_stroke():
    """NFD không tách được chữ đ, phải quy đổi riêng."""
    assert normalize("Quản lý đào tạo đại học") == "quan ly dao tao dai hoc"
    assert "dong" in normalize("tự động")


def test_full_label_mentions_both_numbering_schemes():
    label = get_resolver().full_label("K23")
    assert "Khóa 23" in label
    assert "số 3" in label
