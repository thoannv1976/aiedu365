"""Kết nối Firestore và các thao tác ghi (lead, hội thoại, audit log).

Khi ``USE_FIRESTORE=false`` hoặc không có quyền GCP, toàn bộ hàm ghi chuyển
sang bộ nhớ tiến trình để môi trường phát triển vẫn chạy được đầy đủ luồng.
"""

from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_client: Any | None = None
_client_tried = False
_lock = threading.Lock()

# Bộ nhớ dự phòng khi chưa có Firestore.
_memory: dict[str, dict[str, dict[str, Any]]] = {
    "leads": {},
    "chat_sessions": {},
    "chat_messages": {},
    "audit_logs": {},
    "app_config": {},
    "sessions_schedule": {},
    "faqs": {},
    "admin_users": {},
    "site_content": {},
}


def get_firestore() -> Any | None:
    global _client, _client_tried
    settings = get_settings()
    if not settings.use_firestore:
        return None
    if _client is not None or _client_tried:
        return _client
    with _lock:
        if _client is None and not _client_tried:
            _client_tried = True
            try:
                from google.cloud import firestore

                _client = firestore.Client(
                    project=settings.gcp_project, database=settings.firestore_database
                )
                logger.info("Đã kết nối Firestore project=%s", settings.gcp_project)
            except Exception as exc:  # pragma: no cover - phụ thuộc hạ tầng
                logger.warning("Không kết nối được Firestore: %s. Dùng bộ nhớ tạm.", exc)
                _client = None
    return _client


def _now() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return uuid.uuid4().hex


def add_document(collection: str, data: dict[str, Any], doc_id: str | None = None) -> str:
    doc_id = doc_id or new_id()
    payload = {**data, "_createdAt": _now().isoformat()}
    db = get_firestore()
    if db is not None:
        try:
            db.collection(collection).document(doc_id).set(payload)
            return doc_id
        except Exception as exc:  # pragma: no cover
            logger.error("Ghi Firestore thất bại (%s): %s", collection, exc)
    _memory.setdefault(collection, {})[doc_id] = payload
    return doc_id


def update_document(collection: str, doc_id: str, data: dict[str, Any]) -> bool:
    db = get_firestore()
    if db is not None:
        try:
            db.collection(collection).document(doc_id).set(data, merge=True)
            return True
        except Exception as exc:  # pragma: no cover
            logger.error("Cập nhật Firestore thất bại (%s/%s): %s", collection, doc_id, exc)
    bucket = _memory.setdefault(collection, {})
    if doc_id not in bucket:
        return False
    bucket[doc_id] = {**bucket[doc_id], **data}
    return True


def get_document(collection: str, doc_id: str) -> dict[str, Any] | None:
    db = get_firestore()
    if db is not None:
        try:
            snap = db.collection(collection).document(doc_id).get()
            return snap.to_dict() if snap.exists else None
        except Exception as exc:  # pragma: no cover
            logger.error("Đọc Firestore thất bại (%s/%s): %s", collection, doc_id, exc)
    return _memory.get(collection, {}).get(doc_id)


def list_documents(
    collection: str, limit: int = 200, order_by: str | None = None, descending: bool = True
) -> list[dict[str, Any]]:
    db = get_firestore()
    if db is not None:
        try:
            from google.cloud import firestore as fs

            query = db.collection(collection)
            if order_by:
                direction = fs.Query.DESCENDING if descending else fs.Query.ASCENDING
                query = query.order_by(order_by, direction=direction)
            return [{**(d.to_dict() or {}), "id": d.id} for d in query.limit(limit).stream()]
        except Exception as exc:  # pragma: no cover
            logger.error("Liệt kê Firestore thất bại (%s): %s", collection, exc)
    rows = [{**v, "id": k} for k, v in _memory.get(collection, {}).items()]
    key = order_by or "_createdAt"
    rows.sort(key=lambda r: str(r.get(key, "")), reverse=descending)
    return rows[:limit]


def delete_document(collection: str, doc_id: str) -> bool:
    db = get_firestore()
    if db is not None:
        try:
            db.collection(collection).document(doc_id).delete()
            return True
        except Exception as exc:  # pragma: no cover
            logger.error("Xóa Firestore thất bại (%s/%s): %s", collection, doc_id, exc)
    return _memory.get(collection, {}).pop(doc_id, None) is not None


def write_audit(actor: str, action: str, target: str, before: Any = None, after: Any = None) -> str:
    return add_document(
        "audit_logs",
        {
            "actor": actor,
            "action": action,
            "target": target,
            "before": before,
            "after": after,
            "at": _now().isoformat(),
        },
    )
