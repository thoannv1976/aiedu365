# Prompt deploy — dán vào Claude for Chrome

Quy trình đang dùng: Claude Code viết mã và đẩy lên GitHub → anh/chị sang
Claude for Chrome bảo nó deploy bằng Cloud Shell.

Mở https://shell.cloud.google.com trước, đợi Cloud Shell sẵn sàng, rồi dán một
trong hai prompt dưới đây.

---

## A. Deploy lại khi có mã mới (dùng thường xuyên)

```
Deploy lại app AIEDU365 lên Cloud Run bằng Cloud Shell.

Gõ từng lệnh, đợi chạy xong hẳn mới sang lệnh kế tiếp. Bước build mất 12–15
phút, hãy kiên nhẫn chờ, đừng bỏ ngang. Nếu Cloud Shell hỏi xác nhận
(Authorize/Continue/y) thì đồng ý. Nếu lệnh nào báo lỗi, DỪNG LẠI, đọc nguyên
văn thông báo lỗi và báo cho tôi, đừng tự sửa lệnh hay bỏ qua bước đó.

1. Lấy mã mới nhất
     cd ~/aiedu365
     git checkout claude/chatbot-training-advisor-plan-0r9qjx
     git pull

   Nếu git pull báo "local changes would be overwritten", chạy:
     git reset --hard origin/claude/chatbot-training-advisor-plan-0r9qjx
   rồi pull lại. (Mọi bản sửa cục bộ trong Cloud Shell đều bỏ được — mã chính
   thức nằm trên GitHub.)

2. Build và deploy
     gcloud builds submit --config cloudbuild.yaml \
       --substitutions=_REGION=asia-southeast1,_SITE_URL=https://aiedu365-web-ggqcdx3gya-as.a.run.app

3. Kiểm tra lại giúp tôi
   - Mở https://aiedu365-web-ggqcdx3gya-as.a.run.app — trang chủ phải hiện đầy
     đủ định dạng và màu sắc. Nếu trang lên nhưng mất giao diện thì báo ngay.
   - Mở khung chat, hỏi "Khóa 22 học những gì?" — phải trả lời kèm trích dẫn.
   - Hỏi "Giá bitcoin hôm nay?" — phải TỪ CHỐI, đây là hành vi đúng.

Báo lại: build thành công hay lỗi, và kết quả 3 mục kiểm tra.
```

---

## B. Các bước hoàn tất (chỉ làm một lần, sau lần deploy đầu)

```
Hoàn tất cài đặt app AIEDU365 trên Cloud Shell. Gõ từng lệnh, đợi xong mới sang
lệnh kế tiếp. Lệnh nào báo lỗi thì DỪNG LẠI và báo nguyên văn lỗi cho tôi.

1. Cho service web gọi được API (thiếu bước này thì trang lên nhưng chatbot
   trả 403 và không phản hồi)
     cd ~/aiedu365
     ./infra/finish-deploy.sh aiedu365 asia-southeast1

2. Đẩy dữ liệu 8 khóa tập huấn lên Firestore
     pip install --quiet google-cloud-firestore
     python data/seed.py --project aiedu365

3. Kiểm tra
   - Mở https://aiedu365-web-ggqcdx3gya-as.a.run.app rồi hỏi chatbot
     "Khóa 22 học những gì?" — phải trả lời kèm trích dẫn nguồn.
   - Mở https://aiedu365-web-ggqcdx3gya-as.a.run.app/admin — phải hiện màn hình
     đăng nhập.

Báo lại kết quả từng bước.

LƯU Ý: gọi thẳng vào https://aiedu365-api-ggqcdx3gya-as.a.run.app mà bị 403 là
ĐÚNG thiết kế — service API cố ý không mở ra Internet. Chỉ cần trang web gọi
được là đạt.
```

---

## Còn một việc làm trên giao diện, không qua dòng lệnh

Bật **Firebase Authentication** thì mới đăng nhập được trang `/admin`:

- Console → Firebase → Authentication → bật **Email/Password** và **Google**
- Tài khoản trong `ADMIN_EMAILS` (mặc định `hoanganh.goldenlight@gmail.com`)
  tự có quyền Super Admin ở lần đăng nhập đầu tiên.

## Cách deploy dự phòng (không cần Cloud Shell)

Đã cấu hình sẵn Workload Identity Federation, nên có thể deploy bằng cách vào
tab **Actions** trên GitHub → chọn **"Deploy lên Cloud Run"** → bấm
**Run workflow**. Cách này chạy 209 test và kiểm tra kiểu dữ liệu TRƯỚC khi
deploy — deploy tay qua Cloud Shell thì bỏ qua khâu này.
