"""Truy hồi lai ghép: vector search + khớp từ khóa + lọc theo mã khóa.

Chỉ số vector được nạp sẵn trong bộ nhớ tiến trình. Với corpus ~700 chunk,
cách này nhanh hơn và rẻ hơn một dịch vụ tìm kiếm riêng; khi bật Firestore,
vector vẫn được lưu để index không phải dựng lại mỗi lần khởi động.
"""

from __future__ import annotations

import asyncio
import logging
import math
import re
from dataclasses import dataclass

from app.core.config import Settings, get_settings
from app.models.schemas import KbChunk, RetrievalHit
from app.providers import get_embedder
from app.services.aliases import get_resolver, normalize
from app.services.chunker import build_corpus
from app.services.store import ContentStore, get_store

logger = logging.getLogger(__name__)

_WORD_RE = re.compile(r"\w+", re.UNICODE)
_STOPWORDS = {
    "la", "va", "cua", "cho", "voi", "cac", "nhung", "duoc", "co", "khong",
    "the", "nao", "gi", "thi", "mot", "trong", "de", "ve", "tai", "den",
    "hay", "hoac", "toi", "chung", "anh", "chi", "xin", "vui", "long", "ban",
    "muon", "hoi", "bao", "nhieu", "khi", "neu", "nhu", "se", "da", "rat",
}


def _tokens(text: str) -> list[str]:
    return [w for w in _WORD_RE.findall(normalize(text)) if len(w) > 1 and w not in _STOPWORDS]


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


@dataclass
class IndexedChunk:
    chunk: KbChunk
    embedding: list[float]
    token_set: set[str]


class RetrievalService:
    def __init__(self, settings: Settings | None = None, store: ContentStore | None = None) -> None:
        self.settings = settings or get_settings()
        self.store = store or get_store()
        self._index: list[IndexedChunk] = []
        self._ready = False
        self._lock = asyncio.Lock()

    # -- dựng chỉ mục -----------------------------------------------------

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def size(self) -> int:
        return len(self._index)

    def build_chunks(self) -> list[KbChunk]:
        return build_corpus(self.store.courses, self.store.faqs, self.store.site)

    async def ensure_index(self, force: bool = False) -> None:
        if self._ready and not force:
            return
        async with self._lock:
            if self._ready and not force:
                return
            chunks = self.build_chunks()
            embedder = get_embedder()
            vectors: list[list[float]] = []
            batch_size = 50
            for start in range(0, len(chunks), batch_size):
                batch = chunks[start : start + batch_size]
                try:
                    vectors.extend(
                        await embedder.embed([c.content for c in batch], "RETRIEVAL_DOCUMENT")
                    )
                except Exception as exc:  # pragma: no cover - phụ thuộc mạng
                    logger.error("Lỗi tạo embedding: %s. Chuyển sang truy hồi từ khóa.", exc)
                    vectors.extend([[] for _ in batch])
            self._index = [
                IndexedChunk(chunk=c, embedding=v, token_set=set(_tokens(c.content + " " + c.title)))
                for c, v in zip(chunks, vectors)
            ]
            self._ready = True
            logger.info("Đã dựng chỉ mục Knowledge Base: %d chunk", len(self._index))

    async def reindex(self) -> int:
        self.store.load(force=True)
        get_resolver()._build()  # cập nhật lại bảng alias theo nội dung mới
        await self.ensure_index(force=True)
        return len(self._index)

    # -- truy hồi ---------------------------------------------------------

    async def _embed_query(self, query: str) -> list[float]:
        try:
            vectors = await get_embedder().embed([query], "RETRIEVAL_QUERY")
            return vectors[0] if vectors else []
        except Exception as exc:  # pragma: no cover
            logger.warning("Không tạo được embedding cho truy vấn: %s", exc)
            return []

    async def search(
        self,
        query: str,
        top_k: int | None = None,
        course_codes: list[str] | None = None,
        ensure_coverage: bool = False,
    ) -> list[RetrievalHit]:
        """Tìm các chunk liên quan nhất.

        ``course_codes`` giới hạn phạm vi khi đã biết người dùng hỏi về khóa nào.
        ``ensure_coverage`` bảo đảm mỗi khóa được nhắc tới đều có ít nhất một
        chunk trong kết quả — cần cho câu hỏi so sánh, nếu không một khóa mạnh
        sẽ chiếm hết chỗ và bot trả lời phiến diện.
        """
        await self.ensure_index()
        if not self._index:
            return []

        top_k = top_k or self.settings.retrieval_top_k
        query_vec = await self._embed_query(query)
        query_tokens = set(_tokens(query))
        codes = {c.upper() for c in (course_codes or [])}

        scored: list[tuple[float, IndexedChunk]] = []
        for item in self._index:
            if not item.chunk.active:
                continue
            vector_score = _cosine(query_vec, item.embedding) if query_vec and item.embedding else 0.0
            overlap = len(query_tokens & item.token_set)
            keyword_score = overlap / max(len(query_tokens), 1)
            score = 0.75 * vector_score + 0.25 * keyword_score
            if codes:
                if item.chunk.courseCode in codes:
                    score += 0.15
                elif item.chunk.courseCode is not None:
                    score -= 0.10
            if item.chunk.sourceDoc == "FAQ":
                score += 0.05  # FAQ do ban tổ chức soạn được ưu tiên
            scored.append((score, item))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        hits = [RetrievalHit(chunk=item.chunk, score=round(score, 4)) for score, item in scored[:top_k]]

        if ensure_coverage and codes:
            present = {h.chunk.courseCode for h in hits}
            for code in codes:
                if code in present:
                    continue
                best = next(
                    (
                        (score, item)
                        for score, item in scored
                        if item.chunk.courseCode == code
                    ),
                    None,
                )
                if best:
                    hits.append(RetrievalHit(chunk=best[1].chunk, score=round(best[0], 4)))
            hits.sort(key=lambda h: h.score, reverse=True)

        return hits

    def with_pinned(self, hits: list[RetrievalHit], chunk_ids: list[str]) -> list[RetrievalHit]:
        """Ghim thêm một số chunk bắt buộc vào kết quả truy hồi.

        Dùng cho các loại câu hỏi luôn có câu trả lời đúng bất kể điểm tương
        đồng — ví dụ hỏi về thời gian, địa điểm, học phí thì luôn phải dẫn tới
        thông tin ban tổ chức.
        """
        present = {h.chunk.id for h in hits}
        extra = [
            RetrievalHit(chunk=item.chunk, score=1.0)
            for item in self._index
            if item.chunk.id in chunk_ids and item.chunk.id not in present
        ]
        return extra + hits if extra else hits

    def top_score(self, hits: list[RetrievalHit]) -> float:
        return max((h.score for h in hits), default=0.0)


_service: RetrievalService | None = None


def get_retrieval() -> RetrievalService:
    global _service
    if _service is None:
        _service = RetrievalService()
    return _service
