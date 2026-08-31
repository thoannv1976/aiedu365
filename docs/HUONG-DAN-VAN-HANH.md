# HƯỚNG DẪN VẬN HÀNH
# Dành cho ban tổ chức chương trình tập huấn

Tài liệu này viết cho người vận hành, không cần biết lập trình.

---

## 1. Đăng nhập khu quản trị

Truy cập `/admin` trên tên miền của hệ thống. Đăng nhập bằng tài khoản đã được
cấp quyền.

**Ba mức quyền:**

| Vai trò | Làm được gì |
|---|---|
| **Super Admin** | Toàn quyền, gồm cả sửa cấu hình AI và system prompt |
| **Editor** | Sửa nội dung, Knowledge Base, FAQ, cập nhật trạng thái đăng ký |
| **Viewer** | Chỉ xem bảng điều khiển và danh sách đăng ký |

---

## 2. Việc cần làm ngay sau khi nhận hệ thống

### 2.1 Điền thông tin còn trống trong thư mời

Thư mời gốc để trống thời gian, địa điểm, hạn đăng ký và đầu mối liên hệ.
Chatbot được lập trình để **không tự bịa** những thông tin này — nó sẽ trả lời
"ban tổ chức sẽ cung cấp". Sau khi anh/chị điền, chatbot trả lời được ngay.

Vào **Cấu hình → Nội dung trang**, điền:

- Tên đơn vị tổ chức
- Địa chỉ, email, số điện thoại đầu mối
- Hạn đăng ký

Rồi vào **Knowledge Base → Cập nhật Knowledge Base** để chatbot áp dụng.

### 2.2 Kiểm tra chatbot trả lời đúng

Vào **Knowledge Base → Thử truy hồi**, gõ vài câu hỏi thật mà anh/chị nghĩ các
trường sẽ hỏi. Màn hình cho biết:

- Chatbot có đủ căn cứ để trả lời không
- Nó lấy đoạn tài liệu nào, điểm bao nhiêu

Nếu một câu hỏi quan trọng bị báo "không đủ căn cứ", nghĩa là tài liệu chưa có
nội dung đó — cần bổ sung bằng FAQ (mục 3).

---

## 3. Làm chatbot trả lời tốt hơn

Đây là công việc thường xuyên và quan trọng nhất.

### Vòng lặp cải tiến

```
Người dùng hỏi  →  Bot trả lời chưa đạt  →  Anh/chị viết lại câu trả lời chuẩn
                                                        ↓
        Chatbot trả lời đúng  ←  Cập nhật Knowledge Base  ←  Lưu thành FAQ
```

**Cách làm:**

1. Vào **Hội thoại**, bật *"Chỉ câu chưa trả lời được"*.
2. Với mỗi câu đáng trả lời, bấm **"Viết câu trả lời chuẩn → tạo FAQ"**.
3. Viết câu trả lời như anh/chị vẫn trả lời qua email.
4. Bấm **Lưu thành FAQ**.
5. Sang **Knowledge Base**, bấm **Cập nhật Knowledge Base**.

Từ lúc này chatbot trả lời câu đó bằng đúng nội dung anh/chị viết, và ưu tiên
nó hơn nội dung thư mời.

> **Lưu ý:** không phải câu nào "chưa trả lời được" cũng là lỗi. Câu hỏi ngoài
> phạm vi (giá vàng, thời tiết…) bị từ chối là đúng.

---

## 4. Theo dõi hằng ngày

Vào **Bảng điều khiển**, ba con số cần để mắt:

| Chỉ số | Ý nghĩa | Khi nào cần xử lý |
|---|---|---|
| **Câu không trả lời được** | Tỷ lệ chatbot phải từ chối | Trên 25% → xem mục Hội thoại, bổ sung FAQ |
| **Mức hài lòng** | Tỷ lệ 👍 trên tổng số đánh giá | Dưới 70% → xem những câu bị 👎 |
| **Guardrail chặn** | Số câu trả lời vi phạm nguyên tắc, đã bị chặn | Lớn hơn 0 → báo cho bộ phận kỹ thuật |

Bảng **"Quan tâm theo khóa"** cho biết khóa nào đang được hỏi nhiều nhất —
hữu ích khi lên kế hoạch mở lớp.

Bảng **"Loại câu hỏi"**: nếu tỷ trọng *"định tuyến khóa"* cao, nghĩa là nhiều
người chưa tự chọn được khóa. Cân nhắc làm rõ hơn phần giới thiệu khóa học.

---

## 5. Quản lý đăng ký

Vào **Đăng ký**:

- Lọc theo trạng thái: Mới → Đã liên hệ → Đã xác nhận (hoặc Đã hủy).
- Bấm vào nhãn trạng thái để chuyển.
- **Xuất Excel/CSV** tải về file mở được bằng Excel, tiếng Việt hiển thị đúng.

Mỗi đăng ký ghi rõ **nguồn**: từ phiếu đăng ký, từ chatbot, hay từ công cụ chọn
khóa — giúp biết kênh nào hiệu quả.

---

## 6. Điều chỉnh cách chatbot trả lời

Vào **Cấu hình AI** (cần quyền Super Admin).

### Hai nút xoay quan trọng nhất

**Ngưỡng tương đồng** (mặc định 0.50)

- Chatbot **từ chối quá nhiều** câu hợp lệ → **giảm** xuống 0.45, 0.40.
- Chatbot **trả lời lan man**, không bám tài liệu → **tăng** lên 0.55, 0.60.

Sau mỗi lần đổi, dùng **Knowledge Base → Thử truy hồi** để kiểm tra.

**Temperature** (mặc định 0.2)

Càng thấp, câu trả lời càng bám sát tài liệu. Không nên đặt trên 0.5 cho hệ
thống này.

### System prompt

Đây là bộ quy tắc trả lời của chatbot. Mỗi lần lưu tạo một phiên bản mới, có
thể quay lui. **Không xóa các quy tắc về AI có trách nhiệm** — chúng lấy trực
tiếp từ ràng buộc ghi trong thư mời:

- Khóa 27: AI không tự quyết định tuyển dụng, bổ nhiệm, đánh giá, kỷ luật
- Khóa 26: AI không thay giảng viên chấm điểm chính thức
- Khóa 28: AI không tự quyết định chấp nhận hay từ chối bản thảo
- Mọi con số hiệu quả là mức tham chiếu, không phải cam kết

---

## 7. Thêm khóa học mới

Hệ thống thiết kế mở. Thêm Khóa 29, 30… chỉ cần:

1. Bộ phận kỹ thuật thêm một file dữ liệu khóa mới.
2. Anh/chị bấm **Cập nhật Knowledge Base**.

Các con số trên trang chủ (số khóa, số ngày, số module) tự tính lại theo dữ
liệu thật — không cần sửa tay ở đâu cả.

---

## 8. Khi có sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Chatbot không phản hồi | Kiểm tra `/healthz` của service API. Nếu lỗi, báo bộ phận kỹ thuật |
| Chatbot trả lời sai nội dung | Vào Hội thoại, tìm câu đó, viết FAQ đè lên (mục 3) |
| Chatbot nói sai mã khóa | Báo ngay bộ phận kỹ thuật — đây là lỗi nghiêm trọng |
| Trang không hiện nội dung mới | Trang có bộ đệm 60 giây; đợi một phút rồi tải lại |
| Không đăng nhập được quản trị | Token hết hạn. Đăng xuất rồi đăng nhập lại |

**Nhật ký kiểm toán** ghi lại mọi thay đổi trong khu quản trị: ai làm, làm gì,
lúc nào. Bản ghi không sửa hay xóa được.
