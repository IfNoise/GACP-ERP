---
title: "Operational Qualification (OQ) Protocol"
system: "GACP-ERP: Enterprise Resource Planning for Medical Cannabis Cultivation"
version: "1.0"
status: "approved"
last_updated: "2025-09-15"
approved_by: "QA Manager, IT Administrator, Compliance Officer"
regulatory_scope: "GACP Guidelines, 21 CFR Part 11, EU GMP Annex 11"
technology_stack: "VictoriaMetrics, EMQX, Telegraf, Tempo, Loki, OpenTelemetry"
---

# GACP-ERP Operational Qualification Protocol

## Purpose and Scope

Данный протокол устанавливает процедуры операционной квалификации (OQ) системы GACP-ERP для подтверждения корректной работы всех функциональных модулей в соответствии с User Requirements Specification (URS), Functional Specification (FS) и Design Specification (DS).

### Objectives

1. **Functional Verification**: Подтверждение работы всех модулей согласно спецификациям
2. **Regulatory Compliance**: Верификация соответствия GACP, 21 CFR Part 11, EU GMP Annex 11
3. **Integration Testing**: Проверка интеграции с observability стеком и IoT системами
4. **Performance Validation**: Подтверждение производительности в рабочих условиях
5. **Security Assessment**: Верификация системы безопасности и контроля доступа

### Scope

- **Core ERP Modules**: Все функциональные модули GACP-ERP системы
- **Observability Stack**: VictoriaMetrics, Tempo, Loki, EMQX, Telegraf
- **Security Systems**: Authentication, authorization, audit trail, e-signatures
- **Integration Points**: IoT sensors, external systems, reporting interfaces
- **Operational Procedures**: Backup/restore, disaster recovery, monitoring

## System Architecture Overview

### GACP-ERP Core Platform

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Business Logic │    │   Data Layer    │
│   (React/Vue)   │◄──►│   (Microservices)│◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Observability & Monitoring Stack

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Application     │    │ Environmental   │    │ Infrastructure  │
│ VictoriaMetrics │    │ VictoriaMetrics │    │ VictoriaMetrics │
│ (App Metrics)   │    │ (IoT Data)      │    │ (System)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Tempo      │    │      Loki       │    │      EMQX       │
│ (Distributed    │    │   (Centralized  │    │   (MQTT Broker  │
│  Tracing)       │    │    Logging)     │    │   for IoT)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Operational Qualification Test Modules

### Core Business Modules

#### Module 1: Plant Lifecycle Management

**Test Objective**: Verify complete plant lifecycle tracking from seed to harvest

**Test Cases**:

1. **OQ-PLM-001**: Seed/Clone Registration

   - Create new genetic material records
   - Verify unique identification assignment
   - Validate required field completion
   - Confirm audit trail generation

2. **OQ-PLM-002**: Growth Stage Transitions

   - Test automated stage progression
   - Verify environmental parameter tracking
   - Validate milestone documentation
   - Confirm compliance checkpoints

3. **OQ-PLM-003**: Harvest Processing
   - Execute harvest procedure workflows
   - Verify batch creation and tracking
   - Validate yield calculation accuracy
   - Confirm post-harvest documentation

**Expected Results**: All PLM workflows execute without errors, data integrity maintained throughout lifecycle

#### Module 2: Batch Management & Traceability

**Test Objective**: Verify comprehensive batch tracking and traceability

**Test Cases**:

1. **OQ-BM-001**: Batch Creation and Assignment

   - Create production batches
   - Assign plants to batches
   - Verify batch hierarchy structure
   - Validate parent-child relationships

2. **OQ-BM-002**: Chain of Custody Tracking

   - Test custody transfer workflows
   - Verify location tracking accuracy
   - Validate handler identification
   - Confirm timestamp integrity

3. **OQ-BM-003**: Genealogy and Lineage
   - Trace product genealogy
   - Verify genetic lineage tracking
   - Validate breeding records
   - Confirm compliance documentation

**Expected Results**: Complete traceability from seed to final product with unbroken chain of custody

#### Module 3: Quality Management System

**Test Objective**: Verify QMS functionality and regulatory compliance

**Test Cases**:

1. **OQ-QMS-001**: Specification Management

   - Create and manage product specifications
   - Test specification versioning
   - Verify approval workflows
   - Validate change control procedures

2. **OQ-QMS-002**: Testing and Analysis

   - Execute analytical testing workflows
   - Verify results entry and validation
   - Test out-of-specification handling
   - Confirm certificate of analysis generation

3. **OQ-QMS-003**: Deviation and CAPA Management
   - Create deviation records
   - Test investigation workflows
   - Verify CAPA assignment and tracking
   - Validate effectiveness assessment

**Expected Results**: QMS processes function according to GACP requirements with proper documentation

### Technology Integration Modules

#### Module 4: Observability and Monitoring

**Test Objective**: Verify observability stack integration and functionality

**Test Cases**:

1. **OQ-OBS-001**: Application Metrics (VictoriaMetrics App Cluster)

   - Verify application performance metrics collection
   - Test custom business metrics
   - Validate metric aggregation and storage
   - Confirm dashboard functionality

2. **OQ-OBS-002**: Environmental IoT Metrics (VictoriaMetrics IoT Cluster)

   - Test IoT sensor data ingestion via Telegraf
   - Verify EMQX MQTT broker functionality
   - Validate environmental data storage
   - Confirm alarm and threshold monitoring

3. **OQ-OBS-003**: Distributed Tracing (Tempo)

   - Verify OpenTelemetry instrumentation
   - Test trace collection and storage
   - Validate service dependency mapping
   - Confirm performance bottleneck identification

4. **OQ-OBS-004**: Centralized Logging (Loki)
   - Test application log aggregation
   - Verify structured logging formats
   - Validate log retention policies
   - Confirm log correlation with traces

**Expected Results**: Complete observability with clear separation between application and environmental metrics

#### Module 5: IoT and Environmental Systems

**Test Objective**: Verify IoT integration and environmental monitoring

**Test Cases**:

1. **OQ-IOT-001**: Sensor Data Collection

   - Test temperature sensor readings
   - Verify humidity monitoring
   - Validate CO2 level tracking
   - Confirm light intensity measurement

2. **OQ-IOT-002**: EMQX MQTT Broker Operations

   - Test MQTT client connections
   - Verify message publishing/subscribing
   - Validate QoS level handling
   - Confirm broker high availability

3. **OQ-IOT-003**: Telegraf Data Processing

   - Test data transformation rules
   - Verify metric standardization
   - Validate data enrichment
   - Confirm buffering and retry logic

4. **OQ-IOT-004**: Environmental Alarm System
   - Test threshold-based alarms
   - Verify notification delivery
   - Validate escalation procedures
   - Confirm alarm acknowledgment

**Expected Results**: Reliable IoT data collection with real-time environmental monitoring and alerting

### Compliance and Security Modules

#### Module 6: Electronic Records and Signatures

**Test Objective**: Verify 21 CFR Part 11 compliance for electronic records and signatures

**Test Cases**:

1. **OQ-ERS-001**: Electronic Record Integrity

   - Test record creation and modification
   - Verify data integrity controls
   - Validate tamper-evident mechanisms
   - Confirm backup and recovery procedures

2. **OQ-ERS-002**: Electronic Signature Implementation

   - Test digital signature creation
   - Verify identity authentication
   - Validate signature verification
   - Confirm non-repudiation controls

3. **OQ-ERS-003**: Audit Trail Functionality
   - Test comprehensive audit logging
   - Verify immutable audit records
   - Validate user action tracking
   - Confirm regulatory compliance reporting

**Expected Results**: Full 21 CFR Part 11 compliance with secure electronic records and signatures

#### Module 7: Access Control and Security

**Test Objective**: Verify security controls and access management

**Test Cases**:

1. **OQ-SEC-001**: Role-Based Access Control (RBAC)

   - Test role assignment and permissions
   - Verify principle of least privilege
   - Validate role inheritance
   - Confirm access matrix compliance

2. **OQ-SEC-002**: Authentication and Authorization

   - Test multi-factor authentication
   - Verify single sign-on functionality
   - Validate session management
   - Confirm password policy enforcement

3. **OQ-SEC-003**: Security Monitoring
   - Test intrusion detection
   - Verify security event logging
   - Validate incident response procedures
   - Confirm compliance monitoring

**Expected Results**: Robust security controls with comprehensive access management and monitoring

#### Module 8: Training and Competency Management

**Test Objective**: Verify training management system functionality

**Test Cases**:

1. **OQ-TCM-001**: Training Program Management

   - Test course creation and assignment
   - Verify competency tracking
   - Validate certification management
   - Confirm compliance reporting

2. **OQ-TCM-002**: Employee Qualification Tracking
   - Test qualification matrix application
   - Verify training completion tracking
   - Validate recertification scheduling
   - Confirm competency assessment

**Expected Results**: Comprehensive training management with regulatory compliance tracking

## Test Execution Procedures

### Pre-Execution Requirements

#### Environment Preparation

1. **System Readiness Verification**

   - Confirm IQ completion and approval
   - Verify system configuration baseline
   - Validate observability stack deployment
   - Confirm security controls implementation

2. **Test Data Preparation**

   - Create test user accounts with defined roles
   - Prepare sample genetic material data
   - Generate test IoT sensor readings
   - Establish baseline performance metrics

3. **Tool and Resource Setup**
   - Configure test execution environment
   - Prepare test data sets
   - Setup monitoring and logging
   - Establish communication channels

#### Test Team Roles and Responsibilities

| Role                      | Responsibilities                        | Qualifications                          |
| ------------------------- | --------------------------------------- | --------------------------------------- |
| **Test Manager**          | Overall test coordination and reporting | PMP certification, QA experience        |
| **QA Lead**               | Test case execution and validation      | QA background, GACP knowledge           |
| **IT Specialist**         | Technical testing and infrastructure    | System administration, DevOps           |
| **Compliance Officer**    | Regulatory compliance verification      | Regulatory experience, audit background |
| **Subject Matter Expert** | Business process validation             | Cannabis cultivation expertise          |

### Test Execution Methodology

#### Test Case Structure

Each test case follows standardized format:

```
Test ID: OQ-[MODULE]-[NUMBER]
Objective: [Clear test objective]
Prerequisites: [Required conditions]
Test Steps: [Detailed execution steps]
Expected Results: [Specific success criteria]
Actual Results: [To be completed during execution]
Pass/Fail: [Final determination]
Tester Signature: [Electronic signature]
Date: [Execution date]
```

#### Execution Process

1. **Test Case Review**: Pre-execution review of test procedures
2. **Environment Verification**: Confirm test environment readiness
3. **Step-by-Step Execution**: Follow documented test procedures
4. **Result Documentation**: Record actual vs. expected results
5. **Deviation Handling**: Document and investigate any deviations
6. **Approval Process**: Obtain required signatures for completion

### Performance Testing Procedures

#### Load Testing Scenarios

1. **Concurrent User Testing**

   - Simulate 100+ concurrent users
   - Test peak usage scenarios
   - Verify system responsiveness
   - Measure transaction throughput

2. **Data Volume Testing**

   - Process large datasets (10M+ records)
   - Test bulk import/export operations
   - Verify database performance
   - Measure query response times

3. **IoT Data Ingestion Testing**
   - Simulate 1000+ IoT sensors
   - Test high-frequency data collection
   - Verify EMQX broker performance
   - Measure Telegraf processing capacity

#### Performance Acceptance Criteria

| Metric                         | Target     | Measurement Method     |
| ------------------------------ | ---------- | ---------------------- |
| **Response Time**              | <2 seconds | Web page load time     |
| **Transaction Throughput**     | >100 TPS   | Peak load testing      |
| **System Availability**        | >99.9%     | Uptime monitoring      |
| **IoT Data Latency**           | <5 seconds | End-to-end measurement |
| **Database Query Performance** | <1 second  | Query execution time   |

## Integration Testing Procedures

### External System Integration

#### ERP-to-Observability Integration

1. **VictoriaMetrics Application Cluster**

   - Test metric ingestion from ERP modules
   - Verify custom business metrics
   - Validate dashboard integration
   - Confirm alert rule functionality

2. **VictoriaMetrics IoT Cluster**

   - Test environmental data separation
   - Verify IoT-specific dashboards
   - Validate environmental alerts
   - Confirm data retention policies

3. **Tempo Distributed Tracing**

   - Test OpenTelemetry integration
   - Verify trace propagation
   - Validate service maps
   - Confirm performance analysis

4. **Loki Centralized Logging**
   - Test log aggregation
   - Verify structured logging
   - Validate log correlation
   - Confirm search functionality

#### IoT System Integration

1. **EMQX MQTT Broker**

   - Test device connectivity
   - Verify message routing
   - Validate QoS handling
   - Confirm high availability

2. **Telegraf Data Collection**
   - Test input plugin configuration
   - Verify data transformation
   - Validate output routing
   - Confirm error handling

### Workflow Integration Testing

#### End-to-End Business Processes

1. **Complete Cultivation Cycle**

   - Seed registration → Growth monitoring → Harvest → Processing
   - Verify data flow between modules
   - Validate regulatory compliance points
   - Confirm traceability maintenance

2. **Quality Management Workflow**

   - Sample collection → Testing → Results → Release/Reject decision
   - Verify QMS integration
   - Validate compliance documentation
   - Confirm batch disposition

3. **Environmental Monitoring Integration**
   - IoT sensors → EMQX → Telegraf → VictoriaMetrics → Dashboards
   - Verify real-time data flow
   - Validate alarm generation
   - Confirm response procedures

## Disaster Recovery Testing

### Backup and Restore Procedures

#### Database Backup Testing

1. **Full Database Backup**

   - Execute complete database backup
   - Verify backup file integrity
   - Test backup encryption
   - Confirm offsite storage

2. **Incremental Backup Testing**
   - Test daily incremental backups
   - Verify point-in-time recovery
   - Validate backup automation
   - Confirm restoration procedures

#### Observability Stack Backup

1. **VictoriaMetrics Data Backup**

   - Test metric data backup procedures
   - Verify data export functionality
   - Validate backup completeness
   - Confirm restoration accuracy

2. **Configuration Backup**
   - Backup EMQX configurations
   - Test Telegraf config restoration
   - Verify Grafana dashboard backup
   - Confirm infrastructure as code

### Failover and Recovery Testing

#### High Availability Testing

1. **Database Failover**

   - Test primary database failure
   - Verify automatic failover
   - Validate data consistency
   - Confirm service continuity

2. **Application Server Failover**

   - Test load balancer functionality
   - Verify session persistence
   - Validate health checks
   - Confirm zero-downtime deployment

3. **Observability Stack Resilience**
   - Test VictoriaMetrics cluster failover
   - Verify EMQX broker redundancy
   - Validate monitoring continuity
   - Confirm alert delivery

#### Recovery Time Testing

| Scenario                  | RTO Target | RPO Target | Test Procedure                      |
| ------------------------- | ---------- | ---------- | ----------------------------------- |
| **Database Failure**      | 4 hours    | 15 minutes | Simulate DB crash, measure recovery |
| **Application Failure**   | 1 hour     | 5 minutes  | Stop services, measure restart time |
| **Complete Site Failure** | 24 hours   | 4 hours    | Simulate disaster, activate DR site |
| **Observability Failure** | 2 hours    | 30 minutes | Test monitoring stack recovery      |

## Acceptance Criteria and Sign-off

### Module-Specific Acceptance Criteria

#### Core Business Modules

- [ ] **Plant Lifecycle Management**: All workflows execute successfully with complete traceability
- [ ] **Batch Management**: Full batch tracking with unbroken chain of custody
- [ ] **Quality Management**: QMS processes comply with GACP requirements
- [ ] **Training Management**: Complete training tracking with compliance reporting

#### Technology Integration

- [ ] **Observability Stack**: Full metrics, tracing, and logging functionality with proper separation
- [ ] **IoT Integration**: Reliable environmental monitoring with real-time alerting
- [ ] **Performance**: All performance targets met under load conditions
- [ ] **Security**: Comprehensive access controls and audit capabilities

#### Compliance and Regulatory

- [ ] **21 CFR Part 11**: Electronic records and signatures fully compliant
- [ ] **GACP Guidelines**: All cultivation processes meet GACP standards
- [ ] **EU GMP Annex 11**: Computerized systems comply with EU requirements
- [ ] **Data Integrity**: ALCOA+ principles implemented throughout system

### Overall System Acceptance

#### Technical Acceptance Criteria

1. **Functionality**: 100% of test cases pass without critical defects
2. **Performance**: All performance benchmarks met or exceeded
3. **Integration**: Seamless integration between all system components
4. **Security**: No high or critical security vulnerabilities identified
5. **Compliance**: Full regulatory compliance verified and documented

#### Business Acceptance Criteria

1. **User Acceptance**: Business users approve system functionality
2. **Process Compliance**: All business processes meet regulatory requirements
3. **Training Effectiveness**: Users demonstrate competency in system operation
4. **Documentation**: Complete and accurate system documentation provided
5. **Support Readiness**: Technical support procedures established and tested

### Formal Approval and Sign-off

#### Required Approvals

| Role                   | Responsibility                    | Signature | Date |
| ---------------------- | --------------------------------- | --------- | ---- |
| **QA Manager**         | Quality assurance approval        |           |      |
| **IT Administrator**   | Technical implementation approval |           |      |
| **Compliance Officer** | Regulatory compliance approval    |           |      |
| **Farm Manager**       | Business process approval         |           |      |
| **Project Manager**    | Overall project approval          |           |      |

#### Documentation Requirements

- [ ] Complete test execution records
- [ ] Deviation reports and resolutions
- [ ] Performance test results
- [ ] Security assessment report
- [ ] Compliance verification documentation
- [ ] User acceptance test results
- [ ] Training completion records

### Post-OQ Activities

#### System Release Preparation

1. **Production Environment Setup**

   - Deploy validated system configuration
   - Implement production security controls
   - Establish monitoring and alerting
   - Configure backup and disaster recovery

2. **User Training and Go-Live**

   - Complete end-user training programs
   - Conduct production readiness review
   - Execute go-live procedures
   - Establish ongoing support processes

3. **Ongoing Monitoring and Maintenance**
   - Implement change control procedures
   - Establish periodic review schedules
   - Monitor system performance metrics
   - Maintain regulatory compliance

**OQ Completion Date**: ********\_********

**System Ready for Production**: ☐ Yes ☐ No (if No, specify required actions)

---

_This Operational Qualification Protocol is a controlled document and must be updated following the change control procedure._
