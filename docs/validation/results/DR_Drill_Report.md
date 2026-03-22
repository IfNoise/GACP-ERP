# GACP-ERP — Disaster Recovery Drill Report

**Document ID**: VAL-DR-DRILL-001
**Version**: 1.0
**Execution Date**: _[To be filled during drill execution]_
**Executed By**: _[Name]_
**Reviewed By**: _[Name]_

---

## Executive Summary

This report documents the results of the GACP-ERP disaster recovery drill, validating backup integrity, failover procedures, and recovery time objectives (RTO/RPO) as required by 21 CFR Part 11 §11.10 and EU GMP Annex 11 §7.2.

---

## Drill Scenarios

### Scenario 1: PostgreSQL Primary Node Failure

| Parameter | Target | Actual | Pass/Fail |
|-----------|--------|--------|-----------|
| **RTO** | < 15 minutes | ___ minutes | ☐ |
| **RPO** | < 5 minutes | ___ minutes | ☐ |
| Automatic failover triggered | Yes | ☐ Yes / ☐ No | ☐ |
| Services reconnected | All | ☐ All / ☐ Partial | ☐ |
| Audit trail continuous | No gaps | ☐ Verified | ☐ |
| Data loss | 0 records | ___ records | ☐ |

**Steps Executed:**

1. [ ] Identified current primary pod: `___`
2. [ ] Stopped primary: `kubectl delete pod postgres-X -n gacp-data`
3. [ ] Monitored CloudNativePG automatic failover
4. [ ] New primary promoted: `___` at `___` (time)
5. [ ] Verified service reconnection (checked pod logs)
6. [ ] Verified audit trail continuity (checked ImmuDB)
7. [ ] Verified no data loss

**Observations:**

```
[Fill during drill execution]
```

---

### Scenario 2: Kafka Broker Failure

| Parameter | Target | Actual | Pass/Fail |
|-----------|--------|--------|-----------|
| **Recovery time** | < 5 minutes | ___ minutes | ☐ |
| Partition leadership transferred | Yes | ☐ Yes / ☐ No | ☐ |
| Message loss | 0 | ___ messages | ☐ |
| Consumer lag recovered | < 5 min | ___ minutes | ☐ |

**Steps Executed:**

1. [ ] Identified broker to stop: `kafka-X`
2. [ ] Stopped broker: `kubectl delete pod kafka-X -n gacp-data`
3. [ ] Monitored partition leadership transfer
4. [ ] Checked consumer lag: `___`
5. [ ] Verified no message loss in audit-consumer logs
6. [ ] Broker pod restarted and rejoined cluster

**Observations:**

```
[Fill during drill execution]
```

---

### Scenario 3: Full Cluster Recovery from Backup

| Parameter | Target | Actual | Pass/Fail |
|-----------|--------|--------|-----------|
| **RTO** | < 30 minutes | ___ minutes | ☐ |
| PostgreSQL restored | Complete | ☐ Yes / ☐ No | ☐ |
| ImmuDB restored | Complete | ☐ Yes / ☐ No | ☐ |
| Data consistency verified | All tables | ☐ Yes / ☐ No | ☐ |
| Audit trail integrity | Verified | ☐ Yes / ☐ No | ☐ |

**Steps Executed:**

1. [ ] Identified latest backup: `___` (date)
2. [ ] Restored PostgreSQL from CloudNativePG barman backup
3. [ ] Restored ImmuDB from MinIO backup
4. [ ] Ran integrity checks:
   - `SELECT count(*) FROM plants`: ___
   - `SELECT count(*) FROM audit_trail`: ___
   - ImmuDB `VerifiedGet` on known TX: ☐ Pass / ☐ Fail
5. [ ] Verified all services started successfully
6. [ ] Ran smoke tests

**Observations:**

```
[Fill during drill execution]
```

---

## Backup Verification Results

| Backup Type | Last Backup | Size | Integrity Check | Status |
|-------------|-------------|------|-----------------|--------|
| PostgreSQL (barman) | ___ | ___ | ☐ Pass / ☐ Fail | ☐ |
| ImmuDB | ___ | ___ | ☐ Pass / ☐ Fail | ☐ |
| MongoDB | ___ | ___ | ☐ Pass / ☐ Fail | ☐ |
| WORM audit data | ___ | ___ | ☐ Pass / ☐ Fail | ☐ |

---

## Deviations from Plan

| # | Description | Impact | Corrective Action |
|---|-------------|--------|-------------------|
| 1 | ___ | ___ | ___ |

---

## Recommendations

1. ___
2. ___

---

## Conclusion

_[Summary: drill passed/failed, system meets/does not meet RTO/RPO targets]_

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Executed by | ___ | ___ | ___ |
| Reviewed by | ___ | ___ | ___ |
| Approved by | ___ | ___ | ___ |

---

**Next Scheduled Drill**: _[Quarterly — next date]_
