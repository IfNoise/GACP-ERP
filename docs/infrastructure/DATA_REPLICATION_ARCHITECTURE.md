---
title: "Data Replication & High Availability Architecture"
version: "1.0"
status: "active"
last_updated: "2025-09-14"
type: "infrastructure"
audience: "Auditors, DevOps, IT Administration"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: draft
---

# Data Replication & High Availability Architecture

**Документ**: Data Replication Architecture Specification  
**Версия**: 1.0  
**Дата**: 14 сентября 2025  
**Статус**: КРИТИЧЕСКИЙ - Основа для GACP-аудита  
**Целевая аудитория**: Аудиторы, DevOps, IT Administration

---

## 🎯 **1. ВВЕДЕНИЕ И ЦЕЛИ**

### 1.1 Назначение документа

Данный документ описывает архитектуру репликации данных в GACP-ERP системе для обеспечения:

- **Непрерывности бизнеса**: RTO ≤ 1 час, RPO ≤ 15 минут
- **GACP-соответствия**: Полная трассируемость и неизменяемость audit trail
- **Надежности данных**: Multi-tier backup и geo-redundancy
- **Готовности к аудиту**: Документированные процедуры восстановления

### 1.2 Регуляторные требования

Архитектура соответствует:

- **ALCOA+ Data Integrity**: Неизменяемость критических записей
- **FDA 21 CFR Part 11**: Электронные записи и подписи
- **EU GMP Annex 11**: Компьютеризированные системы
- **GACP Guidelines**: Надлежащие практики культивирования

### 1.3 Ключевые показатели

| Компонент         | RPO      | RTO      | Доступность | Схема репликации         |
| ----------------- | -------- | -------- | ----------- | ------------------------ |
| **Audit Trail**   | < 5 мин  | < 30 мин | 99.9%       | Синхронная → Cloud WORM  |
| **Production DB** | < 15 мин | < 1 час  | 99.5%       | Streaming → Multi-cloud  |
| **IoT Metrics**   | < 1 час  | < 4 часа | 99.0%       | Асинхронная → TimeSeries |
| **Documents**     | < 1 час  | < 4 часа | 99.5%       | Object → Cross-region    |

---

## 🏗️ **2. АРХИТЕКТУРА РЕПЛИКАЦИИ**

### 2.1 Общая схема системы

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         FARM SITE (PRIMARY)                        │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │PostgreSQL   │ │Kafka        │ │immudb       │ │MinIO        │   │
│ │Primary      │ │Cluster      │ │AuditTrail   │ │Object Store │   │
│ │Cluster      │ │(3 brokers)  │ │(WORM)       │ │(Documents)  │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                        REPLICATION LAYER
                              │
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Kafka        │ │WAL-G        │ │Minio Client │ │Vector.dev   │   │
│ │Connect      │ │Streaming    │ │Replication  │ │Log Forward  │   │
│ │(CDC)        │ │Replication  │ │Agent        │ │Agent        │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                         CLOUD REPLICAS
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                    MULTI-CLOUD REPLICAS                            │
├─────────────────────────────────────────────────────────────────────┤
│ AWS Region 1        │ AWS Region 2        │ Azure Region           │
│ ┌─────────────┐    │ ┌─────────────┐    │ ┌─────────────┐        │
│ │RDS PostgreSQL│    │ │S3 WORM      │    │ │PostgreSQL   │        │
│ │Read Replica  │    │ │Audit Store  │    │ │Flex Server  │        │
│ └─────────────┘    │ └─────────────┘    │ └─────────────┘        │
│ ┌─────────────┐    │ ┌─────────────┐    │ ┌─────────────┐        │
│ │Timestream   │    │ │CloudWatch   │    │ │Blob Storage │        │
│ │IoT Metrics  │    │ │Monitoring   │    │ │Documents    │        │
│ └─────────────┘    │ └─────────────┘    │ └─────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Компоненты репликации

#### 2.2.1 PostgreSQL Streaming Replication

**Конфигурация Primary:**

```sql
-- postgresql.conf
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
synchronous_standby_names = 'aws_replica,azure_replica'
synchronous_commit = remote_write
archive_mode = on
archive_command = 'wal-g wal-push %p'
```

**Схема репликации:**

1. **Primary → AWS RDS**: Streaming replication (5-15 сек лаг)
2. **Primary → Azure**: Streaming replication (10-30 сек лаг)
3. **AWS → S3 WORM**: WAL архивирование (каждые 5 минут)
4. **Local → Cloud**: Ежедневные pgdump бэкапы

#### 2.2.2 Kafka Event Streaming

**Cluster Configuration:**

```properties
# server.properties
broker.id=1,2,3
num.network.threads=8
num.io.threads=16
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
num.partitions=12
num.recovery.threads.per.data.dir=1
offsets.topic.replication.factor=3
transaction.state.log.replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false
```

**Topics и репликация:**

- `audit.events` (replication.factor=3, min.insync.replicas=2)
- `iot.metrics` (replication.factor=3, min.insync.replicas=1)
- `database.changes` (replication.factor=3, min.insync.replicas=2)
- `system.logs` (replication.factor=2, min.insync.replicas=1)

#### 2.2.3 immudb Audit Trail Replication

**WORM Storage для аудита:**

```typescript
// immudb replication configuration
interface AuditReplicationConfig {
  primary: {
    host: "immudb-primary.farm.local";
    port: 3322;
    database: "audit_trail";
    replication: "sync";
  };
  replicas: [
    {
      provider: "AWS";
      service: "DocumentDB"; // MongoDB-compatible
      region: "us-west-2";
      worm: true;
      retention: "10_years";
    },
    {
      provider: "Azure";
      service: "CosmosDB";
      region: "westeurope";
      worm: true;
      retention: "10_years";
    }
  ];
}
```

**Replication Flow:**

1. **Write** → Primary immudb
2. **Sync** → Cloud DocumentDB/CosmosDB (< 5 сек)
3. **Verify** → Cryptographic hash validation
4. **Archive** → Long-term WORM storage

---

## 📊 **3. DATA CLASSIFICATION & REPLICATION POLICIES**

### 3.1 Критические данные (RPO ≤ 15 мин, RTO ≤ 1 час)

#### 3.1.1 Audit Trail Data

- **Источник**: immudb
- **Репликация**: Синхронная → AWS DocumentDB + Azure CosmosDB
- **WORM**: Включен на всех репликах
- **Верификация**: Cryptographic hash validation каждые 15 минут
- **Retention**: 10+ лет

#### 3.1.2 Production Database

- **Источник**: PostgreSQL Primary
- **Репликация**: Streaming → AWS RDS + Azure PostgreSQL
- **Backup**: WAL-G → S3 + Azure Blob (каждые 15 минут)
- **Point-in-time recovery**: 30 дней
- **Cross-region**: Ежедневные полные backups

#### 3.1.3 Documents (Mayan EDMS)

- **Источник**: MinIO Primary Cluster
- **Репликация**: Cross-region → AWS S3 + Azure Blob
- **Versioning**: Включено на всех репликах
- **Object Lock**: WORM для regulatory documents
- **Encryption**: AES-256 (at rest + in transit)

### 3.2 Важные данные (RPO ≤ 1 час, RTO ≤ 4 часа)

#### 3.2.1 IoT Metrics (VictoriaMetrics)

- **Источник**: VictoriaMetrics cluster
- **Репликация**: Асинхронная → AWS Timestream + Azure Data Explorer
- **Retention**: 5 лет (1-hour resolution), 1 год (5-minute resolution)
- **Compression**: Built-in time-series compression

#### 3.2.2 Application Logs

- **Источник**: ELK Stack
- **Репликация**: Vector → AWS CloudWatch + Azure Monitor
- **Retention**: 90 дней (operational), 2 года (audit logs)

### 3.3 Стандартные данные (RPO ≤ 24 часа, RTO ≤ 24 часа)

#### 3.3.1 Development/Test Data

- **Источник**: Test PostgreSQL
- **Репликация**: Ежедневные dumps → Cloud storage
- **Retention**: 30 дней

---

## 🔄 **4. REPLICATION MONITORING & ALERTING**

### 4.1 Key Performance Indicators (KPIs)

#### 4.1.1 PostgreSQL Replication Metrics

```sql
-- Monitoring queries for replication lag
SELECT
    client_addr,
    client_hostname,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    (EXTRACT(EPOCH FROM NOW()) - EXTRACT(EPOCH FROM reply_time))::int AS lag_seconds
FROM pg_stat_replication;

-- Check replication slot status
SELECT
    slot_name,
    plugin,
    slot_type,
    database,
    active,
    restart_lsn,
    confirmed_flush_lsn
FROM pg_replication_slots;
```

#### 4.1.2 Kafka Replication Metrics

- `kafka.server:type=ReplicaManager,name=LeaderCount`
- `kafka.server:type=ReplicaManager,name=PartitionCount`
- `kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions`
- `kafka.consumer.lag` по каждому топику

#### 4.1.3 Object Storage Replication

- **Cross-region sync lag**: MaxAge of objects not yet replicated
- **Failed operations**: PUT/GET error rates by region
- **Object integrity**: MD5/SHA256 checksum validation results

### 4.2 Alerting Rules

#### 4.2.1 Critical Alerts (Immediate response)

- **PostgreSQL replica lag > 5 minutes**
- **Kafka under-replicated partitions > 0**
- **immudb sync failure**
- **S3 cross-region replication failure**

#### 4.2.2 Warning Alerts (Response within 1 hour)

- **PostgreSQL replica lag > 1 minute**
- **Kafka consumer lag > 1000 messages**
- **Object storage sync lag > 15 minutes**

### 4.3 Monitoring Dashboard

**Grafana Dashboard Components:**

1. **Replication Health Overview**

   - Service status indicators
   - Real-time lag metrics
   - Error rate trends

2. **Data Flow Visualization**

   - Message throughput by topic
   - Bytes replicated per service
   - Failed replication attempts

3. **Compliance Metrics**
   - RPO/RTO compliance percentages
   - WORM integrity verification
   - Audit trail completeness

---

## 🛡️ **5. SECURITY & COMPLIANCE**

### 5.1 Encryption Standards

#### 5.1.1 Data in Transit

- **TLS 1.3** для всех replication connections
- **mTLS** для service-to-service communication
- **VPN tunneling** для cross-cloud replication
- **Certificate rotation** каждые 90 дней

#### 5.1.2 Data at Rest

- **AES-256** encryption для всех storage layers
- **Key Management**: HashiCorp Vault + Cloud HSM
- **Encrypted backups** with separate key management
- **LUKS** encryption для local storage

### 5.2 Access Control

#### 5.2.1 Replication Service Accounts

```yaml
# PostgreSQL replication user
postgres_replication_user:
  username: "replicator"
  permissions: ["REPLICATION", "LOGIN"]
  password_rotation: "90_days"
  mfa_required: true

# Cloud service accounts
aws_replication_role:
  service: "RDS"
  permissions: ["rds:CreateDBSnapshot", "s3:PutObject"]
  assume_role_policy: "farm_replication_policy"

azure_replication_identity:
  service: "PostgreSQL"
  permissions: ["Backup", "ReplicationReader"]
  rbac_assignment: "Reader"
```

#### 5.2.2 Network Security

- **Private endpoints** для cloud replication
- **IP whitelisting** для source and destination
- **Firewall rules** restricting replication ports
- **Network segmentation** между production и replication

### 5.3 Audit & Compliance Features

#### 5.3.1 Replication Audit Trail

```sql
-- Audit table for replication activities
CREATE TABLE audit.replication_events (
    event_id UUID PRIMARY KEY,
    replication_type VARCHAR(50), -- streaming, backup, object_sync
    source_system VARCHAR(100),
    destination_system VARCHAR(100),
    operation VARCHAR(20), -- start, complete, fail, verify
    data_volume BIGINT, -- bytes replicated
    lag_seconds INTEGER,
    error_message TEXT,
    performed_at TIMESTAMP,
    checksum VARCHAR(64),
    compliance_verified BOOLEAN
);
```

#### 5.3.2 Verification Procedures

1. **Daily verification** всех replication endpoints
2. **Weekly restore testing** для critical data
3. **Monthly compliance reports** для аудиторов
4. **Quarterly DR testing** с полным failover

---

## ⚡ **6. DISASTER RECOVERY PROCEDURES**

### 6.1 Failover Scenarios

#### 6.1.1 Primary Database Failure

**Automatic Failover (RTO: 5-15 minutes):**

1. HAProxy detects primary failure
2. Promote AWS RDS read replica to primary
3. Update application connection strings
4. Verify data consistency
5. Begin replication from new primary

**Manual Steps:**

```bash
# 1. Promote replica to primary
aws rds promote-read-replica --db-instance-identifier gacp-replica-aws

# 2. Update DNS records
aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch file://promote-replica.json

# 3. Verify application connectivity
psql -h gacp-db-primary.farm.local -U app_user -d gacp_production -c "SELECT 1;"

# 4. Restart replication to Azure
pg_basebackup -h gacp-db-primary.farm.local -U replicator -D /replica_base
```

#### 6.1.2 Complete Site Failure

**Cloud-Based Recovery (RTO: 2-4 hours):**

1. Assess scope of failure
2. Activate cloud-based infrastructure
3. Restore from latest backups
4. Verify data integrity and consistency
5. Switch DNS to cloud endpoints
6. Notify stakeholders and regulatory bodies

### 6.2 Recovery Verification

#### 6.2.1 Data Integrity Checks

```sql
-- Verify audit trail continuity
SELECT
    MIN(performed_at) as earliest_record,
    MAX(performed_at) as latest_record,
    COUNT(*) as total_records,
    COUNT(DISTINCT DATE(performed_at)) as days_covered
FROM audit.audit_trail_events
WHERE performed_at >= NOW() - INTERVAL '30 days';

-- Check for data gaps
WITH date_series AS (
    SELECT generate_series(
        date_trunc('day', NOW() - INTERVAL '30 days'),
        date_trunc('day', NOW()),
        '1 day'::interval
    )::date as expected_date
),
actual_dates AS (
    SELECT DISTINCT DATE(performed_at) as actual_date
    FROM audit.audit_trail_events
    WHERE performed_at >= NOW() - INTERVAL '30 days'
)
SELECT ds.expected_date
FROM date_series ds
LEFT JOIN actual_dates ad ON ds.expected_date = ad.actual_date
WHERE ad.actual_date IS NULL;
```

#### 6.2.2 Application Functionality Tests

1. **User authentication** and authorization
2. **CRUD operations** на critical entities
3. **Report generation** and PDF signing
4. **Audit trail** logging and immutability
5. **IoT data collection** and processing

---

## 📋 **7. OPERATIONAL PROCEDURES**

### 7.1 Daily Operations

#### 7.1.1 Health Check Checklist

- [ ] PostgreSQL replication lag < 30 seconds
- [ ] Kafka consumer lag < 100 messages
- [ ] Object storage sync status: OK
- [ ] immudb sync status: OK
- [ ] All cloud replicas responsive
- [ ] Backup jobs completed successfully
- [ ] No critical alerts in monitoring

#### 7.1.2 Monitoring Script

```bash
#!/bin/bash
# daily_replication_health_check.sh

# PostgreSQL replication status
psql -h localhost -U monitor -d postgres -c "
    SELECT
        client_addr,
        state,
        replay_lag
    FROM pg_stat_replication;"

# Kafka lag check
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
    --describe --group audit-consumer

# Object storage sync verification
aws s3api head-object --bucket gacp-audit-backup \
    --key "latest_backup_timestamp.txt"

# Generate daily report
echo "Replication Health Check - $(date)" > /var/log/replication_daily.log
```

### 7.2 Weekly Operations

#### 7.2.1 Performance Optimization

- **Analyze replication performance** trends
- **Optimize database configurations** based on metrics
- **Review and adjust retention** policies
- **Update monitoring thresholds** if needed

#### 7.2.2 Security Reviews

- **Certificate expiration** checking
- **Access logs** review for anomalies
- **Network security** configuration validation
- **Service account** permission audit

### 7.3 Monthly Operations

#### 7.3.1 Disaster Recovery Testing

```bash
#!/bin/bash
# monthly_dr_test.sh

# 1. Create test restore point
psql -c "SELECT pg_create_restore_point('monthly_dr_test');"

# 2. Simulate failure scenario
systemctl stop postgresql

# 3. Restore from replica
pg_ctl promote -D /var/lib/postgresql/replica

# 4. Verify data integrity
psql -c "SELECT COUNT(*) FROM audit.audit_trail_events;"

# 5. Document results
echo "DR Test Results - $(date)" >> /var/log/dr_tests.log
```

#### 7.3.2 Compliance Reporting

- **Generate replication metrics** для аудиторов
- **Verify ALCOA+ compliance** для всех replicas
- **Document any incidents** или deviations
- **Update procedures** based on lessons learned

---

## 📊 **8. COMPLIANCE DOCUMENTATION**

### 8.1 Audit Trail Requirements

#### 8.1.1 ALCOA+ Compliance Matrix

| Принцип             | Реализация                          | Verification                          |
| ------------------- | ----------------------------------- | ------------------------------------- |
| **Attributable**    | User ID + timestamp в каждой записи | Daily audit trail review              |
| **Legible**         | UTF-8 encoding, structured format   | Automated readability tests           |
| **Contemporaneous** | Real-time logging (< 5 sec delay)   | Timestamp validation checks           |
| **Original**        | WORM storage, immutable records     | Hash verification, no updates allowed |
| **Accurate**        | Input validation, checksums         | Data integrity verification           |

#### 8.1.2 Replication Validation Records

```sql
-- Daily replication validation log
CREATE TABLE compliance.replication_validation_log (
    validation_id UUID PRIMARY KEY,
    validation_date DATE,
    replication_target VARCHAR(100),
    records_verified BIGINT,
    hash_matches BIGINT,
    discrepancies_found INTEGER,
    validation_status VARCHAR(20), -- PASS, FAIL, WARNING
    performed_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.2 Regulatory Documentation

#### 8.2.1 Change Control Records

- **Replication configuration changes**
- **Software version updates**
- **Security policy modifications**
- **Infrastructure topology changes**

#### 8.2.2 Incident Documentation

- **Replication failures** и resolution procedures
- **Data integrity violations** и corrective actions
- **Security incidents** affecting replication
- **Performance degradations** и optimizations

### 8.3 Audit Readiness

#### 8.3.1 Documentation Package для Аудиторов

1. **Architecture diagrams** (this document)
2. **SOPs** для replication management
3. **Validation records** for past 12 months
4. **Incident reports** и resolution evidence
5. **Training records** для technical staff
6. **Change control** documentation
7. **DR test results** и certificates

#### 8.3.2 Quick Reference для Аудиторов

```yaml
# System Overview
Primary_Site: "Cannabis Farm, Location XYZ"
Cloud_Providers: ["AWS us-west-2", "Azure westeurope"]
Data_Types: ["Production", "Audit Trail", "Documents", "IoT Metrics"]
Compliance_Standards: ["GACP", "ALCOA+", "21 CFR Part 11", "EU GMP Annex 11"]

# Key Metrics
RPO_Critical_Data: "15 minutes"
RTO_Critical_Systems: "1 hour"
Availability_Target: "99.5%"
Audit_Retention: "10+ years"

# Contact Information
Primary_DBA: "farm-dba@company.com"
Cloud_Admin: "cloud-ops@company.com"
Compliance_Officer: "compliance@company.com"
```

---

## 🔧 **9. TECHNICAL IMPLEMENTATION**

### 9.1 Infrastructure as Code

#### 9.1.1 Terraform для Cloud Replicas

```hcl
# AWS RDS Replica
resource "aws_db_instance" "gacp_replica" {
  identifier = "gacp-erp-replica"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.2xlarge"

  allocated_storage     = 1000
  max_allocated_storage = 5000
  storage_type         = "gp3"
  storage_encrypted    = true

  # Replication configuration
  replicate_source_db = "arn:aws:rds:us-west-1:account:db:gacp-primary"

  # Backup configuration
  backup_retention_period = 35
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Security
  vpc_security_group_ids = [aws_security_group.rds_replica.id]
  db_subnet_group_name   = aws_db_subnet_group.private.name

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = {
    Environment = "production"
    Purpose     = "gacp_replica"
    Compliance  = "21CFR_Part11"
  }
}

# Azure PostgreSQL Replica
resource "azurerm_postgresql_flexible_server" "gacp_replica" {
  name                = "gacp-erp-replica-azure"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location

  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  sku_name   = "GP_Standard_D8s_v3"
  version    = "15"
  storage_mb = 1048576

  backup_retention_days = 35
  geo_redundant_backup_enabled = true

  tags = {
    Environment = "production"
    Purpose     = "gacp_replica"
    Compliance  = "EU_GMP_Annex11"
  }
}
```

#### 9.1.2 Kubernetes для Replication Services

```yaml
# Kafka Connect for CDC replication
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafka-connect-replication
  namespace: data-replication
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kafka-connect
  template:
    metadata:
      labels:
        app: kafka-connect
    spec:
      containers:
        - name: kafka-connect
          image: confluentinc/cp-kafka-connect:7.4.0
          env:
            - name: CONNECT_BOOTSTRAP_SERVERS
              value: "kafka-1:9092,kafka-2:9092,kafka-3:9092"
            - name: CONNECT_GROUP_ID
              value: "gacp-replication-group"
            - name: CONNECT_CONFIG_STORAGE_TOPIC
              value: "connect-configs"
            - name: CONNECT_OFFSET_STORAGE_TOPIC
              value: "connect-offsets"
            - name: CONNECT_STATUS_STORAGE_TOPIC
              value: "connect-status"
            - name: CONNECT_CONFIG_STORAGE_REPLICATION_FACTOR
              value: "3"
            - name: CONNECT_OFFSET_STORAGE_REPLICATION_FACTOR
              value: "3"
            - name: CONNECT_STATUS_STORAGE_REPLICATION_FACTOR
              value: "3"
          resources:
            requests:
              memory: "2Gi"
              cpu: "1000m"
            limits:
              memory: "4Gi"
              cpu: "2000m"
          volumeMounts:
            - name: connect-plugins
              mountPath: /usr/share/java/kafka-connect-plugins
      volumes:
        - name: connect-plugins
          configMap:
            name: kafka-connect-plugins
```

### 9.2 Monitoring as Code

#### 9.2.1 Prometheus Rules

```yaml
# Replication monitoring rules
groups:
  - name: gacp_replication_alerts
    rules:
      - alert: PostgreSQLReplicationLag
        expr: pg_stat_replication_replay_lag_seconds > 300
        for: 2m
        labels:
          severity: critical
          service: postgresql
        annotations:
          summary: "PostgreSQL replication lag is high"
          description: "Replication lag is {{ $value }} seconds on {{ $labels.instance }}"

      - alert: KafkaUnderReplicatedPartitions
        expr: kafka_server_replica_manager_under_replicated_partitions > 0
        for: 1m
        labels:
          severity: critical
          service: kafka
        annotations:
          summary: "Kafka has under-replicated partitions"
          description: "{{ $value }} partitions are under-replicated"

      - alert: ObjectStorageSyncFailure
        expr: increase(minio_replication_failed_total[5m]) > 0
        for: 1m
        labels:
          severity: warning
          service: object_storage
        annotations:
          summary: "Object storage replication failed"
          description: "{{ $value }} replication failures in the last 5 minutes"
```

#### 9.2.2 Grafana Dashboard

```json
{
  "dashboard": {
    "id": null,
    "title": "GACP Data Replication Dashboard",
    "tags": ["gacp", "replication", "compliance"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Replication Health Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"postgres-exporter\"}",
            "legendFormat": "PostgreSQL Primary"
          },
          {
            "expr": "kafka_server_broker_state",
            "legendFormat": "Kafka Broker Status"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                { "color": "red", "value": 0 },
                { "color": "green", "value": 1 }
              ]
            }
          }
        }
      },
      {
        "id": 2,
        "title": "Replication Lag Trends",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_replication_replay_lag_seconds",
            "legendFormat": "PostgreSQL Lag (seconds)"
          },
          {
            "expr": "kafka_consumer_lag_sum",
            "legendFormat": "Kafka Consumer Lag"
          }
        ]
      }
    ]
  }
}
```

---

## 📚 **10. СВЯЗАННАЯ ДОКУМЕНТАЦИЯ**

### 10.1 Операционные процедуры

- **[SOP_DatabaseReplication.md](./sop/SOP_DatabaseReplication.md)** - Детальные операционные процедуры
- **[SOP_DataBackup.md](./sop/SOP_DataBackup.md)** - Стратегии резервного копирования
- **[SOP_DisasterRecovery.md](./sop/SOP_DisasterRecovery.md)** - Процедуры восстановления

### 10.2 Архитектурная документация

- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Общая архитектура системы
- **[EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md)** - Архитектура событий Kafka
- **[INFRASTRUCTURE_UPDATE_SUMMARY.md](./INFRASTRUCTURE_UPDATE_SUMMARY.md)** - История изменений

### 10.3 Compliance документы

- **[DS.md](./validation/DS.md)** - Design Specification с data retention policies
- **[FS.md](./validation/FS.md)** - Functional Specification с RPO/RTO requirements
- **[VMP.md](./validation/VMP.md)** - Validation Master Plan

### 10.4 Руководства по мониторингу

- **Prometheus Configuration**: `/etc/prometheus/prometheus.yml`
- **Grafana Dashboards**: `/var/lib/grafana/dashboards/`
- **Alert Manager Rules**: `/etc/alertmanager/rules/`

---

## ✅ **11. ЗАКЛЮЧЕНИЕ**

### 11.1 Готовность к аудиту

Данная архитектура репликации обеспечивает:

- ✅ **Полное соответствие GACP**: Все критические данные реплицируются с ALCOA+ compliance
- ✅ **Надежность**: RPO ≤ 15 мин, RTO ≤ 1 час для критических систем
- ✅ **Прозрачность**: Полная документация для регуляторов и аудиторов
- ✅ **Автоматизация**: Минимизация человеческих ошибок через IaC и мониторинг
- ✅ **Безопасность**: End-to-end encryption и строгий контроль доступа

### 11.2 Постоянное улучшение

Система подвергается регулярному review:

- **Ежемесячно**: Performance optimization и capacity planning
- **Ежеквартально**: DR testing и процедурные updates
- **Ежегодно**: Архитектурный review и compliance validation

### 11.3 Контакты для аудиторов

**Technical Lead**: Victor Noise (victor@farmtech.com)  
**Compliance Officer**: compliance@farmtech.com  
**Infrastructure Manager**: infra@farmtech.com

**Документация актуальна на**: 14 сентября 2025 г.  
**Следующий review**: 14 марта 2026 г.
