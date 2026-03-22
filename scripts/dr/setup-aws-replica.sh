#!/usr/bin/env bash
#
# GACP-ERP — Setup AWS RDS PostgreSQL Read Replica
# Part of Multi-Cloud DR preparation (EPIC 15.5)
#
# PREREQUISITES:
#   - AWS CLI configured (aws configure)
#   - Appropriate IAM permissions (rds:*, ec2:*, iam:PassRole)
#   - VPC peering or VPN to on-premise cluster established
#
# USAGE:
#   ./setup-aws-replica.sh [--dry-run]
#
# WARNING: This script provisions AWS resources that incur costs.

set -euo pipefail

DRY_RUN="${1:-}"
REGION="${AWS_REGION:-eu-central-1}"
INSTANCE_CLASS="db.r6g.large"
DB_NAME="gacp_erp"
REPLICA_ID="gacp-erp-dr-replica"
VPC_SECURITY_GROUP="${DR_VPC_SG:-sg-xxxxxxxx}"
SUBNET_GROUP="${DR_SUBNET_GROUP:-gacp-erp-dr-subnets}"
KMS_KEY="${DR_KMS_KEY_ARN:-alias/gacp-erp-dr}"

echo "============================================"
echo "  GACP-ERP — AWS DR Replica Setup"
echo "  Region: ${REGION}"
echo "  Instance: ${INSTANCE_CLASS}"
echo "============================================"

if [ "${DRY_RUN}" = "--dry-run" ]; then
  echo "[DRY RUN] Would provision:"
  echo "  - RDS PostgreSQL 16 instance: ${REPLICA_ID}"
  echo "  - Instance class: ${INSTANCE_CLASS}"
  echo "  - Encrypted with KMS key: ${KMS_KEY}"
  echo "  - Multi-AZ: true"
  echo "  - Automated backups: 7 days"
  exit 0
fi

echo ""
echo "[1/4] Creating DB subnet group..."
aws rds create-db-subnet-group \
  --db-subnet-group-name "${SUBNET_GROUP}" \
  --db-subnet-group-description "GACP-ERP DR replica subnets" \
  --subnet-ids "${DR_SUBNET_IDS}" \
  --region "${REGION}" \
  --tags Key=Project,Value=gacp-erp Key=Environment,Value=dr \
  2>/dev/null || echo "  Subnet group already exists"

echo "[2/4] Creating RDS instance..."
aws rds create-db-instance \
  --db-instance-identifier "${REPLICA_ID}" \
  --db-instance-class "${INSTANCE_CLASS}" \
  --engine postgres \
  --engine-version "16" \
  --master-username gacp_admin \
  --master-user-password "$(aws secretsmanager get-secret-value --secret-id gacp-erp/dr-db-password --query SecretString --output text --region "${REGION}")" \
  --db-name "${DB_NAME}" \
  --allocated-storage 100 \
  --max-allocated-storage 500 \
  --storage-type gp3 \
  --storage-encrypted \
  --kms-key-id "${KMS_KEY}" \
  --multi-az \
  --vpc-security-group-ids "${VPC_SECURITY_GROUP}" \
  --db-subnet-group-name "${SUBNET_GROUP}" \
  --backup-retention-period 7 \
  --preferred-backup-window "02:00-03:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --deletion-protection \
  --copy-tags-to-snapshot \
  --tags Key=Project,Value=gacp-erp Key=Environment,Value=dr \
  --region "${REGION}"

echo "[3/4] Waiting for RDS instance to become available..."
aws rds wait db-instance-available \
  --db-instance-identifier "${REPLICA_ID}" \
  --region "${REGION}"

echo "[4/4] Retrieving endpoint..."
ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "${REPLICA_ID}" \
  --query "DBInstances[0].Endpoint.Address" \
  --output text \
  --region "${REGION}")

echo ""
echo "============================================"
echo "  DR Replica Ready"
echo "  Endpoint: ${ENDPOINT}"
echo "  Port: 5432"
echo "  Database: ${DB_NAME}"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Configure logical replication from on-premise primary"
echo "  2. Set up monitoring (CloudWatch alarms)"
echo "  3. Test failover procedure"
echo "  4. Document in docs/runbooks/DR_MULTICLOUD.md"
