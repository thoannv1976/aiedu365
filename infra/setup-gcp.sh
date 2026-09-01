#!/usr/bin/env bash
#
# Khởi tạo hạ tầng GCP cho AIEDU365. Chạy một lần, có thể chạy lại an toàn.
#
#   ./infra/setup-gcp.sh aiedu365 asia-southeast1
#
set -euo pipefail

PROJECT="${1:-aiedu365}"
REGION="${2:-asia-southeast1}"
REPO="aiedu365"

echo "▸ Project: $PROJECT · Region: $REGION"
gcloud config set project "$PROJECT" >/dev/null

echo "▸ Bật các API cần thiết"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com \
  identitytoolkit.googleapis.com \
  --quiet

echo "▸ Artifact Registry"
gcloud artifacts repositories describe "$REPO" --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$REPO" \
    --repository-format=docker --location="$REGION" \
    --description="Ảnh container của AIEDU365"

echo "▸ Firestore (Native mode)"
gcloud firestore databases describe --database='(default)' >/dev/null 2>&1 || \
  gcloud firestore databases create --location="$REGION" --type=firestore-native

echo "▸ Service account cho API — chỉ quyền tối thiểu"
gcloud iam service-accounts describe "aiedu365-api@$PROJECT.iam.gserviceaccount.com" >/dev/null 2>&1 || \
  gcloud iam service-accounts create aiedu365-api --display-name="AIEDU365 API"

# secretAdmin cần cho việc ban tổ chức nhập khóa API của Claude/OpenAI/Gemini
# trong trang quản trị: service phải tạo được secret và thêm phiên bản mới.
for role in roles/aiplatform.user roles/datastore.user roles/secretmanager.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:aiedu365-api@$PROJECT.iam.gserviceaccount.com" \
    --role="$role" --condition=None --quiet >/dev/null
done

echo "▸ Service account cho web"
gcloud iam service-accounts describe "aiedu365-web@$PROJECT.iam.gserviceaccount.com" >/dev/null 2>&1 || \
  gcloud iam service-accounts create aiedu365-web --display-name="AIEDU365 Web"

cat <<'NOTE'

▸ Bước còn lại sau khi deploy lần đầu:

  1. Cho phép service web gọi service API (API không mở ra Internet):

       gcloud run services add-iam-policy-binding aiedu365-api \
         --region=REGION \
         --member="serviceAccount:aiedu365-web@PROJECT.iam.gserviceaccount.com" \
         --role=roles/run.invoker

  2. Tạo chỉ mục vector cho Firestore (chỉ cần khi bật USE_FIRESTORE):

       gcloud firestore indexes composite create \
         --collection-group=kb_chunks \
         --query-scope=COLLECTION \
         --field-config=vector-config='{"dimension":768,"flat":{}}',field-path=embedding

  3. Bật Firebase Authentication và cấp custom claim "role" cho tài khoản quản trị.

NOTE

echo "✓ Xong."
