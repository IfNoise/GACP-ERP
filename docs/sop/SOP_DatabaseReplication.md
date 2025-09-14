---
title: "SOP: Database Replication and Data Integrity"
document_number: "SOP-GACP-DRP-001"
version: "2.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approved_by: "Quality Assurance Manager"
department: "IT Operations & Quality Assurance"
classification: "Critical Data Management"
related_procedures: ["SOP_DataBackup", "SOP_SystemAdministration", "SOP_DataIntegrity", "SOP_ITSecurity"]
regulatory_references: ["ALCOA+ Data Integrity", "FDA 21 CFR Part 11", "EU GMP Annex 11", "GACP Guidelines", "ICH Q9"]
---

# SOP: Database Replication and Data Integrity

## 1. Purpose and Scope

### 1.1 Purpose

This Standard Operating Procedure establishes comprehensive procedures for database replication and data integrity management in the GACP-compliant cannabis cultivation facility, ensuring:

- **Continuous Data Availability**: 24/7 access to critical operational and audit data
- **Regulatory Compliance**: ALCOA+ compliant data integrity throughout replication lifecycle
- **Audit Readiness**: Immutable audit trail preservation for regulatory inspections
- **Business Continuity**: Seamless operations during primary system maintenance or failures
- **Data Security**: Encrypted, authenticated replication with complete chain of custody

### 1.2 Scope

This procedure applies to all database replication activities for:

**Primary Data Types**:
- **Plant Lifecycle Data**: Cultivation records, batch information, harvest data
- **IoT Sensor Metrics**: Environmental monitoring, equipment status, alerts
- **Audit Trail Logs**: User activities, system changes, compliance events
- **User Access Logs**: Authentication, authorization, session management
- **SCADA/SCUD Integration**: Environmental controls, automation systems
- **Quality Control Data**: Testing results, specifications, deviations
- **Regulatory Documentation**: SOPs, training records, certifications

**System Components**:
- Primary database (on-premise PostgreSQL cluster)
- Cloud replica infrastructure (AWS/Azure/GCP)
- Replication middleware (Kafka/MQTT streams)
- Monitoring and alerting systems
- Backup and recovery infrastructure

### 1.3 Regulatory Framework

All replication activities must comply with:

- **ALCOA+ Principles**: Attributable, Legible, Contemporaneous, Original, Accurate
- **FDA 21 CFR Part 11**: Electronic records and signatures requirements
- **EU GMP Annex 11**: Computerized systems validation and data integrity
- **GACP Guidelines**: Good Agricultural and Collection Practices
- **ICH Q9**: Quality Risk Management for data systems

## 2. System Architecture and Components

### 2.1 Primary Database Infrastructure (Farm Site)

#### 2.1.1 PostgreSQL Primary Cluster
**Configuration**:
- **Version**: PostgreSQL 15+ with streaming replication
- **Clustering**: 3-node primary cluster with automatic failover
- **Storage**: High-performance SSD with RAID 10 configuration
- **Memory**: 64GB RAM with optimized buffer settings
- **CPU**: 16-core processors for parallel processing

**Key Features**:
- Point-in-Time Recovery (PITR) enabled
- Write-Ahead Logging (WAL) with archival
- Continuous backup to local and remote storage
- Real-time performance monitoring
- Automated maintenance and optimization

#### 2.1.2 Data Organization
```sql
-- Primary Database Schema Structure

-- Operational Tables
CREATE SCHEMA operational;
- cultivation_batches
- environmental_data
- equipment_status
- inventory_management
- quality_control_results

-- Audit Tables (Immutable)
CREATE SCHEMA audit;
- audit_trail_events
- user_access_logs
- system_change_logs
- data_modification_history
- compliance_events

-- Configuration Tables
CREATE SCHEMA configuration;
- system_settings
- user_permissions
- workflow_definitions
- integration_endpoints
```

### 2.2 Replication Infrastructure

#### 2.2.1 Streaming Replication Architecture
```
Primary Site (Farm)          Replication Layer              Cloud Replica
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│ PostgreSQL      │         │ Kafka Cluster    │         │ PostgreSQL      │
│ Primary Cluster │────────▶│ - Topic: ops_data│────────▶│ Read-Only       │
│                 │         │ - Topic: audit   │         │ Replica         │
│ WAL Archiving   │         │ - Topic: config  │         │                 │
│ Backup Jobs     │         │ Telegraf/Vector │         │ WORM Storage    │
│ Monitoring      │         │ Encryption: TLS  │         │ Monitoring      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

#### 2.2.2 Replication Components
1. **Kafka Message Streaming**
   - Guaranteed message ordering and delivery
   - Fault-tolerant partitioning
   - Configurable retention policies
   - Real-time and batch processing support

2. **Telegraf/Vector Forwarders**
   - Data format transformation
   - Routing and filtering capabilities
   - Error handling and retry logic
   - Performance optimization

3. **Network Security**
   - TLS 1.3 encryption for all traffic
   - Mutual authentication certificates
   - VPN tunneling for additional security
   - Network segmentation and firewalls

### 2.3 Cloud Replica Infrastructure

#### 2.3.1 Cloud Database Configuration
**Platform**: Multi-cloud deployment (primary: AWS, secondary: Azure)

**Primary Cloud (AWS)**:
- **Service**: Amazon RDS PostgreSQL with Multi-AZ
- **Instance**: db.r6g.2xlarge (8 vCPU, 64 GB RAM)
- **Storage**: Provisioned IOPS SSD (10,000 IOPS)
- **Backup**: Automated daily snapshots with 35-day retention
- **Security**: VPC isolation, encryption at rest/transit

**Secondary Cloud (Azure)**:
- **Service**: Azure Database for PostgreSQL
- **Tier**: General Purpose with High Availability
- **Compute**: 8 vCores, 64 GB RAM
- **Storage**: Premium SSD with backup redundancy
- **Security**: Private endpoints, Azure Key Vault integration

#### 2.3.2 WORM (Write Once, Read Many) Implementation
```sql
-- WORM Policy Implementation for Audit Tables

-- Table-level immutability triggers
CREATE OR REPLACE FUNCTION audit_immutability_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit records are immutable. Operation: % not allowed.', TG_OP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all audit tables
CREATE TRIGGER audit_immutability
    BEFORE UPDATE OR DELETE
    ON audit.audit_trail_events
    FOR EACH ROW
    EXECUTE FUNCTION audit_immutability_trigger();
```

## 3. Roles and Responsibilities

### 3.1 IT Administrator (Farm)
**Qualifications**: Bachelor's degree in IT/Computer Science, PostgreSQL certification, 5+ years database administration

**Primary Responsibilities**:
- Maintain primary database cluster health and performance
- Monitor replication status and resolve connectivity issues
- Perform local backup verification and testing
- Implement security patches and updates
- Coordinate with cloud administrators for troubleshooting
- Maintain on-premise monitoring and alerting systems

**Daily Tasks**:
- Check database cluster status and performance metrics
- Verify WAL archiving and backup completion
- Monitor replication lag and network connectivity
- Review security alerts and access logs
- Update replication monitoring dashboards

### 3.2 IT Administrator (Cloud)
**Qualifications**: Cloud platform certification (AWS/Azure), database security expertise, DevOps experience

**Primary Responsibilities**:
- Ensure integrity and availability of cloud replica databases
- Implement and maintain WORM storage policies
- Provide secure read-only access for QA and auditors
- Monitor cloud infrastructure performance and costs
- Maintain disaster recovery and business continuity plans
- Coordinate with farm IT for replication issues

**Daily Tasks**:
- Verify cloud database health and performance
- Monitor WORM policy compliance and enforcement
- Check access logs and security compliance
- Update cloud infrastructure monitoring
- Review cost optimization opportunities

### 3.3 Quality Assurance Manager
**Qualifications**: Quality management experience, GMP/GACP knowledge, data integrity expertise

**Primary Responsibilities**:
- Validate replication integrity and data consistency
- Confirm audit data immutability and completeness
- Approve failover procedures and emergency protocols
- Conduct periodic data integrity assessments
- Coordinate regulatory inspection support
- Oversee compliance documentation and training

**Weekly Tasks**:
- Validate random audit record samples between farm and cloud
- Review replication monitoring reports and trends
- Assess data integrity controls effectiveness
- Update compliance documentation as needed
- Conduct training and competency assessments

### 3.4 Data Protection Officer (DPO)
**Qualifications**: Data protection certification, legal compliance background, technical understanding

**Primary Responsibilities**:
- Ensure GDPR/privacy compliance in replication processes
- Oversee data retention and deletion policies
- Manage data subject rights and requests
- Coordinate with legal team on regulatory matters
- Maintain privacy impact assessments
- Oversee breach notification procedures

## 4. Replication Setup and Configuration

### 4.1 Primary Database Configuration

#### 4.1.1 PostgreSQL Streaming Replication Setup
```bash
# postgresql.conf configuration for primary database

# Replication settings
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 1GB
archive_mode = on
archive_command = 'rsync -a %p /archive/wal/%f'

# Performance optimization
shared_buffers = 16GB
effective_cache_size = 48GB
random_page_cost = 1.1
checkpoint_completion_target = 0.9

# Logging and monitoring
log_statement = 'mod'
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
```

#### 4.1.2 Replication User Configuration
```sql
-- Create dedicated replication user with minimal privileges
CREATE USER replicator REPLICATION LOGIN ENCRYPTED PASSWORD 'secure_password_here';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE gacp_erp TO replicator;
GRANT USAGE ON SCHEMA operational, audit, configuration TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA operational, audit, configuration TO replicator;

-- Create replication slot for guaranteed delivery
SELECT pg_create_physical_replication_slot('cloud_replica_slot');
```

### 4.2 Kafka Streaming Configuration

#### 4.2.1 Kafka Cluster Setup
```yaml
# kafka-config.yml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: gacp-replication-cluster
spec:
  kafka:
    replicas: 3
    version: 3.5.0
    listeners:
      - name: tls
        port: 9093
        type: internal
        tls: true
        authentication:
          type: tls
    config:
      offsets.topic.replication.factor: 3
      transaction.state.log.replication.factor: 3
      transaction.state.log.min.isr: 2
      default.replication.factor: 3
      min.insync.replicas: 2
      log.retention.hours: 168  # 7 days
      log.segment.bytes: 1073741824  # 1GB
    storage:
      type: persistent-claim
      size: 1Ti
      class: fast-ssd
```

#### 4.2.2 Topic Configuration
```bash
# Create topics for different data types
kafka-topics.sh --create --topic operational-data \
  --partitions 12 --replication-factor 3 \
  --config retention.ms=604800000 \
  --config compression.type=lz4

kafka-topics.sh --create --topic audit-logs \
  --partitions 6 --replication-factor 3 \
  --config retention.ms=31536000000 \
  --config compression.type=gzip \
  --config cleanup.policy=compact

kafka-topics.sh --create --topic configuration-changes \
  --partitions 3 --replication-factor 3 \
  --config retention.ms=2592000000 \
  --config compression.type=snappy
```

### 4.3 Cloud Replica Configuration

#### 4.3.1 AWS RDS Setup
```python
# AWS RDS PostgreSQL setup with Terraform
resource "aws_db_instance" "gacp_replica" {
  identifier = "gacp-erp-replica"
  engine     = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.2xlarge"
  
  allocated_storage     = 1000
  max_allocated_storage = 5000
  storage_type         = "io1"
  iops                 = 10000
  storage_encrypted    = true
  kms_key_id          = aws_kms_key.gacp_key.arn
  
  db_name  = "gacp_erp_replica"
  username = "gacp_admin"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.gacp_db.id]
  db_subnet_group_name   = aws_db_subnet_group.gacp.name
  
  backup_retention_period = 35
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "gacp-replica-final-snapshot"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = {
    Name        = "GACP ERP Replica"
    Environment = "production"
    Compliance  = "GMP-GACP"
  }
}
```

#### 4.3.2 WORM Storage Implementation
```sql
-- Comprehensive WORM implementation for cloud replica

-- Create WORM enforcement schema
CREATE SCHEMA worm_control;

-- WORM metadata table
CREATE TABLE worm_control.worm_metadata (
    table_name VARCHAR(255) PRIMARY KEY,
    worm_enabled BOOLEAN DEFAULT FALSE,
    creation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verification TIMESTAMP,
    record_count BIGINT DEFAULT 0,
    checksum VARCHAR(64)
);

-- WORM verification function
CREATE OR REPLACE FUNCTION worm_control.verify_table_integrity(table_schema TEXT, table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_checksum VARCHAR(64);
    stored_checksum VARCHAR(64);
    record_count BIGINT;
BEGIN
    -- Calculate current table checksum
    EXECUTE format('SELECT COUNT(*), MD5(STRING_AGG(t::text, '''')) FROM %I.%I t', 
                   table_schema, table_name)
    INTO record_count, current_checksum;
    
    -- Get stored checksum
    SELECT checksum INTO stored_checksum 
    FROM worm_control.worm_metadata 
    WHERE worm_metadata.table_name = format('%s.%s', table_schema, table_name);
    
    -- Update verification timestamp
    UPDATE worm_control.worm_metadata 
    SET last_verification = CURRENT_TIMESTAMP,
        record_count = record_count
    WHERE worm_metadata.table_name = format('%s.%s', table_schema, table_name);
    
    -- Return integrity status
    RETURN (current_checksum = stored_checksum);
END;
$$ LANGUAGE plpgsql;
```

## 5. Replication Monitoring and Alerting

### 5.1 Real-time Monitoring

#### 5.1.1 PostgreSQL Replication Monitoring
```python
# Python monitoring script for PostgreSQL replication
import psycopg2
import prometheus_client
from prometheus_client import Gauge, Counter
import time
import logging

class ReplicationMonitor:
    def __init__(self, primary_conn, replica_conn):
        self.primary = primary_conn
        self.replica = replica_conn
        
        # Prometheus metrics
        self.replication_lag = Gauge('postgres_replication_lag_seconds', 
                                   'Replication lag in seconds')
        self.replica_status = Gauge('postgres_replica_status', 
                                  'Replica status (1=healthy, 0=unhealthy)')
        self.bytes_sent = Counter('postgres_replication_bytes_sent_total',
                                'Total bytes sent to replica')
        
    def check_replication_status(self):
        try:
            # Check primary server status
            primary_cursor = self.primary.cursor()
            primary_cursor.execute("""
                SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
                       write_lag, flush_lag, replay_lag
                FROM pg_stat_replication 
                WHERE application_name = 'cloud_replica';
            """)
            
            replication_stats = primary_cursor.fetchone()
            
            if replication_stats:
                # Extract lag information
                replay_lag = replication_stats[8]
                if replay_lag:
                    lag_seconds = replay_lag.total_seconds()
                    self.replication_lag.set(lag_seconds)
                    
                    # Alert if lag > 5 minutes
                    if lag_seconds > 300:
                        self.send_alert(f"Replication lag high: {lag_seconds}s")
                
                self.replica_status.set(1)
                logging.info(f"Replication healthy. Lag: {replay_lag}")
            else:
                self.replica_status.set(0)
                self.send_alert("No active replication connection found")
                
        except Exception as e:
            self.replica_status.set(0)
            logging.error(f"Replication monitoring error: {e}")
            self.send_alert(f"Replication monitoring failed: {e}")
    
    def send_alert(self, message):
        # Integration with alerting system (Slack, email, PagerDuty)
        logging.warning(f"ALERT: {message}")
        # Additional alerting logic here
```

#### 5.1.2 Kafka Monitoring Integration
```yaml
# Prometheus monitoring for Kafka replication
version: '3.8'
services:
  kafka-exporter:
    image: danielqsj/kafka-exporter:latest
    command:
      - --kafka.server=kafka-cluster:9092
      - --topic.filter=operational-data|audit-logs|configuration-changes
      - --group.filter=replication-consumers
    ports:
      - "9308:9308"
    environment:
      - KAFKA_OPTS=-Djava.security.auth.login.config=/etc/kafka/kafka_client_jaas.conf

  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--web.external-url=http://localhost:9093'
```

### 5.2 Alerting Configuration

#### 5.2.1 Alert Rules
```yaml
# alerting-rules.yml
groups:
- name: database_replication
  rules:
  - alert: ReplicationLagHigh
    expr: postgres_replication_lag_seconds > 300
    for: 2m
    labels:
      severity: warning
      service: database_replication
    annotations:
      summary: "Database replication lag is high"
      description: "Replication lag is {{ $value }} seconds"

  - alert: ReplicationDown
    expr: postgres_replica_status == 0
    for: 1m
    labels:
      severity: critical
      service: database_replication
    annotations:
      summary: "Database replication is down"
      description: "Primary database cannot reach replica"

  - alert: KafkaReplicationConsumerLag
    expr: kafka_consumer_lag_sum > 1000
    for: 5m
    labels:
      severity: warning
      service: kafka_replication
    annotations:
      summary: "Kafka consumer lag is high"
      description: "Consumer lag is {{ $value }} messages"

  - alert: WORMIntegrityFailure
    expr: worm_integrity_check_failures_total > 0
    for: 0m
    labels:
      severity: critical
      service: data_integrity
    annotations:
      summary: "WORM integrity check failed"
      description: "Data integrity violation detected in audit tables"
```

#### 5.2.2 Notification Channels
```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.company.com:587'
  smtp_from: 'alerts@gacperp.com'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      service: database_replication
    receiver: 'database-team'

receivers:
- name: 'default'
  email_configs:
  - to: 'ops-team@gacperp.com'
    subject: 'GACP-ERP Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

- name: 'critical-alerts'
  email_configs:
  - to: 'critical-alerts@gacperp.com'
    subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK_URL'
    channel: '#critical-alerts'
    title: 'CRITICAL ALERT'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

- name: 'database-team'
  email_configs:
  - to: 'database-team@gacperp.com'
    subject: 'Database Alert: {{ .GroupLabels.alertname }}'
```

## 6. Failover and Recovery Procedures

### 6.1 Planned Failover (Maintenance)

#### 6.1.1 Pre-Failover Checklist
```
Planned Failover Preparation Checklist:

□ Verify cloud replica is current (lag < 1 minute)
□ Confirm all applications can connect to cloud database
□ Test read-only application functionality
□ Verify backup and WORM integrity
□ Notify all stakeholders of maintenance window
□ Prepare rollback procedures
□ Update monitoring and alerting thresholds
□ Coordinate with QA for validation procedures
```

#### 6.1.2 Failover Execution
```bash
#!/bin/bash
# Planned failover script

# 1. Stop new connections to primary
psql -h primary-db -c "ALTER SYSTEM SET max_connections = 1;"
psql -h primary-db -c "SELECT pg_reload_conf();"

# 2. Wait for existing transactions to complete
echo "Waiting for active transactions to complete..."
while [ $(psql -h primary-db -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND pid != pg_backend_pid();") -gt 0 ]; do
    sleep 5
done

# 3. Perform final WAL flush
psql -h primary-db -c "SELECT pg_switch_wal();"

# 4. Verify replica is caught up
echo "Verifying replica synchronization..."
PRIMARY_LSN=$(psql -h primary-db -t -c "SELECT pg_current_wal_lsn();")
REPLICA_LSN=$(psql -h replica-db -t -c "SELECT pg_last_wal_replay_lsn();")

if [ "$PRIMARY_LSN" = "$REPLICA_LSN" ]; then
    echo "Replica is synchronized. Proceeding with failover."
else
    echo "Replica not synchronized. Aborting failover."
    exit 1
fi

# 5. Promote replica (requires QA Manager approval)
echo "Promoting replica to primary..."
# This step requires manual approval and execution
echo "MANUAL STEP: Execute 'SELECT pg_promote();' on replica with QA approval"
```

### 6.2 Emergency Failover

#### 6.2.1 Automatic Failover Detection
```python
# Emergency failover detection system
class EmergencyFailoverMonitor:
    def __init__(self):
        self.primary_health_checks = []
        self.failover_threshold = 3  # consecutive failures
        self.check_interval = 30  # seconds
        
    def check_primary_health(self):
        health_checks = [
            self.check_database_connectivity(),
            self.check_disk_space(),
            self.check_memory_usage(),
            self.check_replication_status()
        ]
        
        if all(check['status'] == 'healthy' for check in health_checks):
            self.primary_health_checks = []  # Reset failure counter
            return True
        else:
            self.primary_health_checks.append(time.time())
            self.log_health_issues(health_checks)
            
            # Trigger emergency failover if threshold reached
            if len(self.primary_health_checks) >= self.failover_threshold:
                self.initiate_emergency_failover()
                return False
        
        return True
    
    def initiate_emergency_failover(self):
        # Log emergency situation
        logging.critical("Initiating emergency failover due to primary database failure")
        
        # Notify operations team immediately
        self.send_emergency_notification()
        
        # Execute automated failover procedures
        self.execute_emergency_procedures()
        
    def execute_emergency_procedures(self):
        # 1. Verify replica health
        if not self.verify_replica_health():
            logging.critical("Replica also unhealthy - manual intervention required")
            return False
            
        # 2. Redirect application traffic to read-only replica
        self.update_application_configuration()
        
        # 3. Enable temporary write functionality (with approval)
        # This requires specific business approval for data integrity
        
        # 4. Update monitoring and alerting
        self.update_monitoring_configuration()
        
        return True
```

#### 6.2.2 Recovery Procedures
```sql
-- Recovery validation queries after failover

-- 1. Verify data consistency
SELECT 
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname IN ('operational', 'audit', 'configuration')
ORDER BY schemaname, tablename;

-- 2. Check audit trail integrity
SELECT 
    MIN(event_timestamp) AS earliest_event,
    MAX(event_timestamp) AS latest_event,
    COUNT(*) AS total_events,
    COUNT(DISTINCT user_id) AS unique_users
FROM audit.audit_trail_events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- 3. Verify WORM compliance
SELECT 
    table_name,
    worm_enabled,
    last_verification,
    record_count,
    CASE 
        WHEN worm_control.verify_table_integrity(
            split_part(table_name, '.', 1), 
            split_part(table_name, '.', 2)
        ) THEN 'PASS'
        ELSE 'FAIL'
    END AS integrity_status
FROM worm_control.worm_metadata
WHERE worm_enabled = TRUE;
```

## 7. Data Integrity Validation

### 7.1 Continuous Validation

#### 7.1.1 Automated Integrity Checks
```python
# Data integrity validation system
class DataIntegrityValidator:
    def __init__(self, primary_conn, replica_conn):
        self.primary = primary_conn
        self.replica = replica_conn
        self.validation_log = []
        
    def validate_audit_records(self, sample_size=1000):
        """Validate random sample of audit records between primary and replica"""
        
        # Get random sample from primary
        primary_cursor = self.primary.cursor()
        primary_cursor.execute("""
            SELECT audit_id, event_timestamp, user_id, event_type, 
                   event_details, checksum
            FROM audit.audit_trail_events 
            TABLESAMPLE SYSTEM (1)
            LIMIT %s
        """, (sample_size,))
        
        primary_records = primary_cursor.fetchall()
        
        # Verify each record exists in replica with same data
        replica_cursor = self.replica.cursor()
        mismatches = []
        
        for record in primary_records:
            audit_id = record[0]
            replica_cursor.execute("""
                SELECT audit_id, event_timestamp, user_id, event_type,
                       event_details, checksum
                FROM audit.audit_trail_events 
                WHERE audit_id = %s
            """, (audit_id,))
            
            replica_record = replica_cursor.fetchone()
            
            if not replica_record:
                mismatches.append({
                    'type': 'missing_record',
                    'audit_id': audit_id,
                    'primary_record': record
                })
            elif record != replica_record:
                mismatches.append({
                    'type': 'data_mismatch',
                    'audit_id': audit_id,
                    'primary_record': record,
                    'replica_record': replica_record
                })
        
        # Log validation results
        validation_result = {
            'timestamp': datetime.now(),
            'sample_size': len(primary_records),
            'mismatches_found': len(mismatches),
            'mismatches': mismatches,
            'integrity_score': (len(primary_records) - len(mismatches)) / len(primary_records) * 100
        }
        
        self.validation_log.append(validation_result)
        
        # Alert if integrity issues found
        if mismatches:
            self.send_integrity_alert(validation_result)
            
        return validation_result
    
    def validate_operational_data_consistency(self):
        """Check operational data consistency and completeness"""
        
        consistency_checks = [
            self.check_cultivation_batch_integrity(),
            self.check_iot_sensor_data_completeness(),
            self.check_quality_control_data_accuracy(),
            self.check_inventory_transaction_consistency()
        ]
        
        overall_status = all(check['status'] == 'pass' for check in consistency_checks)
        
        return {
            'overall_status': 'pass' if overall_status else 'fail',
            'individual_checks': consistency_checks,
            'timestamp': datetime.now()
        }
```

#### 7.1.2 ALCOA+ Compliance Verification
```sql
-- ALCOA+ compliance verification queries

-- Attributable: All records have proper user attribution
SELECT 
    'Attributable Check' AS compliance_aspect,
    COUNT(*) AS total_records,
    COUNT(CASE WHEN user_id IS NOT NULL AND user_id != '' THEN 1 END) AS attributed_records,
    ROUND(
        COUNT(CASE WHEN user_id IS NOT NULL AND user_id != '' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) AS compliance_percentage
FROM audit.audit_trail_events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

-- Legible: All records are in readable format
SELECT 
    'Legible Check' AS compliance_aspect,
    COUNT(*) AS total_records,
    COUNT(CASE WHEN event_details IS NOT NULL AND LENGTH(event_details) > 0 THEN 1 END) AS legible_records,
    ROUND(
        COUNT(CASE WHEN event_details IS NOT NULL AND LENGTH(event_details) > 0 THEN 1 END) * 100.0 / COUNT(*),
        2
    ) AS compliance_percentage
FROM audit.audit_trail_events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

-- Contemporaneous: Records created close to actual events
SELECT 
    'Contemporaneous Check' AS compliance_aspect,
    COUNT(*) AS total_records,
    COUNT(CASE WHEN ABS(EXTRACT(EPOCH FROM (event_timestamp - created_timestamp))) <= 300 THEN 1 END) AS contemporaneous_records,
    ROUND(
        COUNT(CASE WHEN ABS(EXTRACT(EPOCH FROM (event_timestamp - created_timestamp))) <= 300 THEN 1 END) * 100.0 / COUNT(*),
        2
    ) AS compliance_percentage
FROM audit.audit_trail_events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
AND created_timestamp IS NOT NULL

UNION ALL

-- Original: No unauthorized modifications
SELECT 
    'Original Check' AS compliance_aspect,
    COUNT(*) AS total_records,
    COUNT(CASE WHEN modification_count = 0 THEN 1 END) AS original_records,
    ROUND(
        COUNT(CASE WHEN modification_count = 0 THEN 1 END) * 100.0 / COUNT(*),
        2
    ) AS compliance_percentage
FROM audit.audit_trail_events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

-- Accurate: Data matches source systems
SELECT 
    'Accurate Check' AS compliance_aspect,
    COUNT(*) AS total_records,
    COUNT(CASE WHEN data_validation_status = 'verified' THEN 1 END) AS accurate_records,
    ROUND(
        COUNT(CASE WHEN data_validation_status = 'verified' THEN 1 END) * 100.0 / COUNT(*),
        2
    ) AS compliance_percentage
FROM audit.audit_trail_events
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days';
```

### 7.2 Quality Assurance Validation

#### 7.2.1 Weekly QA Validation Process
```
QA Weekly Validation Checklist:

Database Replication Validation:
□ Compare record counts between primary and replica databases
□ Validate sample of audit records for data integrity
□ Verify WORM policy enforcement on audit tables
□ Check replication lag and performance metrics
□ Review security access logs and anomalies
□ Validate backup completion and integrity
□ Test disaster recovery procedures (quarterly)

Data Quality Assessment:
□ Run ALCOA+ compliance verification queries
□ Check for data anomalies or inconsistencies
□ Validate critical business data accuracy
□ Verify IoT sensor data completeness
□ Review cultivation batch data integrity
□ Assess quality control data accuracy

Compliance Documentation:
□ Update validation reports and findings
□ Document any deviations or corrective actions
□ Review and approve replication configuration changes
□ Verify training records are current
□ Assess overall system compliance status
```

#### 7.2.2 Monthly Compliance Reporting
```python
# Monthly compliance report generation
class ComplianceReporter:
    def __init__(self, db_connections):
        self.primary_db = db_connections['primary']
        self.replica_db = db_connections['replica']
        self.report_date = datetime.now()
        
    def generate_monthly_report(self):
        report = {
            'report_period': f"{self.report_date.strftime('%Y-%m')}",
            'generation_date': self.report_date.isoformat(),
            'executive_summary': self.create_executive_summary(),
            'replication_performance': self.analyze_replication_performance(),
            'data_integrity_assessment': self.assess_data_integrity(),
            'alcoa_compliance': self.evaluate_alcoa_compliance(),
            'security_analysis': self.analyze_security_metrics(),
            'recommendations': self.generate_recommendations(),
            'regulatory_readiness': self.assess_regulatory_readiness()
        }
        
        # Generate PDF report
        self.create_pdf_report(report)
        
        # Store in document management system
        self.archive_report(report)
        
        return report
    
    def create_executive_summary(self):
        return {
            'replication_uptime': self.calculate_uptime_percentage(),
            'data_integrity_score': self.calculate_integrity_score(),
            'compliance_rating': self.calculate_compliance_rating(),
            'critical_issues': self.identify_critical_issues(),
            'performance_trends': self.analyze_performance_trends()
        }
```

## 8. Security and Access Control

### 8.1 Network Security

#### 8.1.1 Encryption and Authentication
```yaml
# TLS configuration for database replication
apiVersion: v1
kind: Secret
metadata:
  name: replication-tls-certs
type: tls
data:
  tls.crt: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t... # Base64 encoded certificate
  tls.key: LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t... # Base64 encoded private key
  ca.crt: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...  # Base64 encoded CA certificate

---
# PostgreSQL TLS configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-tls-config
data:
  postgresql.conf: |
    ssl = on
    ssl_cert_file = '/etc/ssl/certs/server.crt'
    ssl_key_file = '/etc/ssl/private/server.key'
    ssl_ca_file = '/etc/ssl/certs/ca.crt'
    ssl_min_protocol_version = 'TLSv1.3'
    ssl_max_protocol_version = 'TLSv1.3'
    ssl_ciphers = 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS'
    ssl_prefer_server_ciphers = on
```

#### 8.1.2 Access Control Configuration
```sql
-- Comprehensive access control for replication system

-- Create role-based access control
CREATE ROLE replication_admin;
CREATE ROLE replication_monitor;
CREATE ROLE qa_auditor;
CREATE ROLE read_only_user;

-- Grant permissions to replication admin
GRANT ALL PRIVILEGES ON SCHEMA operational, audit, configuration TO replication_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA operational, audit, configuration TO replication_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA operational, audit, configuration TO replication_admin;

-- Grant monitoring permissions
GRANT CONNECT ON DATABASE gacp_erp TO replication_monitor;
GRANT USAGE ON SCHEMA pg_catalog, information_schema TO replication_monitor;
GRANT SELECT ON pg_stat_replication, pg_stat_database, pg_stat_user_tables TO replication_monitor;

-- Grant QA auditor read access
GRANT CONNECT ON DATABASE gacp_erp TO qa_auditor;
GRANT USAGE ON SCHEMA audit, operational TO qa_auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA audit, operational TO qa_auditor;

-- Grant read-only access for general users
GRANT CONNECT ON DATABASE gacp_erp TO read_only_user;
GRANT USAGE ON SCHEMA operational TO read_only_user;
GRANT SELECT ON ALL TABLES IN SCHEMA operational TO read_only_user;

-- Row Level Security for sensitive data
ALTER TABLE operational.cultivation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY cultivation_access_policy ON operational.cultivation_batches
    FOR SELECT
    TO read_only_user
    USING (facility_id IN (SELECT facility_id FROM user_facility_access WHERE user_id = current_user));
```

### 8.2 Audit and Compliance Logging

#### 8.2.1 Comprehensive Audit Logging
```sql
-- Enhanced audit logging for replication system

-- Create comprehensive audit function
CREATE OR REPLACE FUNCTION audit.log_replication_event(
    p_event_type VARCHAR(50),
    p_table_name VARCHAR(100),
    p_operation VARCHAR(20),
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_user_id VARCHAR(50) DEFAULT current_user,
    p_source_system VARCHAR(50) DEFAULT 'replication_system'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit.replication_audit_log (
        event_id,
        event_timestamp,
        event_type,
        table_name,
        operation,
        user_id,
        source_system,
        old_data,
        new_data,
        session_id,
        client_ip,
        application_name,
        checksum
    ) VALUES (
        gen_random_uuid(),
        CURRENT_TIMESTAMP,
        p_event_type,
        p_table_name,
        p_operation,
        p_user_id,
        p_source_system,
        p_old_data,
        p_new_data,
        current_setting('application_name', true),
        inet_client_addr(),
        current_setting('application_name', true),
        md5(concat(p_event_type, p_table_name, p_operation, p_user_id, CURRENT_TIMESTAMP::text))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic audit logging
CREATE OR REPLACE FUNCTION audit.replication_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM audit.log_replication_event(
            'REPLICATION_INSERT',
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            TG_OP,
            NULL,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM audit.log_replication_event(
            'REPLICATION_UPDATE',
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD)::jsonb,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM audit.log_replication_event(
            'REPLICATION_DELETE',
            TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD)::jsonb,
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## 9. Training and Competency

### 9.1 Personnel Training Requirements

#### 9.1.1 Initial Training Program
**Target Audience**: IT administrators, QA personnel, operations staff

**Training Content**:
- Database replication concepts and architecture
- ALCOA+ data integrity principles
- WORM storage requirements and implementation
- Monitoring and alerting procedures
- Emergency response and failover procedures
- Regulatory compliance requirements (GMP/GACP)
- Security procedures and access controls

**Training Method**: Combination of classroom instruction, hands-on labs, and mentoring
**Duration**: 40 hours over 1 week
**Competency Assessment**: Written exam (85% pass) and practical demonstration

#### 9.1.2 Role-Specific Training
1. **IT Administrators**
   - Advanced PostgreSQL administration
   - Kafka configuration and troubleshooting
   - Cloud platform management (AWS/Azure)
   - Network security and encryption
   - Performance tuning and optimization

2. **QA Personnel**
   - Data integrity validation procedures
   - Compliance reporting and documentation
   - Audit support and inspection readiness
   - Risk assessment and management
   - Regulatory requirements interpretation

3. **Operations Staff**
   - Basic monitoring and alerting
   - Incident reporting procedures
   - Emergency contact protocols
   - System status interpretation
   - Documentation requirements

### 9.2 Ongoing Training and Certification

#### 9.2.1 Continuous Education
1. **Monthly Technical Updates**
   - Technology updates and patches
   - Security vulnerability alerts
   - Performance optimization techniques
   - New feature implementations
   - Industry best practices

2. **Quarterly Compliance Training**
   - Regulatory requirement updates
   - Audit findings and lessons learned
   - Process improvements and changes
   - Documentation updates
   - Emergency procedure drills

#### 9.2.2 Competency Maintenance
```python
# Training tracking and competency management system
class TrainingTracker:
    def __init__(self, database_connection):
        self.db = database_connection
        
    def track_training_completion(self, user_id, training_module, completion_date, score):
        """Record training completion and assess competency"""
        
        self.db.execute("""
            INSERT INTO training.completion_records (
                user_id, training_module, completion_date, score, 
                competency_status, next_required_training
            ) VALUES (
                %s, %s, %s, %s,
                CASE WHEN %s >= 85 THEN 'competent' ELSE 'requires_additional_training' END,
                %s + INTERVAL '1 year'
            )
        """, (user_id, training_module, completion_date, score, score, completion_date))
        
        # Generate certificate if competent
        if score >= 85:
            self.generate_competency_certificate(user_id, training_module)
            
    def assess_training_needs(self, user_id):
        """Assess upcoming training requirements for user"""
        
        cursor = self.db.cursor()
        cursor.execute("""
            SELECT training_module, next_required_training, competency_status
            FROM training.completion_records 
            WHERE user_id = %s
            AND next_required_training <= CURRENT_DATE + INTERVAL '30 days'
            ORDER BY next_required_training
        """, (user_id,))
        
        return cursor.fetchall()
```

## 10. Performance Optimization

### 10.1 Database Performance Tuning

#### 10.1.1 PostgreSQL Optimization
```sql
-- Performance optimization for replication workloads

-- Optimize WAL settings for replication
ALTER SYSTEM SET wal_buffers = '64MB';
ALTER SYSTEM SET wal_writer_delay = '200ms';
ALTER SYSTEM SET commit_delay = 100;
ALTER SYSTEM SET commit_siblings = 5;

-- Optimize checkpoint settings
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET checkpoint_timeout = '15min';
ALTER SYSTEM SET max_wal_size = '2GB';
ALTER SYSTEM SET min_wal_size = '512MB';

-- Optimize connection and memory settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '25% of RAM';
ALTER SYSTEM SET effective_cache_size = '75% of RAM';
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '2GB';

-- Optimize for read-heavy replica workloads
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET seq_page_cost = 1.0;
ALTER SYSTEM SET cpu_tuple_cost = 0.01;
ALTER SYSTEM SET cpu_index_tuple_cost = 0.005;

-- Enable query optimization
ALTER SYSTEM SET enable_partitionwise_join = on;
ALTER SYSTEM SET enable_partitionwise_aggregate = on;
ALTER SYSTEM SET jit = on;
ALTER SYSTEM SET jit_above_cost = 100000;

SELECT pg_reload_conf();
```

#### 10.1.2 Index Optimization
```sql
-- Create optimized indexes for replication queries

-- Audit table indexes
CREATE INDEX CONCURRENTLY idx_audit_events_timestamp_user 
ON audit.audit_trail_events (event_timestamp, user_id) 
WHERE event_timestamp >= CURRENT_DATE - INTERVAL '1 year';

CREATE INDEX CONCURRENTLY idx_audit_events_type_table 
ON audit.audit_trail_events (event_type, table_name)
INCLUDE (event_details);

-- Operational data indexes
CREATE INDEX CONCURRENTLY idx_cultivation_batches_facility_date 
ON operational.cultivation_batches (facility_id, creation_date DESC)
WHERE status != 'archived';

CREATE INDEX CONCURRENTLY idx_iot_data_sensor_timestamp 
ON operational.iot_sensor_data (sensor_id, measurement_timestamp DESC)
WHERE measurement_timestamp >= CURRENT_DATE - INTERVAL '90 days';

-- Partitioning for large tables
CREATE TABLE operational.iot_sensor_data_y2025m09 
PARTITION OF operational.iot_sensor_data
FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE operational.iot_sensor_data_y2025m10 
PARTITION OF operational.iot_sensor_data
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

### 10.2 Network and Storage Optimization

#### 10.2.1 Network Configuration
```yaml
# Network optimization for replication traffic
apiVersion: v1
kind: ConfigMap
metadata:
  name: network-optimization
data:
  sysctl.conf: |
    # TCP optimization for database replication
    net.core.rmem_max = 268435456
    net.core.wmem_max = 268435456
    net.ipv4.tcp_rmem = 4096 87380 268435456
    net.ipv4.tcp_wmem = 4096 65536 268435456
    net.core.netdev_max_backlog = 5000
    net.ipv4.tcp_congestion_control = bbr
    
    # Connection optimization
    net.ipv4.tcp_keepalive_time = 600
    net.ipv4.tcp_keepalive_probes = 3
    net.ipv4.tcp_keepalive_intvl = 30
    
    # Buffer optimization
    net.core.rmem_default = 262144
    net.core.wmem_default = 262144
```

#### 10.2.2 Storage Optimization
```bash
# Storage optimization for database workloads

# XFS filesystem optimization for PostgreSQL
mkfs.xfs -f -b size=4096 -s size=4096 -l agcount=64,size=128m /dev/nvme0n1
mount -o noatime,nobarrier,logbufs=8,logbsize=256k,largeio,inode64,allocsize=4m /dev/nvme0n1 /var/lib/postgresql

# I/O scheduler optimization
echo mq-deadline > /sys/block/nvme0n1/queue/scheduler
echo 8 > /sys/block/nvme0n1/queue/nr_requests

# Kernel parameters for database workloads
echo 'vm.swappiness = 1' >> /etc/sysctl.conf
echo 'vm.dirty_background_ratio = 3' >> /etc/sysctl.conf
echo 'vm.dirty_ratio = 15' >> /etc/sysctl.conf
echo 'vm.dirty_expire_centisecs = 500' >> /etc/sysctl.conf
echo 'vm.dirty_writeback_centisecs = 100' >> /etc/sysctl.conf
```

## 11. Documentation and Record Keeping

### 11.1 Documentation Requirements

#### 11.1.1 Technical Documentation
```
Database Replication Documentation Structure:

├── Architecture_Documentation/
│   ├── System_Architecture_Diagram
│   ├── Network_Topology_Diagram
│   ├── Data_Flow_Diagrams
│   ├── Security_Architecture
│   └── Integration_Specifications
├── Configuration_Documentation/
│   ├── Database_Configuration_Files
│   ├── Replication_Setup_Procedures
│   ├── Monitoring_Configuration
│   ├── Security_Configuration
│   └── Performance_Tuning_Parameters
├── Operational_Procedures/
│   ├── Daily_Operations_Checklist
│   ├── Monitoring_Procedures
│   ├── Backup_and_Recovery_Procedures
│   ├── Incident_Response_Procedures
│   └── Maintenance_Procedures
├── Compliance_Documentation/
│   ├── Validation_Documentation
│   ├── Risk_Assessments
│   ├── Audit_Reports
│   ├── Training_Records
│   └── Change_Control_Records
└── Emergency_Procedures/
    ├── Disaster_Recovery_Plan
    ├── Failover_Procedures
    ├── Emergency_Contact_Lists
    ├── Business_Continuity_Plan
    └── Recovery_Validation_Procedures
```

#### 11.1.2 Compliance Records
```python
# Document management system for compliance records
class ComplianceDocumentManager:
    def __init__(self, document_store):
        self.doc_store = document_store
        self.retention_policies = {
            'validation_records': 7,  # years
            'audit_reports': 10,      # years
            'training_records': 7,    # years
            'incident_reports': 10,   # years
            'change_records': 7       # years
        }
    
    def store_compliance_document(self, doc_type, content, metadata):
        """Store compliance document with proper metadata and retention"""
        
        document = {
            'document_id': self.generate_document_id(),
            'document_type': doc_type,
            'content': content,
            'metadata': metadata,
            'created_date': datetime.now(),
            'retention_period': self.retention_policies.get(doc_type, 7),
            'compliance_tags': self.extract_compliance_tags(content),
            'access_control': self.determine_access_control(doc_type),
            'digital_signature': self.apply_digital_signature(content)
        }
        
        # Store in secure document repository
        doc_id = self.doc_store.store(document)
        
        # Create audit trail entry
        self.log_document_creation(doc_id, doc_type, metadata)
        
        return doc_id
    
    def retrieve_compliance_documents(self, doc_type, date_range=None):
        """Retrieve compliance documents for audit or review"""
        
        query_params = {'document_type': doc_type}
        if date_range:
            query_params['date_range'] = date_range
            
        documents = self.doc_store.query(query_params)
        
        # Log document access
        self.log_document_access(query_params)
        
        return documents
```

### 11.2 Record Retention and Archival

#### 11.2.1 Retention Schedule
| Record Type | Retention Period | Storage Location | Access Level |
|-------------|------------------|------------------|--------------|
| Replication Logs | 1 year active, 7 years archive | Primary + Cloud | IT Admin |
| QA Validation Reports | 7 years | Document Management System | QA Manager |
| Audit Trail Records | 10 years (permanent for GMP) | Immutable Storage | QA + Auditors |
| Training Records | 7 years after termination | HR System + Backup | HR + QA |
| Incident Reports | 10 years | Secure Archive | Management |
| Configuration Changes | 7 years | Version Control + Archive | IT Admin |
| Performance Reports | 3 years active, 7 years archive | Monitoring System | Operations |

#### 11.2.2 Archival Procedures
```bash
# Automated archival script for replication records
#!/bin/bash

ARCHIVE_DATE=$(date -d "1 year ago" +%Y-%m-%d)
ARCHIVE_PATH="/archive/replication/$(date +%Y)"
CLOUD_ARCHIVE="s3://gacp-compliance-archive/replication/"

# Create archive directory structure
mkdir -p "$ARCHIVE_PATH"/{logs,reports,configurations}

# Archive replication logs older than 1 year
psql -h primary-db -c "
COPY (
    SELECT * FROM replication.log_entries 
    WHERE log_date < '$ARCHIVE_DATE'
) TO STDOUT WITH CSV HEADER
" > "$ARCHIVE_PATH/logs/replication_logs_$ARCHIVE_DATE.csv"

# Compress and encrypt archive files
tar -czf "$ARCHIVE_PATH/replication_archive_$ARCHIVE_DATE.tar.gz" \
    "$ARCHIVE_PATH"/{logs,reports,configurations}

# Encrypt archive with GPG
gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65536 \
    --symmetric --output "$ARCHIVE_PATH/replication_archive_$ARCHIVE_DATE.tar.gz.gpg" \
    "$ARCHIVE_PATH/replication_archive_$ARCHIVE_DATE.tar.gz"

# Upload to cloud storage
aws s3 cp "$ARCHIVE_PATH/replication_archive_$ARCHIVE_DATE.tar.gz.gpg" \
    "$CLOUD_ARCHIVE" --server-side-encryption AES256

# Verify upload and cleanup local files
if aws s3 ls "$CLOUD_ARCHIVE/replication_archive_$ARCHIVE_DATE.tar.gz.gpg"; then
    rm "$ARCHIVE_PATH/replication_archive_$ARCHIVE_DATE.tar.gz"
    echo "Archive successfully uploaded and local copy removed"
else
    echo "Upload failed - retaining local copy"
fi
```

## 12. Document Control and Review

### 12.1 Document Information

**Document Owner**: IT Operations Manager
**Technical Reviewer**: Database Administrator
**Compliance Reviewer**: Quality Assurance Manager
**Security Reviewer**: Information Security Manager

### 12.2 Revision History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2025-09-04 | Initial user-provided template | QA Manager |
| 2.0 | 2025-09-14 | Complete SOP development with comprehensive procedures and architecture | QA Manager |

### 12.3 Next Review

- **Scheduled Review Date**: September 14, 2026
- **Trigger Events**: Infrastructure changes, regulatory updates, security incidents, technology upgrades
- **Review Criteria**: Effectiveness, compliance, operational efficiency, security posture, technology advancement

---

**Document Control Notice**
- **Reviewed by**: Quality Assurance Manager, [Signature Required]
- **Approved by**: Operations Director, [Signature Required]

---

*This document is controlled under the GACP-ERP Document Management System. Printed copies are uncontrolled unless specifically marked otherwise.*