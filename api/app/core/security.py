"""Xác thực quản trị bằng Firebase ID token.

Ba vai trò: super_admin (toàn quyền) · editor (nội dung, KB, FAQ) ·
viewer (chỉ xem thống kê và đăng ký). Vai trò lấy từ custom claim ``role``
của Firebase, hoặc từ danh sách ADMIN_EMAILS khi tài khoản chưa được gán claim.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal

from fastapi import Depends, HTTPException, Request, status

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)

Role = Literal["super_admin", "editor", "viewer"]
_ROLE_RANK: dict[str, int] = {"viewer": 1, "editor": 2, "super_admin": 3}


@dataclass
class AdminIdentity:
    uid: str
    email: str
    role: Role


def _verify_firebase_token(token: str, settings: Settings) -> dict:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token

    return google_id_token.verify_firebase_token(
        token, google_requests.Request(), audience=settings.firebase_project_id
    )


def get_identity(request: Request, settings: Settings = Depends(get_settings)) -> AdminIdentity:
    # Trên Cloud Run, header Authorization đã bị dùng cho ID token của IAM khi
    # service web gọi sang, nên token quản trị của người dùng tới qua header
    # riêng. Chạy cục bộ thì chỉ có Authorization.
    header = request.headers.get("x-admin-authorization") or request.headers.get(
        "authorization", ""
    )
    if not header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cần đăng nhập để truy cập khu vực quản trị.",
        )
    token = header[7:].strip()

    if (
        settings.environment == "development"
        and settings.dev_admin_token
        and token == settings.dev_admin_token
    ):
        # Lối vào dành riêng cho phát triển cục bộ. Ở production biến
        # DEV_ADMIN_TOKEN để trống nên nhánh này không bao giờ đúng.
        logger.warning("Đăng nhập quản trị bằng token phát triển.")
        email = settings.admin_email_list[0] if settings.admin_email_list else "dev@local"
        return AdminIdentity(uid="dev", email=email, role="super_admin")

    try:
        claims = _verify_firebase_token(token, settings)
    except Exception as exc:
        logger.warning("Token quản trị không hợp lệ: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ."
        ) from exc

    email = (claims.get("email") or "").lower()
    if not email or not claims.get("email_verified", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản chưa xác thực email.")

    role = claims.get("role")
    if role not in _ROLE_RANK:
        # Tài khoản chưa được gán custom claim: chỉ chấp nhận nếu nằm trong
        # danh sách quản trị cấu hình sẵn, và cấp quyền cao nhất để có thể
        # thiết lập các tài khoản còn lại.
        if email in settings.admin_email_list:
            role = "super_admin"
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản chưa được cấp quyền vào khu vực quản trị.",
            )

    return AdminIdentity(uid=claims.get("user_id") or claims.get("sub", ""), email=email, role=role)


def _require(minimum: Role):
    def dependency(identity: AdminIdentity = Depends(get_identity)) -> AdminIdentity:
        if _ROLE_RANK[identity.role] < _ROLE_RANK[minimum]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Thao tác này cần quyền {minimum}.",
            )
        return identity

    return dependency


require_viewer = _require("viewer")
require_editor = _require("editor")
require_super_admin = _require("super_admin")
