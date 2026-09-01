# KIẾN TRÚC HỆ THỐNG

Tài liệu kỹ thuật. Xem `HUONG-DAN-VAN-HANH.md` nếu anh/chị vận hành hệ thống.

---

## 1. Tổng thể

```
                       Internet
                          │
                          ▼
              ┌───────────────────────┐
              │  Cloud Run: web       │  ← service DUY NHẤT mở ra Internet
              │  Next.js 15           │
              │  · landing page       │
              │  · khu quản trị       │
              │  · proxy /api/*       │
              └───────────┬───────────┘
                          │ ID token (IAM)
                          ▼
              ┌───────────────────────┐
              │  Cloud Run: api       │  ← --no-allow-unauthenticated
              │  FastAPI              │
              │  · RAG + guardrail    │
              │  · CRUD + admin       │
              └───┬───────────────┬───┘
                  │               │
        ┌─────────▼───┐   ┌───────▼────────┐
        │  Firestore  │   │   Vertex AI    │
        │  + Vector   │   │ Gemini + embed │
        └─────────────┘   └────────────────┘
```

**Vì sao web proxy cho API thay vì trình duyệt gọi thẳng:**

1. Service API không mở ra Internet. Mọi endpoint quản trị nằm sau hai lớp:
   IAM của Cloud Run, rồi mới tới xác thực Firebase của ứng dụng.
2. Không phải cấu hình CORS — một nguồn lỗi phổ biến khi lên production.
3. Không lộ URL nội bộ của service API.

Việc chuyển tiếp do route handler `web/src/app/api/[...path]/route.ts` đảm
nhiệm. Nó lấy ID token từ metadata server của Cloud Run, gắn vào header
`Authorization`, và chuyển token quản trị của người dùng sang header
`X-Admin-Authorization` để hai lớp không đè lên nhau.

---

## 2. Luồng xử lý một câu hỏi

```
Câu hỏi của người dùng
   │
   ├─▶ 1. Kiểm duyệt đầu vào
   │      Độ dài · rate limit (20 tin/phiên/giờ, 100 request/IP/giờ)
   │      Phát hiện prompt injection → đánh dấu, không từ chối
   │
   ├─▶ 2. Phân loại ý định (bằng luật, không gọi model)
   │      TRA CỨU · SO SÁNH · ĐỊNH TUYẾN · ĐĂNG KÝ · NGOÀI PHẠM VI
   │
   ├─▶ 3. Chuẩn hóa mã khóa
   │      "khóa 3" / "khóa số 3" / "K23" / "quản lý đào tạo" → K23
   │
   ├─▶ 4. Truy hồi lai ghép
   │      0.75 × cosine(vector) + 0.25 × trùng từ khóa
   │      ± 0.15 theo mã khóa đã xác định · +0.05 cho FAQ
   │      SO SÁNH và ĐỊNH TUYẾN: top-k 16 và bảo đảm mỗi khóa có ≥ 1 chunk
   │
   ├─▶ 5. CHỐT CHẶN
   │      Không đủ ngữ cảnh → trả lời "chưa có thông tin", KHÔNG gọi model
   │
   ├─▶ 6. Gọi Gemini, stream về trình duyệt (SSE)
   │
   └─▶ 7. Kiểm tra đầu ra
          Khẳng định bị cấm · mã khóa không có căn cứ trong ngữ cảnh
```

### Vì sao chốt chặn dùng nhiều tín hiệu

Một ngưỡng cứng áp lên điểm hỗn hợp rất giòn: giá trị tuyệt đối của nó phụ
thuộc mô hình embedding đang dùng, nên đổi nhà cung cấp là chặn oan hàng loạt
câu hợp lệ. Vì vậy quyết định dựa trên hai tín hiệu:

- điểm cao nhất vượt ngưỡng, **hoặc**
- câu hỏi nêu đích danh một khóa và có chunk của đúng khóa đó ở mức điểm gần
  ngưỡng.

Câu ngoài phạm vi không thỏa cả hai.

### Vì sao chuẩn hóa mã khóa nằm trong code, không phó mặc cho model

Mã chính thức là **K21–K28**, nhưng thân thư mời gọi các khóa này là *"khóa tập
huấn chuyên sâu số 1"* đến *"số 8"*. Các đơn vị cầm thư mời giấy sẽ hỏi "khóa
số 3" trong khi trang hiển thị "Khóa 23". Trả lời nhầm khóa là lỗi nghiêm trọng
nhất hệ thống này có thể mắc, nên việc quy đổi phải tất định.

---

## 3. Knowledge Base

151 chunk khi chưa có lịch khai giảng, khoảng 31.700 token, tách **theo cấu
trúc mục** chứ không theo số ký tự. Mỗi chunk là một đơn vị ý nghĩa trọn vẹn
(một ngày học, một bảng module, một bộ KPI), nên khi trích dẫn vẫn đọc được và
không đứt giữa câu.

| Nguồn | Số chunk |
|---|---|
| 08 khóa × ~19 mục | 134 |
| FAQ do ban tổ chức soạn | 15 |
| Thông tin tổ chức và nguyên tắc chung | 2 |
| Lịch khai giảng | 1 chunk cho mỗi khóa có lịch |

### Ghim chunk cho câu hỏi hậu cần

Chunk lịch khai giảng ngắn nên luôn thua điểm tương đồng trước các chunk nội
dung dài của cùng khóa — kể cả khi câu hỏi nói rõ "khóa 22 khai giảng khi nào".
Vì vậy với ý định ĐĂNG KÝ, hệ thống **ghim thẳng** chunk lịch của khóa được
nhắc tới cùng chunk thông tin tổ chức, thay vì trông chờ vào xếp hạng.

Nguyên tắc chung: loại câu hỏi nào luôn có một nguồn trả lời đúng thì ghim
nguồn đó, không để nó cạnh tranh điểm.

Chỉ mục vector nằm trong bộ nhớ tiến trình, dựng lúc khởi động. Với corpus cỡ
này, cách đó nhanh và rẻ hơn một dịch vụ tìm kiếm riêng.

---

## 4. Guardrail đầu ra

Ba nhóm khẳng định bị cấm, lấy trực tiếp từ ràng buộc ghi trong thư mời:

| Khóa | Điều bị cấm |
|---|---|
| K27 | AI tự động quyết định tuyển dụng, bổ nhiệm, đánh giá, kỷ luật |
| K26 | AI thay giảng viên chấm điểm chính thức |
| K28 | AI tự quyết định chấp nhận hay từ chối bản thảo |
| — | Biến chỉ số tham chiếu thành cam kết ("cam kết giảm 50%") |

Phát hiện bằng **cụm từ xuất hiện gần nhau theo thứ tự** thay vì một biểu thức
chính quy dài — bền hơn nhiều với vô số cách diễn đạt mà mô hình có thể sinh ra.

Ngoài ra, mọi mã khóa nêu trong câu trả lời phải có căn cứ trong **nội dung**
chunk đã truy hồi, không chỉ nhãn khóa: một chunk của Khóa 22 nói về ranh giới
với Khóa 21 là căn cứ hợp lệ để nhắc Khóa 21.

---

## 5. LLM Gateway

`api/app/providers/` — đổi nhà cung cấp chỉ cần đổi biến `LLM_PROVIDER`:

| Provider | Dùng khi |
|---|---|
| `vertex` | Mặc định. Gemini qua Vertex AI, cùng project, cùng IAM |
| `anthropic` | Claude API. Không có embedding nên phần đó tự quay về Vertex |
| `echo` | Phát triển và kiểm thử. Không gọi mạng, vẫn đi hết luồng RAG |

Provider `echo` dùng embedding hash bag-of-words tất định — không thay được mô
hình thật, nhưng đủ để kiểm thử luồng truy hồi và chạy toàn bộ test suite trong
CI mà không tốn chi phí API.

---

## 6. Dữ liệu

Nguồn mặc định là các file JSON trong `data/`. Nội dung ban tổ chức sửa trong
trang quản trị được ghi đè lên trên. JSON còn là phương án dự phòng — nhờ vậy
frontend chạy được ngay từ lúc chưa có hạ tầng GCP, và một sự cố Firestore
không làm sập trang công khai.

Lớp đọc và lớp ghi dùng chung một trừu tượng (`services/firestore.py`), tự
chuyển sang bộ nhớ tiến trình khi chưa bật Firestore. Nhờ vậy môi trường phát
triển hành xử giống hệt production — sửa nội dung là thấy ngay, thay vì im lặng
biến mất.

Chạy `python data/seed.py --project aiedu365` một lần sau khi tạo Firestore để
đẩy dữ liệu gốc lên. Mặc định script chỉ tạo document còn thiếu, không ghi đè
nội dung ban tổ chức đã sửa.

### Collection

| Collection | Nội dung |
|---|---|
| `courses` | 08 khóa: mã, `legacyNumber`, `aliases[]`, nội dung từng ngày, module |
| `sessions_schedule` | Lịch khai giảng từng đợt, trạng thái, đầu mối riêng |
| `faqs` | Hỏi đáp do ban tổ chức soạn, có độ ưu tiên |
| `admin_users` | Danh sách tài khoản quản trị và vai trò |
| `chat_messages` | Log hội thoại: câu hỏi, ý định, trích dẫn, điểm, token, đánh giá |
| `leads` | Đăng ký, trạng thái xử lý |
| `app_config` | Model, ngưỡng, phiên bản prompt |
| `prompt_versions` | Lịch sử system prompt |
| `audit_logs` | Nhật ký kiểm toán, bất biến |
| `site_content` | Nội dung trang sửa được từ admin |

IP người dùng được **băm** trước khi ghi log, không lưu IP thô.

---

## 7. Triển khai

```bash
./infra/setup-gcp.sh aiedu365 asia-southeast1     # chạy một lần
gcloud builds submit --config cloudbuild.yaml     # mỗi lần deploy
```

`cloudbuild.yaml` deploy API trước để lấy URL nội bộ, rồi mới build web —
vì URL đó được nhúng vào cấu hình proxy lúc build.

Sau lần deploy đầu tiên, cấp quyền cho web gọi API:

```bash
gcloud run services add-iam-policy-binding aiedu365-api \
  --region=asia-southeast1 \
  --member="serviceAccount:aiedu365-web@aiedu365.iam.gserviceaccount.com" \
  --role=roles/run.invoker
```

CI/CD chạy test trước, chỉ deploy khi xanh, và dùng Workload Identity Federation
nên không có file khóa service account nào được tạo hay lưu.

---

## 8. Chi phí

Ước tính ~1.000 phiên chat/tháng:

| Hạng mục | USD/tháng |
|---|---|
| Cloud Run (2 service, scale-to-zero) | 5 – 15 |
| Firestore | 1 – 5 |
| Vertex AI Gemini 2.5 Flash | 4 – 12 |
| Embeddings | < 1 |
| **Tổng (chưa gắn Load Balancer)** | **~10 – 28** |

Cả hai service để `min-instances=0` nên không có lưu lượng thì không tính tiền.
