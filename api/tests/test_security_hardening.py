"""Các lỗ hổng đã phát hiện khi rà soát và cách chặn.

Mỗi test mô tả một đường tấn công cụ thể, không phải kiểm tra hình thức.
"""

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app
from app.routers.admin import _csv_safe
from app.services import firestore as fs


@pytest.fixture(scope="module")
def client():
    settings = get_settings()
    settings.environment = "development"
    settings.dev_admin_token = "test-token"
    with TestClient(create_app()) as c:
        yield c


@pytest.fixture
def auth():
    return {"authorization": "Bearer test-token"}


# --- CSV injection --------------------------------------------------------


@pytest.mark.parametrize("payload", ["=1+1", '=HYPERLINK("http://x","y")', "+1", "-1", "@SUM(A1)"])
def test_formula_cells_are_neutralised(payload):
    """Excel thực thi ô bắt đầu bằng = + - @; người đăng ký nhập được các ô này."""
    safe = _csv_safe(payload)
    assert safe.startswith("'")
    assert safe[1:] == payload  # nội dung gốc không mất


@pytest.mark.parametrize("payload", ["Nguyễn Văn A", "Trường ĐH Sư phạm", "", "a=b"])
def test_normal_values_are_untouched(payload):
    assert _csv_safe(payload) == payload


def test_export_neutralises_attacker_supplied_name(client, auth):
    """Đường tấn công đầy đủ: đăng ký công khai → file ban tổ chức mở bằng Excel."""
    fs._memory["leads"] = {}
    res = client.post(
        "/api/leads",
        json={
            "fullName": '=HYPERLINK("http://ke-tan-cong.example","Bấm vào đây")',
            "organization": "Trường Thử Nghiệm",
            "email": "a@b.edu.vn",
            "courses": [{"code": "K22", "attendees": 1}],
        },
    )
    assert res.status_code == 201

    csv_text = client.get("/api/admin/leads/export", headers=auth).text
    assert "'=HYPERLINK" in csv_text
    assert ",=HYPERLINK" not in csv_text
    fs._memory["leads"] = {}


# --- Khóa giới hạn tần suất không được để người gọi tự đặt -----------------


class _Req:
    def __init__(self, xff: str | None = None, host: str = "10.0.0.1") -> None:
        self.headers = {"x-forwarded-for": xff} if xff else {}
        self.client = type("C", (), {"host": host})()


def test_spoofed_forwarded_header_does_not_change_rate_limit_key():
    """Kẻ gửi spam đặt X-Forwarded-For giả; hạ tầng nối IP thật vào SAU.

    Lấy phần tử đầu sẽ cho phép mỗi request một khóa khác nhau, tức là bỏ hẳn
    giới hạn tần suất.
    """
    from app.services.client_ip import client_ip

    assert client_ip(_Req("1.2.3.4, 203.0.113.9")) == "203.0.113.9"
    assert client_ip(_Req("giả-mạo-1, giả-mạo-2, 203.0.113.9")) == "203.0.113.9"

    # Cùng một người gọi, dù đổi phần giả mạo, vẫn ra cùng một khóa.
    from app.services.client_ip import client_key

    assert client_key(_Req("aaa, 203.0.113.9")) == client_key(_Req("bbb, 203.0.113.9"))


def test_client_ip_falls_back_to_connection():
    from app.services.client_ip import client_ip

    assert client_ip(_Req(None, host="192.0.2.5")) == "192.0.2.5"


def test_ip_is_hashed_not_stored_raw():
    from app.services.client_ip import client_key

    key = client_key(_Req("1.1.1.1, 203.0.113.9"))
    assert "203.0.113.9" not in key
    assert len(key) == 32


# --- Chống spam form đăng ký ----------------------------------------------


def test_registration_form_is_rate_limited(client):
    """Endpoint công khai duy nhất ghi dữ liệu; không giới hạn thì spam được."""
    fs._memory["leads"] = {}
    body = {
        "fullName": "Người Gửi Spam",
        "organization": "Đơn vị X",
        "email": "spam@example.vn",
        "courses": [{"code": "K21", "attendees": 1}],
    }
    statuses = [
        client.post("/api/leads", json=body, headers={"x-forwarded-for": "203.0.113.77"}).status_code
        for _ in range(12)
    ]
    assert statuses.count(201) == 10
    assert 429 in statuses
    fs._memory["leads"] = {}
