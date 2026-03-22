---
title: "Log Management Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Log Management Runbook

## 1. Loki Architecture

```
Application Pods → Promtail (DaemonSet) → Loki → Grafana
                                          ↓
                                    MinIO (S3 storage)
```

## 2. Retention Policies

| Log Type | Hot Retention (Loki) | Cold Archive | Total Retention | Regulation |
|----------|---------------------|-------------|-----------------|------------|
| Application logs | 30 days | MinIO cold tier | 1 year | Internal policy |
| Audit logs | 90 days | MinIO WORM | 7 years | 21 CFR Part 11 |
| Security logs | 90 days | MinIO WORM | 7 years | EU GMP Annex 11 |
| Access logs (Istio) | 14 days | MinIO cold tier | 90 days | Internal policy |
| IoT data logs | 30 days | MinIO cold tier | 2 years | GACP |

### 2.1 Loki Retention Configuration

```yaml
# Loki config (helm values)
compactor:
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150

limits_config:
  retention_period: 720h  # 30 days default
  per_tenant_override_config: /etc/loki/overrides.yaml

# Per-tenant overrides
overrides:
  audit:
    retention_period: 2160h  # 90 days
  security:
    retention_period: 2160h  # 90 days
```

## 3. Log Archival to Cold Storage

### 3.1 Automated Archival (CronJob)

The monthly archive CronJob (`k8s/cronjobs/backup-archive.yaml`) handles archival
of audit and security logs to MinIO WORM bucket.

### 3.2 Manual Log Export

```bash
# Export logs for a specific period (using logcli)
logcli query \
  '{namespace="gacp-erp"}' \
  --from="2025-07-01T00:00:00Z" \
  --to="2025-07-15T23:59:59Z" \
  --limit=0 \
  --output=jsonl \
  > gacp-erp-logs-2025-07-01-to-15.jsonl

# Compress and upload to MinIO
gzip gacp-erp-logs-2025-07-01-to-15.jsonl
mc cp gacp-erp-logs-2025-07-01-to-15.jsonl.gz \
  minio-local/gacp-erp-archive/logs/2025/07/
```

### 3.3 Audit Log Export for Compliance

```bash
# Export audit-specific logs
logcli query \
  '{namespace="gacp-erp", app=~"audit-consumer|api-gateway"} |= "audit"' \
  --from="2025-01-01T00:00:00Z" \
  --to="2025-06-30T23:59:59Z" \
  --limit=0 \
  --output=jsonl \
  > audit-logs-H1-2025.jsonl

# Store in WORM bucket
gzip audit-logs-H1-2025.jsonl
mc cp audit-logs-H1-2025.jsonl.gz \
  minio-local/gacp-erp-worm/audit-logs/2025/
```

## 4. Log Queries (Grafana / LogQL)

### 4.1 Common Queries

```logql
# All errors in last hour
{namespace="gacp-erp"} |= "error" | logfmt | level = "error"

# Specific service errors
{namespace="gacp-erp", app="quality-service"} |= "error"

# Slow requests (> 1s)
{namespace="gacp-erp", app="api-gateway"} | json | duration > 1000

# Authentication failures
{namespace="gacp-erp"} |= "authentication" |= "failed"

# Audit events
{namespace="gacp-erp", app="audit-consumer"} | json | event_type = "state_change"
```

### 4.2 Compliance Log Extraction

```logql
# All e-signature events
{namespace="gacp-erp"} |= "e-signature" | json

# All data modification events (for regulatory audit)
{namespace="gacp-erp"} | json | event_type =~ "create|update|delete"

# Access control events
{namespace="gacp-erp"} |= "authorization" | json
```

## 5. Monitoring & Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Loki ingestion stopped | No new logs for 5 min | P2 |
| Promtail pod not running | DaemonSet missing pods | P2 |
| Log storage > 80% | MinIO bucket usage | P3 |
| Audit log gap detected | No audit logs for 10 min | P1 |
| High error rate in logs | > 100 errors/min sustained | P2 |

## 6. Troubleshooting

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| Logs not appearing in Grafana | Check Promtail pods: `kubectl get ds -n gacp-observability` | Restart Promtail DaemonSet |
| Query timeout | Large time range or unselective query | Add label filters, reduce time range |
| Storage full | `mc admin info minio-local` | Trigger compaction, expand storage |
| Missing audit logs | Check audit-consumer pod | Restart pod, check Kafka consumer group lag |
