/**
 * Địa chỉ công khai của trang, dùng cho metadata, sitemap và robots.
 *
 * Không dùng `process.env.NEXT_PUBLIC_SITE_URL ?? '...'`: toán tử `??` chỉ thay
 * thế khi giá trị là null/undefined, còn ở lần build đầu tiên biến này được đặt
 * bằng CHUỖI RỖNG (chưa biết URL vì service web chưa tồn tại). Chuỗi rỗng lọt
 * qua `??` rồi làm `new URL('')` ném ERR_INVALID_URL và hỏng cả bước build.
 */
const FALLBACK = 'https://aiedu365.example'

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return FALLBACK
  try {
    return new URL(raw).toString().replace(/\/$/, '')
  } catch {
    // Giá trị sai định dạng thì dùng giá trị dự phòng thay vì làm hỏng build.
    return FALLBACK
  }
}
