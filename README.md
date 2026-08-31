# AIEDU365

Landing page + AI Chatbot tư vấn **Chương trình tập huấn AI chuyên sâu cho Chuyển đổi số Đại học** (08 khóa).

> Trạng thái hiện tại: **đang chờ phê duyệt kế hoạch**. Chưa triển khai code sản phẩm.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [`docs/KE-HOACH-XAY-DUNG.md`](docs/KE-HOACH-XAY-DUNG.md) | Kế hoạch xây dựng đầy đủ: kiến trúc GCP, landing page, chatbot RAG, admin, lộ trình |
| [`docs/source/`](docs/source/) | 08 thư mời gốc (.docx) và bản trích xuất nội dung |

## Tóm tắt hệ thống dự kiến

- **Landing page** — Next.js 15 + TypeScript + Tailwind, 15 section, 8 trang chi tiết khóa học, công cụ "Chọn khóa phù hợp", SEO + dark mode.
- **Chatbot RAG** — FastAPI + Vertex AI Gemini + Firestore Vector Search, phân loại ý định (tra cứu · so sánh · định tuyến khóa), trả lời có trích dẫn nguồn, guardrail chặn các khẳng định sai lệch, thu thập lead.
- **Admin** — 11 module: quản lý khóa học, Knowledge Base, FAQ, hội thoại, lead, cấu hình AI, phân quyền, audit log.
- **Hạ tầng** — Google Cloud Platform, project `aiedu365`, Cloud Run + Firestore + Vertex AI.

## 08 khóa tập huấn

| Mã | Khóa | Thời lượng | Nhóm |
|---|---|---|---|
| K1 | AI trong Chuyển đổi số Đại học & phát triển giải pháp AI dùng chung | 05 ngày | Nền tảng toàn trường |
| K2 | AI trong Đảm bảo chất lượng và Kiểm định GDĐH | 02 ngày | Chất lượng & kiểm định |
| K3 | AI trong Quản lý đào tạo Đại học | 02 ngày | Quản trị & vận hành |
| K4 | AI trong Quản lý khoa học và Nghiên cứu | 02 ngày | Khoa học & xuất bản |
| K5 | AI trong Thương mại điện tử, Kinh doanh số và Marketing số | 02 ngày | Đào tạo chuyên ngành |
| K6 | AI trong Giảng dạy, Đánh giá và Cá nhân hóa học tập Ngoại ngữ | 02 ngày | Đào tạo chuyên ngành |
| K7 | AI trong Tổ chức nhân sự và Hành chính tổng hợp | 02 ngày | Quản trị & vận hành |
| K8 | AI thúc đẩy chuyển đổi số Tạp chí khoa học và Quản lý khoa học | 02 ngày | Khoa học & xuất bản |

Tổng: **19 ngày tập huấn · 61 module phần mềm chi tiết + 05 suite nền tảng**.
