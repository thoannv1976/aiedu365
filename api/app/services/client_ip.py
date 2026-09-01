"""Xác định địa chỉ IP của người gọi, dùng làm khóa giới hạn tần suất.

Lấy phần tử ĐẦU của ``X-Forwarded-For`` là sai trong kiến trúc này: bất kỳ ai
cũng gửi kèm được header đó, hạ tầng chỉ nối thêm giá trị thật vào sau. Khóa
giới hạn tần suất khi ấy do chính người gọi đặt, tức là vô hiệu.

Phần tử CUỐI là giá trị proxy tin cậy gần nhất ghi vào và người gọi không giả
được. Với chuỗi ``giả-mạo, ip-thật`` thì đó là ``ip-thật``.
"""

from __future__ import annotations

import hashlib

from fastapi import Request


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return request.client.host if request.client else "unknown"


def client_key(request: Request, salt: str = "aiedu365") -> str:
    """Khóa đã băm để ghi log — không lưu IP thô."""
    return hashlib.sha256(f"{salt}:{client_ip(request)}".encode()).hexdigest()[:32]
