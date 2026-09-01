#!/usr/bin/env python3
"""Đẩy dữ liệu gốc từ file JSON lên Firestore.

Chỉ cần chạy một lần sau khi tạo Firestore, để ban tổ chức bắt đầu sửa nội
dung từ trang quản trị. Bỏ qua bước này thì hệ thống vẫn chạy — API đọc thẳng
file JSON — nhưng mọi thay đổi trong trang quản trị sẽ chỉ nằm trong bộ nhớ
tiến trình và mất khi service khởi động lại.

    python data/seed.py --project aiedu365
    python data/seed.py --project aiedu365 --dry-run
    python data/seed.py --project aiedu365 --force   # ghi đè nội dung đã sửa
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent


def load(name: str):
    with (DATA_DIR / name).open(encoding="utf-8") as fh:
        return json.load(fh)


def collect() -> dict[str, dict[str, dict]]:
    """Gom dữ liệu thành {collection: {doc_id: document}}."""
    courses = {}
    for path in sorted((DATA_DIR / "courses").glob("*.json")):
        with path.open(encoding="utf-8") as fh:
            course = json.load(fh)
        courses[course["code"]] = course

    faqs = {faq["id"]: faq for faq in load("faqs.json")}
    site = {"main": load("site.json")}
    return {"courses": courses, "faqs": faqs, "site_content": site}


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed Firestore từ dữ liệu JSON.")
    parser.add_argument("--project", default="aiedu365")
    parser.add_argument("--database", default="(default)")
    parser.add_argument("--dry-run", action="store_true", help="Chỉ in ra, không ghi.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Ghi đè cả document đã tồn tại. Mặc định chỉ tạo document còn thiếu, "
        "để không xóa mất nội dung ban tổ chức đã sửa.",
    )
    args = parser.parse_args()

    data = collect()
    total = sum(len(docs) for docs in data.values())
    print(f"Nguồn: {DATA_DIR}")
    for collection, docs in data.items():
        print(f"  {collection}: {len(docs)} document")

    if args.dry_run:
        print(f"\n[dry-run] Sẽ ghi {total} document. Không thay đổi gì.")
        return 0

    try:
        from google.cloud import firestore
    except ImportError:
        print("\nThiếu thư viện: pip install google-cloud-firestore", file=sys.stderr)
        return 1

    client = firestore.Client(project=args.project, database=args.database)
    written = skipped = 0

    for collection, docs in data.items():
        for doc_id, payload in docs.items():
            ref = client.collection(collection).document(doc_id)
            if not args.force and ref.get().exists:
                skipped += 1
                continue
            ref.set(payload)
            written += 1

    print(f"\n✓ Đã ghi {written} document, bỏ qua {skipped} document đã tồn tại.")
    if skipped and not args.force:
        print("  Dùng --force nếu muốn ghi đè bằng dữ liệu gốc.")
    print("\nBước tiếp theo: vào trang quản trị, bấm “Cập nhật Knowledge Base”.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
