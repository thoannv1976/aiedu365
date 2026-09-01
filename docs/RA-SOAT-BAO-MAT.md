# RÀ SOÁT BẢO MẬT

Kết quả rà soát toàn bộ mã nguồn trước khi bàn giao. Bốn vấn đề được phát hiện
và đã sửa, kèm test khẳng định.

---

## Đã phát hiện và sửa

### 1. CSV injection trong file xuất đăng ký — mức nghiêm trọng

**Đường tấn công.** Bất kỳ ai cũng điền được form đăng ký công khai. Nếu đặt
họ tên là `=HYPERLINK("http://ke-tan-cong.example","Bấm vào đây")`, Excel và
LibreOffice sẽ **thực thi** ô đó khi cán bộ ban tổ chức mở file xuất ra. Đây là
kiểu tấn công đi từ một form vô hại tới máy tính của người vận hành.

**Đã sửa.** Ô bắt đầu bằng `=`, `+`, `-`, `@`, tab hoặc carriage return được
thêm dấu nháy đơn ở đầu — quy ước "đây là văn bản" của Excel. Dấu này không
hiện khi xem và giá trị gốc giữ nguyên.

`api/app/routers/admin.py` · test: `test_export_neutralises_attacker_supplied_name`

### 2. XSS qua JSON-LD trên trang khóa học và hỏi đáp — mức nghiêm trọng

**Đường tấn công.** Trang chi tiết khóa và trang hỏi đáp nhúng dữ liệu vào thẻ
`<script type="application/ld+json">` bằng `JSON.stringify`. Hàm này thoát ký
tự theo chuẩn JSON nhưng **không thoát `<`**. Người có quyền Editor đặt tiêu đề
khóa học chứa `</script><script>…` là đóng được thẻ script sớm; phần còn lại
được trình duyệt đọc như HTML và chạy trên trang công khai.

**Đã sửa.** Hàm `serializeJsonLd` thoát `<`, `>`, `&` thành escape sequence
Unicode. JSON vẫn hợp lệ, giá trị nguyên vẹn, nhưng trình phân tích HTML không
còn thấy dấu đóng thẻ nào.

`web/src/lib/jsonld.ts`

### 3. Khóa giới hạn tần suất do người gọi tự đặt — mức trung bình

**Đường tấn công.** Hệ thống lấy phần tử **đầu** của header `X-Forwarded-For`
làm khóa giới hạn. Nhưng header đó ai cũng gửi kèm được, hạ tầng chỉ nối giá
trị thật vào **sau**. Kẻ gửi spam chỉ cần đổi giá trị giả mỗi lần là mỗi request
có một khóa khác nhau — giới hạn tần suất trở thành vô nghĩa.

**Đã sửa.** Lấy phần tử **cuối**, là giá trị proxy tin cậy gần nhất ghi vào và
người gọi không giả được.

`api/app/services/client_ip.py` · test: `test_spoofed_forwarded_header_does_not_change_rate_limit_key`

### 4. Form đăng ký không có giới hạn — mức trung bình

**Đường tấn công.** `POST /api/leads` là endpoint công khai duy nhất ghi dữ
liệu và không có giới hạn nào. Một script có thể bơm hàng nghìn bản ghi rác,
khiến danh sách đăng ký của ban tổ chức không dùng được.

**Đã sửa.** Giới hạn 10 phiếu mỗi giờ cho mỗi địa chỉ. Đây là lớp phòng thủ
nền; nếu vẫn bị spam thì bật thêm captcha ở tầng frontend (xem mục *Còn lại*).

`api/app/routers/leads.py` · test: `test_registration_form_is_rate_limited`

---

## Đã kiểm tra, không có vấn đề

| Hạng mục | Kết luận |
|---|---|
| Xác thực quản trị | Ba vai trò phân cấp, có test cho từng cặp vai trò/quyền |
| Lối vào phát triển | `DEV_ADMIN_TOKEN` chỉ có tác dụng khi `ENVIRONMENT=development` **và** biến được đặt giá trị. Có test khẳng định nó bị bỏ qua ở production |
| Service API | Chạy `--no-allow-unauthenticated`, không mở ra Internet. Quản trị nằm sau hai lớp: IAM của Cloud Run rồi mới tới Firebase |
| Prompt injection | Chỉ dẫn nhúng trong câu hỏi bị đánh dấu và vô hiệu hóa trong prompt, không từ chối cả câu hỏi |
| Hiển thị câu trả lời của mô hình | Markdown dựng thành phần tử React, không chèn HTML thô — nội dung mô hình sinh ra không thể thành mã chạy được |
| Sửa nội dung khóa học | Mã khóa, slug, số hiệu bị khóa ở phía máy chủ; gửi lên bị bỏ qua và báo lại |
| Nhật ký | IP được băm trước khi ghi, không lưu IP thô |
| Firestore rules | Client chỉ đọc nội dung đã publish, chặn mọi thao tác ghi |
| Bí mật | Không có khóa nào trong repo; CI/CD dùng Workload Identity Federation nên không tạo file khóa service account |
| Quyền service account | Đặc quyền tối thiểu: service API chỉ có `aiplatform.user`, `datastore.user`, `secretmanager.secretAccessor` |
| Container | Chạy bằng user không phải root |

---

## Còn lại — cần quyết định của ban tổ chức

| Việc | Ghi chú |
|---|---|
| **Captcha cho form đăng ký** | Giới hạn tần suất đã chặn spam thô. Nếu bị tấn công có tổ chức thì bật Cloudflare Turnstile hoặc reCAPTCHA v3 — cần khóa API của dịch vụ đó |
| **Giới hạn tần suất khi chạy nhiều instance** | Hiện lưu trong bộ nhớ tiến trình, đủ cho quy mô hiện tại. Khi Cloud Run scale lên nhiều instance, mỗi instance đếm riêng nên hạn mức thực tế nhân lên. Chuyển sang Firestore hoặc Memorystore nếu cần chính xác |
| **Banner đồng ý thu thập dữ liệu** | Cần khi công bố chính thức, kèm trang chính sách dữ liệu |
| **Sao lưu Firestore** | Script khởi tạo chưa bật lịch sao lưu tự động; nên bật trước khi có dữ liệu thật |
