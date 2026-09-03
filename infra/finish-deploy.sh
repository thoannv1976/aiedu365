#!/usr/bin/env bash
#
# Bước 3/3 — Hoàn tất sau khi deploy lần đầu.
#
#   ./infra/finish-deploy.sh aiedu365 asia-southeast1
#
# Chạy lại được nhiều lần.
#
set -euo pipefail

PROJECT="${1:-aiedu365}"
REGION="${2:-asia-southeast1}"

gcloud config set project "$PROJECT" >/dev/null
WEB_SA="aiedu365-web@$PROJECT.iam.gserviceaccount.com"

for service in aiedu365-api aiedu365-web; do
  if ! gcloud run services describe "$service" --region="$REGION" >/dev/null 2>&1; then
    echo "✗ Chưa có service $service. Hãy chạy bước 2 (gcloud builds submit) trước." >&2
    exit 1
  fi
done

# Service API chạy ở chế độ không mở ra Internet, nên phải cấp quyền riêng cho
# service web gọi vào. Thiếu bước này thì trang lên được nhưng mọi lời gọi API
# trả về 403 và chatbot không phản hồi.
echo "▸ Cho phép web gọi API"
gcloud run services add-iam-policy-binding aiedu365-api \
  --region="$REGION" \
  --member="serviceAccount:$WEB_SA" \
  --role=roles/run.invoker \
  --quiet >/dev/null

API_URL="$(gcloud run services describe aiedu365-api --region="$REGION" --format='value(status.url)')"
WEB_URL="$(gcloud run services describe aiedu365-web --region="$REGION" --format='value(status.url)')"

echo "▸ Kiểm tra API"
if gcloud run services describe aiedu365-api --region="$REGION" \
     --format='value(status.conditions[0].status)' | grep -qi true; then
  echo "  · API đang chạy: $API_URL (không mở ra Internet — đúng thiết kế)"
else
  echo "  ! API chưa ở trạng thái Ready, xem log: gcloud run services logs read aiedu365-api --region=$REGION"
fi

echo "▸ Kiểm tra trang công khai"
CODE="$(curl -s -o /dev/null -w '%{http_code}' "$WEB_URL" || echo 000)"
echo "  · GET $WEB_URL → HTTP $CODE"

cat <<NOTE

✓ Đã deploy xong.

  Trang công khai:  $WEB_URL
  Khu quản trị:     $WEB_URL/admin

Còn hai việc làm trên giao diện, không qua dòng lệnh:

  1. Đẩy dữ liệu gốc lên Firestore (chạy trong Cloud Shell, tại thư mục repo):
       pip install --quiet google-cloud-firestore
       python data/seed.py --project $PROJECT

  2. Deploy lại một lần với domain thật, để metadata và sitemap trỏ đúng
     (lần đầu chưa biết URL nên phần này còn để trống):
       gcloud builds submit --config cloudbuild.yaml \
         --substitutions=_REGION=$REGION,_SITE_URL=$WEB_URL

  3. Bật Firebase Authentication rồi cấp quyền quản trị:
       · Console → Firebase → Authentication → bật Email/Password và Google
       · Tài khoản trong ADMIN_EMAILS tự có quyền Super Admin ở lần đăng nhập
         đầu; các tài khoản khác cần gán custom claim "role" (viewer/editor/
         super_admin) qua Firebase Admin SDK

NOTE
