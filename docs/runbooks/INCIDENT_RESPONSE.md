---
title: "Incident Response Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Incident Response Runbook

## 1. Severity Classification

| Severity | Description | Response Time | Resolution Target | Escalation |
|----------|------------|---------------|-------------------|------------|
| **P1 — Critical** | System down, data loss, security breach | 15 min | 1 hour | Immediate: all engineers + management |
| **P2 — Major** | Core module degraded, significant user impact | 30 min | 4 hours | Lead engineer + manager |
| **P3 — Minor** | Non-critical feature impacted, workaround available | 2 hours | 24 hours | Assigned engineer |
| **P4 — Low** | Cosmetic issue, minor inconvenience | Next business day | 5 business days | Backlog |

### P1 Examples
- All services down
- Database corruption / data loss
- Audit trail system failure
- Security breach (unauthorized access)
- E-signature system failure

### P2 Examples
- Single core service down (quality, financial, cultivation)
- IoT data pipeline failure
- Performance degradation > 5x normal
- Backup failure

### P3 Examples
- Analytics dashboard error
- Non-critical reports broken
- Single sensor integration failure

## 2. Incident Workflow

```
Detection → Triage → Contain → Diagnose → Resolve → Verify → Post-Mortem
```

### 2.1 Detection

Sources:
- Grafana alerts (VictoriaMetrics)
- PagerDuty notifications
- User reports
- Automated health checks
- Loki log-based alerts

### 2.2 Triage (First 15 min)

```bash
# Quick system health check
kubectl get pods -n gacp-erp | grep -v Running
kubectl get events -n gacp-erp --sort-by='.lastTimestamp' | tail -20

# Check key metrics
# Grafana: System Overview dashboard
# - Error rate
# - P95 latency
# - Pod restarts
# - CPU/Memory usage

# Check logs
kubectl logs -n gacp-erp deploy/<service> --tail=100 --since=15m
```

### 2.3 Containment

| Scenario | Containment Action |
|----------|-------------------|
| Single service crash | Restart pod, check logs |
| Database issue | Failover to replica, stop writes if needed |
| Security breach | Isolate affected pods, revoke tokens |
| Data corruption | Stop affected service, preserve evidence |
| Network issue | Check Istio config, NetworkPolicies |

### 2.4 Diagnosis

```bash
# Distributed tracing
# Grafana → Explore → Tempo → Search by service/error

# Log correlation
# Grafana → Explore → Loki → {namespace="gacp-erp"} |= "error"

# Resource exhaustion
kubectl top pods -n gacp-erp --sort-by=cpu
kubectl describe pod <pod-name> -n gacp-erp
```

### 2.5 Resolution

Follow appropriate runbook:
- Service restart → `kubectl rollout restart deployment/<service> -n gacp-erp`
- Rollback → `docs/runbooks/ROLLBACK.md`
- Database → `docs/runbooks/DATABASE_MAINTENANCE.md`
- DR failover → `docs/runbooks/DR_FAILOVER.md`

### 2.6 Verification

- [ ] Affected service healthy (Running/Ready)
- [ ] Error rate returned to baseline (< 1%)
- [ ] P95 latency returned to baseline
- [ ] Audit trail recording events
- [ ] User-reported functionality restored
- [ ] No data loss confirmed

## 3. Escalation Matrix

| Level | Contact | Trigger |
|-------|---------|---------|
| L1 — On-call Engineer | PagerDuty rotation | Any alert |
| L2 — Lead Engineer | Direct contact | P1 or P2 unresolved in 30 min |
| L3 — Architecture Team | Slack #incident | Complex infrastructure issues |
| L4 — Management | Phone + email | P1 > 1 hour, data breach, regulatory impact |

## 4. Communication Template

### Internal (Slack #incident)

```
🚨 INCIDENT: [P1/P2/P3/P4] — [Brief description]
Impact: [What users/systems are affected]
Status: [Investigating / Contained / Resolving]
ETA: [Estimated resolution time]
Lead: [Engineer name]
```

### Stakeholder Update

```
Subject: GACP-ERP Incident Update — [Severity]

Current Status: [Status]
Impact: [Description of user impact]
Root Cause: [If known]
Next Update: [Time]
```

## 5. Evidence Preservation (GxP)

For any incident affecting GxP data:

1. **Do NOT delete logs** — preserve all evidence
2. Capture screenshots of Grafana dashboards
3. Export relevant Loki logs: `logcli query '{namespace="gacp-erp"}' --from=<start> --to=<end> > incident-logs.txt`
4. Export Tempo traces for affected period
5. Record ImmuDB audit entries for the incident window
6. Document all actions taken with timestamps

## 6. Post-Incident Review

Within 48 hours of P1/P2 resolution:

1. Create Post-Incident Report:
   - Timeline of events
   - Root cause analysis (5 Whys)
   - Impact assessment
   - Actions taken
   - Preventive measures
2. Review with team
3. Create follow-up tickets for preventive measures
4. Update runbooks if gaps identified
5. If GxP-relevant: create deviation report in quality module
