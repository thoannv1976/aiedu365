# AIEDU365

Landing page + AI Chatbot tư vấn **Chương trình tập huấn AI chuyên sâu cho Chuyển đổi số Đại học** (05 khóa).

> Trạng thái hiện tại: **đang chờ phê duyệt kế hoạch**. Chưa triển khai code sản phẩm.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [`docs/KE-HOACH-XAY-DUNG.md`](docs/KE-HOACH-XAY-DUNG.md) | Kế hoạch xây dựng đầy đủ: kiến trúc GCP, landing page, chatbot RAG, admin, lộ trình |
| [`docs/source/`](docs/source/) | 05 thư mời gốc (.docx) và bản trích xuất nội dung |

## Tóm tắt hệ thống dự kiến

- **Landing page** — Next.js 15 + TypeScript + Tailwind, 13 section, 5 trang chi tiết khóa học, SEO + dark mode.
- **Chatbot RAG** — FastAPI + Vertex AI Gemini + Firestore Vector Search, trả lời có trích dẫn nguồn từ thư mời, thu thập lead.
- **Admin** — 11 module: quản lý khóa học, Knowledge Base, FAQ, hội thoại, lead, cấu hình AI, phân quyền, audit log.
- **Hạ tầng** — Google Cloud Platform, project `aiedu365`, Cloud Run + Firestore + Vertex AI.

## 05 khóa tập huấn

| Mã | Khóa | Thời lượng |
|---|---|---|
| K1 | AI trong Chuyển đổi số Đại học & phát triển giải pháp AI dùng chung | 05 ngày |
| K2 | AI trong Đảm bảo chất lượng và Kiểm định GDĐH | 02 ngày |
| K3 | AI trong Quản lý đào tạo Đại học | 02 ngày |
| K4 | AI trong Quản lý khoa học và Nghiên cứu | 02 ngày |
| K5 | AI trong Thương mại điện tử, Kinh doanh số và Marketing số | 02 ngày |
