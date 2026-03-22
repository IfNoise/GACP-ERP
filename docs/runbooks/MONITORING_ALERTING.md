---
title: "Monitoring & Alerting Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Monitoring & Alerting Runbook

## 1. Observability Stack

| Component | Purpose | Endpoint |
|-----------|---------|----------|
| VictoriaMetrics (App) | Application metrics | `http://vm-app:8428` |
| VictoriaMetrics (IoT) | IoT/environmental metrics | `http://vm-iot:8428` |
| Grafana | Dashboards & visualization | `https://grafana.gacp-erp.local` |
| Tempo | Distributed tracing | `http://tempo:3200` |
| Loki | Log aggregation | `http://loki:3100` |
| AlertManager | Alert routing | `http://alertmanager:9093` |

## 2. Grafana Dashboards

| Dashboard | Content | Refresh |
|-----------|---------|---------|
| System Overview | Pod status, CPU/Memory, error rate, P95 latency | 30s |
| Cultivation Module | Plant counts, batch status, stage transitions | 1m |
| Quality Module | Deviations, CAPAs, change controls, active/closed | 1m |
| Financial Module | Transactions/min, GL balance, PO status | 1m |
| IoT Sensors | Real-time temp/humidity/CO2/pH, threshold alerts | 10s |
| Audit Trail | Events/min, ImmuDB TX rate, verification status | 30s |
| Performance | P50/P95/P99 latency, throughput, error budget | 15s |
| SLA | Uptime %, availability, SLO compliance | 5m |

## 3. Alert Rules Inventory

### 3.1 Critical (P1) — Immediate Response

| Alert | Expression | For | Action |
|-------|-----------|-----|--------|
| ServiceDown | `up{namespace="gacp-erp"} == 0` | 2m | Page on-call |
| HighErrorRate | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05` | 3m | Page on-call |
| DatabaseDown | `pg_up == 0` | 1m | Page on-call + DBA |
| AuditTrailDown | `up{app="audit-consumer"} == 0` | 2m | Page on-call (GxP critical) |
| ImmuDBDown | `immudb_health_status != 1` | 2m | Page on-call |
| BackupOlderThan48h | `gacp_backup_verification_status != 1` for 48h | — | Page on-call |
| CertExpiringCritical | `certmanager_certificate_expiration_timestamp_seconds - time() < 7 * 86400` | 1h | Page on-call |

### 3.2 Warning (P2) — Respond Within 30 min

| Alert | Expression | For | Action |
|-------|-----------|-----|--------|
| HighLatency | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1` | 5m | Notify channel |
| PodRestarting | `increase(kube_pod_container_status_restarts_total[1h]) > 3` | — | Notify channel |
| HighMemory | `container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.85` | 10m | Notify channel |
| KafkaConsumerLag | `kafka_consumer_group_lag > 10000` | 5m | Notify channel |
| DiskUsageHigh | `kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.80` | 10m | Notify channel |
| CertExpiringSoon | `certmanager_certificate_expiration_timestamp_seconds - time() < 14 * 86400` | 1h | Notify channel |

### 3.3 Info (P3/P4) — Next Business Day

| Alert | Expression | For | Action |
|-------|-----------|-----|--------|
| HighCPU | `rate(container_cpu_usage_seconds_total[5m]) / container_spec_cpu_quota > 0.70` | 30m | Backlog ticket |
| SlowQueries | `pg_stat_activity_max_tx_duration > 300` | 5m | Backlog ticket |
| DeadTuples | `pg_stat_user_tables_n_dead_tup > 10000` | 1h | Schedule maintenance |

## 4. On-Call Schedule

### 4.1 Rotation

| Week | Primary | Secondary |
|------|---------|-----------|
| Rotation A | Engineer 1 | Engineer 2 |
| Rotation B | Engineer 2 | Engineer 3 |
| Rotation C | Engineer 3 | Engineer 1 |

Rotation period: 1 week, handover on Monday 09:00 UTC.

### 4.2 Escalation Path

```
Alert fired
  → PagerDuty → Primary on-call (15 min to ack)
    → If no ack → Secondary on-call
      → If no ack (30 min) → Lead Engineer
        → If P1 > 1 hour → Management
```

## 5. Alert Response Procedures

### 5.1 ServiceDown

```bash
# 1. Identify which service
kubectl get pods -n gacp-erp | grep -v Running

# 2. Check pod events
kubectl describe pod <pod-name> -n gacp-erp

# 3. Check logs
kubectl logs <pod-name> -n gacp-erp --previous --tail=50

# 4. Attempt restart
kubectl rollout restart deployment/<service> -n gacp-erp

# 5. If still failing → see INCIDENT_RESPONSE.md
```

### 5.2 HighErrorRate

```bash
# 1. Check which endpoints are failing
# Grafana → Performance dashboard → Error rate by endpoint

# 2. Check recent deployments
helm history gacp-erp -n gacp-erp --max 5

# 3. If recent deploy → consider rollback
# See docs/runbooks/ROLLBACK.md

# 4. Check downstream dependencies
kubectl exec -n gacp-erp deploy/api-gateway -- curl -s http://postgres:5432 || echo "DB unreachable"
```

### 5.3 KafkaConsumerLag

```bash
# 1. Check consumer groups
kubectl exec -n gacp-data kafka-0 -- \
  kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --group audit-consumer-group

# 2. Check consumer pod
kubectl logs -n gacp-erp deploy/audit-consumer --tail=50

# 3. If processing is slow → scale consumer
kubectl scale deployment audit-consumer -n gacp-erp --replicas=4
```

## 6. False Positive Handling

If an alert is a false positive:

1. Acknowledge in PagerDuty with note
2. Add silence in AlertManager (max 24h)
3. Create ticket to tune alert threshold
4. Document pattern in this runbook

```bash
# Create silence via amtool
amtool silence add alertname="HighCPU" \
  --duration=4h \
  --comment="False positive during batch processing window" \
  --author="on-call-name"
```

## 7. Maintenance Mode

During scheduled maintenance:

```bash
# Silence all non-critical alerts
amtool silence add namespace="gacp-erp" \
  --duration=2h \
  --comment="Scheduled maintenance window" \
  --author="ops"

# Remove silence after maintenance
amtool silence expire <silence-id>
```
