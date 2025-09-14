---
title: "Go Audit Trail Consumer Specification"
document_number: "SPEC-AUD-001"
version: "2.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approval: "System Architect"
---

# Go Audit Trail Consumer Specification

## 1. Overview

Данная спецификация определяет требования к высокопроизводительному Audit Trail Consumer на языке Go, который обеспечивает неизменяемое логирование всех событий ERP системы для GACP-совместимого производства каннабиса.

## 2. Architecture Decision

### 2.1 Language Choice: Go
**Обоснование выбора Go:**
- Высокая производительность и низкая латентность
- Отличная интеграция с Kafka (sarama, segmentio/kafka-go)
- Нативная поддержка immudb клиента
- Конкурентная модель goroutines для обработки миллионов событий
- Стабильность на высоких нагрузках
- Компактные бинарники для Docker deployment

**Интеграция с TypeScript:**
- Contract-first approach: Zod schemas → JSON Schema → Go structs
- Автоматическая генерация типов через quicktype/protobuf
- End-to-end типобезопасность от frontend до storage

### 2.2 Event-Driven Architecture
```
[ERP Monolith/Microservices] → [Kafka Broker] → [Go Audit Consumer] → [immudb Storage]
                                      ↓
                             [Other Consumers] (analytics, notifications)
```

## 3. Technical Requirements

### 3.1 Kafka Integration
- **Consumer Group**: `audit-trail-consumer`
- **Topics**: Subscribe to all ERP topics (`plant-events`, `financial-events`, `workforce-events`, etc.)
- **Offset Management**: Auto-commit with configurable intervals
- **Throughput**: Support for 1M+ events/day
- **Latency**: < 100ms end-to-end processing time

### 3.2 immudb Storage
- **Storage Type**: Immutable, cryptographically verifiable key-value store
- **Data Format**: JSON events with timestamp + entity_id keys
- **Verification**: Cryptographic proof of data integrity
- **Retention**: Permanent storage for compliance

### 3.3 Type Safety
```go
// Generated from Zod schemas
type PlantCreatedEvent struct {
    ID        string    `json:"id"`
    Strain    string    `json:"strain"`
    CreatedAt time.Time `json:"createdAt"`
    UserID    string    `json:"userId"`
    Action    string    `json:"action"`
}

type FinancialTransactionEvent struct {
    TransactionID string  `json:"transactionId"`
    Amount        float64 `json:"amount"`
    Currency      string  `json:"currency"`
    BatchID       string  `json:"batchId"`
    Timestamp     time.Time `json:"timestamp"`
}
```

### 3.4 PDF Report Generation
- **Library**: gofpdf или unidoc/unipdf
- **Triggers**: Daily, weekly, monthly reports
- **Storage**: MinIO/S3 compatible storage
- **Content**: Audit trail summaries, compliance reports

## 4. Implementation Structure

### 4.1 Project Structure
```
services/audit-trail-go/
├── cmd/
│   └── main.go                 # Entry point
├── internal/
│   ├── consumer/               # Kafka consumer logic
│   │   ├── consumer.go
│   │   └── handler.go
│   ├── storage/                # immudb integration
│   │   ├── immudb.go
│   │   └── storage.go
│   ├── reports/                # PDF generation
│   │   ├── generator.go
│   │   └── templates.go
│   ├── events/                 # Generated Go structs
│   │   ├── plant_events.go
│   │   ├── financial_events.go
│   │   └── workforce_events.go
│   └── config/                 # Configuration
│       └── config.go
├── pkg/
│   └── contracts/              # Shared event contracts
├── scripts/
│   └── generate-types.sh       # Type generation from schemas
├── go.mod
├── go.sum
├── Dockerfile
└── docker-compose.yml
```

### 4.2 Core Components

#### 4.2.1 Kafka Consumer
```go
type Consumer struct {
    reader     *kafka.Reader
    immuClient client.ImmuClient
    logger     *zap.Logger
}

func (c *Consumer) Start(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            msg, err := c.reader.ReadMessage(ctx)
            if err != nil {
                c.logger.Error("Failed to read message", zap.Error(err))
                continue
            }
            
            if err := c.processEvent(msg); err != nil {
                c.logger.Error("Failed to process event", zap.Error(err))
            }
        }
    }
}
```

#### 4.2.2 Event Processing
```go
func (c *Consumer) processEvent(msg kafka.Message) error {
    // Validate event structure
    var baseEvent BaseEvent
    if err := json.Unmarshal(msg.Value, &baseEvent); err != nil {
        return fmt.Errorf("invalid event structure: %w", err)
    }
    
    // Store in immudb with cryptographic verification
    key := fmt.Sprintf("%s_%s_%d", baseEvent.Type, baseEvent.EntityID, baseEvent.Timestamp.Unix())
    _, err := c.immuClient.Set(ctx, []byte(key), msg.Value)
    return err
}
```

### 4.3 Report Generation
```go
type ReportGenerator struct {
    storage    ObjectStorage
    immuClient client.ImmuClient
}

func (r *ReportGenerator) GenerateDailyAuditReport(date time.Time) error {
    // Query events from immudb for the date
    events, err := r.queryEventsByDate(date)
    if err != nil {
        return err
    }
    
    // Generate PDF
    pdf := gofpdf.New("P", "mm", "A4", "")
    pdf.AddPage()
    
    // Add content to PDF
    r.addAuditSummary(pdf, events)
    
    // Save to storage
    filename := fmt.Sprintf("audit-report-%s.pdf", date.Format("2006-01-02"))
    return r.storage.Upload(filename, pdf)
}
```

## 5. Configuration

### 5.1 Environment Variables
```bash
# Kafka Configuration
KAFKA_BROKERS=kafka:9092
KAFKA_GROUP_ID=audit-trail-consumer
KAFKA_TOPICS=plant-events,financial-events,workforce-events

# immudb Configuration
IMMUDB_HOST=immudb
IMMUDB_PORT=3322
IMMUDB_USER=immudb
IMMUDB_PASSWORD=immudb
IMMUDB_DATABASE=audit_trail

# Storage Configuration
STORAGE_TYPE=minio
STORAGE_ENDPOINT=minio:9000
STORAGE_BUCKET=audit-reports
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin

# Performance Tuning
CONSUMER_BATCH_SIZE=100
CONSUMER_WORKERS=4
REPORT_SCHEDULE=0 2 * * *  # Daily at 2 AM
```

### 5.2 Docker Configuration
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o audit-consumer cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/audit-consumer .
CMD ["./audit-consumer"]
```

## 6. Performance Requirements

### 6.1 Throughput
- **Target**: 10,000+ events/second
- **Peak Load**: 50,000+ events/second
- **Batch Processing**: 100-1000 events per batch

### 6.2 Latency
- **Event Processing**: < 100ms per event
- **Storage Write**: < 50ms to immudb
- **Report Generation**: < 5 minutes for daily report

### 6.3 Reliability
- **Uptime**: 99.9% availability
- **Data Loss**: Zero tolerance
- **Recovery Time**: < 5 minutes from failure

## 7. Monitoring & Observability

### 7.1 Metrics (Prometheus)
```go
var (
    eventsProcessed = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "audit_events_processed_total",
            Help: "Total number of audit events processed",
        },
        []string{"event_type", "status"},
    )
    
    processingLatency = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "audit_processing_duration_seconds",
            Help: "Time taken to process audit events",
        },
        []string{"event_type"},
    )
)
```

### 7.2 Health Checks
```go
func (c *Consumer) HealthCheck() error {
    // Check Kafka connectivity
    if err := c.reader.Stats(); err != nil {
        return fmt.Errorf("kafka unhealthy: %w", err)
    }
    
    // Check immudb connectivity
    if err := c.immuClient.HealthCheck(ctx); err != nil {
        return fmt.Errorf("immudb unhealthy: %w", err)
    }
    
    return nil
}
```

## 8. Deployment & Scaling

### 8.1 Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: audit-trail-consumer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: audit-trail-consumer
  template:
    spec:
      containers:
      - name: audit-consumer
        image: audit-trail-go:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 8.2 Horizontal Scaling
- Multiple consumer instances with different partition assignments
- Load balancing through Kafka consumer groups
- Stateless design for easy scaling

## 9. Security

### 9.1 Data Encryption
- TLS for Kafka connections
- Encrypted storage in immudb
- Secure credential management

### 9.2 Access Control
- Service account authentication
- RBAC for Kubernetes deployment
- Audit trail access logging

## 10. Compliance

### 10.1 Regulatory Requirements
- GACP compliance for audit trail integrity
- 21 CFR Part 11 for electronic records
- EU GMP Annex 11 for computerized systems

### 10.2 Data Retention
- Permanent retention in immudb
- Periodic backup to long-term storage
- Compliance reporting capabilities

## 11. Migration & Integration

### 11.1 Nx Monorepo Integration
- Use @nx-go/nx-go plugin for Go support
- Shared contract generation from TypeScript schemas
- Unified CI/CD pipeline

### 11.2 Type Generation Pipeline
```bash
# Generate JSON Schema from Zod
npm run generate:schemas

# Generate Go structs from JSON Schema
quicktype -s schema libs/contracts/schemas/*.json -o services/audit-trail-go/internal/events/

# Build and test Go service
nx build audit-trail-go
nx test audit-trail-go
```

## 12. References

- Kafka Go Client: https://github.com/segmentio/kafka-go
- immudb Go SDK: https://github.com/codenotary/immudb
- PDF Generation: https://github.com/jung-kurt/gofpdf
- Nx Go Plugin: https://github.com/nx-go/nx-go
- GACP Guidelines: WHO/TRS/937
- 21 CFR Part 11: FDA Electronic Records