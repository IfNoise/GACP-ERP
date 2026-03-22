#!/usr/bin/env bash
#
# GACP-ERP — Sync MinIO WORM bucket to AWS S3 Object Lock
# Part of Multi-Cloud DR preparation (EPIC 15.5)
#
# Syncs audit WORM data to AWS S3 with Object Lock (Governance mode)
# to ensure regulatory compliance across cloud providers.
#
# PREREQUISITES:
#   - AWS CLI configured
#   - S3 bucket with Object Lock enabled
#   - mc (MinIO Client) installed
#
# USAGE:
#   ./sync-worm-s3.sh [--dry-run]

set -euo pipefail

DRY_RUN="${1:-}"
SOURCE_BUCKET="gacp-erp-audit-worm"
TARGET_BUCKET="${AWS_WORM_BUCKET:-gacp-erp-audit-worm-s3}"
REGION="${AWS_REGION:-eu-central-1}"
MINIO_ALIAS="minio-local"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio.gacp-data:9000}"
RETENTION_DAYS=2555  # 7 years

echo "============================================"
echo "  GACP-ERP — WORM Sync to AWS S3"
echo "  Source: ${MINIO_ALIAS}/${SOURCE_BUCKET}"
echo "  Target: s3://${TARGET_BUCKET}"
echo "============================================"

# Configure MinIO client
mc alias set "${MINIO_ALIAS}" "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" 2>/dev/null || true

if [ "${DRY_RUN}" = "--dry-run" ]; then
  echo "[DRY RUN] Would sync:"
  OBJECT_COUNT=$(mc ls --recursive "${MINIO_ALIAS}/${SOURCE_BUCKET}" 2>/dev/null | wc -l || echo "0")
  echo "  Objects to sync: ${OBJECT_COUNT}"
  echo "  Target: s3://${TARGET_BUCKET}"
  echo "  Retention: ${RETENTION_DAYS} days (Governance mode)"
  exit 0
fi

echo ""
echo "[1/3] Ensuring AWS S3 bucket exists with Object Lock..."
aws s3api head-bucket --bucket "${TARGET_BUCKET}" --region "${REGION}" 2>/dev/null || {
  aws s3api create-bucket \
    --bucket "${TARGET_BUCKET}" \
    --region "${REGION}" \
    --create-bucket-configuration LocationConstraint="${REGION}" \
    --object-lock-enabled-for-bucket

  aws s3api put-object-lock-configuration \
    --bucket "${TARGET_BUCKET}" \
    --object-lock-configuration '{
      "ObjectLockEnabled": "Enabled",
      "Rule": {
        "DefaultRetention": {
          "Mode": "GOVERNANCE",
          "Days": '"${RETENTION_DAYS}"'
        }
      }
    }' \
    --region "${REGION}"

  echo "  S3 bucket created with Object Lock (Governance, ${RETENTION_DAYS} days)"
}

echo "[2/3] Syncing WORM data..."
mc mirror --overwrite --remove "${MINIO_ALIAS}/${SOURCE_BUCKET}" "s3/${TARGET_BUCKET}" 2>&1 || {
  # Fallback: use aws s3 sync if mc mirror fails
  echo "  mc mirror failed, falling back to aws s3 sync..."
  TMP_DIR=$(mktemp -d)
  mc cp --recursive "${MINIO_ALIAS}/${SOURCE_BUCKET}/" "${TMP_DIR}/"
  aws s3 sync "${TMP_DIR}" "s3://${TARGET_BUCKET}" --region "${REGION}"
  rm -rf "${TMP_DIR}"
}

echo "[3/3] Verifying sync..."
SOURCE_COUNT=$(mc ls --recursive "${MINIO_ALIAS}/${SOURCE_BUCKET}" 2>/dev/null | wc -l || echo "0")
TARGET_COUNT=$(aws s3 ls "s3://${TARGET_BUCKET}" --recursive --region "${REGION}" | wc -l || echo "0")

echo ""
echo "============================================"
echo "  Sync Complete"
echo "  Source objects: ${SOURCE_COUNT}"
echo "  Target objects: ${TARGET_COUNT}"
echo "  Retention: ${RETENTION_DAYS} days"
echo "============================================"

if [ "${SOURCE_COUNT}" != "${TARGET_COUNT}" ]; then
  echo "WARNING: Object count mismatch! Manual verification required."
  exit 1
fi
