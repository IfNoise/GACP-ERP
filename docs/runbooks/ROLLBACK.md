---
title: "Rollback Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Rollback Runbook

## 1. When to Rollback

| Condition | Action |
|-----------|--------|
| Health check fails > 5 min post-deploy | Immediate rollback |
| Error rate > 5% sustained 3+ min | Immediate rollback |
| CrashLoopBackOff on any core service | Immediate rollback |
| Database migration failure | Assess + rollback |
| Critical security vulnerability discovered | Immediate rollback |
| Data corruption detected | Immediate rollback + incident |

## 2. Helm Rollback Procedure

### 2.1 List Revisions

```bash
helm history gacp-erp -n gacp-erp --max 10
```

### 2.2 Rollback to Previous Revision

```bash
# Rollback to previous revision
helm rollback gacp-erp -n gacp-erp

# Or rollback to specific revision
helm rollback gacp-erp <REVISION_NUMBER> -n gacp-erp --wait --timeout 10m
```

### 2.3 Verify Rollback

```bash
# Check pods are running with previous image
kubectl get pods -n gacp-erp -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'

# Check health
curl -sf https://gacp-erp.local/api/health | jq .

# Check error rate in Grafana
# Dashboard: System Overview → Error Rate panel
```

## 3. Database Migration Rollback

Database migrations are **forward-only** by design (Drizzle). If a migration must be reversed:

```bash
# 1. Identify the migration
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 3;"

# 2. Apply manual reverse SQL (must be pre-prepared)
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -f /tmp/rollback-migration.sql

# 3. Remove migration record
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "DELETE FROM drizzle.__drizzle_migrations WHERE id = <MIGRATION_ID>;"
```

**Warning**: Always test migration rollback on staging first.

## 4. Post-Rollback Verification

- [ ] All pods Running/Ready
- [ ] Health endpoint returns 200
- [ ] Error rate < 1% in Grafana
- [ ] No CrashLoopBackOff events
- [ ] Login and basic navigation functional
- [ ] IoT data flow active
- [ ] Audit trail recording events

## 5. Post-Rollback Actions

1. Create incident ticket with root cause
2. Notify stakeholders: `⚠️ GACP-ERP rolled back to v{previous_version}`
3. Fix the issue in development
4. Re-deploy with fix following `DEPLOYMENT.md`
