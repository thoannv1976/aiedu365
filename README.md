# AIEDU365

Landing page và AI chatbot tư vấn cho **Chương trình tập huấn AI chuyên sâu cho
Chuyển đổi số Đại học** — 08 khóa, Khóa 21 đến Khóa 28.

Chạy trên Google Cloud Platform: Cloud Run + Firestore + Vertex AI.

---

## Chạy thử trong 2 phút

Không cần tài khoản GCP — provider `echo` chạy hoàn toàn ngoại tuyến nhưng vẫn
đi qua đầy đủ luồng RAG, trích dẫn và guardrail.

```bash
# Terminal 1 — API
python3 -m venv .venv && .venv/bin/pip install -r api/requirements.txt
cd api && LLM_PROVIDER=echo USE_FIRESTORE=false \
  ../.venv/bin/uvicorn app.main:app --port 8080

# Terminal 2 — Web
cd web && npm install
API_INTERNAL_URL=http://127.0.0.1:8080 npm run dev
```

Mở http://localhost:3000

Để vào thử khu quản trị, chạy API kèm `ENVIRONMENT=development
DEV_ADMIN_TOKEN=demo-token`, rồi dán `demo-token` ở màn hình đăng nhập `/admin`.
Biến này chỉ có tác dụng ở môi trường development.

---

## Cấu trúc

```
aiedu365/
├── data/                    Dữ liệu khóa học — nguồn sự thật
│   ├── courses/K21..K28.json
│   ├── groups.json · faqs.json · site.json
│   ├── eval/questions.json  36 câu kiểm thử chatbot
│   └── seed.py              Đẩy dữ liệu gốc lên Firestore
├── api/                     FastAPI: RAG, guardrail, admin
├── web/                     Next.js 15: landing page + khu quản trị
├── infra/                   Script khởi tạo GCP, Firestore rules
├── docs/
│   ├── KE-HOACH-XAY-DUNG.md Kế hoạch đã duyệt
│   ├── KIEN-TRUC.md         Tài liệu kỹ thuật
│   ├── HUONG-DAN-VAN-HANH.md Dành cho ban tổ chức
│   └── source/              08 thư mời gốc
└── cloudbuild.yaml
```

---

## 08 khóa tập huấn

Mã chính thức là **K21–K28**. Thân thư mời gọi các khóa này là *"khóa tập huấn
chuyên sâu số 1"* đến *"số 8"* — hệ thống nhận cả hai cách gọi.

| Mã | Khóa | Thời lượng | Nhóm |
|---|---|---|---|
| K21 | AI trong Chuyển đổi số Đại học & giải pháp AI dùng chung | 05 ngày | Nền tảng toàn trường |
| K22 | AI trong Đảm bảo chất lượng và Kiểm định | 02 ngày | Chất lượng & kiểm định |
| K23 | AI trong Quản lý đào tạo | 02 ngày | Quản trị & vận hành |
| K24 | AI trong Quản lý khoa học và Nghiên cứu | 02 ngày | Khoa học & xuất bản |
| K25 | AI trong TMĐT, Kinh doanh số và Marketing số | 02 ngày | Đào tạo chuyên ngành |
| K26 | AI trong Giảng dạy và Đánh giá Ngoại ngữ | 02 ngày | Đào tạo chuyên ngành |
| K27 | AI trong Tổ chức nhân sự và Hành chính tổng hợp | 02 ngày | Quản trị & vận hành |
| K28 | AI cho Tạp chí khoa học và Quản lý khoa học | 02 ngày | Khoa học & xuất bản |

**19 ngày · 66 module phần mềm** (61 module chi tiết + 05 suite nền tảng).

---

## Tính năng

**Trang công khai**
- Trang chủ 15 phần, 08 trang chi tiết khóa dựng tĩnh, SEO + JSON-LD, dark mode
- Công cụ **Chọn khóa phù hợp**: 3 câu hỏi, gợi ý kèm lý do và số người nên cử
- Catalog 66 module phần mềm, lọc và tìm kiếm không dấu
- Phiếu đăng ký chọn nhiều khóa

**Chatbot**
- RAG có chốt chặn: thiếu căn cứ thì từ chối, không gọi model để bịa
- Phân loại ý định — câu so sánh và định tuyến khóa dùng luồng truy hồi riêng
- Chuẩn hóa mã khóa trước khi truy hồi, không phó mặc cho mô hình
- Trích dẫn nguồn dưới mỗi câu trả lời
- Guardrail chặn khẳng định vi phạm ràng buộc trong thư mời

**Khu quản trị** — 11 màn hình, chia ba nhóm
- *Vận hành*: bảng điều khiển, đăng ký + xuất CSV, hội thoại
- *Nội dung*: sửa 08 khóa học (5 thẻ), lịch khai giảng, hỏi đáp, nội dung trang
- *Hệ thống*: Knowledge Base (index lại + thử truy hồi), cấu hình AI,
  người dùng, nhật ký kiểm toán
- Vòng lặp cải tiến: câu trả lời kém → viết lại thành FAQ → chatbot tốt lên
- Ba vai trò: Super Admin · Editor · Viewer

---

## Kiểm thử

```bash
cd api && ../.venv/bin/python -m pytest tests/ -q    # 156 test
cd web && npm run typecheck
```

Bộ câu hỏi eval ở `data/eval/questions.json` gồm cả các câu **phải bị từ chối**
(ngoài phạm vi, prompt injection).

---

## Triển khai lên GCP

```bash
./infra/setup-gcp.sh aiedu365 asia-southeast1
gcloud builds submit --config cloudbuild.yaml
python data/seed.py --project aiedu365    # đẩy dữ liệu gốc lên Firestore
```

Chi tiết ở [`docs/KIEN-TRUC.md`](docs/KIEN-TRUC.md).
