---
title: "Database Maintenance Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Database Maintenance Runbook

## 1. PostgreSQL (CloudNativePG)

### 1.1 Scheduled VACUUM

CloudNativePG enables autovacuum by default. Verify and manually trigger if needed:

```bash
# Check autovacuum status
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT schemaname, relname, last_vacuum, last_autovacuum, n_dead_tup
   FROM pg_stat_user_tables
   ORDER BY n_dead_tup DESC
   LIMIT 20;"

# Manual VACUUM ANALYZE on specific table
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c "VACUUM ANALYZE plants;"

# Full VACUUM (requires downtime — schedule maintenance window)
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c "VACUUM FULL plants;"
```

### 1.2 REINDEX

```bash
# Check index bloat
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) as size
   FROM pg_stat_user_indexes
   ORDER BY pg_relation_size(indexrelid) DESC
   LIMIT 20;"

# Reindex specific table (non-blocking with CONCURRENTLY)
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c "REINDEX TABLE CONCURRENTLY plants;"

# Reindex entire database (schedule maintenance window)
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c "REINDEX DATABASE CONCURRENTLY gacp_erp;"
```

### 1.3 Statistics Update

```bash
# Update statistics for query planner
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c "ANALYZE;"
```

### 1.4 Dead Tuple Monitoring

Alert threshold: > 10,000 dead tuples on any table.

```bash
# Monitor dead tuples
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT relname, n_live_tup, n_dead_tup,
          ROUND(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2) as dead_pct
   FROM pg_stat_user_tables
   WHERE n_dead_tup > 1000
   ORDER BY n_dead_tup DESC;"
```

### 1.5 Connection Monitoring

```bash
# Active connections
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# Long-running queries (> 5 min)
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT pid, now() - query_start as duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - query_start > interval '5 minutes';"

# Kill stuck query
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c "SELECT pg_terminate_backend(<PID>);"
```

### 1.6 Storage Monitoring

```bash
# Database size
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT pg_size_pretty(pg_database_size('gacp_erp'));"

# Table sizes
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U gacp -d gacp_erp -c \
  "SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
   FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 15;"
```

## 2. ImmuDB Maintenance

```bash
# Check ImmuDB status
kubectl exec -n gacp-data deploy/immudb -- immuadmin status

# Database info
kubectl exec -n gacp-data deploy/immudb -- immuadmin database list

# Compaction (reduces storage)
kubectl exec -n gacp-data deploy/immudb -- immuadmin database compact gacp_audit_ledger
```

## 3. Maintenance Schedule

| Task | Frequency | Window | Impact |
|------|-----------|--------|--------|
| VACUUM ANALYZE (auto) | Continuous | N/A | None |
| VACUUM FULL | Monthly | Sunday 02:00-04:00 UTC | Brief table locks |
| REINDEX CONCURRENTLY | Monthly | Sunday 02:00-04:00 UTC | Minimal |
| ANALYZE (full) | Weekly | Sunday 01:00 UTC | None |
| Dead tuple check | Daily | Automated alert | None |
| Connection audit | Weekly | Manual | None |
| Storage check | Weekly | Automated alert at 80% | None |
| ImmuDB compaction | Monthly | Sunday 05:00 UTC | Brief pause |
