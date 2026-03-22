# GACP-ERP — Failover Runbook

**Document ID**: RB-DR-FAILOVER-001
**Version**: 1.0
**Classification**: Critical Operations
**Last Updated**: 2025-01-01

---

## Purpose

This runbook describes the procedure for failing over GACP-ERP services when the primary PostgreSQL instance or other critical infrastructure components become unavailable.

---

## Pre-Requisites

- kubectl access to the Kubernetes cluster
- `cnpg` plugin installed (`kubectl cnpg`)
- Access to monitoring dashboards (Grafana)
- On-call engineer with `cluster-admin` RBAC

---

## Scenario 1: PostgreSQL Primary Node Failure

**Target RTO**: < 15 minutes
**Target RPO**: < 5 minutes (synchronous replica)

### Detection

1. **Automatic**: CloudNativePG detects primary unresponsive (health check timeout: 30s)
2. **Monitoring alert**: `gacp_postgres_primary_down` fires in VictoriaMetrics
3. **Manual**: `kubectl cnpg status postgres -n gacp-data` shows primary pod not Running

### Automatic Failover (CloudNativePG)

CloudNativePG performs automatic failover:

1. Primary health check fails after 30 seconds
2. Synchronous replica promoted to new primary
3. `postgres-rw.gacp-data` service endpoint updated automatically
4. Applications reconnect via connection pool retry

**No manual intervention required** — verify recovery:

```bash
# Check cluster status
kubectl cnpg status postgres -n gacp-data

# Verify new primary is accepting writes
kubectl exec -n gacp-data postgres-1 -- psql -U gacp_admin -d gacp_erp \
  -c "SELECT pg_is_in_recovery();"
# Expected: f (false = primary)

# Verify replication lag
kubectl cnpg status postgres -n gacp-data | grep "Replication"
```

### Manual Failover (if automatic fails)

```bash
# Force promote specific replica
kubectl cnpg promote postgres -n gacp-data --instance postgres-2

# Verify promotion
kubectl cnpg status postgres -n gacp-data

# Restart application pods to refresh connections
kubectl rollout restart deployment -n gacp-erp
```

### Post-Failover Verification

1. [ ] New primary accepting writes
2. [ ] All services reconnected (check pod logs)
3. [ ] Audit trail functional: create test entry, verify in ImmuDB
4. [ ] No data gaps in audit trail
5. [ ] Replication re-established with remaining replica(s)
6. [ ] Backup schedule verified after topology change

---

## Scenario 2: Kafka Broker Failure

**Target RTO**: < 5 minutes

### Detection

1. Consumer lag increasing (`gacp_kafka_consumer_lag` metric)
2. Broker pod not Running
3. Under-replicated partitions alert

### Recovery

Kafka KRaft mode handles broker failure automatically:

```bash
# Check broker status
kubectl get pods -n gacp-data -l app=kafka

# Check partition leadership
kubectl exec -n gacp-data kafka-0 -- \
  kafka-metadata.sh --snapshot /var/lib/kafka/data/__cluster_metadata-0/*.log \
  --describe-partitions 2>/dev/null | head -20

# If broker pod is stuck, delete and let StatefulSet recreate
kubectl delete pod kafka-<N> -n gacp-data

# Verify recovery
kubectl exec -n gacp-data kafka-0 -- \
  kafka-topics.sh --bootstrap-server localhost:9092 --describe --under-replicated-partitions
```

### Post-Recovery

1. [ ] All partitions fully replicated
2. [ ] Consumer lag returning to 0
3. [ ] No messages lost (check audit consumer logs)

---

## Scenario 3: ImmuDB Failure

**Target RTO**: < 30 minutes

### Recovery

```bash
# Check pod status
kubectl get pods -n gacp-data -l app=immudb

# If pod restarting, check logs
kubectl logs -n gacp-data immudb-0 --tail=50

# If data corruption, restore from backup
# 1. Scale down
kubectl scale statefulset immudb -n gacp-data --replicas=0

# 2. Restore from MinIO backup
kubectl run immudb-restore --rm -it --image=codenotary/immudb:1.9 -- /bin/sh -c "
  mc alias set minio http://minio.gacp-data:9000 \$MINIO_ACCESS_KEY \$MINIO_SECRET_KEY
  LATEST=\$(mc ls minio/gacp-erp-backups/immudb/ | tail -1 | awk '{print \$NF}')
  mc cp minio/gacp-erp-backups/immudb/\${LATEST}/backup.tar.gz /tmp/
  tar -xzf /tmp/backup.tar.gz -C /var/lib/immudb/
"

# 3. Scale up
kubectl scale statefulset immudb -n gacp-data --replicas=1
```

---

## Communication Template

```
INCIDENT: [Component] Failure
STATUS: [Detected | Investigating | Mitigating | Resolved]
IMPACT: [Description of user impact]
RTO TARGET: [X minutes]
CURRENT STATUS: [Description]
NEXT UPDATE: [Time]
```

---

## Escalation Matrix

| Severity | Response Time | Escalation |
|----------|--------------|------------|
| P1 (Critical - data loss risk) | 15 min | Engineering Lead → CTO |
| P2 (Major - service degradation) | 30 min | Engineering Lead |
| P3 (Minor - partial impact) | 2 hours | On-call engineer |
| P4 (Low - no immediate impact) | Next business day | Ticket |
