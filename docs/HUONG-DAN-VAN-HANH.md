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

Thư mời gốc để trống thời gian, địa điểm, hạn đăng ký và đầu mối liên hệ.
Chatbot được lập trình để **không tự bịa** những thông tin này — nó trả lời
"ban tổ chức sẽ cung cấp". Ba bước dưới đây khiến nó trả lời được cụ thể.

### Bước 1 — Điền thông tin đơn vị tổ chức

Vào **Nội dung trang**, điền:

| Mục | Hiện ở đâu |
|---|---|
| Đơn vị tổ chức | Chân trang mọi trang |
| Đơn vị đầu mối, email, điện thoại, địa chỉ | Chân trang, trang Đăng ký, và câu trả lời của chatbot |
| Hạn đăng ký | Trang Đăng ký và câu trả lời của chatbot |

Nếu chưa điền, màn hình sẽ hiện cảnh báo màu vàng nhắc anh/chị.

### Bước 2 — Thêm lịch khai giảng

Vào **Lịch khai giảng → Thêm đợt khai giảng**. Mỗi đợt gồm khóa, ngày bắt đầu
và kết thúc, địa điểm, số chỗ, hạn đăng ký và đầu mối riêng của đợt đó.

**Trạng thái** quyết định cách hiển thị:

| Trạng thái | Ý nghĩa |
|---|---|
| Dự kiến | Đã có kế hoạch, chưa mở đăng ký |
| Đang nhận đăng ký | Hiển thị nổi bật, khuyến khích đăng ký |
| Đã đóng đăng ký / Đã tổ chức | Vẫn hiện để tham khảo |
| Đã hủy | **Ẩn hoàn toàn** khỏi trang công khai và khỏi chatbot |

Lịch hiện ở trang chi tiết khóa, trang Đăng ký, và chatbot dùng để trả lời câu
"khóa này khai giảng khi nào".

### Bước 3 — Cập nhật Knowledge Base

Vào **Knowledge Base → Cập nhật Knowledge Base**. Đây là bước bắt buộc sau mỗi
lần sửa nội dung — chatbot chỉ áp dụng sau khi index lại.

> Trang công khai có bộ đệm 60 giây, nên đợi khoảng một phút rồi tải lại để
> thấy nội dung mới.

### Bước 4 — Kiểm tra chatbot trả lời đúng

Vào **Knowledge Base → Thử truy hồi**, gõ vài câu hỏi thật mà anh/chị nghĩ các
trường sẽ hỏi. Màn hình cho biết chatbot có đủ căn cứ để trả lời không, và nó
lấy đoạn tài liệu nào.

Nếu một câu hỏi quan trọng bị báo "không đủ căn cứ", nghĩa là tài liệu chưa có
nội dung đó — bổ sung bằng FAQ (mục 3).

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

## 6. Sửa nội dung khóa học và hỏi đáp

### Nội dung khóa học

Vào **Khóa học**, chọn khóa cần sửa. Nội dung chia thành năm thẻ:

| Thẻ | Nội dung |
|---|---|
| Thông tin chung | Tiêu đề, thời lượng, đoạn mở đầu, từ khóa nhận diện, hiển thị |
| Nội dung từng ngày | Các mục học và kết quả đầu ra của mỗi ngày |
| Kết quả & KPI | Kết quả mang về, chỉ số hiệu quả, dữ liệu cần mang theo |
| Phần mềm | Tên bộ phần mềm, danh sách module, phạm vi chuyển giao |
| Nguyên tắc & đối tượng | Nguyên tắc AI có trách nhiệm, thành phần nên cử, so với khóa khác |

**Không sửa được:** mã khóa, đường dẫn và số hiệu trong thư mời. Đổi chúng sẽ
phá các đường dẫn đã phát hành và bảng quy đổi mã khóa của chatbot. Hệ thống
tự bỏ qua nếu có ai cố gửi lên.

**Cần cẩn trọng:**

- **Từ khóa nhận diện** — chatbot dùng để hiểu người hỏi đang nói về khóa nào
  khi họ không nêu mã. Thêm cách gọi mà các trường hay dùng thì chatbot nhận
  diện tốt hơn.
- **Nguyên tắc AI có trách nhiệm** — lấy từ ràng buộc trong thư mời và được
  chatbot bắt buộc tuân thủ. Chỉ sửa khi thư mời thay đổi.
- **Lưu ý về chỉ số** — chatbot nhắc lại mỗi lần nêu con số hiệu quả, để không
  ai hiểu nhầm thành cam kết. Không nên xóa.

Danh sách nhập theo kiểu **mỗi dòng một mục** — dán thẳng từ Word xuống là ra
đúng danh sách.

### Hỏi đáp

Vào **Hỏi đáp** để thêm, sửa, ẩn hoặc xóa câu hỏi. FAQ hiện trên trang công
khai và được chatbot **ưu tiên hơn nội dung thư mời** — đây là cách nhanh nhất
để sửa một câu trả lời sai.

- **Độ ưu tiên** cao hơn = chatbot ưu tiên dùng hơn.
- **Thứ tự hiển thị** nhỏ hơn = hiện trước trên trang Hỏi đáp.
- **Khóa liên quan**: để trống nếu câu hỏi áp dụng cho cả chương trình.

15 câu hỏi mặc định đi kèm hệ thống chỉ **ẩn** được, không xóa vĩnh viễn.

### Người dùng quản trị

Vào **Người dùng** (cần quyền Super Admin) để cấp quyền. Quy trình hai bước là
cố ý:

1. Thêm email và vai trò ở đây — ghi nhận ai nên có quyền gì.
2. Bộ phận kỹ thuật gán custom claim `role` trong Firebase Authentication —
   bước này mới thực sự cấp quyền đăng nhập.

Anh/chị không thể tự gỡ quyền của chính mình.

---

## 7. Chọn nhà cung cấp AI và nhập khóa API

Vào **Nhà cung cấp AI** (cần quyền Super Admin).

### Bốn lựa chọn

| Nhà cung cấp | Cần khóa API | Có embedding | Ghi chú |
|---|---|---|---|
| **Google Vertex AI** | Không | Có | Gemini chạy trong chính project GCP, xác thực bằng IAM. Là lựa chọn mặc định |
| **Google Gemini (AI Studio)** | Có | Có | Dùng khi chưa bật Vertex AI. Lấy khóa tại `aistudio.google.com/apikey` |
| **Claude (Anthropic)** | Có | **Không** | Lấy khóa tại `console.anthropic.com` |
| **OpenAI** | Có | Có | Lấy khóa tại `platform.openai.com/api-keys` |

### Hai vai trò tách biệt

Hệ thống dùng AI cho hai việc khác nhau, và anh/chị chọn riêng cho từng việc:

- **Trả lời câu hỏi** — sinh câu trả lời cho người dùng.
- **Tạo vector truy hồi** — biến tài liệu thành số để tìm đoạn liên quan.

Sở dĩ tách ra vì **Claude không có dịch vụ embedding**. Muốn dùng Claude để trả
lời thì phải chọn thêm một bên khác (Vertex AI, Gemini hoặc OpenAI) cho phần
truy hồi. Hệ thống sẽ chặn nếu anh/chị chọn sai.

### Cách nhập khóa

1. Dán khóa vào ô của nhà cung cấp tương ứng, bấm **Lưu khóa**.
2. Bấm **Kiểm tra kết nối** — hệ thống gọi thử một câu ngắn và báo lại có dùng
   được không, mất bao lâu. Làm bước này *trước khi* chuyển sang dùng.
3. Chọn nhà cung cấp ở phần **Đang sử dụng**, bấm **Áp dụng**.

Khóa được lưu vào Secret Manager của GCP và **không đọc ngược ra được** — kể cả
tài khoản Super Admin cũng chỉ thấy 4 ký tự cuối. Muốn đổi thì dán khóa mới đè
lên. Nhật ký kiểm toán ghi lại việc đổi khóa nhưng không ghi giá trị khóa.

### Lưu ý quan trọng khi đổi bên tạo vector

Đổi bên tạo vector là **đổi hẳn không gian vector** — mọi vector cũ trở nên vô
nghĩa và chatbot sẽ trả về kết quả gần như ngẫu nhiên. Hệ thống tự động index
lại Knowledge Base ngay khi anh/chị bấm Áp dụng, mất khoảng vài chục giây.
Anh/chị không phải nhớ làm gì thêm.

Đổi bên **trả lời** thì không ảnh hưởng tới vector, không cần index lại.

### Gợi ý cấu hình

| Tình huống | Cấu hình |
|---|---|
| Đã bật Vertex AI trên project GCP | Vertex AI cho cả hai vai trò — không cần khóa nào |
| Chưa bật Vertex AI | Gemini (AI Studio) cho cả hai vai trò |
| Muốn chất lượng tiếng Việt cao nhất cho câu tư vấn | Claude trả lời + Vertex AI hoặc OpenAI tạo vector |
| Đã có sẵn tài khoản OpenAI | OpenAI cho cả hai vai trò |

> Nếu thấy cảnh báo "khóa đang nằm trong bộ nhớ tiến trình", nghĩa là service
> chưa có quyền ghi Secret Manager — khóa sẽ mất khi khởi động lại. Báo bộ phận
> kỹ thuật cấp quyền `roles/secretmanager.admin` cho service account.

---

## 8. Điều chỉnh cách chatbot trả lời

## 9. Thêm khóa học mới

Hệ thống thiết kế mở. Thêm Khóa 29, 30… chỉ cần:

1. Bộ phận kỹ thuật thêm một file dữ liệu khóa mới.
2. Anh/chị bấm **Cập nhật Knowledge Base**.

Các con số trên trang chủ (số khóa, số ngày, số module) tự tính lại theo dữ
liệu thật — không cần sửa tay ở đâu cả.

---

## 10. Khi có sự cố

| Hiện tượng | Cách xử lý |
|---|---|
| Chatbot không phản hồi | Vào **Nhà cung cấp AI**, bấm *Kiểm tra kết nối*. Khóa API hết hạn hoặc hết hạn mức là nguyên nhân thường gặp nhất |
| Chatbot trả lời lung tung, không liên quan | Có thể vừa đổi bên tạo vector mà chưa index lại. Vào **Knowledge Base**, bấm *Cập nhật Knowledge Base* |
| Chatbot trả lời sai nội dung | Vào Hội thoại, tìm câu đó, viết FAQ đè lên (mục 3) |
| Chatbot nói sai mã khóa | Báo ngay bộ phận kỹ thuật — đây là lỗi nghiêm trọng |
| Trang không hiện nội dung mới | Trang có bộ đệm 60 giây; đợi một phút rồi tải lại |
| Không đăng nhập được quản trị | Token hết hạn. Đăng xuất rồi đăng nhập lại |

**Nhật ký kiểm toán** ghi lại mọi thay đổi trong khu quản trị: ai làm, làm gì,
lúc nào. Bản ghi không sửa hay xóa được.
