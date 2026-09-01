/**
 * Tuần tự hóa JSON-LD an toàn để nhúng vào thẻ `<script>`.
 *
 * `JSON.stringify` thoát ký tự theo chuẩn JSON, nhưng KHÔNG thoát `<`. Nếu nội
 * dung chứa chuỗi `</script>` — mà nội dung khóa học và câu trả lời hỏi đáp thì
 * ban tổ chức sửa được — trình duyệt sẽ đóng thẻ script sớm và phần còn lại
 * được đọc như HTML. Đó là một lỗ hổng XSS.
 *
 * Thoát `<`, `>` và `&` thành escape sequence Unicode: JSON vẫn hợp lệ và giữ
 * nguyên giá trị, nhưng trình phân tích HTML không còn thấy dấu đóng thẻ nào.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
