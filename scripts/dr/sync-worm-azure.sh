#!/usr/bin/env bash
#
# GACP-ERP — Sync MinIO WORM bucket to Azure Immutable Blob Storage
# Part of Multi-Cloud DR preparation (EPIC 15.5)
#
# Syncs audit WORM data to Azure Blob Storage with immutability policy
# to ensure regulatory compliance across cloud providers.
#
# PREREQUISITES:
#   - Azure CLI configured (az login)
#   - Storage account with versioning and immutability policy
#   - mc (MinIO Client) installed
#
# USAGE:
#   ./sync-worm-azure.sh [--dry-run]

set -euo pipefail

DRY_RUN="${1:-}"
SOURCE_BUCKET="gacp-erp-audit-worm"
RESOURCE_GROUP="${AZURE_RG:-gacp-erp-dr}"
STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-gacperpworm}"
CONTAINER_NAME="audit-worm"
MINIO_ALIAS="minio-local"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio.gacp-data:9000}"
RETENTION_DAYS=2555  # 7 years

echo "============================================"
echo "  GACP-ERP — WORM Sync to Azure Blob"
echo "  Source: ${MINIO_ALIAS}/${SOURCE_BUCKET}"
echo "  Target: ${STORAGE_ACCOUNT}/${CONTAINER_NAME}"
echo "============================================"

mc alias set "${MINIO_ALIAS}" "${MINIO_ENDPOINT}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" 2>/dev/null || true

if [ "${DRY_RUN}" = "--dry-run" ]; then
  OBJECT_COUNT=$(mc ls --recursive "${MINIO_ALIAS}/${SOURCE_BUCKET}" 2>/dev/null | wc -l || echo "0")
  echo "[DRY RUN] Would sync:"
  echo "  Objects to sync: ${OBJECT_COUNT}"
  echo "  Target: ${STORAGE_ACCOUNT}/${CONTAINER_NAME}"
  echo "  Retention: ${RETENTION_DAYS} days (time-based immutability)"
  exit 0
fi

echo ""
echo "[1/4] Ensuring Azure Storage account exists..."
az storage account show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${STORAGE_ACCOUNT}" &>/dev/null || {
  az storage account create \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${STORAGE_ACCOUNT}" \
    --sku Standard_GRS \
    --kind StorageV2 \
    --allow-blob-public-access false \
    --enable-hierarchical-namespace false \
    --tags Project=gacp-erp Environment=dr
}

ACCOUNT_KEY=$(az storage account keys list \
  --resource-group "${RESOURCE_GROUP}" \
  --account-name "${STORAGE_ACCOUNT}" \
  --query "[0].value" -o tsv)

echo "[2/4] Creating container with immutability policy..."
az storage container create \
  --account-name "${STORAGE_ACCOUNT}" \
  --account-key "${ACCOUNT_KEY}" \
  --name "${CONTAINER_NAME}" \
  2>/dev/null || true

# Set time-based immutability policy
az storage container immutability-policy create \
  --resource-group "${RESOURCE_GROUP}" \
  --account-name "${STORAGE_ACCOUNT}" \
  --container-name "${CONTAINER_NAME}" \
  --period "${RETENTION_DAYS}" \
  --allow-protected-append-writes true \
  2>/dev/null || echo "  Immutability policy already exists"

echo "[3/4] Syncing WORM data..."
TMP_DIR=$(mktemp -d)
mc cp --recursive "${MINIO_ALIAS}/${SOURCE_BUCKET}/" "${TMP_DIR}/"

az storage blob upload-batch \
  --account-name "${STORAGE_ACCOUNT}" \
  --account-key "${ACCOUNT_KEY}" \
  --destination "${CONTAINER_NAME}" \
  --source "${TMP_DIR}" \
  --overwrite false

rm -rf "${TMP_DIR}"

echo "[4/4] Verifying sync..."
SOURCE_COUNT=$(mc ls --recursive "${MINIO_ALIAS}/${SOURCE_BUCKET}" 2>/dev/null | wc -l || echo "0")
TARGET_COUNT=$(az storage blob list \
  --account-name "${STORAGE_ACCOUNT}" \
  --account-key "${ACCOUNT_KEY}" \
  --container-name "${CONTAINER_NAME}" \
  --query "length(@)" -o tsv || echo "0")

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
