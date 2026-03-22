---
title: "Production Deployment Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Deployment Runbook

## 1. Pre-Deployment Checklist

- [ ] All unit, integration, and contract tests pass in CI
- [ ] Docker images built and pushed to registry with new tag
- [ ] Helm chart version bumped in `Chart.yaml`
- [ ] `values.yaml` reviewed for environment-specific overrides
- [ ] Database migration scripts reviewed
- [ ] Change Control ticket approved (quality module)
- [ ] Deployment window confirmed (low-traffic period preferred)
- [ ] DR backup verified (< 24h old)
- [ ] Notify stakeholders of maintenance window

## 2. Deployment Procedure

### 2.1 Helm Upgrade

```bash
# Set target namespace
export NS=gacp-erp
export RELEASE=gacp-erp
export CHART=./k8s/helm/gacp-erp
export VALUES=./k8s/helm/gacp-erp/values-production.yaml

# Dry-run first
helm upgrade $RELEASE $CHART \
  --namespace $NS \
  --values $VALUES \
  --dry-run --debug

# Execute upgrade
helm upgrade $RELEASE $CHART \
  --namespace $NS \
  --values $VALUES \
  --wait \
  --timeout 10m \
  --atomic
```

The `--atomic` flag ensures automatic rollback on failure.

### 2.2 Database Migrations

```bash
# Migrations run automatically via init container.
# Verify migration status:
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT * FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 5;"
```

### 2.3 Canary Deployment (Optional)

```bash
# Deploy canary (10% traffic)
helm upgrade $RELEASE $CHART \
  --namespace $NS \
  --values $VALUES \
  --set canary.enabled=true \
  --set canary.weight=10

# Monitor for 15 minutes, then promote
helm upgrade $RELEASE $CHART \
  --namespace $NS \
  --values $VALUES \
  --set canary.enabled=false
```

## 3. Post-Deployment Verification

### 3.1 Smoke Tests

```bash
# Health endpoint
curl -sf https://gacp-erp.local/api/health | jq .

# Service readiness
kubectl get pods -n $NS -o wide
kubectl get deploy -n $NS

# Check for restart loops
kubectl get events -n $NS --sort-by='.lastTimestamp' | tail -20
```

### 3.2 Functional Smoke Tests

- [ ] Login with test account → dashboard loads
- [ ] Create test plant → verify in list
- [ ] IoT dashboard shows sensor data
- [ ] Audit trail shows deployment event
- [ ] Grafana dashboards show metrics from new pods

### 3.3 Performance Baseline

```bash
# Quick K6 smoke test (1 min, 10 VUs)
k6 run --vus 10 --duration 1m tests/load/api-gateway.js
```

## 4. Rollback Criteria

Trigger immediate rollback if:
- Health check fails after 5 minutes
- Error rate > 5% in Grafana
- Any pod in CrashLoopBackOff
- Database migration failure
- Critical alert fired

Rollback procedure: See `docs/runbooks/ROLLBACK.md`

## 5. Communication

| Event | Channel | Template |
|-------|---------|----------|
| Deployment start | Slack #ops | `🚀 Deploying GACP-ERP v{version} to production` |
| Deployment success | Slack #ops | `✅ GACP-ERP v{version} deployed successfully` |
| Deployment failure | Slack #ops + PagerDuty | `❌ GACP-ERP deployment failed — rollback initiated` |
