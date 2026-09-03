# Prompt để dán vào Claude for Chrome (triển khai AIEDU365)

Mở https://shell.cloud.google.com trước, đợi Cloud Shell sẵn sàng, rồi dán
toàn bộ phần trong khung dưới đây vào Claude for Chrome.

---

Tôi cần bạn giúp triển khai ứng dụng AIEDU365 lên Google Cloud Run, làm việc
trực tiếp trên tab Google Cloud Shell đang mở.

BỐI CẢNH
- Kho mã: https://github.com/thoannv1976/aiedu365
- Nhánh cần dùng: claude/chatbot-training-advisor-plan-0r9qjx
- Project GCP: aiedu365
- Region: asia-southeast1
- Ứng dụng gồm 2 service Cloud Run: aiedu365-api (KHÔNG mở ra Internet, đúng
  thiết kế) và aiedu365-web (công khai).

CÁCH LÀM VIỆC
Gõ từng lệnh vào ô nhập của Cloud Shell rồi nhấn Enter. Sau mỗi lệnh, đợi chạy
xong hẳn rồi mới sang lệnh kế tiếp — bước build mất khoảng 10–15 phút, hãy kiên
nhẫn chờ, đừng bỏ ngang. Nếu Cloud Shell hỏi xác nhận (Authorize / Continue /
y), hãy đồng ý. Nếu có lệnh nào báo lỗi, DỪNG LẠI, chụp/đọc nguyên văn thông
báo lỗi và báo cho tôi, đừng tự ý sửa lệnh hay bỏ qua bước đó.

BƯỚC 0 — Lấy mã nguồn
    git clone https://github.com/thoannv1976/aiedu365.git
    cd aiedu365
    git checkout claude/chatbot-training-advisor-plan-0r9qjx
    gcloud config set project aiedu365

(Nếu thư mục aiedu365 đã tồn tại từ trước thì thay bằng:
    cd aiedu365 && git fetch origin && git checkout claude/chatbot-training-advisor-plan-0r9qjx && git pull )

BƯỚC 1 — Khởi tạo hạ tầng (bật API, tạo Artifact Registry, Firestore, cấp quyền)
    ./infra/setup-gcp.sh aiedu365 asia-southeast1

BƯỚC 2 — Build và deploy cả hai service (đây là bước lâu nhất, 10–15 phút)
    gcloud builds submit --config cloudbuild.yaml --substitutions=_REGION=asia-southeast1

BƯỚC 3 — Hoàn tất: cho web gọi được API, rồi in ra đường dẫn
    ./infra/finish-deploy.sh aiedu365 asia-southeast1

Hãy chép lại cho tôi đường dẫn (URL) mà bước 3 in ra.

BƯỚC 4 — Đẩy dữ liệu 8 khóa tập huấn lên Firestore
    pip install --quiet google-cloud-firestore
    python data/seed.py --project aiedu365

BƯỚC 5 — Deploy lại một lần với đúng tên miền, để phần chia sẻ link và sitemap
trỏ chính xác. Thay <URL_WEB> bằng URL mà bước 3 đã in ra:
    gcloud builds submit --config cloudbuild.yaml --substitutions=_REGION=asia-southeast1,_SITE_URL=<URL_WEB>

BƯỚC 6 — Kiểm tra giúp tôi
- Mở <URL_WEB>: trang chủ phải hiện đầy đủ, có định dạng và màu sắc (nếu trang
  hiện ra nhưng mất hết giao diện thì báo tôi ngay).
- Mở khung chat, hỏi thử: "Khóa 22 học những gì?" — bot phải trả lời và có
  trích dẫn nguồn kèm theo.
- Hỏi thử một câu ngoài phạm vi: "Giá bitcoin hôm nay?" — bot phải từ chối,
  đây là hành vi đúng.
- Mở <URL_WEB>/admin: phải hiện màn hình đăng nhập.

Cuối cùng, báo lại cho tôi: URL trang công khai, URL trang quản trị, và kết
quả của 4 mục kiểm tra ở bước 6.

LƯU Ý
- Đừng tạo khóa (key) service account và đừng tải file khóa về máy.
- Service aiedu365-api cố ý không mở ra Internet; gọi thẳng vào nó mà bị 403
  là đúng, không phải lỗi.
