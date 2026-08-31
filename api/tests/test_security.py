"""Phân quyền quản trị."""

import pytest
from fastapi import HTTPException

from app.core.config import Settings
from app.core.security import AdminIdentity, _require, get_identity


class _Request:
    def __init__(self, headers: dict[str, str]) -> None:
        self.headers = headers


def _settings(**kwargs) -> Settings:
    base = dict(environment="development", dev_admin_token="", admin_emails="a@b.vn")
    base.update(kwargs)
    return Settings(**base)


def test_missing_header_is_rejected():
    with pytest.raises(HTTPException) as exc:
        get_identity(_Request({}), _settings())
    assert exc.value.status_code == 401


def test_invalid_token_is_rejected():
    with pytest.raises(HTTPException) as exc:
        get_identity(_Request({"authorization": "Bearer khong-hop-le"}), _settings())
    assert exc.value.status_code == 401


def test_dev_token_only_works_when_configured():
    """Không đặt DEV_ADMIN_TOKEN thì không có lối vào nào ngoài Firebase."""
    with pytest.raises(HTTPException):
        get_identity(_Request({"authorization": "Bearer bat-ky"}), _settings())

    identity = get_identity(
        _Request({"authorization": "Bearer token-cuc-bo"}),
        _settings(dev_admin_token="token-cuc-bo"),
    )
    assert identity.role == "super_admin"


def test_dev_token_is_ignored_in_production():
    with pytest.raises(HTTPException):
        get_identity(
            _Request({"authorization": "Bearer token-cuc-bo"}),
            _settings(environment="production", dev_admin_token="token-cuc-bo"),
        )


@pytest.mark.parametrize(
    "role,minimum,allowed",
    [
        ("viewer", "viewer", True),
        ("viewer", "editor", False),
        ("viewer", "super_admin", False),
        ("editor", "editor", True),
        ("editor", "super_admin", False),
        ("super_admin", "super_admin", True),
    ],
)
def test_role_hierarchy(role, minimum, allowed):
    identity = AdminIdentity(uid="u", email="a@b.vn", role=role)
    dependency = _require(minimum)
    if allowed:
        assert dependency(identity) is identity
    else:
        with pytest.raises(HTTPException) as exc:
            dependency(identity)
        assert exc.value.status_code == 403


def test_admin_token_read_from_dedicated_header():
    """Trên Cloud Run, Authorization đã dùng cho ID token của IAM."""
    settings = _settings(dev_admin_token="token-cuc-bo")
    identity = get_identity(
        _Request(
            {
                "authorization": "Bearer id-token-cua-iam",
                "x-admin-authorization": "Bearer token-cuc-bo",
            }
        ),
        settings,
    )
    assert identity.role == "super_admin"
