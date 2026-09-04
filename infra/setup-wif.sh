#!/usr/bin/env bash
#
# Cho phép GitHub Actions deploy lên GCP mà KHÔNG cần tạo file khóa service
# account. GitHub và Google tin nhau qua Workload Identity Federation: mỗi lần
# chạy, GitHub xin Google một token sống vài phút rồi hết hạn.
#
# Chạy MỘT LẦN trong Cloud Shell:
#   ./infra/setup-wif.sh aiedu365 thoannv1976/aiedu365
#
# Chạy lại được nhiều lần.
#
set -euo pipefail

PROJECT="${1:-aiedu365}"
GH_REPO="${2:-thoannv1976/aiedu365}"
POOL="github"
PROVIDER="github"

gcloud config set project "$PROJECT" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
DEPLOY_SA="aiedu365-deploy@$PROJECT.iam.gserviceaccount.com"

echo "▸ Bật API cần thiết"
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com --quiet

echo "▸ Service account dùng để deploy"
gcloud iam service-accounts describe "$DEPLOY_SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create aiedu365-deploy --display-name="AIEDU365 Deploy"

# Chỉ đủ quyền chạy Cloud Build và deploy Cloud Run — không cấp quyền chủ dự án.
for role in \
  roles/cloudbuild.builds.editor \
  roles/artifactregistry.writer \
  roles/run.admin \
  roles/iam.serviceAccountUser \
  roles/storage.admin \
  roles/logging.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:$DEPLOY_SA" --role="$role" \
    --condition=None --quiet >/dev/null
done

echo "▸ Workload Identity Pool"
gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create "$POOL" \
    --location=global --display-name="GitHub Actions"

echo "▸ Provider cho GitHub"
# attribute-condition khóa chặt vào đúng repo này. Thiếu nó thì BẤT KỲ repo nào
# trên GitHub cũng đổi được token của dự án — Google bắt buộc phải có.
gcloud iam workload-identity-pools providers describe "$PROVIDER" \
  --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
    --location=global --workload-identity-pool="$POOL" \
    --display-name="GitHub" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='$GH_REPO'"

echo "▸ Cho repo $GH_REPO đóng vai service account"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$GH_REPO" \
  --quiet >/dev/null

cat <<NOTE

✓ Xong phía Google Cloud.

Còn một việc trên GitHub — vào:
  https://github.com/$GH_REPO/settings/secrets/actions

Bấm "New repository secret" và tạo 2 mục sau (chép nguyên văn):

  Tên:  WIF_PROVIDER
  Giá trị:
projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER

  Tên:  DEPLOY_SERVICE_ACCOUNT
  Giá trị:
$DEPLOY_SA

(Tùy chọn) Sau khi có URL trang web thật, tạo thêm secret SITE_URL để phần
chia sẻ link và sitemap trỏ đúng.

Từ lúc này, deploy chỉ cần bấm nút: tab Actions → "Deploy lên Cloud Run" →
Run workflow. Không có file khóa nào được tạo ra hay lưu lại ở đâu.

NOTE
