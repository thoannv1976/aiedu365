"""Endpoint đăng ký tham dự và gợi ý khóa học."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.core.config import get_settings
from app.models.schemas import LeadCreate, RecommendRequest, RecommendResponse
from app.services import firestore as fs
from app.services.client_ip import client_key
from app.services.rate_limit import SlidingWindowLimiter
from app.services.recommend import get_recommend_service
from app.services.store import get_store

logger = logging.getLogger(__name__)
router = APIRouter(tags=["leads"])

# Form đăng ký là endpoint công khai duy nhất ghi dữ liệu. Không giới hạn thì
# một script có thể bơm hàng nghìn bản ghi rác, khiến danh sách của ban tổ chức
# không dùng được. Đây là lớp phòng thủ nền; nếu vẫn bị spam thì bật thêm
# captcha (Turnstile hoặc reCAPTCHA) ở tầng frontend.
_lead_limiter = SlidingWindowLimiter(limit=10, window_seconds=3600)


@router.post("/recommend", response_model=RecommendResponse)
def recommend(payload: RecommendRequest) -> RecommendResponse:
    return get_recommend_service().recommend(
        payload.unitType, payload.priority, payload.headcount, payload.note
    )


@router.post("/leads", status_code=201)
def create_lead(payload: LeadCreate, request: Request) -> dict:
    allowed, _ = _lead_limiter.allow(client_key(request))
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=(
                "Đã nhận khá nhiều phiếu đăng ký từ kết nối này trong một giờ. "
                "Anh/chị vui lòng liên hệ trực tiếp ban tổ chức."
            ),
        )

    store = get_store()
    valid_codes = {c.code for c in store.courses}
    for interest in payload.courses:
        if interest.code.upper() not in valid_codes:
            raise HTTPException(status_code=400, detail=f"Mã khóa không hợp lệ: {interest.code}")

    data = payload.model_dump(mode="json")
    data["courses"] = [{**c, "code": c["code"].upper()} for c in data["courses"]]
    data["status"] = "new"
    data["assignedTo"] = ""
    data["notes"] = []
    lead_id = fs.add_document("leads", data)
    logger.info("Đăng ký mới từ %s (%d khóa)", payload.organization, len(payload.courses))
    return {
        "id": lead_id,
        "message": "Đã ghi nhận đăng ký. Ban tổ chức sẽ liên hệ lại với anh/chị.",
    }
