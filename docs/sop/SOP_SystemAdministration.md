---
title: "SOP: System Administration"
document_number: "SOP-GACP-SYS-001"
version: "2.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approved_by: "Quality Assurance Manager"
department: "IT Operations"
classification: "Critical Infrastructure"
related_procedures:
  [
    "SOP_DataBackup",
    "SOP_ITSecurity",
    "SOP_AccessControl",
    "SOP_ChangeControl",
    "SOP_IncidentManagement",
  ]
regulatory_references:
  [
    "ALCOA+ Data Integrity",
    "FDA 21 CFR Part 11",
    "EU GMP Annex 11",
    "GACP Guidelines",
  ]
---

# SOP: System Administration

## 1. Purpose and Scope

### 1.1 Purpose

This Standard Operating Procedure establishes comprehensive procedures for system administration of the GACP-compliant cannabis cultivation ERP system, ensuring:

- **System Reliability**: Maintaining 99.9% uptime for critical business operations
- **Security Management**: Comprehensive access control and security monitoring
- **Data Integrity**: ALCOA+ compliant data management and protection
- **Change Control**: Controlled system updates and configuration management
- **Compliance**: Adherence to regulatory requirements for computerized systems

### 1.2 Scope

This procedure covers all aspects of GACP-ERP system administration:

- User account management and access control
- System monitoring and performance optimization
- Database administration and maintenance
- Infrastructure management (Kubernetes, networking, storage)
- Security administration and incident response
- Backup and disaster recovery operations
- System updates and patch management
- Audit trail management and compliance reporting

### 1.3 Regulatory Framework

All system administration activities must comply with:

- **ALCOA+ Principles**: Data integrity throughout system lifecycle
- **FDA 21 CFR Part 11**: Electronic records and signatures requirements
- **EU GMP Annex 11**: Computerized systems validation
- **GACP Guidelines**: Good Agricultural and Collection Practices
- **Data Protection Regulations**: GDPR and privacy requirements

## 2. System Architecture Overview

### 2.1 Core Infrastructure Components

#### 2.1.1 Container Orchestration

- **Kubernetes Cluster**: Production and development environments
- **Container Registry**: Secure image storage and management
- **Service Mesh**: Inter-service communication and security
- **Load Balancers**: High availability and traffic distribution

#### 2.1.2 Data Tier

- **PostgreSQL**: Primary transactional database
- **immudb**: Immutable audit trail storage
- **MinIO**: Object storage for documents and media
- **Redis**: Caching and session management

#### 2.1.3 Message Queuing

- **Apache Kafka**: Event streaming and integration
- **MQTT**: IoT device communication
- **RabbitMQ**: Reliable message delivery

#### 2.1.4 Security and Identity

- **Keycloak**: Identity and access management (IAM)
- **SCUD**: Security, Compliance, User management, Data protection
- **TLS/SSL**: Encryption in transit
- **Certificate Management**: PKI infrastructure

### 2.2 Monitoring and Observability

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Centralized logging (Elasticsearch, Logstash, Kibana)
- **Jaeger**: Distributed tracing

## 3. Roles and Responsibilities

### 3.1 System Administrator

**Qualifications**: Certified in Linux administration, Kubernetes, and database management

**Responsibilities**:

- Daily system monitoring and maintenance
- User account provisioning and deprovisioning
- Database backup verification and testing
- Security patch application and testing
- Performance optimization and tuning
- Incident response and troubleshooting

### 3.2 DevOps Engineer

**Qualifications**: Certified in CI/CD, container technologies, and cloud platforms

**Responsibilities**:

- Infrastructure as Code (IaC) management
- Deployment pipeline maintenance
- Container image management and security scanning
- Kubernetes cluster management
- Automation development and maintenance

### 3.3 IT Manager

**Qualifications**: IT management experience with regulatory compliance background

**Responsibilities**:

- Overall IT strategy and planning
- Change approval and oversight
- Compliance monitoring and reporting
- Budget planning and resource allocation
- Vendor management and contract oversight

### 3.4 Security Administrator

**Qualifications**: Certified in cybersecurity and compliance frameworks

**Responsibilities**:

- Security policy implementation and enforcement
- Access control management and review
- Security incident investigation and response
- Vulnerability assessment and remediation
- Compliance audit support

## 4. User Account Management

### 4.1 Account Provisioning

#### 4.1.1 New User Account Creation

1. **Request Authorization**

   - HR submits new user request with role specification
   - IT Manager reviews and approves request
   - Security Administrator validates role assignments
   - Document request in change management system

2. **Account Setup Process**

   - Create account in Keycloak identity provider
   - Assign appropriate role-based permissions
   - Configure multi-factor authentication (MFA)
   - Set password policy compliance
   - Generate temporary credentials

3. **Access Verification**
   - Test account login and permissions
   - Verify access to required ERP modules
   - Confirm MFA setup completion
   - Document account creation in audit log

#### 4.1.2 Role-Based Access Control (RBAC)

1. **Standard Roles Definition**

   - **Production Operator**: Basic cultivation operations
   - **Quality Analyst**: QA/QC functions and reporting
   - **Supervisor**: Team management and oversight
   - **Manager**: Department management and reporting
   - **Administrator**: System configuration and management

2. **Permission Matrix Management**
   - Maintain updated role-permission matrix
   - Regular review of role definitions (quarterly)
   - Document any role modifications
   - Ensure principle of least privilege

### 4.2 Account Maintenance

#### 4.2.1 Regular Account Reviews

1. **Monthly Active Account Review**

   - Generate report of all active accounts
   - Verify employment status with HR
   - Identify inactive accounts (>30 days)
   - Review privileged account usage

2. **Quarterly Access Rights Review**
   - Review user permissions against current job roles
   - Identify and remove excessive permissions
   - Update role assignments based on job changes
   - Document review findings and actions

#### 4.2.2 Account Modifications

1. **Role Change Process**

   - HR submits role change request
   - IT Manager approves permission changes
   - Update Keycloak role assignments
   - Test new permissions before finalizing
   - Document changes in audit trail

2. **Temporary Access Grants**
   - Document business justification
   - Set specific expiration date
   - Monitor temporary access usage
   - Automatically revoke at expiration

### 4.3 Account Deprovisioning

#### 4.3.1 Employee Termination Process

1. **Immediate Actions** (within 1 hour of notification)

   - Disable account in Keycloak
   - Revoke all active sessions
   - Block VPN and remote access
   - Notify security team of termination

2. **Data Handling** (within 24 hours)

   - Transfer ownership of critical data
   - Archive personal files if required
   - Remove personal information per GDPR
   - Update group memberships and distribution lists

3. **Final Cleanup** (within 1 week)
   - Delete account from all systems
   - Revoke certificates and tokens
   - Update emergency contact lists
   - Complete deprovisioning documentation

## 5. System Monitoring and Performance

### 5.1 Continuous Monitoring

#### 5.1.1 Infrastructure Monitoring

1. **Server Health Monitoring**

   - CPU utilization (alert at >80%)
   - Memory usage (alert at >85%)
   - Disk space (alert at >90%)
   - Network connectivity and throughput
   - Service availability and response times

2. **Database Performance Monitoring**

   - Query performance and slow queries
   - Connection pool utilization
   - Transaction throughput and latency
   - Backup completion status
   - Database integrity checks

3. **Application Performance Monitoring**
   - Response times for critical business functions
   - Error rates and exception tracking
   - User session monitoring
   - API performance and availability
   - Resource consumption by application modules

#### 5.1.2 Alerting and Escalation

1. **Alert Severity Levels**

   - **Critical**: System down, data loss risk (immediate response)
   - **High**: Performance degradation, security events (15 minutes)
   - **Medium**: Resource warnings, configuration issues (1 hour)
   - **Low**: Information, planned maintenance (4 hours)

2. **Escalation Procedures**
   - Level 1: System Administrator (immediate)
   - Level 2: IT Manager and on-call engineer (15 minutes)
   - Level 3: Senior management and vendor support (1 hour)
   - Level 4: External emergency support (2 hours)

### 5.2 Performance Optimization

#### 5.2.1 Capacity Planning

1. **Resource Utilization Analysis**

   - Historical trend analysis of system resources
   - Identification of peak usage patterns
   - Capacity forecasting based on business growth
   - Regular review of infrastructure sizing

2. **Performance Tuning**
   - Database query optimization
   - Application caching strategies
   - Network bandwidth optimization
   - Storage performance improvements

#### 5.2.2 Preventive Maintenance

1. **Scheduled Maintenance Windows**

   - Weekly maintenance window: Sunday 2-6 AM
   - Monthly major maintenance: First Saturday 10 PM - 6 AM
   - Emergency maintenance: As required with management approval
   - Advance notification to all users (72 hours minimum)

2. **Maintenance Activities**
   - Database maintenance and optimization
   - Log rotation and cleanup
   - Security patch application
   - Performance baseline updates
   - Backup verification testing

## 6. Database Administration

### 6.1 Database Maintenance

#### 6.1.1 Daily Maintenance Tasks

1. **Backup Verification**

   - Verify completion of automated backups
   - Check backup integrity and file sizes
   - Test backup restoration on development environment
   - Document any backup failures or issues

2. **Performance Monitoring**
   - Review slow query reports
   - Monitor database connection pools
   - Check tablespace utilization
   - Analyze wait events and blocking sessions

#### 6.1.2 Weekly Maintenance Tasks

1. **Database Health Checks**

   - Run database consistency checks
   - Update database statistics
   - Rebuild fragmented indexes
   - Review and apply minor database patches

2. **Security and Compliance**
   - Review database access logs
   - Verify encryption key rotation
   - Check compliance with retention policies
   - Update database user permissions

### 6.2 Data Integrity Management

#### 6.2.1 ALCOA+ Compliance

1. **Attributable**

   - All database changes linked to authenticated users
   - Audit trail for all data modifications
   - User activity logging and monitoring

2. **Legible**

   - Standardized data formats and encoding
   - Clear field definitions and constraints
   - Readable backup and archive formats

3. **Contemporaneous**

   - Real-time timestamp recording
   - Synchronized system clocks
   - Immediate audit trail updates

4. **Original**

   - Immutable audit records in immudb
   - Original data preservation during migrations
   - Cryptographic hashing for integrity verification

5. **Accurate**
   - Data validation rules and constraints
   - Input verification and sanitization
   - Regular data quality assessments

#### 6.2.2 Data Protection

1. **Encryption Management**

   - Encryption at rest for all sensitive data
   - TLS encryption for data in transit
   - Regular encryption key rotation
   - Secure key management practices

2. **Access Control**
   - Database-level access controls
   - Application-level security
   - Query auditing and monitoring
   - Privileged user monitoring

## 7. Security Administration

### 7.1 Access Control Management

#### 7.1.1 Authentication Systems

1. **Single Sign-On (SSO) Management**

   - Keycloak configuration and maintenance
   - Federation with external identity providers
   - Multi-factor authentication enforcement
   - Session management and timeout policies

2. **Certificate Management**
   - SSL/TLS certificate lifecycle management
   - Certificate authority (CA) operations
   - Certificate renewal automation
   - Revocation and emergency procedures

#### 7.1.2 Authorization Management

1. **Role-Based Access Control**

   - Regular permission audits
   - Role definition updates
   - Privilege escalation monitoring
   - Access certification processes

2. **API Security**
   - API key management and rotation
   - Rate limiting and throttling
   - API access logging and monitoring
   - OAuth and JWT token management

### 7.2 Security Monitoring

#### 7.2.1 Threat Detection

1. **Security Event Monitoring**

   - Failed login attempt monitoring
   - Unusual access pattern detection
   - Privilege escalation detection
   - Data exfiltration monitoring

2. **Vulnerability Management**
   - Regular vulnerability scanning
   - Patch management and testing
   - Security configuration validation
   - Penetration testing coordination

#### 7.2.2 Incident Response

1. **Security Incident Classification**

   - **Critical**: Active breach, data compromise
   - **High**: Attempted breach, system compromise
   - **Medium**: Security policy violation
   - **Low**: Security awareness event

2. **Response Procedures**
   - Immediate containment actions
   - Evidence preservation
   - Impact assessment
   - Recovery and restoration
   - Post-incident review and improvement

## 8. Backup and Disaster Recovery

### 8.1 Backup Management

#### 8.1.1 Backup Strategy

1. **Backup Types and Frequency**

   - **Full Backup**: Weekly (Sunday 2 AM)
   - **Incremental Backup**: Daily (2 AM)
   - **Transaction Log Backup**: Every 15 minutes
   - **Configuration Backup**: After each change

2. **Backup Verification**
   - Automated backup completion checks
   - Monthly restoration testing
   - Backup integrity verification
   - Off-site backup confirmation

#### 8.1.2 Retention Policy

1. **Retention Schedule**

   - Daily backups: 30 days retention
   - Weekly backups: 12 weeks retention
   - Monthly backups: 7 years retention
   - Configuration backups: Permanent retention

2. **Archival Management**
   - Long-term storage in secure location
   - Regular archival media testing
   - Migration to new media as required
   - Secure disposal of expired media

### 8.2 Disaster Recovery

#### 8.2.1 Recovery Procedures

1. **Recovery Time Objectives (RTO)**

   - Critical systems: 4 hours
   - Production systems: 8 hours
   - Development systems: 24 hours
   - Reporting systems: 48 hours

2. **Recovery Point Objectives (RPO)**
   - Transaction data: 15 minutes
   - Configuration data: 1 hour
   - Historical data: 24 hours
   - Archived data: 1 week

#### 8.2.2 Business Continuity

1. **Failover Procedures**

   - Automated failover for critical services
   - Manual failover procedures documentation
   - Regular failover testing (quarterly)
   - Communication procedures during outages

2. **Alternate Site Operations**
   - Secondary site readiness assessment
   - Data synchronization procedures
   - Network connectivity verification
   - User access from alternate locations

## 9. Change Management

### 9.1 Change Control Process

#### 9.1.1 Change Classification

1. **Emergency Changes**

   - Security vulnerabilities
   - Critical system failures
   - Data integrity threats
   - Regulatory compliance issues

2. **Standard Changes**

   - Pre-approved routine maintenance
   - Security patch application
   - Configuration updates
   - User access modifications

3. **Normal Changes**
   - System upgrades
   - New feature implementations
   - Infrastructure modifications
   - Process improvements

#### 9.1.2 Change Approval Process

1. **Change Request Submission**

   - Complete change request form
   - Include technical and business justification
   - Assess risk and impact
   - Define rollback procedures

2. **Change Review and Approval**

   - Technical review by system administrators
   - Business impact assessment
   - Risk evaluation and mitigation
   - Approval by change advisory board

3. **Change Implementation**
   - Pre-implementation testing
   - Scheduled implementation window
   - Real-time monitoring during change
   - Post-implementation verification

### 9.2 Configuration Management

#### 9.2.1 Configuration Baseline

1. **Infrastructure as Code (IaC)**

   - Kubernetes deployment manifests
   - Database schema versions
   - Network configuration templates
   - Security policy definitions

2. **Version Control**
   - All configuration in Git repositories
   - Branching strategy for environments
   - Code review requirements
   - Automated deployment pipelines

#### 9.2.2 Configuration Auditing

1. **Regular Configuration Reviews**

   - Monthly configuration compliance checks
   - Quarterly configuration baseline updates
   - Annual configuration audit
   - Continuous configuration monitoring

2. **Drift Detection**
   - Automated configuration drift detection
   - Configuration compliance reporting
   - Remediation procedures for drift
   - Root cause analysis for unauthorized changes

## 10. Compliance and Audit Support

### 10.1 Audit Trail Management

#### 10.1.1 Audit Log Configuration

1. **System Activity Logging**

   - User authentication and authorization events
   - Data access and modification activities
   - System configuration changes
   - Administrative actions and commands

2. **Log Retention and Storage**
   - Real-time logs in Elasticsearch
   - Long-term storage in immutable format
   - 7-year retention for GMP compliance
   - Secure off-site backup of audit logs

#### 10.1.2 Audit Log Analysis

1. **Regular Log Reviews**

   - Daily review of security events
   - Weekly review of administrative actions
   - Monthly comprehensive log analysis
   - Quarterly audit trail validation

2. **Compliance Reporting**
   - Automated compliance report generation
   - Audit trail completeness verification
   - Exception reporting and investigation
   - Regulatory submission support

### 10.2 Regulatory Compliance

#### 10.2.1 FDA 21 CFR Part 11 Compliance

1. **Electronic Records**

   - Comprehensive audit trails
   - Record retention and retrieval
   - Data integrity protection
   - System validation documentation

2. **Electronic Signatures**
   - Digital signature implementation
   - Signature verification processes
   - Signature audit trails
   - Non-repudiation controls

#### 10.2.2 EU GMP Annex 11 Compliance

1. **Computerized System Validation**

   - System risk assessment
   - Validation lifecycle documentation
   - Change control procedures
   - Periodic review processes

2. **Data Integrity**
   - ALCOA+ implementation
   - Data governance procedures
   - Technical and procedural controls
   - Regular data integrity assessments

## 11. Training and Competency

### 11.1 Administrator Training

#### 11.1.1 Initial Training Requirements

**Target Audience**: New system administrators
**Training Content**:

- GACP-ERP system architecture and components
- Security policies and procedures
- Database administration best practices
- Regulatory compliance requirements
- Emergency response procedures

**Training Method**: Combination of classroom and hands-on training
**Duration**: 40 hours over 2 weeks
**Competency Assessment**: Written exam and practical demonstration

#### 11.1.2 Ongoing Training

1. **Monthly Technical Training**

   - New technology updates
   - Security threat awareness
   - Best practice sharing
   - Tool and process improvements

2. **Annual Compliance Training**
   - Regulatory requirement updates
   - Audit preparation procedures
   - Data integrity principles
   - Change management processes

### 11.2 Training Documentation

#### 11.2.1 Training Materials

- **Administrator Manual**: Comprehensive system administration guide
- **Procedure Checklists**: Step-by-step task instructions
- **Emergency Procedures**: Quick reference for incident response
- **Video Tutorials**: Visual training for complex procedures

#### 11.2.2 Training Records

- Individual training completion tracking
- Competency assessment results
- Continuing education credits
- Training effectiveness evaluation

## 12. Document Control and Review

### 12.1 Document Information

**Document Owner**: IT Operations Manager
**Technical Reviewer**: Senior System Administrator
**Compliance Reviewer**: Quality Assurance Manager

### 12.2 Revision History

| Version | Date       | Changes                                       | Approved By |
| ------- | ---------- | --------------------------------------------- | ----------- |
| 1.0     | 2025-09-14 | Initial basic template (19 lines)             | QA Manager  |
| 2.0     | 2025-09-14 | Complete SOP development with full procedures | QA Manager  |

### 12.3 Next Review

- **Scheduled Review Date**: September 14, 2026
- **Trigger Events**: Infrastructure changes, regulatory updates, audit findings
- **Review Criteria**: Effectiveness, compliance, operational efficiency

---

**Document Control Notice**

- **Reviewed by**: Quality Assurance Manager, [Signature Required]
- **Approved by**: Operations Director, [Signature Required]

---

_This document is controlled under the GACP-ERP Document Management System. Printed copies are uncontrolled unless specifically marked otherwise._
