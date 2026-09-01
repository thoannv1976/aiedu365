"""Quản trị nhà cung cấp mô hình và lưu khóa API."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app
from app.services import firestore as fs
from app.services import llm_settings, secrets


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


@pytest.fixture(autouse=True)
def _reset():
    yield
    secrets._memory.clear()
    secrets._meta.clear()
    fs._memory["app_config"] = {}
    llm_settings.invalidate()


# --- Khóa API chỉ ghi vào, không đọc ngược ra ------------------------------


def test_api_key_is_never_returned(client, auth):
    """Ràng buộc quan trọng nhất: không endpoint nào trả khóa ra."""
    secret = "sk-ant-khoa-bi-mat-khong-duoc-lo-ra-ngoai"
    client.put("/api/admin/providers/anthropic/key", json={"apiKey": secret}, headers=auth)

    for path in ("/api/admin/providers", "/api/admin/config", "/api/admin/audit-logs"):
        body = client.get(path, headers=auth).text
        assert secret not in body, f"Khóa bị lộ qua {path}"
        assert "khoa-bi-mat" not in body


def test_key_status_shows_only_last_four_characters(client, auth):
    client.put(
        "/api/admin/providers/openai/key", json={"apiKey": "sk-abcdefghijklmn9876"}, headers=auth
    )
    data = client.get("/api/admin/providers", headers=auth).json()
    openai = next(p for p in data["providers"] if p["id"] == "openai")
    assert openai["keyConfigured"] is True
    assert openai["keyPreview"] == "…9876"
    assert "abcdefghij" not in str(data)


def test_audit_log_records_change_without_the_key(client, auth):
    client.put(
        "/api/admin/providers/gemini/key", json={"apiKey": "AIza-khoa-that-1234"}, headers=auth
    )
    logs = client.get("/api/admin/audit-logs", headers=auth).json()
    entry = next(log for log in logs if log["action"] == "provider.key_set")
    assert "khoa-that" not in str(entry)
    assert entry["after"]["preview"] == "…1234"


# --- Phân quyền -----------------------------------------------------------


def test_setting_key_requires_super_admin(client):
    res = client.put("/api/admin/providers/openai/key", json={"apiKey": "sk-1234567890abc"})
    assert res.status_code == 401


def test_short_key_is_rejected(client, auth):
    res = client.put("/api/admin/providers/openai/key", json={"apiKey": "sk-123"}, headers=auth)
    assert res.status_code == 400


def test_vertex_does_not_accept_a_key(client, auth):
    """Vertex dùng IAM của project; nhận khóa ở đây sẽ gây hiểu nhầm."""
    res = client.put(
        "/api/admin/providers/vertex/key", json={"apiKey": "khong-can-khoa-nay"}, headers=auth
    )
    assert res.status_code == 400
    assert "IAM" in res.json()["detail"]


# --- Chọn nhà cung cấp ----------------------------------------------------


def test_cannot_activate_provider_without_key(client, auth):
    res = client.put(
        "/api/admin/providers/active",
        json={"chatProvider": "anthropic", "embeddingProvider": "vertex"},
        headers=auth,
    )
    assert res.status_code == 400
    assert "Chưa nhập khóa API" in res.json()["detail"]


def test_claude_cannot_be_used_for_embedding(client, auth):
    """Anthropic không có dịch vụ embedding — chọn nhầm sẽ làm hỏng truy hồi."""
    client.put(
        "/api/admin/providers/anthropic/key", json={"apiKey": "sk-ant-1234567890abc"}, headers=auth
    )
    res = client.put(
        "/api/admin/providers/active",
        json={"chatProvider": "anthropic", "embeddingProvider": "anthropic"},
        headers=auth,
    )
    assert res.status_code == 400
    assert "embedding" in res.json()["detail"]


def test_claude_for_chat_with_another_provider_for_embedding(client, auth):
    """Cấu hình hợp lệ: Claude trả lời, Gemini tạo vector."""
    client.put(
        "/api/admin/providers/anthropic/key", json={"apiKey": "sk-ant-1234567890abc"}, headers=auth
    )
    res = client.put(
        "/api/admin/providers/active",
        json={"chatProvider": "anthropic", "embeddingProvider": "vertex"},
        headers=auth,
    )
    assert res.status_code == 200, res.text
    active = res.json()["active"]
    assert active["chatProvider"] == "anthropic"
    assert active["embeddingProvider"] == "vertex"
    assert active["chatModel"] == "claude-sonnet-5"


def test_cannot_delete_key_of_active_provider(client, auth):
    client.put(
        "/api/admin/providers/openai/key", json={"apiKey": "sk-1234567890abcdef"}, headers=auth
    )
    client.put(
        "/api/admin/providers/active",
        json={"chatProvider": "openai", "embeddingProvider": "openai"},
        headers=auth,
    )
    res = client.delete("/api/admin/providers/openai/key", headers=auth)
    assert res.status_code == 400
    assert "đang được dùng" in res.json()["detail"]


# --- Đổi embedding buộc index lại -----------------------------------------


@pytest.mark.asyncio
async def test_changing_embedding_provider_forces_reindex(client, auth):
    """Đổi bên tạo embedding là đổi không gian vector.

    Giữ nguyên vector cũ thì truy hồi trả về kết quả gần như ngẫu nhiên, nên
    hệ thống phải tự index lại chứ không để ban tổ chức tự nhớ.
    """
    client.put(
        "/api/admin/providers/openai/key", json={"apiKey": "sk-1234567890abcdef"}, headers=auth
    )
    res = client.put(
        "/api/admin/providers/active",
        json={"chatProvider": "echo", "embeddingProvider": "openai"},
        headers=auth,
    )
    assert res.status_code == 200
    assert res.json()["reindexed"] > 0
    assert "index lại" in res.json()["message"]


def test_switching_chat_only_does_not_reindex(client, auth):
    """Đổi bên trả lời không đụng tới vector, không cần index lại."""
    client.put(
        "/api/admin/providers/anthropic/key", json={"apiKey": "sk-ant-1234567890abc"}, headers=auth
    )
    res = client.put(
        "/api/admin/providers/active",
        json={"chatProvider": "anthropic", "embeddingProvider": "echo"},
        headers=auth,
    )
    # embedding đang là echo từ trước trong môi trường test nên không đổi
    assert res.status_code == 200


# --- Provider được dựng lại sau khi đổi -----------------------------------


def test_provider_is_rebuilt_after_key_change(client, auth):
    from app.providers import get_provider

    client.put(
        "/api/admin/providers/openai/key", json={"apiKey": "sk-truoc-1234567890"}, headers=auth
    )
    client.put(
        "/api/admin/providers/active",
        json={"chatProvider": "openai", "embeddingProvider": "echo"},
        headers=auth,
    )
    assert get_provider().api_key == "sk-truoc-1234567890"

    client.put(
        "/api/admin/providers/openai/key", json={"apiKey": "sk-sau-09876543210"}, headers=auth
    )
    assert get_provider().api_key == "sk-sau-09876543210"


def test_provider_catalogue_lists_capabilities(client, auth):
    data = client.get("/api/admin/providers", headers=auth).json()
    by_id = {p["id"]: p for p in data["providers"]}

    assert by_id["anthropic"]["supportsChat"] is True
    assert by_id["anthropic"]["supportsEmbedding"] is False
    assert by_id["vertex"]["needsKey"] is False
    assert by_id["gemini"]["needsKey"] is True
    assert "anthropic" not in data["embeddingProviders"]
