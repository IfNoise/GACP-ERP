# GACP-ERP — Failback Runbook

**Document ID**: RB-DR-FAILBACK-001
**Version**: 1.0
**Classification**: Critical Operations
**Last Updated**: 2025-01-01

---

## Purpose

This runbook describes the procedure for returning GACP-ERP services to normal operation after a failover event, restoring the original primary topology.

---

## Pre-Conditions

- [ ] Failover completed successfully (see DR_FAILOVER.md)
- [ ] Root cause identified and resolved
- [ ] Original node repaired or replaced
- [ ] Maintenance window scheduled
- [ ] All stakeholders notified

---

## Scenario 1: PostgreSQL Failback

### Step 1 — Assess Current State

```bash
# Current topology
kubectl cnpg status postgres -n gacp-data

# Verify current primary is healthy
kubectl exec -n gacp-data $(kubectl get pods -n gacp-data -l cnpg.io/instanceRole=primary -o name) \
  -- psql -U gacp_admin -d gacp_erp -c "SELECT pg_current_wal_lsn();"
```

### Step 2 — Rejoin Former Primary as Replica

CloudNativePG handles this automatically when the pod restarts:

```bash
# If former primary pod is not running, let StatefulSet recreate it
kubectl delete pod postgres-0 -n gacp-data  # adjust name as needed

# Monitor rejoin
kubectl cnpg status postgres -n gacp-data --watch
```

### Step 3 — Verify Replication Sync

```bash
# Wait for replica to catch up
kubectl cnpg status postgres -n gacp-data | grep -A2 "Streaming"

# Verify sync
kubectl exec -n gacp-data postgres-0 -- psql -U gacp_admin -d gacp_erp \
  -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"
# Target: < 1 second
```

### Step 4 — Switchover (Optional)

If restoring original primary topology is desired:

```bash
# Controlled switchover (zero downtime)
kubectl cnpg promote postgres -n gacp-data --instance postgres-0

# Verify switchover
kubectl cnpg status postgres -n gacp-data
```

> **Note**: Switchover is optional. CloudNativePG does not require the original primary to be promoted back. The cluster is fully functional with the new primary.

### Step 5 — Post-Failback Verification

1. [ ] Primary role on expected pod
2. [ ] All replicas streaming and in sync
3. [ ] All services writing to correct endpoint
4. [ ] Audit trail continuous (no gaps around switchover time)
5. [ ] Backup schedule resumed
6. [ ] Monitoring alerts cleared

---

## Scenario 2: Kafka Failback

After broker replacement/recovery:

```bash
# Verify all brokers present
kubectl get pods -n gacp-data -l app=kafka

# Check for under-replicated partitions
kubectl exec -n gacp-data kafka-0 -- \
  kafka-topics.sh --bootstrap-server localhost:9092 --describe --under-replicated-partitions
# Expected: empty output

# Rebalance partitions if needed
kubectl exec -n gacp-data kafka-0 -- \
  kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --reassignment-json-file /tmp/reassignment.json --execute
```

---

## Scenario 3: Return from DR Site

If operating from DR site (AWS/Azure), see DR_MULTICLOUD.md for reverse replication.

---

## Post-Incident Review

After failback is complete:

1. Schedule post-incident review within 48 hours
2. Document in incident report:
   - Timeline of events
   - Root cause analysis
   - Impact assessment (data loss, downtime)
   - Actions taken
   - Lessons learned
   - Improvement items
3. Update runbooks if procedures need adjustment
4. File any CAPA if quality-impacting (create CAPA in GACP-ERP system)
