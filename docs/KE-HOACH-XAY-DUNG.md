# KẾ HOẠCH XÂY DỰNG
# AIEDU365 — Landing Page + AI Chatbot Tư vấn Khóa Tập huấn

> Tài liệu trình duyệt. **Chưa viết code sản phẩm** cho tới khi kế hoạch này được phê duyệt.
> Repo: `github.com/thoannv1976/aiedu365` · Hạ tầng: Google Cloud Platform (project `aiedu365`, số hiệu `240029683319`)
>
> **Cập nhật lần 2** — bổ sung Khóa 26 (Ngoại ngữ), Khóa 27 (Tổ chức nhân sự & Hành chính tổng hợp), Khóa 28 (Tạp chí khoa học & Quản lý khoa học). Tổng: **08 khóa (K21–K28) · 19 ngày · hơn 60 module phần mềm**.
>
> **Lưu ý mã khóa:** mã chính thức là **K21–K28**. Phần thân thư mời ghi "Khóa tập huấn chuyên sâu số 1–8" — hai cách đánh số này cùng chỉ một khóa (số 1 = K21, số 8 = K28). Chatbot phải nhận cả hai cách gọi (xem §5.5).

---

## 1. BỐI CẢNH & MỤC TIÊU

Nguồn dữ liệu đầu vào: **08 thư mời** tham dự các khóa tập huấn chuyên sâu về ứng dụng AI cho chuyển đổi số đại học.

**Mục tiêu sản phẩm**

| # | Mục tiêu | Chỉ số đo |
|---|---|---|
| 1 | Giới thiệu trọn bộ 08 khóa tập huấn bằng một landing page hiện đại, thuyết phục | Thời gian ở lại trang, tỷ lệ cuộn hết trang |
| 2 | Chatbot tư vấn 24/7, trả lời chính xác **dựa trên nội dung thư mời** (không bịa) | ≥ 90% câu hỏi được trả lời có trích dẫn nguồn |
| 3 | **Định tuyến đúng khóa** cho từng đơn vị — với 08 khóa, đây là bài toán khó nhất | ≥ 85% gợi ý khóa đúng trên bộ tình huống kiểm thử |
| 4 | Chuyển đổi người quan tâm thành đăng ký/lead cho ban tổ chức | Số lead/tháng, tỷ lệ chat → đăng ký |
| 5 | Trang quản trị chuyên nghiệp để BTC tự vận hành, không cần lập trình viên | BTC tự cập nhật nội dung khóa học ≤ 5 phút |

---

## 2. TOÀN CẢNH 08 KHÓA TẬP HUẤN (dữ liệu gốc cho Knowledge Base)

### 2.1 Bảng tổng hợp

| Mã | Tên khóa | Thời lượng | Phần mềm chuyển giao | Đối tượng · số người |
|---|---|---|---|---|
| **K21** | Ứng dụng AI trong Chuyển đổi số Đại học và phát triển các giải pháp AI dùng chung | **05 ngày / 05 chuyên đề** | Trọn bộ 05 suite: AI Academic Copilot · AI Quality & Accreditation Copilot · AI Research Copilot · AI Student 360 & Admissions Agent · University AI Platform (AI9) | Lãnh đạo · Chuyên viên nghiệp vụ · CNTT/CĐS — **~03 người/đơn vị** (Business–Process–Technology) |
| **K22** | AI trong Đảm bảo chất lượng và Kiểm định GDĐH | 02 ngày | **AI Quality & Accreditation Copilot** — 08 module | ĐBCL · Khảo thí · Kiểm định · QLĐT · CĐS — **03–05 người** |
| **K23** | AI trong Quản lý đào tạo Đại học | 02 ngày | **AI Academic Copilot** — 07 module | QLĐT · CTĐT · Cố vấn học tập · CTSV · CĐS — **03–05 người** |
| **K24** | AI trong Quản lý khoa học và Nghiên cứu | 02 ngày | **AI Research Copilot** — 08 module | QLKH · Nghiên cứu · Hợp tác học thuật · Thư viện số · CĐS — **03–05 người** |
| **K25** | AI trong Thương mại điện tử, Kinh doanh số và Marketing số | 02 ngày | **AI Digital Business Lab & Simulator** — 10 module | Khoa/Bộ môn TMĐT · Kinh doanh số · Marketing số · Business Analytics · Entrepreneurship — **05–10 người** |
| **K26** | AI trong Giảng dạy, Đánh giá và Cá nhân hóa học tập Ngoại ngữ | 02 ngày | **AI Foreign Language Learning & Assessment Platform** — 08 module | Khoa/Bộ môn Ngoại ngữ (Anh, Pháp, Trung, Nhật, Hàn…) — **05–10 người** |
| **K27** | AI trong Tổ chức nhân sự và Hành chính tổng hợp | 02 ngày | **AI HR & Administration Copilot Suite** — 10 module | Tổ chức cán bộ · Hành chính – Tổng hợp · Văn phòng · CNTT/CĐS — **03–05 người** |
| **K28** | AI thúc đẩy chuyển đổi số Tạp chí khoa học và Quản lý khoa học | 02 ngày | **AI Journal & Research Management Suite** — 10 module | Tạp chí khoa học · Tòa soạn · QLKH · Xuất bản · Thư viện số · CĐS — **03–06 người** |

Tổng: **08 khóa · 19 ngày tập huấn · 61 module chi tiết + 05 suite nền tảng**.

### 2.2 Nhóm khóa học (dùng làm bộ lọc trên landing page và cho chatbot định tuyến)

| Nhóm | Khóa | Đơn vị mục tiêu |
|---|---|---|
| **Nền tảng toàn trường** | K21 | Ban giám hiệu, Trung tâm CNTT/CĐS — khóa bao trùm cả 05 lĩnh vực |
| **Quản trị & vận hành** | K23, K27 | Phòng Đào tạo · Tổ chức cán bộ · Hành chính – Tổng hợp · Văn phòng |
| **Chất lượng & kiểm định** | K22 | Phòng ĐBCL · Khảo thí |
| **Khoa học & xuất bản** | K24, K28 | Phòng QLKH · Tạp chí khoa học · Thư viện số |
| **Đào tạo chuyên ngành** | K25, K26 | Khoa/Bộ môn TMĐT–Kinh doanh số · Khoa/Bộ môn Ngoại ngữ |

### 2.3 Điểm chung của cả 08 khóa — "xương sống" nội dung landing page

- Mô hình **Learn → Design → Build → Pilot → Transfer**
- Tỷ lệ **30% nền tảng / 70% workshop** trên dữ liệu thật của đơn vị (áp dụng cho toàn bộ 07 khóa chuyên đề 02 ngày)
- **Chuyển giao miễn phí phần mềm** phiên bản triển khai thử nghiệm
- Mỗi đơn vị mang về: **Năng lực + Prototype + Phần mềm + Dữ liệu mẫu + KPI + Kế hoạch pilot 3–6 tháng**
- Lộ trình sau tập huấn: `TRAINING → SOFTWARE TRANSFER → DATA/KB → CONFIG → PILOT → KPI EVALUATION → INTEGRATION → SCALE-UP`
- Nguyên tắc **Human-in-the-loop**, kiểm soát hallucination, bảo mật, AI Governance
- Ghi chú chung: phần mềm miễn phí trong khuôn khổ chương trình; **chi phí hạ tầng máy chủ, API/model AI hoặc dịch vụ bên thứ ba do đơn vị tự cân đối**

### 2.4 Ba khóa mới bổ sung — nội dung chi tiết

**K26 — Ngoại ngữ (`AI-Powered Foreign Language Teaching, Assessment & Personalized Learning`)**

- *Ngày 1 — Giảng dạy & cá nhân hóa*: AI Course Brain/Knowledge Base từ giáo trình · AI Language Tutor (grammar, vocabulary, reading, writing, speaking, ngoại ngữ chuyên ngành) · Lesson Planning · Exercise Generator thích ứng · Conversation Partner & Pronunciation Coach (lưu ý thanh điệu, liaison, pitch/accent) · Personalized Learning Path · tích hợp LMS và guardrails.
- *Ngày 2 — Đánh giá*: Writing Assessment theo rubric · Speaking Assessment (Speech-to-Text, fluency, coherence) · Pronunciation Assessment · **Multi-Agent Grading: AI Examiner 1 → AI Examiner 2 → AI Judge → Confidence Score → Human Review** · Learning Analytics · fairness và privacy.
- *08 module chuyển giao*: Writing Grader · Speaking Grader · Pronunciation Coach · Language Tutor · Course Brain · Exercise Generator · Multi-Agent AI Grading · Learning Analytics Dashboard.
- *KPI tham chiếu*: ≥ 70% bài Writing và Speaking được AI hỗ trợ đánh giá vòng đầu · giảm 40–60% thời gian chấm sơ bộ · pilot 02–03 học phần · ≥ 03 quy trình đưa vào lớp.
- *Mục tiêu dài hạn*: **University AI Foreign Language Lab** dùng chung cho nhiều ngôn ngữ, mỗi Khoa cấu hình riêng học liệu và rubric.

**K27 — Tổ chức nhân sự & Hành chính tổng hợp (`AI-Powered HR & Administration Transformation`)**

- *Ngày 1 — Tổ chức & nhân sự*: HR Copilot & HR Knowledge Base · vị trí việc làm và khung năng lực · hồ sơ và quy trình cán bộ · tuyển dụng & onboarding · đào tạo và phát triển · HR Analytics & Workforce Planning.
- *Ngày 2 — Hành chính & văn phòng*: Document & Records Assistant · Meeting Copilot (agenda, biên bản, trích xuất quyết định – nhiệm vụ – deadline) · Office Knowledge Base · Report & Drafting Assistant · Task & Workflow Automation · Executive Administration Dashboard.
- *10 module chuyển giao*: HR Policy & Organization Copilot · Job Position & Competency Assistant · HR Profile & Process Assistant · Recruitment & Onboarding Assistant · HR Analytics Dashboard · AI Document & Records Assistant · AI Meeting & Task Copilot · AI Office Knowledge Base · AI Report & Drafting Assistant · Workflow Automation & Dashboard.
- *KPI tham chiếu*: giảm 30–50% thời gian tác vụ lặp lại · tối thiểu 02 workflow pilot trong 3–6 tháng.
- **Ràng buộc bắt buộc trong thư mời** — sẽ được mã hóa thành guardrail cứng của chatbot: *"Không sử dụng AI như công cụ tự động quyết định tuyển dụng, bổ nhiệm, đánh giá hoặc kỷ luật"*; dữ liệu nhân sự phải phân quyền, ẩn danh khi cần và có audit log.

**K28 — Tạp chí khoa học & Quản lý khoa học (`AI-Powered Scientific Journal & Research Management`)**

- *Ngày 1 — Tạp chí khoa học*: bản đồ quy trình `Submission → Screening → Review → Revision → Editing → Publication → Analytics` · AI Journal Copilot · manuscript screening · checklist biên tập · Reviewer Discovery & Matching (kiểm tra xung đột lợi ích do người thực hiện) · tóm tắt phản biện và theo dõi vòng sửa · tích hợp OJS/DOI/metadata · AI Governance cho tạp chí (bảo mật bản thảo chưa công bố, bản quyền, đạo đức xuất bản).
- *Ngày 2 — Quản lý khoa học*: Research Management Copilot · tiếp nhận và phân loại hồ sơ đề tài · theo dõi tiến độ và cảnh báo trễ hạn · Publication Assistant · **Researcher Profile 360** · Research Intelligence · Grant/Call Matching · dashboard lãnh đạo · Responsible AI & Research Integrity.
- *10 module chuyển giao*: Journal Copilot · Manuscript Screening Assistant · Reviewer Matching Assistant · Editorial & Revision Tracker · Metadata & Publication Assistant · Research Management Copilot · Researcher 360 · Research Intelligence Dashboard · Grant & Collaboration Matcher · AI Knowledge Base & RAG.
- *KPI tham chiếu*: giảm 30–50% thời gian tác vụ biên tập/tra cứu lặp lại · tối thiểu 2–4 workflow pilot/đơn vị · ít nhất 01 dashboard Research Intelligence.

### 2.5 Điểm chồng lấn cần xử lý riêng

Hai cặp khóa có nội dung giao nhau — nếu không xử lý, chatbot sẽ trả lời mập mờ:

| Cặp | Phần chồng lấn | Cách phân biệt trong câu trả lời |
|---|---|---|
| **K24 ↔ K28** | Research Copilot, Research Intelligence Dashboard, Grant matching, Researcher profiling | K24 hướng tới **nhà nghiên cứu và phòng QLKH** (literature review, methodology, publication workflow của tác giả). K28 hướng tới **tòa soạn tạp chí + quản trị nghiên cứu cấp trường** (biên tập, phản biện, xuất bản, Researcher 360, OJS). Đơn vị có tạp chí riêng → K28; chỉ quản lý đề tài và công bố → K24 |
| **K21 ↔ K22/K23/K24** | K21 ngày 1–3 trùng chủ đề với K23, K22, K24 | K21 là bản **tổng quan 05 lĩnh vực trong 05 ngày**, phù hợp khi cử đoàn liên phòng ban. K22/K23/K24 đi **sâu hơn trong 02 ngày** cho đúng một nghiệp vụ |

Chatbot bắt buộc nêu rõ điểm phân biệt này khi người dùng hỏi câu chạm vào vùng chồng lấn.

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
| Vector / RAG | **Firestore Vector Search + `text-embedding-004`** | Corpus 08 khóa ≈ 650–750 chunk → vẫn dưới ngưỡng cần Vertex AI Search (đắt hơn ~10×) |
| LLM | **Vertex AI — Gemini 2.5 Flash** (mặc định), Gemini 2.5 Pro cho câu hỏi so sánh/định tuyến khóa | Cùng project GCP, cùng IAM, không cần key ngoài, độ trễ thấp, tiếng Việt tốt |
| LLM Gateway | Lớp trừu tượng `providers/` cho phép cắm thêm **Claude API / OpenAI / local LLM** | Đúng tinh thần "University AI Platform" của K21; tránh khoá cứng vào 1 nhà cung cấp |
| Auth admin | **Firebase Auth** (email/password + Google SSO), custom claims phân quyền | Miễn phí ở quy mô này, tích hợp sẵn với Firestore Security Rules |
| Bí mật | **Secret Manager** | Không hardcode key trong repo |
| CI/CD | **GitHub Actions → Cloud Build → Cloud Run** (Workload Identity Federation, không dùng service-account key) | Deploy tự động khi merge vào `main` |
| Giám sát | Cloud Logging, Cloud Monitoring, uptime check; log hội thoại đẩy sang **BigQuery** để phân tích | Phục vụ báo cáo cho BTC |

### 3.2 Ước tính chi phí GCP (tham chiếu, ~1.000 phiên chat/tháng)

| Hạng mục | Ước tính/tháng |
|---|---|
| Cloud Run (2 service, scale-to-zero) | 5 – 15 USD |
| Firestore (đọc/ghi + vector index) | 1 – 5 USD |
| Vertex AI Gemini 2.5 Flash (~1.5M token in / 300K token out) | 4 – 12 USD |
| Embeddings (index 1 lần + query) | < 1 USD |
| Cloud Storage + CDN + Load Balancer | 18 – 25 USD (LB là khoản cố định lớn nhất) |
| **Tổng** | **~30 – 58 USD/tháng** |

> Có thể **bỏ Load Balancer** ở giai đoạn đầu (dùng thẳng domain mapping của Cloud Run) để giảm còn **~10–28 USD/tháng**. Đây là mức tham chiếu; chi phí thực tế phụ thuộc lưu lượng. Việc tăng từ 05 lên 08 khóa gần như không đổi chi phí — corpus lớn hơn nhưng vẫn nhỏ, chỉ tốn thêm ít token ngữ cảnh mỗi câu trả lời.

---

## 4. LANDING PAGE — CẤU TRÚC & NỘI DUNG

### 4.1 Sitemap

```
/                         Trang chủ (landing chính, one-page + scroll)
/khoa-hoc                 Danh sách 08 khóa — lọc theo 05 nhóm (§2.2), thời lượng, đối tượng
/khoa-hoc/[slug]          Trang chi tiết từng khóa (nội dung đầy đủ từ thư mời) — 08 trang
/chon-khoa-hoc            Công cụ "Chọn khóa phù hợp" — 3 câu hỏi, gợi ý 1–2 khóa
/phan-mem-chuyen-giao     Bộ phần mềm AI được chuyển giao miễn phí (61 module, lọc theo khóa)
/dang-ky                  Form đăng ký tham dự (theo đơn vị, chọn nhiều khóa)
/hoi-dap                  FAQ tĩnh + widget chat
/lien-he                  Thông tin ban tổ chức
/admin/*                  Khu vực quản trị (bảo vệ bằng auth)
```

### 4.2 Bố cục trang chủ (thứ tự section)

| # | Section | Nội dung |
|---|---|---|
| 1 | **Hero** | Tiêu đề *"Chương trình tập huấn AI chuyên sâu cho Chuyển đổi số Đại học"* · 08 khóa · Chuyển giao miễn phí phần mềm · 3 CTA: **Chọn khóa phù hợp** / **Đăng ký ngay** / **Hỏi trợ lý AI** |
| 2 | **Dải số liệu** | 08 khóa · 19 ngày tập huấn · 60+ module phần mềm · 70% thực hành · 100% chuyển giao miễn phí (đếm số động khi cuộn) |
| 3 | **Vì sao khóa này khác biệt** | 4 thẻ: *Không phải ChatGPT cơ bản* · *70% workshop trên dữ liệu thật* · *Mang về phần mềm, không chỉ kiến thức* · *Có KPI và kế hoạch pilot 3–6 tháng* |
| 4 | **Chọn khóa phù hợp** | Công cụ 3 câu hỏi (đơn vị của anh/chị làm gì? · ưu tiên nào? · cử được bao nhiêu người?) → gợi ý 1–2 khóa kèm lý do. **Section mới, cần thiết khi đã có 08 khóa** |
| 5 | **08 khóa tập huấn** | Nhóm theo 05 nhóm ở §2.2, K21 nổi bật full-width. Mỗi thẻ: nhóm, thời lượng, sản phẩm đầu ra, đối tượng, số người khuyến nghị, nút *Xem chi tiết* + *Hỏi về khóa này* |
| 6 | **Lộ trình Learn → Transfer** | Timeline ngang: Training → Software Transfer → Data/KB → Config → Pilot → KPI Evaluation → Integration → Scale-up |
| 7 | **Phần mềm chuyển giao miễn phí** | Tab theo từng khóa, liệt kê đầy đủ 61 module + 05 suite nền tảng, có ô tìm kiếm module |
| 8 | **Nên cử ai đi học** | Bảng theo từng khóa: thành phần, vai trò, số người khuyến nghị (03–05 hoặc 05–10 tùy khóa) |
| 9 | **Kết quả đầu ra cam kết** | Checklist trực quan: pain point · quy trình ưu tiên · prototype · Knowledge Base · KPI · kế hoạch pilot |
| 10 | **Hiệu quả kỳ vọng khi pilot** | Chỉ số tham chiếu theo từng khóa **kèm ghi chú rõ đây là mức tham chiếu, không phải cam kết** |
| 11 | **Nguyên tắc sử dụng AI có trách nhiệm** | Human-in-the-loop · không thay thế phán đoán chuyên môn · ràng buộc riêng của K27 (nhân sự) và K28 (liêm chính nghiên cứu). **Section mới — bắt buộc vì K26/K27/K28 đều nêu rõ trong thư mời** |
| 12 | **Chuẩn bị gì trước khi đến** | Danh mục dữ liệu khuyến khích mang theo, theo từng khóa |
| 13 | **Hỏi đáp (FAQ)** | 15–20 câu accordion + ô "Không thấy câu trả lời? Hỏi trợ lý AI" |
| 14 | **Đăng ký** | Form nhúng (chọn nhiều khóa) + thông tin đầu mối |
| 15 | **Footer** | Đơn vị tổ chức, liên hệ, chính sách dữ liệu |
| — | **Chat widget** | Bong bóng cố định góc phải, mở rộng thành panel; luôn hiện trên mọi trang |

### 4.3 Định hướng thiết kế

- **Bảng màu**: xanh mực học thuật `#0B3B75` → xanh cyan công nghệ `#00A6ED`, điểm nhấn vàng đồng `#F5A524` cho CTA; nền sáng `#F8FAFC`, hỗ trợ **dark mode**. Mỗi nhóm khóa (§2.2) có một sắc độ riêng để phân biệt nhanh trong lưới 08 thẻ.
- **Typography**: `Be Vietnam Pro` (heading) + `Inter` (body) — cả hai hỗ trợ dấu tiếng Việt đầy đủ.
- **Chuyển động**: fade-up khi cuộn, đếm số, hover nâng thẻ; tôn trọng `prefers-reduced-motion`.
- **Responsive**: mobile-first, breakpoint 640 / 768 / 1024 / 1280.
- **Khả năng tiếp cận**: tương phản ≥ 4.5:1, điều hướng bàn phím đầy đủ, ARIA cho chat widget.
- **SEO**: metadata tiếng Việt, Open Graph, JSON-LD `Course` schema cho từng khóa (08 trang), sitemap.xml.
- **Hiệu năng**: mục tiêu Lighthouse ≥ 90 cả 4 nhóm; ảnh WebP/AVIF; font self-host.

---

## 5. CHATBOT — THIẾT KẾ CHI TIẾT

### 5.1 Luồng xử lý (RAG có kiểm soát)

```
Câu hỏi
   │
   ├─▶ Kiểm duyệt đầu vào (độ dài, spam, rate limit theo IP+session)
   │
   ├─▶ Phân loại ý định: TRA CỨU · SO SÁNH · ĐỊNH TUYẾN KHÓA · ĐĂNG KÝ · NGOÀI PHẠM VI
   │
   ├─▶ Viết lại truy vấn (dùng 3 lượt hội thoại gần nhất để giải nghĩa "khóa đó", "cái này")
   │
   ├─▶ Truy hồi lai ghép:
   │        • Vector search trên Firestore (top-k = 8; top-k = 16 nếu ý định là SO SÁNH)
   │        • Lọc metadata theo course_code khi đã biết ngữ cảnh khóa
   │        • Khớp từ khoá trên course_code / module_name
   │        • Hợp nhất + xếp hạng lại, bảo đảm mỗi khóa liên quan có ít nhất 1 chunk
   │
   ├─▶ Kiểm tra ngưỡng: nếu điểm tương đồng cao nhất < 0.55
   │        → trả lời "chưa có thông tin" + đề xuất liên hệ BTC (KHÔNG để LLM tự bịa)
   │
   ├─▶ Gọi Gemini với system prompt + ngữ cảnh đã trích + lịch sử hội thoại
   │
   ├─▶ Stream câu trả lời (SSE) + kèm chip nguồn ("Thư mời Khóa 27 — mục 4")
   │
   └─▶ Ghi log: câu hỏi, ý định, đoạn ngữ cảnh, câu trả lời, độ trễ, token, phản hồi 👍/👎
```

**Vì sao cần phân loại ý định:** với 08 khóa, câu hỏi "khóa nào phù hợp với chúng tôi?" cần luồng khác hẳn câu "khóa 7 học mấy ngày?". Ý định SO SÁNH và ĐỊNH TUYẾN cần truy hồi rộng hơn (nhiều khóa cùng lúc) và trả về bảng có cấu trúc thay vì đoạn văn.

### 5.2 Knowledge Base

**Nguồn dữ liệu (3 lớp):**

1. **Nội dung thư mời** — 08 tài liệu gốc, tách chunk theo cấu trúc mục (không cắt theo số ký tự thô), mỗi chunk gắn metadata: `course_code`, `course_group`, `section`, `title`, `source_doc`.
2. **FAQ do BTC soạn** — cặp hỏi/đáp có độ ưu tiên cao hơn, phục vụ các câu về học phí, địa điểm, thời gian, chứng nhận.
3. **Thông tin tổ chức** — thời gian, địa điểm, đầu mối đăng ký, hạn đăng ký (các mục còn để trống trong thư mời — BTC nhập qua admin).

**Ước tính**: ~650–750 chunk (tăng từ ~400 khi còn 05 khóa). Re-index chạy bằng job trên Cloud Run khi admin bấm "Cập nhật Knowledge Base".

### 5.3 Nguyên tắc trả lời (system prompt)

- Chỉ trả lời dựa trên ngữ cảnh được cung cấp; **không suy diễn, không bịa số liệu**.
- Luôn phân biệt rõ đâu là **chỉ số tham chiếu** (30–50%, 50–70%, ≥ 70%…) và nói rõ đây là mục tiêu pilot, không phải cam kết kết quả.
- Không tự đặt ra học phí, thời gian, địa điểm nếu admin chưa cấu hình → trả lời "thông tin này sẽ do ban tổ chức cung cấp" + hiển thị nút liên hệ.
- **Khi câu hỏi chạm vùng chồng lấn K24↔K28 hoặc K21↔K22/K23/K24, bắt buộc nêu điểm phân biệt theo §2.5** thay vì chỉ nêu một khóa.
- **Không mô tả K27 như công cụ tự động ra quyết định nhân sự.** Nếu người dùng hỏi "AI có tự chấm điểm đánh giá cán bộ / tự sàng lọc ứng viên để loại không?", trả lời rõ là **không** — thư mời quy định AI chỉ hỗ trợ, người có thẩm quyền quyết định cuối cùng.
- **Không mô tả K26 như công cụ chấm điểm thay giảng viên** — luôn kèm Multi-Agent Grading có Confidence Score và Human Review.
- **Không mô tả K28 như công cụ tự quyết định chấp nhận/từ chối bản thảo** — AI hỗ trợ screening và gợi ý reviewer; quyết định biên tập và kiểm tra xung đột lợi ích do người thực hiện.
- Trả lời bằng **tiếng Việt** mặc định; tự chuyển sang tiếng Anh nếu người dùng hỏi tiếng Anh.
- Giọng điệu: trang trọng, súc tích, có gạch đầu dòng; luôn kết bằng một gợi ý hành động.
- Khi người dùng mô tả nhu cầu ("trường tôi đang chuẩn bị kiểm định AUN-QA", "khoa tôi dạy tiếng Nhật"), **chủ động tư vấn khóa phù hợp** kèm lý do và số người nên cử.

### 5.4 Tính năng chatbot

| Tính năng | Mô tả |
|---|---|
| Câu hỏi gợi ý | 6 chip khi mở chat: *"So sánh các khóa"*, *"Khóa nào phù hợp với phòng ĐBCL?"*, *"Khóa 24 và khóa 28 khác nhau thế nào?"*, *"Phần mềm được chuyển giao gồm những gì?"*, *"Nên cử bao nhiêu người?"*, *"Có mất phí không?"* |
| **Định tuyến khóa học** | Người dùng mô tả đơn vị và nhu cầu → bot gợi ý 1–2 khóa kèm lý do, số người nên cử và dữ liệu cần mang theo. Đây là tính năng giá trị nhất khi đã có 08 khóa |
| Streaming | Trả lời hiện dần theo token (SSE) |
| Trích dẫn nguồn | Chip dưới câu trả lời, bấm vào mở đúng section trên trang |
| Ngữ cảnh theo trang | Mở chat từ thẻ Khóa 27 → bot biết đang nói về Khóa 27 |
| Thu thập lead | Sau 3–4 lượt hoặc khi phát hiện ý định đăng ký → hiện form nhẹ (tên, đơn vị, email, SĐT, khóa quan tâm — cho chọn nhiều khóa) |
| So sánh khóa | Câu hỏi so sánh → render **bảng so sánh** có cấu trúc, tối đa 3 khóa một lần |
| Phản hồi | 👍/👎 mỗi câu trả lời → dữ liệu cải thiện cho admin |
| Chuyển người thật | Nút "Gặp ban tổ chức" → gửi email/Zalo/điện thoại của đầu mối |
| Lịch sử phiên | Lưu theo `session_id` trong localStorage, khôi phục khi quay lại |
| Đa ngôn ngữ | VI (mặc định) / EN |

### 5.5 Bảng quy đổi mã khóa — bắt buộc cho chatbot

Mã chính thức của chương trình là **K21–K28** (theo tên hồ sơ thư mời), nhưng **phần thân của chính các thư mời lại ghi "Khóa tập huấn chuyên sâu số 1" đến "số 8"**. Người hỏi sẽ dùng lẫn cả hai cách. Nếu không xử lý, chatbot sẽ trả lời sai khóa — lỗi nghiêm trọng nhất có thể xảy ra.

| Mã chính thức | Số hiệu trong thân thư mời | Tên rút gọn để nhận diện |
|---|---|---|
| **K21** | Khóa chuyên sâu số 1 | Chuyển đổi số đại học · AI dùng chung |
| **K22** | Khóa chuyên sâu số 2 | Đảm bảo chất lượng · Kiểm định |
| **K23** | Khóa chuyên sâu số 3 | Quản lý đào tạo |
| **K24** | Khóa chuyên sâu số 4 | Quản lý khoa học · Nghiên cứu |
| **K25** | Khóa chuyên sâu số 5 | Thương mại điện tử · Kinh doanh số · Marketing số |
| **K26** | Khóa chuyên sâu số 6 | Ngoại ngữ |
| **K27** | Khóa chuyên sâu số 7 | Tổ chức nhân sự · Hành chính tổng hợp |
| **K28** | Khóa chuyên sâu số 8 | Tạp chí khoa học · Quản lý khoa học |

**Cách xử lý trong hệ thống:**

- Mỗi bản ghi `courses` lưu cả `code` (K21…K28), `legacyNumber` (1…8) và `aliases[]` (tên rút gọn, từ khóa lĩnh vực).
- Bước viết lại truy vấn chuẩn hóa mọi cách gọi về `code` **trước khi** truy hồi: "khóa 3", "khóa số 3", "khóa quản lý đào tạo", "khóa academic copilot" → `K23`.
- Câu trả lời **luôn dùng mã chính thức**, kèm số hiệu trong ngoặc ở lần nhắc đầu tiên: *"Khóa 23 (khóa chuyên sâu số 3 trong thư mời) — Quản lý đào tạo…"*.
- Nếu câu hỏi mơ hồ giữa hai cách đánh số (ví dụ chỉ nói "khóa 8" mà ngữ cảnh không rõ là K28 hay khóa số 8), bot **hỏi lại một câu ngắn** thay vì đoán.
- Landing page hiển thị nhất quán "Khóa 21 … Khóa 28"; trang chi tiết ghi thêm dòng "Khóa tập huấn chuyên sâu số N" để khớp với thư mời giấy mà các đơn vị đang cầm trên tay.

### 5.6 Rào chắn an toàn (guardrails)

- Rate limit: 20 tin nhắn/phiên/giờ, 100 request/IP/giờ.
- Lọc prompt injection: bỏ qua chỉ dẫn trong nội dung người dùng nhằm thay đổi vai trò của bot.
- Từ chối chủ đề ngoài phạm vi (chính trị, y tế, pháp lý cá nhân…) → chuyển hướng lịch sự về nội dung khóa học.
- **Kiểm tra mã khóa trong câu trả lời**: nếu câu trả lời nhắc tới một khóa, mã nêu ra phải khớp với `course_code` của các chunk đã truy hồi — lệch thì chặn và truy hồi lại.
- **Danh sách khẳng định bị cấm** (kiểm tra hậu kỳ trên câu trả lời trước khi gửi): AI tự quyết định tuyển dụng/bổ nhiệm/kỷ luật · AI thay thế giảng viên chấm điểm chính thức · AI tự quyết định chấp nhận bản thảo · bất kỳ con số nào không có trong ngữ cảnh.
- Không lưu trữ thông tin cá nhân trong log hội thoại nếu người dùng không chủ động cung cấp; có banner đồng ý dữ liệu.
- Ngân sách token/ngày, có cảnh báo khi vượt 80%.

---

## 6. TRANG QUẢN TRỊ (ADMIN)

Đường dẫn `/admin`, bảo vệ bằng Firebase Auth + custom claims. Giao diện sidebar + bảng dữ liệu, tiếng Việt.

| Module | Chức năng |
|---|---|
| **1. Bảng điều khiển** | Biểu đồ: lượt truy cập, số phiên chat, số tin nhắn, số lead theo ngày/tuần/tháng; **phân bố quan tâm theo 08 khóa**; top 10 câu hỏi; tỷ lệ 👍/👎; tỷ lệ câu "không trả lời được"; chi phí token ước tính |
| **2. Quản lý khóa học** | CRUD đầy đủ 08 khóa: tên, slug, nhóm, mô tả, thời lượng, đối tượng, số người khuyến nghị, nội dung từng ngày, kết quả đầu ra, module phần mềm, dữ liệu cần mang theo, ảnh, trạng thái hiển thị, thứ tự. Trình soạn thảo rich-text + xem trước trực tiếp |
| **3. Lịch khai giảng** | Thời gian, địa điểm, hình thức, hạn đăng ký, số chỗ, đầu mối — theo từng khóa, cho phép nhiều đợt/khóa |
| **4. Knowledge Base** | Danh sách chunk (lọc theo khóa); tải lên tài liệu mới (.docx/.pdf/.md); sửa/xoá chunk; bấm **Re-index**; xem trạng thái đồng bộ; test truy hồi ("thử một câu hỏi, xem bot lấy chunk nào") |
| **5. Quản lý FAQ** | CRUD cặp hỏi/đáp, phân nhóm, gắn khóa liên quan, độ ưu tiên, bật/tắt; các FAQ này đồng thời hiển thị ở section 13 landing page |
| **6. Hội thoại** | Xem lại toàn bộ phiên chat; lọc theo ngày/đánh giá/khóa/ý định; gắn nhãn; **đánh dấu câu trả lời sai → chuyển thẳng thành FAQ mới** (vòng lặp cải tiến) |
| **7. Lead & Đăng ký** | Bảng danh sách đăng ký: đơn vị, người liên hệ, **các khóa quan tâm (nhiều khóa)**, số lượng, nguồn (form/chat), trạng thái (mới → đã liên hệ → xác nhận → huỷ); ghi chú; **xuất Excel/CSV**; gửi email xác nhận tự động |
| **8. Cấu hình AI** | Chọn model, temperature, top-k, ngưỡng tương đồng, độ dài trả lời tối đa; **soạn/version system prompt** (có lịch sử và rollback); quản lý danh sách khẳng định bị cấm; chip câu hỏi gợi ý; lời chào |
| **9. Nội dung trang** | Sửa nội dung hero, số liệu, các section landing page mà không cần deploy lại |
| **10. Người dùng & phân quyền** | 3 vai trò: **Super Admin** (toàn quyền) · **Editor** (nội dung, KB, FAQ) · **Viewer** (chỉ xem dashboard & lead). Mời qua email |
| **11. Nhật ký kiểm toán** | Ai sửa gì, lúc nào, giá trị trước/sau — bắt buộc cho môi trường giáo dục |

---

## 7. MÔ HÌNH DỮ LIỆU (Firestore)

```
courses/{courseId}
  code (K21..K28), legacyNumber (1..8), aliases[], group, slug, title, subtitle,
  duration, method, outputs[],
  audience[], recommendedHeadcount, days[{ title, subtitle, topics[], output }],
  deliverables[], softwareModules[{ no, name, description }], expectedKpis[],
  dataToBring[], responsibleAiNotes[], relatedCourses[], roadmap[],
  order, published, updatedAt, updatedBy

sessions_schedule/{scheduleId}
  courseId, startDate, endDate, location, format, registrationDeadline,
  capacity, contactName, contactEmail, contactPhone, status

kb_chunks/{chunkId}
  courseId, courseCode, courseGroup, sourceDoc, section, title, content,
  tokens, embedding: Vector(768), updatedAt, active

faqs/{faqId}
  question, answer, category, courseIds[], priority, published, order

chat_sessions/{sessionId}
  createdAt, lastActiveAt, userAgent, referrerPage, locale,
  courseContext?, detectedIntent?, messageCount, leadCaptured, ipHash

chat_sessions/{sessionId}/messages/{messageId}
  role, content, intent, citations[{chunkId, courseCode, section}],
  latencyMs, tokensIn, tokensOut, model, feedback (up|down|null), createdAt

leads/{leadId}
  fullName, organization, position, email, phone, courseIds[],
  attendeeCount, message, source (form|chat|wizard), sessionId?,
  status, assignedTo, notes[], createdAt

site_content/{key}          // nội dung động của landing page
admin_users/{uid}           // role, displayName, email, active
audit_logs/{logId}          // actor, action, target, before, after, at
app_config/{key}            // model, prompt version, thresholds, budgets, banned claims
```

---

## 8. API (FastAPI)

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/chat` | Gửi tin nhắn, nhận stream SSE | Public + rate limit |
| POST | `/api/chat/feedback` | 👍/👎 cho một tin nhắn | Public |
| POST | `/api/recommend` | Công cụ "Chọn khóa phù hợp" — nhận 3 câu trả lời, gợi ý khóa | Public |
| GET | `/api/courses` · `/api/courses/{slug}` | Dữ liệu khóa học cho frontend | Public |
| GET | `/api/courses/compare?codes=K24,K28` | Dữ liệu so sánh khóa | Public |
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
| **GĐ 1 — Dữ liệu** | Chuyển 08 thư mời thành JSON có cấu trúc, script seed Firestore, pipeline chunk + embedding + index, gắn metadata nhóm khóa | Knowledge Base sẵn sàng, ~700 chunk có vector | 1,5 ngày |
| **GĐ 2 — Landing page** | 15 section trang chủ, 08 trang chi tiết khóa, trang phần mềm (61 module), công cụ chọn khóa, form đăng ký, responsive + dark mode + SEO | Landing page hoàn chỉnh, Lighthouse ≥ 90 | 3–4 ngày |
| **GĐ 3 — Chatbot** | API `/api/chat` với phân loại ý định + RAG + streaming, widget UI, trích dẫn, so sánh khóa, định tuyến khóa, lead capture, guardrails + kiểm tra khẳng định bị cấm | Chatbot đạt trên bộ 80 câu hỏi kiểm thử (gồm 20 câu định tuyến/so sánh) | 3 ngày |
| **GĐ 4 — Admin** | Auth + phân quyền, 11 module quản trị, biểu đồ thống kê, xuất Excel, audit log | Admin panel đầy đủ, BTC tự vận hành được | 3–4 ngày |
| **GĐ 5 — Kiểm thử & vận hành** | Bộ test 120 câu hỏi thực tế, tối ưu prompt, kiểm thử tải, uptime check, hướng dẫn sử dụng cho BTC | Tài liệu vận hành + hệ thống chạy production | 2 ngày |

**Tổng: khoảng 13,5–15,5 ngày công** (tăng từ 10–14 ngày do bổ sung 03 khóa, công cụ định tuyến và bộ guardrail chuyên biệt). Bàn giao theo từng giai đoạn để duyệt dần.

---

## 11. CẤU TRÚC REPO

```
aiedu365/
├── README.md
├── docs/
│   ├── KE-HOACH-XAY-DUNG.md          ← tài liệu này
│   ├── KIEN-TRUC.md
│   ├── HUONG-DAN-VAN-HANH.md         ← tài liệu cho ban tổ chức
│   └── source/                        ← 08 thư mời gốc (.docx) + bản trích xuất
├── web/                               ← Next.js (landing + admin)
│   ├── app/(site)/                    ← landing, 08 trang khóa học, chọn khóa, đăng ký, FAQ
│   ├── app/(admin)/admin/             ← 11 module quản trị
│   ├── components/{ui,sections,chat,admin}/
│   └── lib/
├── api/                               ← FastAPI
│   ├── app/routers/{chat,recommend,courses,leads,admin}.py
│   ├── app/services/{rag,intent,embeddings,llm,guardrails,analytics}.py
│   ├── app/providers/{vertex,anthropic,openai}.py   ← LLM gateway
│   ├── app/models/  · app/core/
│   └── Dockerfile
├── data/
│   ├── courses/K21..K28.json            ← dữ liệu 08 khóa
│   ├── eval/questions.yaml            ← bộ 120 câu hỏi kiểm thử chatbot
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
| 4 | **Logo, màu thương hiệu, ảnh** của đơn vị | Dùng bộ nhận diện đề xuất ở §4.3 nếu chưa có |
| 5 | **Tên miền** | Tạm dùng domain `*.run.app` của Cloud Run; gắn domain riêng sau |
| 6 | **Model LLM** | Vertex AI Gemini 2.5 Flash (khuyến nghị — cùng project, chi phí thấp) |
| 7 | **Email gửi xác nhận đăng ký** | SendGrid free tier hoặc Gmail SMTP của BTC |
| 8 | **Ngôn ngữ giao diện** | Tiếng Việt là chính, có công tắc EN |
| 9 | **Tài khoản admin đầu tiên** | Email `hoanganh.goldenlight@gmail.com` làm Super Admin |
| 10 | **Còn khóa nào nữa không?** | Kế hoạch thiết kế mở — thêm khóa mới chỉ cần tạo JSON + re-index, không phải sửa code. Nếu dự kiến có Khóa 29, 30… xin cho biết để chuẩn bị bố cục lưới |
| 11 | **Cách gọi tên khóa trên giao diện** | Hiển thị **"Khóa 21" … "Khóa 28"** (mã K21–K28). Chatbot đồng thời nhận cách gọi "khóa số 1–8" theo thân thư mời — xem §5.5 |

---

## 13. ĐỀ NGHỊ PHÊ DUYỆT

Kính đề nghị xem xét và phê duyệt kế hoạch. Sau khi được duyệt, việc triển khai sẽ bắt đầu từ **Giai đoạn 0** và bàn giao theo từng giai đoạn để tiện theo dõi, góp ý.

Nếu cần điều chỉnh phạm vi (ví dụ: bỏ bớt module admin, đổi công nghệ, rút gọn landing page), xin cho biết để cập nhật kế hoạch trước khi viết code.
