# AIEDU365 API

FastAPI backend cho landing page và chatbot tư vấn 08 khóa tập huấn (Khóa 21 – Khóa 28).

## Chạy cục bộ

```bash
python3 -m venv ../.venv && ../.venv/bin/pip install -r requirements.txt
LLM_PROVIDER=echo USE_FIRESTORE=false ../.venv/bin/uvicorn app.main:app --reload --port 8080
```

`LLM_PROVIDER=echo` chạy hoàn toàn ngoại tuyến: không gọi Vertex AI, không cần
quyền GCP, nhưng vẫn đi qua đầy đủ luồng RAG, trích dẫn và guardrail. Dùng cho
phát triển và kiểm thử.

## Biến môi trường chính

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `LLM_PROVIDER` | `vertex` | Nhà cung cấp mặc định khi chưa chọn trong trang quản trị: `vertex` · `gemini` · `anthropic` · `openai` · `echo` |
| `USE_FIRESTORE` | `false` | Bật để đọc/ghi Firestore; tắt thì dùng JSON + bộ nhớ tạm |
| `GCP_PROJECT` | `aiedu365` | Project GCP |
| `GCP_LOCATION` | `asia-southeast1` | Vùng Vertex AI |
| `CHAT_MODEL` | `gemini-2.5-flash` | Model cho câu tra cứu |
| `REASONING_MODEL` | `gemini-2.5-pro` | Model cho câu so sánh và định tuyến khóa |
| `SIMILARITY_THRESHOLD` | `0.50` | Ngưỡng chốt chặn; hiệu chỉnh theo model embedding |
| `ADMIN_EMAILS` | — | Email được cấp quyền super admin khi chưa gán custom claim |
| `DEV_ADMIN_TOKEN` | — | Lối vào quản trị cục bộ, chỉ có tác dụng khi `ENVIRONMENT=development` |

Khóa API của Claude, OpenAI và Gemini **không** cấu hình bằng biến môi trường ở
production — ban tổ chức nhập trong trang quản trị và hệ thống lưu vào Secret
Manager. Các biến `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` chỉ
là phương án dự phòng cho môi trường phát triển.

## Kiểm thử

```bash
../.venv/bin/python -m pytest tests/ -q
```

Bộ câu hỏi kiểm thử nằm ở `data/eval/questions.json`, gồm cả các câu **phải bị
từ chối** (ngoài phạm vi, prompt injection).

## Cấu trúc

```
app/
├── core/          config, logging, xác thực quản trị
├── models/        schema Pydantic
├── providers/     LLM Gateway: vertex · gemini · anthropic · openai · echo
├── routers/       content · chat · leads · admin
└── services/
    ├── store         nạp dữ liệu khóa học (JSON, có thể ghi đè bằng Firestore)
    ├── aliases       chuẩn hóa K21–K28 ↔ "khóa số 1–8" ↔ tên lĩnh vực
    ├── chunker       tách Knowledge Base theo cấu trúc mục
    ├── retrieval     truy hồi lai ghép vector + từ khóa
    ├── intent        phân loại tra cứu · so sánh · định tuyến · đăng ký
    ├── prompts       system prompt và khối ngữ cảnh
    ├── guardrails    chốt chặn đầu vào, ngưỡng ngữ cảnh, khẳng định bị cấm
    ├── secrets       lưu khóa API vào Secret Manager, chỉ ghi không đọc ngược
    ├── llm_settings  nhà cung cấp và model do ban tổ chức chọn lúc đang chạy
    ├── recommend     công cụ "Chọn khóa phù hợp" (luật, không gọi model)
    └── chat          ghép toàn bộ luồng
```
