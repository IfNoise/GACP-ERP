#!/usr/bin/env bash
#
# GACP-ERP — Setup Azure PostgreSQL Flexible Server
# Part of Multi-Cloud DR preparation (EPIC 15.5)
#
# PREREQUISITES:
#   - Azure CLI configured (az login)
#   - Appropriate RBAC permissions
#   - VNet peering or VPN to on-premise cluster established
#
# USAGE:
#   ./setup-azure-replica.sh [--dry-run]
#
# WARNING: This script provisions Azure resources that incur costs.

set -euo pipefail

DRY_RUN="${1:-}"
RESOURCE_GROUP="${AZURE_RG:-gacp-erp-dr}"
LOCATION="${AZURE_LOCATION:-westeurope}"
SERVER_NAME="gacp-erp-dr-pg"
SKU="Standard_D4ds_v5"
STORAGE_SIZE=128  # GiB
VNET_NAME="${DR_VNET:-gacp-erp-dr-vnet}"
SUBNET_NAME="${DR_SUBNET:-gacp-erp-dr-pg-subnet}"

echo "============================================"
echo "  GACP-ERP — Azure DR Replica Setup"
echo "  Location: ${LOCATION}"
echo "  SKU: ${SKU}"
echo "============================================"

if [ "${DRY_RUN}" = "--dry-run" ]; then
  echo "[DRY RUN] Would provision:"
  echo "  - Azure PostgreSQL Flexible Server: ${SERVER_NAME}"
  echo "  - SKU: ${SKU}"
  echo "  - Storage: ${STORAGE_SIZE} GiB"
  echo "  - HA: Zone-redundant"
  echo "  - Backup retention: 7 days"
  exit 0
fi

echo ""
echo "[1/5] Creating resource group..."
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --tags Project=gacp-erp Environment=dr \
  2>/dev/null || echo "  Resource group already exists"

echo "[2/5] Creating VNet and subnet..."
az network vnet create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VNET_NAME}" \
  --address-prefix 10.100.0.0/16 \
  --subnet-name "${SUBNET_NAME}" \
  --subnet-prefix 10.100.1.0/24 \
  2>/dev/null || echo "  VNet already exists"

# Delegate subnet to PostgreSQL
az network vnet subnet update \
  --resource-group "${RESOURCE_GROUP}" \
  --vnet-name "${VNET_NAME}" \
  --name "${SUBNET_NAME}" \
  --delegations Microsoft.DBforPostgreSQL/flexibleServers \
  2>/dev/null || true

echo "[3/5] Creating PostgreSQL Flexible Server..."
DB_PASSWORD=$(az keyvault secret show \
  --vault-name "gacp-erp-kv" \
  --name "dr-db-password" \
  --query value -o tsv 2>/dev/null || echo "CHANGE_ME_$(openssl rand -hex 16)")

az postgres flexible-server create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${SERVER_NAME}" \
  --location "${LOCATION}" \
  --sku-name "${SKU}" \
  --storage-size "${STORAGE_SIZE}" \
  --version 16 \
  --admin-user gacp_admin \
  --admin-password "${DB_PASSWORD}" \
  --vnet "${VNET_NAME}" \
  --subnet "${SUBNET_NAME}" \
  --high-availability ZoneRedundant \
  --backup-retention 7 \
  --geo-redundant-backup Enabled \
  --tags Project=gacp-erp Environment=dr

echo "[4/5] Configuring server parameters..."
az postgres flexible-server parameter set \
  --resource-group "${RESOURCE_GROUP}" \
  --server-name "${SERVER_NAME}" \
  --name wal_level \
  --value logical

az postgres flexible-server parameter set \
  --resource-group "${RESOURCE_GROUP}" \
  --server-name "${SERVER_NAME}" \
  --name max_replication_slots \
  --value 10

echo "[5/5] Retrieving connection info..."
FQDN=$(az postgres flexible-server show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${SERVER_NAME}" \
  --query fullyQualifiedDomainName -o tsv)

echo ""
echo "============================================"
echo "  DR Replica Ready"
echo "  FQDN: ${FQDN}"
echo "  Port: 5432"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Configure VNet peering to on-premise"
echo "  2. Set up logical replication from primary"
echo "  3. Configure Azure Monitor alerts"
echo "  4. Document in docs/runbooks/DR_MULTICLOUD.md"
