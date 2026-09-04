# Prompt để dán vào Claude for Chrome (cấp quyền deploy tự động — làm một lần)

Mở https://shell.cloud.google.com trước, đợi Cloud Shell sẵn sàng, rồi dán
toàn bộ phần trong khung dưới đây vào Claude for Chrome.

---

Tôi cần bạn thiết lập để GitHub Actions tự deploy được lên Google Cloud, làm
một lần duy nhất. Có hai phần: chạy một script trong Cloud Shell, rồi tạo hai
mục cấu hình trên GitHub.

BỐI CẢNH
- Project GCP: aiedu365
- Kho mã GitHub: thoannv1976/aiedu365
- Nhánh: claude/chatbot-training-advisor-plan-0r9qjx

CÁCH LÀM VIỆC
Gõ từng lệnh vào Cloud Shell rồi Enter, đợi chạy xong hẳn mới sang lệnh kế
tiếp. Nếu Cloud Shell hỏi xác nhận (Authorize / Continue / y) thì đồng ý. Nếu
có lệnh nào báo lỗi, DỪNG LẠI, đọc nguyên văn thông báo lỗi và báo cho tôi,
đừng tự sửa lệnh hay bỏ qua bước đó.

PHẦN 1 — Chạy script trong Cloud Shell

    cd ~/aiedu365
    git checkout claude/chatbot-training-advisor-plan-0r9qjx
    git pull
    ./infra/setup-wif.sh aiedu365 thoannv1976/aiedu365

Script chạy khoảng 1–2 phút. Kết thúc, nó in ra một khối bắt đầu bằng
"✓ Xong phía Google Cloud." kèm HAI giá trị:

  · WIF_PROVIDER            — dạng projects/<số>/locations/global/...
  · DEPLOY_SERVICE_ACCOUNT  — dạng aiedu365-deploy@aiedu365.iam.gserviceaccount.com

Hãy chép chính xác hai giá trị này (chép nguyên văn, không thêm bớt khoảng
trắng hay xuống dòng). Đây KHÔNG phải mật khẩu hay khóa bí mật — chúng chỉ là
mã định danh, không dùng riêng chúng để truy cập được gì.

PHẦN 2 — Tạo hai mục cấu hình trên GitHub

Mở tab mới: https://github.com/thoannv1976/aiedu365/settings/secrets/actions

Nếu bị hỏi đăng nhập thì dừng lại và báo tôi đăng nhập trước.

Tạo mục thứ nhất:
  1. Bấm nút "New repository secret"
  2. Ô Name: gõ   WIF_PROVIDER
  3. Ô Secret: dán giá trị WIF_PROVIDER đã chép ở Phần 1
  4. Bấm "Add secret"

Tạo mục thứ hai:
  1. Bấm "New repository secret" lần nữa
  2. Ô Name: gõ   DEPLOY_SERVICE_ACCOUNT
  3. Ô Secret: dán giá trị DEPLOY_SERVICE_ACCOUNT đã chép ở Phần 1
  4. Bấm "Add secret"

PHẦN 3 — Kiểm tra

Trên trang vừa rồi, xác nhận danh sách "Repository secrets" có đủ hai mục
WIF_PROVIDER và DEPLOY_SERVICE_ACCOUNT.

Sau đó mở https://github.com/thoannv1976/aiedu365/actions và xác nhận có
workflow tên "Deploy lên Cloud Run".

BÁO LẠI CHO TÔI
- Script ở Phần 1 chạy thành công hay báo lỗi (nếu lỗi: nguyên văn thông báo)
- Đã tạo đủ hai mục trên GitHub chưa
- Có nhìn thấy workflow "Deploy lên Cloud Run" không

Không cần chạy deploy. Sau bước này tôi sẽ tự chạy deploy được.

LƯU Ý
- Đừng tạo file khóa service account và đừng tải bất kỳ file khóa nào về máy.
  Cách làm này cố ý không sinh ra file khóa nào.
- Nếu script báo đã tồn tại sẵn pool hoặc service account thì đó là bình
  thường, script chạy lại được nhiều lần.
