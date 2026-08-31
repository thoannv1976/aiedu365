"""Điểm vào ứng dụng FastAPI."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.routers import admin, chat, content, leads
from app.services.retrieval import get_retrieval
from app.services.store import get_store

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    settings = get_settings()
    store = get_store()
    logger.info(
        "Khởi động %s — %d khóa học, provider=%s",
        settings.app_name,
        len(store.courses),
        settings.llm_provider,
    )
    try:
        await get_retrieval().ensure_index()
    except Exception as exc:  # pragma: no cover
        logger.error("Không dựng được chỉ mục lúc khởi động: %s", exc)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        description="API cho landing page và chatbot tư vấn 08 khóa tập huấn AI (Khóa 21–28).",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(content.router, prefix="/api")
    app.include_router(chat.router, prefix="/api")
    app.include_router(leads.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")

    @app.get("/healthz", tags=["system"])
    def healthz() -> dict:
        retrieval = get_retrieval()
        return {
            "status": "ok",
            "courses": len(get_store().courses),
            "kbChunks": retrieval.size,
            "kbReady": retrieval.ready,
            "provider": settings.llm_provider,
        }

    return app


app = create_app()
