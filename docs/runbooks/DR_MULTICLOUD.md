# GACP-ERP — Multi-Cloud Disaster Recovery

**Document ID**: RB-DR-MULTICLOUD-001
**Version**: 1.0
**Classification**: Critical Operations — Regulatory Compliance
**Last Updated**: 2025-01-01

---

## Purpose

This document describes the multi-cloud disaster recovery strategy for GACP-ERP, ensuring business continuity and regulatory compliance (21 CFR Part 11, EU GMP Annex 11) across cloud providers.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                 ON-PREMISE (Primary)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │ Postgres │  │ ImmuDB  │  │ MongoDB │  │ MinIO (WORM) │   │
│  │ Primary  │  │ Primary │  │ Primary │  │  7yr retain  │   │
│  └────┬─────┘  └────┬────┘  └────┬────┘  └──────┬──────┘   │
│       │              │            │               │          │
└───────┼──────────────┼────────────┼───────────────┼──────────┘
        │              │            │               │
   Logical Repl   Daily Backup  Daily Backup   Daily Sync
        │              │            │               │
  ┌─────┼──────────────┼────────────┼───────────────┼──────┐
  │     ▼              ▼            ▼               ▼      │
  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐│
  │  │ RDS PG  │  │ S3 WORM │  │ S3 Backups│  │ S3 Object││
  │  │ Replica │  │ ImmuDB  │  │ MongoDB   │  │ Lock     ││
  │  └─────────┘  └─────────┘  └──────────┘  └──────────┘│
  │             AWS (DR Site A)                            │
  └────────────────────────────────────────────────────────┘
        │
  ┌─────┼──────────────────────────────────────────────────┐
  │     ▼                                                  │
  │  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐│
  │  │ Azure PG    │  │ Azure Blob    │  │ Immutable    ││
  │  │ Flexible    │  │ (backups)     │  │ Blob Storage ││
  │  └─────────────┘  └───────────────┘  └──────────────┘│
  │             Azure (DR Site B)                          │
  └────────────────────────────────────────────────────────┘
```

---

## DR Tiers

| Tier | Scope | RPO | RTO | Method |
|------|-------|-----|-----|--------|
| **Tier 1** | PostgreSQL | < 5 min | < 15 min | Synchronous replica (CloudNativePG) |
| **Tier 2** | PostgreSQL (cloud) | < 1 hour | < 30 min | Logical replication → AWS RDS / Azure PG |
| **Tier 3** | All databases | < 24 hours | < 4 hours | Daily backup → MinIO → S3/Azure Blob |
| **Tier 4** | Audit WORM | < 24 hours | < 8 hours | Daily WORM sync → S3 Object Lock / Azure Immutable |

---

## Scripts

| Script | Purpose | Schedule |
|--------|---------|----------|
| `scripts/dr/setup-aws-replica.sh` | Provision AWS RDS replica | One-time |
| `scripts/dr/setup-azure-replica.sh` | Provision Azure PG Flexible Server | One-time |
| `scripts/dr/sync-worm-s3.sh` | Sync WORM data to S3 Object Lock | Daily (CronJob) |
| `scripts/dr/sync-worm-azure.sh` | Sync WORM data to Azure Immutable Blob | Daily (CronJob) |

---

## Activation Procedure

### Decision Criteria

Activate multi-cloud DR when:
1. On-premise site completely unavailable (network, power, physical damage)
2. Estimated on-premise recovery > 4 hours
3. Approved by: Engineering Lead + Quality Manager

### Step-by-Step Activation

#### Phase 1: DNS Failover (5 minutes)

1. Update DNS records from on-premise to cloud endpoints
2. `gacp-erp.company.com` → cloud load balancer
3. TTL should be pre-set to 60 seconds

#### Phase 2: Database Promotion (15 minutes)

**AWS:**
```bash
# Promote RDS read replica to standalone
aws rds promote-read-replica \
  --db-instance-identifier gacp-erp-dr-replica \
  --region eu-central-1

# Wait for promotion
aws rds wait db-instance-available \
  --db-instance-identifier gacp-erp-dr-replica
```

**Azure:**
```bash
# Stop replication (makes server standalone)
az postgres flexible-server replica stop-replication \
  --resource-group gacp-erp-dr \
  --name gacp-erp-dr-pg
```

#### Phase 3: Application Deployment (30 minutes)

1. Deploy K8s workloads to cloud cluster (EKS/AKS)
2. Update ConfigMaps with cloud database endpoints
3. Verify all services healthy
4. Run smoke tests

#### Phase 4: Verification (15 minutes)

1. [ ] All API endpoints returning 200
2. [ ] Audit trail functional
3. [ ] IoT data ingestion working (if cloud MQTT available)
4. [ ] User authentication via Keycloak
5. [ ] Document management accessible

---

## Return to On-Premise

See DR_FAILBACK.md for general failback procedure.

### Cloud → On-Premise Reverse Replication

1. Restore on-premise infrastructure
2. Set up reverse logical replication from cloud → on-premise PostgreSQL
3. Wait for full sync
4. Controlled switchover during maintenance window
5. Disable cloud endpoints
6. Verify all services on-premise
7. Resume regular backup/replication schedule

---

## Regulatory Compliance

### 21 CFR Part 11 Requirements

- **§11.10(c)**: Audit trail maintained across DR transition
- **§11.10(e)**: Electronic records protected during transfer
- **§11.300**: Electronic signatures remain valid after DR

### EU GMP Annex 11

- **§7.1**: Data retention (7 years) maintained via WORM sync
- **§7.2**: Backup and restore validated
- **§12.1**: Business continuity plan documented

### Validation

- DR procedures validated during quarterly DR drills
- Results documented in `docs/validation/results/DR_Drill_Report.md`
- Any deviations from expected RTO/RPO filed as quality deviations
