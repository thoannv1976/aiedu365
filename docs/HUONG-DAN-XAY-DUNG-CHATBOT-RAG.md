# Hướng dẫn xây dựng chatbot RAG tiếng Việt

Đúc kết từ dự án AIEDU365 (trợ lý tư vấn chương trình tập huấn, chạy trên GCP).
Tài liệu này ghi lại **những quyết định và lỗi đã tốn thời gian gỡ thật**, không
nhắc lại lý thuyết RAG phổ thông. Đọc trước khi bắt đầu một chatbot tương tự.

---

## 1. Nguyên tắc nền

**Dữ liệu là mã nguồn, không phải nội dung trong cơ sở dữ liệu.**
Đặt dữ liệu gốc dạng JSON có cấu trúc trong repo, review qua Git, rồi nạp lên
CSDL bằng script seed. CSDL giữ bản do người vận hành sửa và đè lên bản gốc.
Lợi ích: xem được lịch sử thay đổi nội dung, dựng lại hệ thống từ số không, và
test chạy không cần CSDL.

**Script seed mặc định chỉ tạo document còn thiếu.** Ghi đè phải là `--force`.
Nếu seed mặc định ghi đè, một lần chạy lại sau khi bàn giao sẽ xóa sạch nội dung
người vận hành đã sửa.

**Không dùng framework RAG dựng sẵn cho bài toán có ràng buộc pháp lý/uy tín.**
Luồng truy hồi tự viết chỉ vài trăm dòng, đổi lại kiểm soát chính xác chỗ nào
chặn, chỗ nào từ chối, chỗ nào ghi log. Với chatbot đại diện cho một tổ chức,
khả năng kiểm soát quan trọng hơn tốc độ dựng ban đầu.

---

## 2. Xử lý tiếng Việt — đọc kỹ phần này

### 2.1. NFD không tách được chữ `đ`

Lỗi đắt nhất của dự án. `unicodedata.normalize("NFD", ...)` chỉ tách dấu thanh và
dấu mũ. Chữ `đ`/`Đ` là ký tự độc lập (U+0111/U+0110), không phải `d` + dấu, nên
bỏ dấu xong `"đào tạo"` thành `"đao tao"` — mọi so khớp từ khóa gõ không dấu đều
trượt, và guardrail lọt.

```python
_DSTROKE = str.maketrans({"đ": "d", "Đ": "D"})

def strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text.translate(_DSTROKE))
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
```

Viết test riêng cho `đ` ngay từ đầu. Lỗi này không gây exception, chỉ làm chất
lượng trả lời tệ đi một cách âm thầm.

### 2.2. Regex phải chạy trên chuỗi đã chuẩn hóa

`kho[aá]` không bao giờ khớp `"khóa"` — dấu nằm trên chữ `o`, không phải chữ `a`.
Chuẩn hóa trước, rồi viết mẫu regex hoàn toàn không dấu:

```python
_COURSE_RE = re.compile(r"\bkhoa\s*(?:so\s*)?(\d{1,2})\b")   # chạy trên text đã bỏ dấu
```

### 2.3. Chuẩn hóa cách gọi tên trước khi truy hồi

Người dùng gọi cùng một đối tượng bằng nhiều tên: mã chính thức, số thứ tự trong
văn bản gốc, tên gọi theo chuyên môn. Dựng bảng alias và giải mã **trước** bước
truy hồi, đừng phó mặc cho mô hình suy đoán.

---

## 3. Truy hồi

**Kết hợp vector và từ khóa.** Chỉ dùng vector sẽ trượt các mã, số hiệu, tên
riêng. Công thức đã dùng:

```
điểm = 0.75 × cosine(vector) + 0.25 × độ trùng từ khóa
       ± 0.15 nếu câu hỏi nhắc đúng/sai mã đối tượng
       + 0.05 nếu là mẩu FAQ
```

**Chia mẩu theo cấu trúc, không cắt theo số ký tự.** Mỗi mẩu là một đơn vị ngữ
nghĩa trọn vẹn (một ngày học, một mục sản phẩm, một FAQ) kèm tiêu đề mô tả. Cắt
cơ học theo 500 ký tự làm câu trả lời cụt ý và trích dẫn vô nghĩa.

**Mẩu quá ngắn sẽ không bao giờ lọt top-k.** Thông tin lịch (ngày, địa điểm) rất
ngắn nên luôn thua các mẩu nội dung dài. Giải pháp: khi phân loại được ý định là
"muốn đăng ký", **ghim cứng** mẩu lịch và mẩu liên hệ vào ngữ cảnh thay vì trông
chờ vào điểm số.

**Ngưỡng cứng là sai.** Câu hỏi hợp lệ đạt 0.544, câu ngoài phạm vi đạt 0.243 —
đặt ngưỡng 0.55 thì từ chối cả câu hợp lệ. Dùng nhiều tín hiệu:

```python
def has_sufficient_context(hits, threshold, course_codes=None) -> bool:
    if not hits:
        return False
    if max(h.score for h in hits) >= threshold:
        return True
    # Hỏi đúng tên đối tượng thì hạ ngưỡng — tín hiệu này đáng tin hơn điểm số.
    if course_codes:
        wanted = {c.upper() for c in course_codes}
        if any(h.chunk.code in wanted and h.score >= threshold * 0.8 for h in hits):
            return True
    return False
```

---

## 4. Phân loại ý định

Phân loại bằng luật (regex) trước khi gọi mô hình: rẻ, xác định, test được.

**Thứ tự kiểm tra quyết định kết quả.** `"nên chọn khóa nào"` chứa cả dấu hiệu
so sánh lẫn dấu hiệu xin tư vấn — đặt sai thứ tự là phân loại sai. Viết test cho
đúng những câu nằm ở ranh giới giữa hai nhóm.

Nhóm ý định đã dùng: `TRA_CỨU · SO_SÁNH · TƯ_VẤN_CHỌN · ĐĂNG_KÝ · NGOÀI_PHẠM_VI`.
Ý định quyết định top-k, mẩu nào được ghim, và câu trả lời có kèm biểu mẫu không.

---

## 5. Guardrail

### 5.1. Từ chối thì không kèm trích dẫn

Câu từ chối mà vẫn hiện nguồn sẽ khiến người đọc tưởng có căn cứ tài liệu. Bắt
buộc: `answered == False` thì `citations == []`. Viết test cho ràng buộc này.

### 5.2. Chặn tuyên bố sai bằng cụm từ có thứ tự và khoảng cách

Regex khớp nguyên câu luôn bị lách. `"AI sẽ tự động quyết định tuyển dụng"` lọt
qua mẫu `"AI quyết định nhân sự"`. Cách làm đúng: khai báo các **nhóm từ phải
xuất hiện, đúng thứ tự, trong một cửa sổ ký tự**:

```python
BannedClaim(
    label="AI tự quyết định nhân sự",
    groups=(("ai",), ("tu dong", "tu"), ("quyet dinh",), ("tuyen dung", "nhan su")),
    window=120,
)
```

### 5.3. Đối chiếu với nội dung mẩu, không phải nhãn mẩu

Guardrail kiểm tra "mô hình có bịa ra mã đối tượng không" ban đầu chỉ so với nhãn
của mẩu, nên báo sai khi mẩu `K22/phân-biệt-K21` nhắc tới K21 một cách hợp lệ.
Phải đối chiếu với **toàn văn nội dung** các mẩu đã đưa vào ngữ cảnh.

### 5.4. Lọc riêng nội dung do người dùng sinh ra

Nếu hiển thị "câu hỏi được hỏi nhiều nhất", câu hỏi đó do người lạ gõ vào. Ba
lớp lọc: (1) mẫu nhận diện thông tin cá nhân — email, số điện thoại, dãy số dài,
đường dẫn, câu tự giới thiệu danh tính; (2) chỉ hiện câu xuất hiện ở **từ 2
phiên khác nhau** trở lên; (3) loại câu đã bị đánh giá kém hoặc bị ẩn thủ công.

---

## 6. Bảo mật

| Rủi ro | Xử lý |
|---|---|
| **Chèn công thức vào file CSV** | Ô bắt đầu bằng `= + - @ tab CR` phải thêm tiền tố `'`. Biểu mẫu công khai + cán bộ mở bằng Excel = thực thi mã. Đây là lỗ hổng nặng, rất hay bị bỏ sót. |
| **XSS qua JSON-LD** | `JSON.stringify` **không** escape `<`. Một tiêu đề chứa `</script><script>` sẽ thoát ra khỏi thẻ. Phải thay `<`, `>`, `&` bằng chuỗi thoát Unicode `\u003c`, `\u003e`, `\u0026` trước khi nhúng vào `<script>`. |
| **Giả mạo IP để lách giới hạn** | Lấy phần tử **cuối** của `X-Forwarded-For`, không phải phần tử đầu. Phần đầu do người gọi tự đặt. |
| **Endpoint ghi công khai** | Mọi endpoint công khai cho phép ghi đều phải có giới hạn tần suất, kể cả biểu mẫu đăng ký. |
| **Hiển thị markdown từ mô hình** | Dựng React element, tuyệt đối không `dangerouslySetInnerHTML`. |
| **Khóa API** | Lưu ở Secret Manager, không lưu CSDL. Ghi vào được, đọc lại không được — chỉ hiện 4 ký tự cuối. Nhật ký ghi việc đổi khóa nhưng không ghi giá trị. Không cho xóa khóa của nhà cung cấp đang dùng. |
| **Cửa hậu môi trường dev** | Lối vào dev chỉ mở khi `environment == "development"` **và** biến token khác rỗng. Ở production để trống. |

Viết test quét toàn bộ phản hồi của các endpoint quản trị để chắc chắn giá trị
khóa API không lọt ra ngoài.

---

## 7. Trừu tượng hóa nhà cung cấp mô hình

Bọc mọi lời gọi mô hình sau một interface chung. Kèm một **provider `echo`**:
sinh embedding tất định bằng hàm băm, không gọi mạng. Toàn bộ test chạy trên
provider này — nhanh, không tốn tiền, kết quả ổn định.

**Đổi mô hình embedding bắt buộc phải dựng lại chỉ mục.** Vector cũ thuộc không
gian khác, truy hồi sẽ hỏng **một cách âm thầm** — không có exception, chỉ là câu
trả lời ngày càng lạc đề. Bắt hệ thống tự nạp lại chỉ mục khi phát hiện thay đổi,
đừng trông chờ người vận hành nhớ.

---

## 8. Triển khai (Google Cloud Run)

**Service xử lý dữ liệu không mở ra Internet.** Chỉ service web công khai; API
để `--no-allow-unauthenticated`. Web gọi API qua route handler lấy ID token từ
metadata server và chuyển tiếp token quản trị ở header riêng:

```typescript
const adminAuth = request.headers.get('authorization')
if (adminAuth) headers.set('x-admin-authorization', adminAuth)
headers.set('authorization', `Bearer ${await getIdentityToken()}`)
```

Cách này thay cho CORS (trình duyệt gọi thẳng bị chặn) và cho `rewrites` của
Next.js (không gắn được token IAM).

**Cấp `roles/run.invoker` cho service account của web sau khi cả hai service đã
tồn tại.** Thiếu bước này trang vẫn lên nhưng mọi lời gọi API trả 403.

### Các lỗi triển khai đã gặp

- **`$SHORT_SHA` rỗng.** Biến này chỉ có giá trị khi build kích hoạt từ kho mã đã
  kết nối. Với `gcloud builds submit` (tải mã từ máy lên) nó rỗng → nhãn ảnh kết
  thúc bằng `:` → Docker báo `invalid reference format` ngay bước đầu. Dùng biến
  tự đặt có giá trị mặc định.
- **`--set-env-vars` mặc định ngăn cách bằng dấu phẩy.** Giá trị chứa dấu phẩy
  (danh sách email) sẽ bị hiểu thành biến riêng. Dùng cú pháp đổi dấu phân cách:
  `--set-env-vars=^@^KEY1=v1@KEY2=v2`.
- **Next.js `output: standalone`** phải chép thủ công `.next/static` và `public`.
  Thiếu thì trang lên nhưng mất toàn bộ CSS/JS. Lệnh đúng là
  `cp -r .next/static .next/standalone/.next/` — có dấu `/` cuối, nếu không sẽ
  lồng thành `static/static`.
- **`next start` bỏ qua cấu hình standalone.** Chạy `node .next/standalone/server.js`.
- **Cấu hình quan trọng đừng để mặc định trong mã.** Danh sách email quản trị
  từng nằm trong file config Python — chạy được, nhưng muốn thêm người phải sửa
  mã và build lại. Đưa ra thành biến của bước triển khai.

---

## 9. Nhất quán giữa môi trường phát triển và production

Lớp lưu trữ phải đi qua **cùng một abstraction** ở cả hai môi trường. Dự án từng
có lớp overlay chỉ đọc từ CSDL, nên khi chạy cục bộ (không bật CSDL) mọi chỉnh
sửa của quản trị viên biến mất sau khi tải lại trang — mà không báo lỗi gì.

Tương tự, khi trộn dữ liệu vào phản hồi API phải kiểm tra trùng khóa:
`{**site, "stats": ...}` đã ghi đè mảng `stats` của trang chủ bằng một dict, làm
hỏng khâu dựng trang tĩnh với lỗi `e.stats.map is not a function`.

---

## 10. Kiểm thử

Duy trì một **bộ câu hỏi chuẩn** dạng JSON, trong đó ghi rõ với mỗi câu: ý định
mong đợi, mã đối tượng mong đợi, và **có được trả lời hay bắt buộc phải từ chối**.
Bộ này phải gồm cả câu ngoài phạm vi và câu cố tình đánh lừa trợ lý. Chạy toàn bộ
trong CI ở mỗi lần sửa mã.

**Khi test đỏ, xác định lỗi nằm ở mã hay ở kỳ vọng của test.** Có trường hợp mã
đúng còn test sai: mã số thuế `0101234567` khớp mẫu số điện thoại trước mẫu dãy
số dài — nhưng cả hai đều dẫn tới quyết định chặn, nên hành vi vẫn đúng. Sửa test
và ghi lại lý do, đừng sửa mã cho vừa test.

---

## 11. Thứ tự triển khai đề xuất

1. Dữ liệu có cấu trúc trong repo + script seed
2. Chuẩn hóa văn bản và bảng alias (kèm test cho chữ `đ`)
3. Chia mẩu theo cấu trúc + truy hồi lai + provider `echo`
4. Phân loại ý định + guardrail + bộ câu hỏi chuẩn
5. API công khai, rồi giao diện
6. Khu quản trị (nội dung trước, hệ thống sau)
7. Rà soát bảo mật **trước** khi triển khai lần đầu
8. Hạ tầng và triển khai

Rà soát bảo mật đặt trước bước triển khai là có chủ đích: bốn lỗ hổng của dự án
này đều được phát hiện ở bước 7, trong đó lỗi chèn công thức CSV chỉ lộ ra khi
xem xét toàn bộ đường đi của dữ liệu từ biểu mẫu công khai đến file xuất ra.
