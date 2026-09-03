#!/usr/bin/env bash
#
# Bước 1/3 — Khởi tạo hạ tầng GCP cho AIEDU365.
# Chạy một lần, có thể chạy lại an toàn (idempotent).
#
#   ./infra/setup-gcp.sh aiedu365 asia-southeast1
#
# Sau bước này: gcloud builds submit --config cloudbuild.yaml
# Rồi:          ./infra/finish-deploy.sh aiedu365 asia-southeast1
#
set -euo pipefail

PROJECT="${1:-aiedu365}"
REGION="${2:-asia-southeast1}"
REPO="aiedu365"

echo "▸ Project: $PROJECT · Region: $REGION"
gcloud config set project "$PROJECT" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"

echo "▸ Bật các API cần thiết (mất 1–2 phút)"
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

grant() { # grant <service-account-email> <role>
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:$1" --role="$2" --condition=None --quiet >/dev/null
}

API_SA="aiedu365-api@$PROJECT.iam.gserviceaccount.com"
WEB_SA="aiedu365-web@$PROJECT.iam.gserviceaccount.com"

echo "▸ Service account cho API — đặc quyền tối thiểu"
gcloud iam service-accounts describe "$API_SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create aiedu365-api --display-name="AIEDU365 API"

# secretmanager.admin cần cho việc ban tổ chức nhập khóa API của Claude, OpenAI
# và Gemini trong trang quản trị: service phải tạo được secret và thêm phiên bản.
for role in roles/aiplatform.user roles/datastore.user roles/secretmanager.admin; do
  grant "$API_SA" "$role"
done

echo "▸ Service account cho web"
gcloud iam service-accounts describe "$WEB_SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create aiedu365-web --display-name="AIEDU365 Web"

# Cloud Build phải deploy được lên Cloud Run và "đóng vai" hai service account
# trên. Thiếu hai quyền này thì bước build chạy xong nhưng deploy báo lỗi
# PERMISSION_DENIED — đây là chỗ hay bị bỏ sót nhất.
#
# Google đã đổi mặc định: project mới dùng Compute Engine default SA cho Cloud
# Build, project cũ dùng SA riêng của Cloud Build. Cấp cho SA nào đang tồn tại.
echo "▸ Quyền deploy cho Cloud Build"
BUILD_SA_FOUND=0
for candidate in \
  "$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"; do
  if gcloud iam service-accounts describe "$candidate" >/dev/null 2>&1; then
    echo "  · $candidate"
    grant "$candidate" roles/run.admin
    grant "$candidate" roles/artifactregistry.writer
    grant "$candidate" roles/logging.logWriter
    for target in "$API_SA" "$WEB_SA"; do
      gcloud iam service-accounts add-iam-policy-binding "$target" \
        --member="serviceAccount:$candidate" \
        --role=roles/iam.serviceAccountUser --quiet >/dev/null
    done
    BUILD_SA_FOUND=1
  fi
done

if [ "$BUILD_SA_FOUND" -eq 0 ]; then
  echo "  ! Không tìm thấy service account nào của Cloud Build."
  echo "    Chạy một build bất kỳ để Google tạo nó, rồi chạy lại script này."
fi

cat <<NOTE

✓ Hạ tầng đã sẵn sàng.

Bước tiếp theo:

  2. Build và deploy:
       gcloud builds submit --config cloudbuild.yaml \\
         --substitutions=_REGION=$REGION

  3. Hoàn tất (cấp quyền web gọi API, in ra URL):
       ./infra/finish-deploy.sh $PROJECT $REGION

NOTE
