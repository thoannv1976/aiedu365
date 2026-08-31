# KẾ HOẠCH XÂY DỰNG
# AIEDU365 — Landing Page + AI Chatbot Tư vấn Khóa Tập huấn

> Tài liệu trình duyệt. **Chưa viết code sản phẩm** cho tới khi kế hoạch này được phê duyệt.
> Repo: `github.com/thoannv1976/aiedu365` · Hạ tầng: Google Cloud Platform (project `aiedu365`, số hiệu `240029683319`)

---

## 1. BỐI CẢNH & MỤC TIÊU

Nguồn dữ liệu đầu vào: 05 thư mời tham dự các khóa tập huấn chuyên sâu về ứng dụng AI cho chuyển đổi số đại học.

**Mục tiêu sản phẩm**

| # | Mục tiêu | Chỉ số đo |
|---|---|---|
| 1 | Giới thiệu trọn bộ 05 khóa tập huấn bằng một landing page hiện đại, thuyết phục | Thời gian ở lại trang, tỷ lệ cuộn hết trang |
| 2 | Chatbot tư vấn 24/7, trả lời chính xác **dựa trên nội dung thư mời** (không bịa) | ≥ 90% câu hỏi được trả lời có trích dẫn nguồn |
| 3 | Chuyển đổi người quan tâm thành đăng ký/lead cho ban tổ chức | Số lead/tháng, tỷ lệ chat → đăng ký |
| 4 | Trang quản trị chuyên nghiệp để BTC tự vận hành, không cần lập trình viên | BTC tự cập nhật nội dung khóa học ≤ 5 phút |

---

## 2. TÓM TẮT 05 KHÓA TẬP HUẤN (dữ liệu gốc cho Knowledge Base)

| Mã | Tên khóa | Thời lượng | Sản phẩm chuyển giao | Đối tượng chính |
|---|---|---|---|---|
| **K1** | Ứng dụng AI trong Chuyển đổi số Đại học và phát triển các giải pháp AI dùng chung | **05 ngày / 05 chuyên đề** | Trọn bộ 05 phần mềm: AI Academic Copilot · AI Quality & Accreditation Copilot · AI Research Copilot · AI Student 360 & Admissions Agent · University AI Platform (AI9) | Lãnh đạo đơn vị · Chuyên viên nghiệp vụ · Cán bộ CNTT/CĐS (cử ~03 người/đơn vị theo mô hình Business–Process–Technology) |
| **K2** | Ứng dụng AI trong Đảm bảo chất lượng và Kiểm định GDĐH | 02 ngày (30% nền tảng · 70% workshop) | **AI Quality & Accreditation Copilot** — 08 module: CLO/PLO Analyzer, CLO–PLO Mapping, Assessment Mapper, Rubric Generator, Exam Matrix Generator, Evidence Finder, Gap Analyzer, Accreditation Assistant | ĐBCL · Khảo thí · Kiểm định · QLĐT · CĐS (03–05 người/đơn vị) |
| **K3** | Ứng dụng AI trong Quản lý đào tạo Đại học | 02 ngày (30/70) | **AI Academic Copilot** — 07 module: Regulation Assistant, Curriculum Assistant, Academic Advisor, Graduation Checker, Study Planner, Student Early Warning, Academic Intelligence Dashboard | QLĐT · CTĐT · Cố vấn học tập · CTSV · CĐS (03–05 người) |
| **K4** | Ứng dụng AI trong Quản lý khoa học và Nghiên cứu | 02 ngày (30/70) | **AI Research Copilot** — 08 module: Research Knowledge Assistant, Literature & Gap Assistant, Proposal & Methodology Copilot, Research Workflow Manager, Publication & Journal Assistant, Research Intelligence Dashboard, Grant & Collaboration Scout, Research Integrity & Human Review | QLKH · Nghiên cứu · Hợp tác học thuật · Thư viện số · CĐS (03–05 người) |
| **K5** | Ứng dụng AI trong Thương mại điện tử, Kinh doanh số và Marketing số | 02 ngày (30/70) | **AI Digital Business Lab & Simulator** — 10 module: AI Marketing Lab, Sales Agent, Pricing Agent, Recommendation Agent, Customer Service Agent, Digital Business Simulator, Competitor Simulator, Consumer Simulator, Market Shock Generator, Analytics Dashboard | Khoa/Bộ môn TMĐT, Kinh doanh số, Marketing số, Digital Business, Business Analytics, Entrepreneurship (**05–10 người**) |

**Điểm chung của cả 05 khóa** — sẽ là "xương sống" nội dung landing page:
- Mô hình **Learn → Design → Build → Pilot → Transfer**
- Tỷ lệ **30% nền tảng / 70% workshop** trên dữ liệu thật của đơn vị
- **Chuyển giao miễn phí phần mềm** phiên bản triển khai thử nghiệm
- Mỗi đơn vị mang về: **Năng lực + Prototype + Phần mềm + Dữ liệu mẫu + KPI + Kế hoạch pilot 3–6 tháng**
- Lộ trình sau tập huấn: `TRAINING → SOFTWARE TRANSFER → DATA CONFIG → PILOT → KPI EVALUATION → IMPROVEMENT → SCALE & TRANSFER`
- Nguyên tắc **Human-in-the-loop**, kiểm soát hallucination, bảo mật, AI Governance

---

## 3. KIẾN TRÚC HỆ THỐNG TRÊN GCP

```
                    ┌──────────────────────────────────────────┐
   Người dùng ───▶  │  Cloud CDN + Cloud Load Balancing (HTTPS) │
                    └───────────────┬──────────────────────────┘
                                    │
            ┌───────────────────────┼────────────────────────┐
            ▼                       ▼                        ▼
   ┌─────────────────┐   ┌────────────────────┐   ┌────────────────────┐
   │ Cloud Storage   │   │  Cloud Run         │   │  Cloud Run         │
   │ (static assets, │   │  "web"             │   │  "api"             │
   │  ảnh, tài liệu) │   │  Next.js SSR       │   │  FastAPI (Python)  │
   └─────────────────┘   │  Landing + Admin   │   │  Chat · RAG · CRUD │
                         └─────────┬──────────┘   └─────────┬──────────┘
                                   │                        │
                                   │        ┌───────────────┼───────────────┐
                                   │        ▼               ▼               ▼
                                   │  ┌───────────┐  ┌────────────┐  ┌─────────────┐
                                   │  │ Firestore │  │  Vertex AI │  │ Secret Mgr  │
                                   │  │ (Native)  │  │  Gemini +  │  │ (API keys)  │
                                   │  │ + Vector  │  │ Embeddings │  └─────────────┘
                                   │  │  Search   │  └────────────┘
                                   │  └───────────┘
                                   ▼
                         ┌──────────────────┐   ┌──────────────────┐
                         │ Firebase Auth /  │   │ Cloud Logging +  │
                         │ Identity Platform│   │ BigQuery (log AI)│
                         └──────────────────┘   └──────────────────┘
```

### 3.1 Lựa chọn công nghệ (khuyến nghị)

| Lớp | Công nghệ đề xuất | Lý do |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion** | SEO tốt cho landing page, SSR/ISR, hệ component sẵn cho admin, animation mượt |
| Backend | **FastAPI (Python 3.12)** | Hệ sinh thái AI/RAG mạnh nhất, dễ tích hợp Vertex AI SDK, async streaming (SSE) |
| Hosting | **Cloud Run** (2 service: `web`, `api`) | Scale-to-zero, trả tiền theo request, không quản trị server, phù hợp lưu lượng biến động của một chiến dịch tuyển sinh |
| CSDL | **Firestore Native mode** | Serverless, tích hợp sẵn Vector Search cho RAG, real-time cho admin dashboard, không tốn phí idle |
| Vector / RAG | **Firestore Vector Search + `text-embedding-004`** | Corpus nhỏ (05 khóa ≈ 300–500 chunk) → không cần Vertex AI Search (đắt hơn ~10×) |
| LLM | **Vertex AI — Gemini 2.5 Flash** (mặc định), Gemini 2.5 Pro cho câu hỏi khó | Cùng project GCP, cùng IAM, không cần key ngoài, độ trễ thấp, tiếng Việt tốt |
| LLM Gateway | Lớp trừu tượng `providers/` cho phép cắm thêm **Claude API / OpenAI / local LLM** | Đúng tinh thần "University AI Platform" của Khóa 1; tránh khoá cứng vào 1 nhà cung cấp |
| Auth admin | **Firebase Auth** (email/password + Google SSO), custom claims phân quyền | Miễn phí ở quy mô này, tích hợp sẵn với Firestore Security Rules |
| Bí mật | **Secret Manager** | Không hardcode key trong repo |
| CI/CD | **GitHub Actions → Cloud Build → Cloud Run** (Workload Identity Federation, không dùng service-account key) | Deploy tự động khi merge vào `main` |
| Giám sát | Cloud Logging, Cloud Monitoring, uptime check; log hội thoại đẩy sang **BigQuery** để phân tích | Phục vụ báo cáo cho BTC |

### 3.2 Ước tính chi phí GCP (tham chiếu, ~1.000 phiên chat/tháng)

| Hạng mục | Ước tính/tháng |
|---|---|
| Cloud Run (2 service, scale-to-zero) | 5 – 15 USD |
| Firestore (đọc/ghi + vector index) | 1 – 5 USD |
| Vertex AI Gemini 2.5 Flash (~1.5M token in / 300K token out) | 3 – 10 USD |
| Embeddings (index 1 lần + query) | < 1 USD |
| Cloud Storage + CDN + Load Balancer | 18 – 25 USD (LB là khoản cố định lớn nhất) |
| **Tổng** | **~30 – 55 USD/tháng** |

> Có thể **bỏ Load Balancer** ở giai đoạn đầu (dùng thẳng domain mapping của Cloud Run) để giảm còn **~10–25 USD/tháng**. Đây là mức tham chiếu; chi phí thực tế phụ thuộc lưu lượng.

---

## 4. LANDING PAGE — CẤU TRÚC & NỘI DUNG

### 4.1 Sitemap

```
/                         Trang chủ (landing chính, one-page + scroll)
/khoa-hoc                 Danh sách 05 khóa (lưới thẻ, bộ lọc theo lĩnh vực/thời lượng)
/khoa-hoc/[slug]          Trang chi tiết từng khóa (nội dung đầy đủ từ thư mời)
/phan-mem-chuyen-giao     Bộ 05 phần mềm AI được chuyển giao miễn phí
/dang-ky                  Form đăng ký tham dự (theo đơn vị, nhiều người)
/hoi-dap                  FAQ tĩnh + widget chat
/lien-he                  Thông tin ban tổ chức
/admin/*                  Khu vực quản trị (bảo vệ bằng auth)
```

### 4.2 Bố cục trang chủ (thứ tự section)

| # | Section | Nội dung |
|---|---|---|
| 1 | **Hero** | Tiêu đề *"Chương trình tập huấn AI chuyên sâu cho Chuyển đổi số Đại học"* · 05 khóa · Chuyển giao miễn phí phần mềm · 2 CTA: **Đăng ký ngay** / **Hỏi trợ lý AI** · nền gradient + hoạ tiết mạch AI động |
| 2 | **Dải số liệu** | 05 khóa · 13 ngày tập huấn · 40+ module phần mềm · 70% thực hành · 100% chuyển giao miễn phí (đếm số động khi cuộn) |
| 3 | **Vì sao khóa này khác biệt** | 4 thẻ: *Không phải ChatGPT cơ bản* · *70% workshop trên dữ liệu thật* · *Mang về phần mềm, không chỉ kiến thức* · *Có KPI và kế hoạch pilot 3–6 tháng* |
| 4 | **05 khóa tập huấn** | Lưới 5 thẻ (K1 nổi bật full-width). Mỗi thẻ: icon, tên, thời lượng, sản phẩm đầu ra, đối tượng, nút *Xem chi tiết* + *Hỏi về khóa này* (mở chat kèm ngữ cảnh khóa đó) |
| 5 | **Lộ trình Learn → Transfer** | Timeline ngang 7 bước: Training → Software Transfer → Data Prep → Config → Pilot → KPI Evaluation → Scale-up |
| 6 | **Phần mềm chuyển giao miễn phí** | Tab theo từng khóa, liệt kê đầy đủ các module (7 + 8 + 8 + 10 + 5 nền tảng) với mô tả ngắn |
| 7 | **Nên cử ai đi học** | Bảng mô hình "Nghiệp vụ – Chuyên môn – Công nghệ" theo từng khóa, kèm số lượng khuyến nghị |
| 8 | **Kết quả đầu ra cam kết** | Checklist trực quan: 10–20 pain point · 3–5 quy trình ưu tiên · prototype · Knowledge Base · KPI · kế hoạch pilot |
| 9 | **Hiệu quả kỳ vọng khi pilot** | Các chỉ số tham chiếu (30–50% giảm thời gian, 50–70% câu hỏi được AI hỗ trợ…) **kèm ghi chú rõ đây là mức tham chiếu, không phải cam kết** |
| 10 | **Chuẩn bị gì trước khi đến** | Danh mục dữ liệu khuyến khích mang theo, theo từng khóa |
| 11 | **Hỏi đáp (FAQ)** | 12–15 câu accordion + ô "Không thấy câu trả lời? Hỏi trợ lý AI" |
| 12 | **Đăng ký** | Form nhúng + thông tin đầu mối |
| 13 | **Footer** | Đơn vị tổ chức, liên hệ, chính sách dữ liệu |
| — | **Chat widget** | Bong bóng cố định góc phải, mở rộng thành panel; luôn hiện trên mọi trang |

### 4.3 Định hướng thiết kế

- **Bảng màu**: xanh mực học thuật `#0B3B75` → xanh cyan công nghệ `#00A6ED`, điểm nhấn vàng đồng `#F5A524` cho CTA; nền sáng `#F8FAFC`, hỗ trợ **dark mode**.
- **Typography**: `Be Vietnam Pro` (heading) + `Inter` (body) — cả hai hỗ trợ dấu tiếng Việt đầy đủ.
- **Chuyển động**: fade-up khi cuộn, đếm số, hover nâng thẻ; tôn trọng `prefers-reduced-motion`.
- **Responsive**: mobile-first, breakpoint 640 / 768 / 1024 / 1280.
- **Khả năng tiếp cận**: tương phản ≥ 4.5:1, điều hướng bàn phím đầy đủ, ARIA cho chat widget.
- **SEO**: metadata tiếng Việt, Open Graph, JSON-LD `Course` schema cho từng khóa, sitemap.xml.
- **Hiệu năng**: mục tiêu Lighthouse ≥ 90 cả 4 nhóm; ảnh WebP/AVIF; font self-host.

---

## 5. CHATBOT — THIẾT KẾ CHI TIẾT

### 5.1 Luồng xử lý (RAG có kiểm soát)

```
Câu hỏi
   │
   ├─▶ Kiểm duyệt đầu vào (độ dài, spam, rate limit theo IP+session)
   │
   ├─▶ Viết lại truy vấn (dùng 3 lượt hội thoại gần nhất để giải nghĩa "khóa đó", "cái này")
   │
   ├─▶ Truy hồi lai ghép:
   │        • Vector search trên Firestore (top-k = 8)
   │        • Khớp từ khoá trên trường course_code / module_name
   │        • Hợp nhất + xếp hạng lại
   │
   ├─▶ Kiểm tra ngưỡng: nếu điểm tương đồng cao nhất < 0.55
   │        → trả lời "chưa có thông tin" + đề xuất liên hệ BTC (KHÔNG để LLM tự bịa)
   │
   ├─▶ Gọi Gemini với system prompt + ngữ cảnh đã trích + lịch sử hội thoại
   │
   ├─▶ Stream câu trả lời (SSE) + kèm chip nguồn ("Thư mời Khóa 3 — mục 3")
   │
   └─▶ Ghi log: câu hỏi, đoạn ngữ cảnh, câu trả lời, độ trễ, token, phản hồi 👍/👎
```

### 5.2 Knowledge Base

**Nguồn dữ liệu (3 lớp):**

1. **Nội dung thư mời** — 05 tài liệu gốc, tách chunk theo cấu trúc mục (không cắt theo số ký tự thô), mỗi chunk gắn metadata: `course_code`, `section`, `title`, `source_doc`.
2. **FAQ do BTC soạn** — cặp hỏi/đáp có độ ưu tiên cao hơn, phục vụ các câu về học phí, địa điểm, thời gian, chứng nhận.
3. **Thông tin tổ chức** — thời gian, địa điểm, đầu mối đăng ký, hạn đăng ký (các mục còn để trống trong thư mời — BTC nhập qua admin).

**Ước tính**: ~350–450 chunk. Re-index chạy bằng job trên Cloud Run khi admin bấm "Cập nhật Knowledge Base".

### 5.3 Nguyên tắc trả lời (system prompt)

- Chỉ trả lời dựa trên ngữ cảnh được cung cấp; **không suy diễn, không bịa số liệu**.
- Luôn phân biệt rõ đâu là **chỉ số tham chiếu** (30–50%, 50–70%…) và nói rõ đây là mục tiêu pilot, không phải cam kết kết quả.
- Không tự đặt ra học phí, thời gian, địa điểm nếu admin chưa cấu hình → trả lời "thông tin này sẽ do ban tổ chức cung cấp" + hiển thị nút liên hệ.
- Trả lời bằng **tiếng Việt** mặc định; tự chuyển sang tiếng Anh nếu người dùng hỏi tiếng Anh.
- Giọng điệu: trang trọng, súc tích, có gạch đầu dòng; luôn kết bằng một gợi ý hành động (xem chi tiết khóa / đăng ký / liên hệ).
- Khi người dùng mô tả nhu cầu ("trường tôi đang chuẩn bị kiểm định AUN-QA"), **chủ động tư vấn khóa phù hợp** kèm lý do.

### 5.4 Tính năng chatbot

| Tính năng | Mô tả |
|---|---|
| Câu hỏi gợi ý | 4–6 chip khi mở chat: *"So sánh 5 khóa"*, *"Khóa nào phù hợp với phòng ĐBCL?"*, *"Phần mềm được chuyển giao gồm những gì?"*, *"Nên cử bao nhiêu người?"* |
| Streaming | Trả lời hiện dần theo token (SSE) |
| Trích dẫn nguồn | Chip dưới câu trả lời, bấm vào mở đúng section trên trang |
| Ngữ cảnh theo trang | Mở chat từ thẻ Khóa 3 → bot biết đang nói về Khóa 3 |
| Thu thập lead | Sau 3–4 lượt hoặc khi phát hiện ý định đăng ký → hiện form nhẹ (tên, đơn vị, email, SĐT, khóa quan tâm) |
| So sánh khóa | Câu hỏi so sánh → render bảng so sánh có cấu trúc |
| Phản hồi | 👍/👎 mỗi câu trả lời → dữ liệu cải thiện cho admin |
| Chuyển người thật | Nút "Gặp ban tổ chức" → gửi email/Zalo/điện thoại của đầu mối |
| Lịch sử phiên | Lưu theo `session_id` trong localStorage, khôi phục khi quay lại |
| Đa ngôn ngữ | VI (mặc định) / EN |

### 5.5 Rào chắn an toàn (guardrails)

- Rate limit: 20 tin nhắn/phiên/giờ, 100 request/IP/giờ.
- Lọc prompt injection: bỏ qua chỉ dẫn trong nội dung người dùng nhằm thay đổi vai trò của bot.
- Từ chối chủ đề ngoài phạm vi (chính trị, y tế, pháp lý cá nhân…) → chuyển hướng lịch sự về nội dung khóa học.
- Không lưu trữ thông tin cá nhân trong log hội thoại nếu người dùng không chủ động cung cấp; có banner đồng ý dữ liệu.
- Ngân sách token/ngày, có cảnh báo khi vượt 80%.

---

## 6. TRANG QUẢN TRỊ (ADMIN)

Đường dẫn `/admin`, bảo vệ bằng Firebase Auth + custom claims. Giao diện sidebar + bảng dữ liệu, tiếng Việt.

| Module | Chức năng |
|---|---|
| **1. Bảng điều khiển** | Biểu đồ: lượt truy cập, số phiên chat, số tin nhắn, số lead theo ngày/tuần/tháng; top 10 câu hỏi; tỷ lệ 👍/👎; tỷ lệ câu "không trả lời được"; chi phí token ước tính |
| **2. Quản lý khóa học** | CRUD đầy đủ 05 khóa: tên, slug, mô tả, thời lượng, đối tượng, nội dung từng ngày, kết quả đầu ra, module phần mềm, dữ liệu cần mang theo, ảnh, trạng thái hiển thị, thứ tự sắp xếp. Trình soạn thảo rich-text + xem trước trực tiếp |
| **3. Lịch khai giảng** | Thời gian, địa điểm, hình thức, hạn đăng ký, số chỗ, đầu mối — chính là các mục còn trống trong thư mời |
| **4. Knowledge Base** | Danh sách chunk; tải lên tài liệu mới (.docx/.pdf/.md); sửa/xoá chunk; bấm **Re-index**; xem trạng thái đồng bộ; test truy hồi ("thử một câu hỏi, xem bot lấy chunk nào") |
| **5. Quản lý FAQ** | CRUD cặp hỏi/đáp, phân nhóm, độ ưu tiên, bật/tắt; các FAQ này đồng thời hiển thị ở section 11 landing page |
| **6. Hội thoại** | Xem lại toàn bộ phiên chat; lọc theo ngày/đánh giá/khóa; gắn nhãn; **đánh dấu câu trả lời sai → chuyển thẳng thành FAQ mới** (vòng lặp cải tiến) |
| **7. Lead & Đăng ký** | Bảng danh sách đăng ký: đơn vị, người liên hệ, khóa quan tâm, số lượng, nguồn (form/chat), trạng thái (mới → đã liên hệ → xác nhận → huỷ); ghi chú; **xuất Excel/CSV**; gửi email xác nhận tự động |
| **8. Cấu hình AI** | Chọn model, temperature, top-k, ngưỡng tương đồng, độ dài trả lời tối đa; **soạn/version system prompt** (có lịch sử và rollback); chip câu hỏi gợi ý; lời chào |
| **9. Nội dung trang** | Sửa nội dung hero, số liệu, các section landing page mà không cần deploy lại |
| **10. Người dùng & phân quyền** | 3 vai trò: **Super Admin** (toàn quyền) · **Editor** (nội dung, KB, FAQ) · **Viewer** (chỉ xem dashboard & lead). Mời qua email |
| **11. Nhật ký kiểm toán** | Ai sửa gì, lúc nào, giá trị trước/sau — bắt buộc cho môi trường giáo dục |

---

## 7. MÔ HÌNH DỮ LIỆU (Firestore)

```
courses/{courseId}
  code, slug, title, subtitle, duration, method, outputs[], audience[],
  days[{ title, subtitle, topics[], output }], deliverables[],
  softwareModules[{ no, name, description }], expectedKpis[],
  dataToBring[], roadmap[], order, published, updatedAt, updatedBy

sessions_schedule/{scheduleId}
  courseId, startDate, endDate, location, format, registrationDeadline,
  capacity, contactName, contactEmail, contactPhone, status

kb_chunks/{chunkId}
  courseId, sourceDoc, section, title, content, tokens,
  embedding: Vector(768), updatedAt, active

faqs/{faqId}
  question, answer, category, courseId?, priority, published, order

chat_sessions/{sessionId}
  createdAt, lastActiveAt, userAgent, referrerPage, locale,
  courseContext?, messageCount, leadCaptured, ipHash

chat_sessions/{sessionId}/messages/{messageId}
  role, content, citations[{chunkId, courseId, section}],
  latencyMs, tokensIn, tokensOut, model, feedback (up|down|null), createdAt

leads/{leadId}
  fullName, organization, position, email, phone, courseIds[],
  attendeeCount, message, source (form|chat), sessionId?,
  status, assignedTo, notes[], createdAt

site_content/{key}          // nội dung động của landing page
admin_users/{uid}           // role, displayName, email, active
audit_logs/{logId}          // actor, action, target, before, after, at
app_config/{key}            // model, prompt version, thresholds, budgets
```

---

## 8. API (FastAPI)

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/chat` | Gửi tin nhắn, nhận stream SSE | Public + rate limit |
| POST | `/api/chat/feedback` | 👍/👎 cho một tin nhắn | Public |
| GET | `/api/courses` · `/api/courses/{slug}` | Dữ liệu khóa học cho frontend | Public |
| GET | `/api/faqs` | FAQ đã publish | Public |
| POST | `/api/leads` | Gửi form đăng ký | Public + captcha |
| GET/POST/PUT/DELETE | `/api/admin/courses/*` | CRUD khóa học | Admin |
| POST | `/api/admin/kb/upload` · `/api/admin/kb/reindex` | Nạp & index Knowledge Base | Admin |
| POST | `/api/admin/kb/test-retrieval` | Thử truy hồi | Admin |
| GET | `/api/admin/conversations` · `/api/admin/analytics` | Hội thoại & thống kê | Admin |
| GET | `/api/admin/leads` · `/api/admin/leads/export` | Danh sách & xuất file | Admin |
| GET/PUT | `/api/admin/config` · `/api/admin/prompts` | Cấu hình AI & prompt | Super Admin |

---

## 9. BẢO MẬT & TUÂN THỦ

- HTTPS bắt buộc, HSTS, CSP chặt (chỉ cho phép domain của chính hệ thống + Google Fonts).
- Firestore Security Rules: client web **chỉ đọc** dữ liệu public; mọi thao tác ghi đi qua API có xác thực.
- Không có secret nào trong repo; toàn bộ qua Secret Manager + biến môi trường Cloud Run.
- Service account theo nguyên tắc đặc quyền tối thiểu (`api` chỉ có `aiplatform.user` + `datastore.user`).
- Cloudflare Turnstile / reCAPTCHA v3 cho form đăng ký.
- Banner đồng ý thu thập dữ liệu + trang chính sách; hash IP, không lưu IP thô.
- Nhật ký kiểm toán bất biến cho mọi thay đổi nội dung.
- Backup Firestore tự động hằng ngày sang Cloud Storage.

---

## 10. LỘ TRÌNH TRIỂN KHAI

| Giai đoạn | Nội dung | Kết quả bàn giao | Ước tính |
|---|---|---|---|
| **GĐ 0 — Nền móng** | Khởi tạo repo, monorepo structure, Dockerfile, Terraform/gcloud script, CI/CD, bật API GCP, tạo Firestore & service account | Repo chạy được, deploy "hello world" lên Cloud Run | 1 ngày |
| **GĐ 1 — Dữ liệu** | Chuyển 05 thư mời thành JSON có cấu trúc, script seed Firestore, pipeline chunk + embedding + index | Knowledge Base sẵn sàng, ~400 chunk có vector | 1 ngày |
| **GĐ 2 — Landing page** | Toàn bộ 13 section, 5 trang chi tiết khóa, trang phần mềm, form đăng ký, responsive + dark mode + SEO | Landing page hoàn chỉnh, Lighthouse ≥ 90 | 2–3 ngày |
| **GĐ 3 — Chatbot** | API `/api/chat` với RAG + streaming, widget UI, trích dẫn, gợi ý câu hỏi, lead capture trong chat, guardrails | Chatbot trả lời đúng trên bộ 50 câu hỏi kiểm thử | 2–3 ngày |
| **GĐ 4 — Admin** | Auth + phân quyền, 11 module quản trị, biểu đồ thống kê, xuất Excel, audit log | Admin panel đầy đủ, BTC tự vận hành được | 3–4 ngày |
| **GĐ 5 — Kiểm thử & vận hành** | Bộ test 80–100 câu hỏi thực tế, tối ưu prompt, kiểm thử tải, uptime check, hướng dẫn sử dụng cho BTC | Tài liệu vận hành + hệ thống chạy production | 1–2 ngày |

**Tổng: khoảng 10–14 ngày công.** Có thể bàn giao theo từng giai đoạn để duyệt dần.

---

## 11. CẤU TRÚC REPO

```
aiedu365/
├── README.md
├── docs/
│   ├── KE-HOACH-XAY-DUNG.md          ← tài liệu này
│   ├── KIEN-TRUC.md
│   ├── HUONG-DAN-VAN-HANH.md         ← tài liệu cho ban tổ chức
│   └── source/                        ← 05 thư mời gốc (.docx) + bản trích xuất
├── web/                               ← Next.js (landing + admin)
│   ├── app/(site)/                    ← landing, khóa học, đăng ký, FAQ
│   ├── app/(admin)/admin/             ← 11 module quản trị
│   ├── components/{ui,sections,chat,admin}/
│   └── lib/
├── api/                               ← FastAPI
│   ├── app/routers/{chat,courses,leads,admin}.py
│   ├── app/services/{rag,embeddings,llm,analytics}.py
│   ├── app/providers/{vertex,anthropic,openai}.py   ← LLM gateway
│   ├── app/models/  · app/core/
│   └── Dockerfile
├── data/
│   ├── courses/*.json                 ← dữ liệu 05 khóa
│   └── seed.py · ingest.py
├── infra/
│   ├── terraform/                     ← hoặc script gcloud
│   └── cloudbuild.yaml
└── .github/workflows/deploy.yml
```

---

## 12. NHỮNG ĐIỂM CẦN CHỐT TRƯỚC KHI VIẾT CODE

| # | Nội dung | Đề xuất mặc định |
|---|---|---|
| 1 | **Tên đơn vị tổ chức** hiển thị trên trang (thư mời để trống) | Cần cung cấp |
| 2 | **Thời gian – địa điểm – hạn đăng ký – đầu mối** của từng khóa | Để trống, BTC nhập qua admin sau |
| 3 | **Học phí** — có công khai không? | Mặc định: không hiển thị, chatbot trả lời "liên hệ ban tổ chức" |
| 4 | **Logo, màu thương hiệu, ảnh** của đơn vị | Dùng bộ nhận diện đề xuất ở mục 4.3 nếu chưa có |
| 5 | **Tên miền** | Tạm dùng domain `*.run.app` của Cloud Run; gắn domain riêng sau |
| 6 | **Model LLM** | Vertex AI Gemini 2.5 Flash (khuyến nghị — cùng project, chi phí thấp) |
| 7 | **Email gửi xác nhận đăng ký** | SendGrid free tier hoặc Gmail SMTP của BTC |
| 8 | **Ngôn ngữ giao diện** | Tiếng Việt là chính, có công tắc EN |
| 9 | **Tài khoản admin đầu tiên** | Email `hoanganh.goldenlight@gmail.com` làm Super Admin |

---

## 13. ĐỀ NGHỊ PHÊ DUYỆT

Kính đề nghị xem xét và phê duyệt kế hoạch. Sau khi được duyệt, việc triển khai sẽ bắt đầu từ **Giai đoạn 0** và bàn giao theo từng giai đoạn để tiện theo dõi, góp ý.

Nếu cần điều chỉnh phạm vi (ví dụ: bỏ bớt module admin, đổi công nghệ, rút gọn landing page), xin cho biết để cập nhật kế hoạch trước khi viết code.
