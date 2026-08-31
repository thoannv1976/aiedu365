# AIEDU365 Web

Landing page và khu quản trị, viết bằng Next.js 15 (App Router) + TypeScript + Tailwind.

## Chạy cục bộ

Cần service API chạy trước (xem `../api/README.md`):

```bash
npm install
API_INTERNAL_URL=http://127.0.0.1:8080 npm run dev
```

## Kiến trúc gọi API

Trình duyệt **không** gọi thẳng service API. Mọi lời gọi đi qua `/api/*` trên
chính domain của web, rồi Next chuyển tiếp sang service API bằng `rewrites`.
Nhờ vậy:

- không phải cấu hình CORS (một nguồn lỗi phổ biến khi lên production),
- không lộ URL nội bộ của service API,
- service API có thể để ở chế độ chỉ nhận traffic nội bộ.

Server component vẫn gọi thẳng `API_INTERNAL_URL` để dựng trang, có ISR 60 giây
nên nội dung ban tổ chức sửa trong trang quản trị lan tới trang công khai trong
vòng một phút mà không cần deploy lại.

## Trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Trang chủ, 15 phần |
| `/khoa-hoc` | Danh sách 08 khóa, lọc theo 05 nhóm |
| `/khoa-hoc/[slug]` | Chi tiết khóa (dựng tĩnh cho cả 08 khóa) |
| `/chon-khoa-hoc` | Công cụ 3 câu hỏi gợi ý khóa phù hợp |
| `/phan-mem-chuyen-giao` | 66 module phần mềm, có lọc và tìm kiếm |
| `/dang-ky` | Phiếu đăng ký, chọn nhiều khóa |
| `/hoi-dap` | FAQ, có JSON-LD FAQPage |
| `/admin/*` | Khu quản trị |

## Build production

```bash
npm run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
API_INTERNAL_URL=... PORT=8080 node .next/standalone/server.js
```

Bước copy `static` là bắt buộc với `output: 'standalone'` — thiếu nó thì trang
lên nhưng không có CSS và JavaScript.
