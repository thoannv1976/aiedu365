"""Giới hạn tần suất trong bộ nhớ tiến trình.

Đủ dùng cho một service Cloud Run quy mô nhỏ. Khi scale nhiều instance,
thay bằng Firestore hoặc Memorystore mà không đổi giao diện gọi.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: int = 3600) -> None:
        self.limit = limit
        self.window = window_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> tuple[bool, int]:
        """Trả về (cho phép, số lượt còn lại)."""
        now = time.time()
        with self._lock:
            bucket = self._events[key]
            cutoff = now - self.window
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.limit:
                return False, 0
            bucket.append(now)
            return True, self.limit - len(bucket)

    def purge(self) -> None:
        now = time.time()
        with self._lock:
            for key in list(self._events):
                bucket = self._events[key]
                while bucket and bucket[0] < now - self.window:
                    bucket.popleft()
                if not bucket:
                    del self._events[key]
