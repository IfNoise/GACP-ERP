---
title: "Go Audit Trail Consumer - Technical Specification"
version: "1.0.0"
status: "Draft"
owner: "Platform Engineering"
approvers:
  - "DevOps Lead"
  - "QA Manager"
  - "Security Officer"
created: "2025-09-13"
system: "GACP-ERP Audit Trail Pipeline"
compliance:
  - "ALCOA+ principles"
  - "EU GMP Annex 11"
  - "FDA 21 CFR Part 11"
---

# Go Audit Trail Consumer - Technical Specification

## 1. Overview

The Go Audit Consumer is a high-performance, microservice-based component responsible for consuming audit events from Apache Kafka and persisting them to both immudb (cryptographic audit trail) and PostgreSQL (query performance replica). This service ensures GACP compliance by implementing ALCOA+ principles for audit trail integrity.

## 2. Architecture Requirements

### 2.1 Performance Targets
- **Throughput**: ≥ 10,000 events/second sustained
- **Latency**: P95 < 50ms for batch processing  
- **Batch Size**: 100-1000 events per batch (configurable)
- **Memory Usage**: < 512MB under normal load
- **Recovery Time**: < 30 seconds after restart

### 2.2 Reliability Requirements
- **Circuit Breaker**: Fail-fast pattern for downstream dependencies
- **Retry Logic**: Exponential backoff with jitter (max 3 retries)
- **Dead Letter Queue**: Failed messages after retry exhaustion
- **Graceful Shutdown**: Complete current batch before termination
- **Health Checks**: /health and /ready endpoints for K8s

### 2.3 Compliance Requirements
- **ALCOA+ Adherence**: Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available
- **Immutability**: No UPDATE/DELETE operations on audit records
- **Cryptographic Integrity**: Use immudb tamper-proof features
- **Timestamp Accuracy**: NTP-synchronized timestamps with timezone handling

## 3. Data Flow Architecture

```
Kafka Topic                Go Consumer               Storage
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│ audit-events    │ ──►  │ Batch Consumer  │ ──► │ immudb (Primary)│
│ - user-actions  │      │ - Circuit Break │     │ - Cryptographic │
│ - system-events │      │ - Retry Logic   │     │ - Append-only   │
│ - compliance    │      │ - Health Check  │     │ - Tamper-proof  │
└─────────────────┘      └─────────────────┘     └─────────────────┘
                                 │
                                 ▼
                         ┌─────────────────┐
                         │ PostgreSQL      │
                         │ (Query Replica) │
                         │ - Fast queries  │
                         │ - Reporting     │
                         └─────────────────┘
```

## 4. Event Schema

### 4.1 Audit Event Structure
```go
type AuditEvent struct {
    // ALCOA+ Required Fields
    EventID          string    `json:"event_id"`          // Unique identifier
    Timestamp        time.Time `json:"timestamp"`         // When (Contemporaneous)
    UserID           string    `json:"user_id"`           // Who (Attributable)
    UserDisplayName  string    `json:"user_display_name"` // Legible user reference
    Action           string    `json:"action"`            // What (Accurate)
    Entity           string    `json:"entity"`            // Target entity type
    EntityID         string    `json:"entity_id"`         // Target entity ID
    BeforeValue      string    `json:"before_value"`      // Original state
    AfterValue       string    `json:"after_value"`       // New state
    Reason           string    `json:"reason"`            // Why (Complete)
    
    // Additional Context
    SessionID        string    `json:"session_id"`        // Session context
    IPAddress        string    `json:"ip_address"`        // Source location
    UserAgent        string    `json:"user_agent"`        // Client information
    Module           string    `json:"module"`            // Source module
    RiskLevel        string    `json:"risk_level"`        // High/Medium/Low
    ComplianceFlags  []string  `json:"compliance_flags"`  // GACP, GMP tags
    
    // Technical Fields
    TraceID          string    `json:"trace_id"`          // Distributed tracing
    CorrelationID    string    `json:"correlation_id"`    // Request correlation
    SourceSystem     string    `json:"source_system"`     // Originating system
    EventVersion     string    `json:"event_version"`     // Schema version
}
```

### 4.2 Event Categories
- **USER_ACTION**: Manual user operations (create, update, delete, approve)
- **SYSTEM_EVENT**: Automated system operations (scheduled tasks, integrations)
- **COMPLIANCE_EVENT**: Specific GACP/GMP compliance activities (SOP execution, training completion)
- **SECURITY_EVENT**: Authentication, authorization, access control events
- **BATCH_LIFECYCLE**: Plant/batch lifecycle events (critical for traceability)

## 5. Monitoring & Observability

### 5.1 Prometheus Metrics
- `audit_events_processed_total{status="success|failure"}` - Counter
- `audit_events_processing_duration_seconds` - Histogram  
- `audit_batch_size` - Histogram
- `audit_consumer_lag` - Gauge
- `audit_immudb_operations_total{operation="insert|verify"}` - Counter
- `audit_postgres_operations_total{operation="insert|update"}` - Counter
- `audit_circuit_breaker_state{service="immudb|postgres"}` - Gauge

### 5.2 Health Checks
- `/health`: Overall service health
- `/ready`: Kubernetes readiness probe
- `/metrics`: Prometheus metrics endpoint

## 6. Deployment Configuration

### 6.1 Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-audit-consumer
  namespace: gacp-erp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: go-audit-consumer
  template:
    metadata:
      labels:
        app: go-audit-consumer
    spec:
      containers:
      - name: audit-consumer
        image: gacp-erp/go-audit-consumer:v1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: KAFKA_BROKERS
          value: "kafka:9092"
        - name: IMMUDB_HOST
          value: "immudb"
        - name: POSTGRES_HOST
          value: "postgresql"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 7. Compliance Validation

### 7.1 ALCOA+ Verification
- **Attributable**: User ID and display name recorded
- **Legible**: Human-readable event descriptions
- **Contemporaneous**: Real-time event capture with NTP sync
- **Original**: immutable storage in immudb
- **Accurate**: Data validation and integrity checks
- **Complete**: All required audit fields captured
- **Consistent**: Standardized event format and processing
- **Enduring**: Long-term retention with backup strategies
- **Available**: Query performance via PostgreSQL replica

### 7.2 Audit Trail Integrity
- Cryptographic verification via immudb
- No deletion or modification of audit records
- Complete event lineage and correlation
- Tamper-evident storage with digital signatures

## 8. Version History

| Version | Date | Description | Author |
|---------|------|-------------|---------|
| 1.0.0 | 2025-09-13 | Initial specification | Platform Engineering |

---

This specification provides a comprehensive foundation for implementing a production-ready, GACP-compliant audit trail consumer in Go, ensuring high performance, reliability, and regulatory compliance.