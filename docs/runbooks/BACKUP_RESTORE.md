---
title: "Backup & Restore Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Backup & Restore Runbook

## 1. Backup Inventory

| Component | Method | Schedule | Retention | Storage |
|-----------|--------|----------|-----------|---------|
| PostgreSQL | CloudNativePG WAL + pg_basebackup | Continuous WAL, daily base | 30 days | MinIO `gacp-erp-backups/postgres/` |
| ImmuDB | immuadmin backup | Daily 03:00 UTC | 30 days | MinIO `gacp-erp-backups/immudb/` |
| MongoDB | mongodump + gzip | Daily 03:30 UTC | 30 days | MinIO `gacp-erp-backups/mongodb/` |
| MinIO documents | Cross-bucket replication | Continuous | 7 years (WORM) | `gacp-erp-archive/` |
| Sealed Secrets keys | Manual export | After rotation | Indefinite | Offline secure storage |
| Helm values | Git | Every commit | Indefinite | Git repository |

## 2. Backup Verification

### 2.1 Automated Verification

Weekly CronJob (`k8s/cronjobs/verify-backup.yaml`) checks:
- PostgreSQL backup exists and is < 24h old
- ImmuDB backup exists and is < 24h old
- MongoDB backup exists and is < 24h old
- Pushes `gacp_backup_verification_status` metric to VictoriaMetrics

### 2.2 Manual Verification

```bash
# List PostgreSQL backups
mc ls minio-local/gacp-erp-backups/postgres/ --recursive | tail -5

# List ImmuDB backups
mc ls minio-local/gacp-erp-backups/immudb/ --recursive | tail -5

# List MongoDB backups
mc ls minio-local/gacp-erp-backups/mongodb/ --recursive | tail -5

# Check backup sizes (detect truncated backups)
mc ls minio-local/gacp-erp-backups/ --recursive --summarize
```

## 3. Restore Procedures

### 3.1 PostgreSQL Restore (CloudNativePG)

#### Point-in-Time Recovery (PITR)

```bash
# 1. Create recovery cluster spec
cat <<EOF | kubectl apply -f -
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-recovery
  namespace: gacp-data
spec:
  instances: 1
  bootstrap:
    recovery:
      source: postgres
      recoveryTarget:
        targetTime: "2025-07-16T12:00:00Z"
  externalClusters:
    - name: postgres
      barmanObjectStore:
        destinationPath: "s3://gacp-erp-backups/postgres/"
        endpointURL: "http://minio.gacp-data:9000"
        s3Credentials:
          accessKeyId:
            name: minio-credentials
            key: ACCESS_KEY_ID
          secretAccessKey:
            name: minio-credentials
            key: SECRET_ACCESS_KEY
EOF

# 2. Wait for recovery cluster to be ready
kubectl get cluster postgres-recovery -n gacp-data -w

# 3. Verify data integrity
kubectl exec -n gacp-data deploy/postgres-recovery -- \
  psql -U gacp -d gacp_erp -c "SELECT count(*) FROM plants;"

# 4. Switchover (if verified)
kubectl cnpg promote postgres-recovery -n gacp-data
```

#### Full Restore from Backup

```bash
# 1. Download latest base backup
mc cp minio-local/gacp-erp-backups/postgres/latest/ /tmp/pg-restore/ --recursive

# 2. Stop services
kubectl scale deployment --all -n gacp-erp --replicas=0

# 3. Restore using CloudNativePG recovery bootstrap (same as PITR without targetTime)

# 4. Restart services
kubectl scale deployment --all -n gacp-erp --replicas=2
```

### 3.2 ImmuDB Restore

```bash
# 1. Download latest backup
mc cp minio-local/gacp-erp-backups/immudb/latest/immudb-backup.tar.gz /tmp/

# 2. Stop audit-consumer
kubectl scale deployment audit-consumer -n gacp-erp --replicas=0

# 3. Copy backup to ImmuDB pod
kubectl cp /tmp/immudb-backup.tar.gz gacp-data/immudb-0:/tmp/

# 4. Restore
kubectl exec -n gacp-data immudb-0 -- \
  immuadmin restore --uncompressed-data-dir /tmp/immudb-restore

# 5. Verify
kubectl exec -n gacp-data immudb-0 -- immuadmin status

# 6. Restart audit-consumer
kubectl scale deployment audit-consumer -n gacp-erp --replicas=2
```

### 3.3 MongoDB Restore

```bash
# 1. Download latest backup
mc cp minio-local/gacp-erp-backups/mongodb/latest/mongodb-dump.gz /tmp/

# 2. Restore
kubectl exec -n gacp-data mongodb-0 -- \
  mongorestore --gzip --archive=/tmp/mongodb-dump.gz --drop

# 3. Verify
kubectl exec -n gacp-data mongodb-0 -- \
  mongosh --eval "db.stats()"
```

## 4. Disaster Recovery Restore

For full DR restore, follow `docs/runbooks/DR_FAILOVER.md`.

## 5. Restore Testing Schedule

| Test | Frequency | Environment |
|------|-----------|-------------|
| PostgreSQL PITR | Quarterly | Staging |
| PostgreSQL full restore | Semi-annually | Staging |
| ImmuDB restore | Quarterly | Staging |
| MongoDB restore | Quarterly | Staging |
| Full DR drill | Annually | DR environment |

## 6. Alerting

| Alert | Condition | Severity |
|-------|-----------|----------|
| Backup CronJob failed | Job status = Failed | P2 |
| Backup verification failed | `gacp_backup_verification_status != 1` | P2 |
| Backup older than 48h | No new backup in 48h | P1 |
| Backup storage > 80% | MinIO bucket > 80% capacity | P3 |
