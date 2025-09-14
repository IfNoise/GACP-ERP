---
title: "SOP: IT Security and Data Protection"
module: "Information Security"
version: "1.0"
status: "active"
last_updated: "2025-09-14"
author: "IT Security Officer"
approver: "General Manager"
effective_date: "2025-09-14"
review_date: "2026-09-14"
related_sops:
  - SOP_AccessControl.md
  - SOP_AuditTrail.md
  - SOP_DataBackup.md
  - SOP_DocumentControl.md
related_modules:
  - SecurityModule
  - AuditModule
  - UserManagement
compliance_standards:
  - "FDA 21 CFR Part 11"
  - "EU GMP Annex 11"
  - "ISO 27001"
  - "ALCOA+ principles"
---

# SOP: IT Security and Data Protection

## 1. Purpose

This Standard Operating Procedure (SOP) establishes comprehensive information security controls and data protection measures for the GACP-ERP system to ensure compliance with regulatory requirements including FDA 21 CFR Part 11, EU GMP Annex 11, and ALCOA+ principles for data integrity.

## 2. Scope

This SOP applies to:

- All IT systems, databases, and digital assets within the organization
- GACP-ERP platform and integrated modules
- Electronic records and signatures
- Data storage, transmission, and processing systems
- Cloud infrastructure and third-party integrations
- IoT devices and environmental monitoring systems
- All personnel with access to computerized systems

## 3. Responsibilities

### 3.1 IT Security Officer

- Overall responsibility for information security program
- Security policy development and maintenance
- Risk assessment and vulnerability management
- Incident response coordination
- Security awareness training programs
- Compliance monitoring and reporting

### 3.2 System Administrators

- Implementation of technical security controls
- User access management and privilege administration
- System monitoring and log analysis
- Security patch management
- Backup and recovery operations
- Security configuration management

### 3.3 Database Administrators

- Database security configuration and hardening
- Data encryption implementation
- Database access control and monitoring
- Data integrity verification
- Performance monitoring for security impact

### 3.4 Network Administrators

- Network security architecture design
- Firewall and intrusion detection systems management
- Network traffic monitoring and analysis
- VPN and remote access security
- Network segmentation implementation

### 3.5 Quality Assurance Manager

- Security validation and testing oversight
- Compliance verification activities
- Change control approval for security-related changes
- Audit support and documentation review

### 3.6 All Personnel

- Adherence to information security policies
- Secure handling of sensitive information
- Prompt reporting of security incidents
- Participation in security awareness training
- Compliance with access control procedures

## 4. Security Framework

### 4.1 Multi-layered Security Architecture

#### 4.1.1 Physical Security

- Controlled access to server rooms and data centers
- Environmental monitoring and alerting
- Surveillance systems and access logging
- Secure disposal of storage media

#### 4.1.2 Network Security

- Firewall configuration with deny-by-default policies
- Network segmentation and VLANs
- Intrusion Detection and Prevention Systems (IDS/IPS)
- Secure wireless networking (WPA3 Enterprise)
- VPN access for remote connectivity

#### 4.1.3 Application Security

- Secure coding practices implementation
- Regular security testing and vulnerability assessments
- Web Application Firewall (WAF) deployment
- API security controls and rate limiting
- Session management and timeout controls

#### 4.1.4 Data Security

- Encryption at rest (AES-256) for all sensitive data
- Encryption in transit (TLS 1.3) for all communications
- Database encryption and key management
- Data classification and handling procedures
- Secure data backup and recovery processes

## 5. Access Control and Authentication

### 5.1 Multi-Factor Authentication (MFA)

- Mandatory MFA for all privileged accounts
- Time-based One-Time Password (TOTP) implementation
- Hardware token support for critical systems
- Biometric authentication where available

### 5.2 Role-Based Access Control (RBAC)

- Principle of least privilege enforcement
- Role definition aligned with job functions:
  - System Administrator
  - Quality Manager
  - Cultivation Technician
  - Laboratory Analyst
  - Auditor (Read-only)
  - Guest (Limited access)

### 5.3 Account Management

- Automated user provisioning and deprovisioning
- Regular access reviews (quarterly)
- Password complexity requirements:
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - No dictionary words or personal information
- Account lockout after 5 failed attempts
- Password aging (90 days maximum)

## 6. Data Protection and Privacy

### 6.1 Data Classification

- **Confidential**: Trade secrets, proprietary cultivation methods
- **Restricted**: Personal employee data, financial information
- **Internal**: Internal procedures, non-public operational data
- **Public**: Marketing materials, published research

### 6.2 Data Handling Requirements

- Encryption of all confidential and restricted data
- Secure data transmission protocols
- Data masking for non-production environments
- Regular data purging according to retention policies

### 6.3 Privacy Controls

- Personal data protection measures
- Data subject rights implementation
- Privacy impact assessments
- Consent management systems

## 7. System Monitoring and Logging

### 7.1 Comprehensive Logging

- Authentication events (success/failure)
- Authorization changes and privilege escalations
- Data access and modification events
- System configuration changes
- Administrative actions
- Security-related events and alerts

### 7.2 Log Management

- Centralized logging infrastructure (SIEM)
- Log retention for minimum 7 years (GMP requirement)
- Log integrity protection and tamper detection
- Regular log review and analysis
- Automated alerting for security events

### 7.3 Audit Trail Requirements (ALCOA+)

- **Attributable**: Clear user identification
- **Legible**: Readable and understandable
- **Contemporaneous**: Real-time or near-real-time logging
- **Original**: First capture of data
- **Accurate**: Correct and reliable information
- **Complete**: All relevant data captured
- **Consistent**: Uniform format and standards
- **Enduring**: Long-term preservation
- **Available**: Accessible when needed

## 8. Vulnerability Management

### 8.1 Vulnerability Assessment

- Quarterly internal vulnerability scans
- Annual external penetration testing
- Continuous monitoring for new vulnerabilities
- Risk-based prioritization of remediation efforts

### 8.2 Patch Management

- Critical security patches within 72 hours
- High-priority patches within 2 weeks
- Regular patches within 30 days
- Change control approval for all patches
- Testing in non-production environments first

### 8.3 Configuration Management

- Hardened system configurations
- Regular compliance scanning
- Configuration drift detection
- Standardized security baselines

## 9. Incident Response

### 9.1 Incident Classification

- **Category 1**: Critical security breach with data loss
- **Category 2**: Significant security event with potential impact
- **Category 3**: Minor security incident with limited scope

### 9.2 Response Procedures

1. **Detection and Analysis** (15 minutes)

   - Initial incident assessment
   - Impact evaluation
   - Stakeholder notification

2. **Containment** (30 minutes)

   - Immediate threat mitigation
   - System isolation if necessary
   - Evidence preservation

3. **Eradication and Recovery** (Variable)

   - Root cause analysis
   - System remediation
   - Service restoration
   - Enhanced monitoring

4. **Post-Incident Activities** (7 days)
   - Incident documentation
   - Lessons learned review
   - Process improvements
   - Stakeholder reporting

### 9.3 Communication Procedures

- Internal notification chains
- Regulatory reporting requirements
- Customer communication protocols
- Media response procedures

## 10. Business Continuity and Disaster Recovery

### 10.1 Backup Strategy

- Daily incremental backups
- Weekly full system backups
- Monthly backup integrity testing
- Offsite backup storage (3-2-1 rule)
- Encrypted backup transmission and storage

### 10.2 Recovery Objectives

- **Recovery Time Objective (RTO)**: 4 hours maximum
- **Recovery Point Objective (RPO)**: 1 hour maximum
- **Mean Time to Recovery (MTTR)**: 2 hours target

### 10.3 Disaster Recovery Testing

- Quarterly DR plan testing
- Annual full-scale DR exercises
- Documentation of test results
- Continuous improvement based on findings

## 11. Compliance and Validation

### 11.1 Regulatory Compliance

- FDA 21 CFR Part 11 validation
- EU GMP Annex 11 compliance
- ALCOA+ data integrity principles
- ISO 27001 information security management

### 11.2 Internal Audits

- Quarterly security audits
- Annual compliance assessments
- Continuous monitoring programs
- Risk assessment updates

### 11.3 External Audits

- Support for regulatory inspections
- Third-party security assessments
- Compliance certification maintenance
- Audit finding remediation

## 12. Training and Awareness

### 12.1 Security Awareness Program

- Mandatory annual security training
- Role-specific security training
- Phishing simulation exercises
- Security policy updates training

### 12.2 Training Documentation

- Training completion records
- Competency assessments
- Continuing education requirements
- Training effectiveness evaluation

## 13. Third-Party Security

### 13.1 Vendor Management

- Security risk assessments
- Contractual security requirements
- Regular vendor security reviews
- Incident notification procedures

### 13.2 Cloud Security

- Cloud security posture management
- Multi-cloud security controls
- Data residency requirements
- Cloud access security broker (CASB)

## 14. Procedures and Controls

### 14.1 Password Management

1. Use enterprise password manager
2. Generate unique passwords for each system
3. Store passwords in encrypted vault
4. Regular password rotation
5. Secure password sharing procedures

### 14.2 System Hardening

1. Disable unnecessary services and ports
2. Apply security patches promptly
3. Configure secure communications
4. Implement access controls
5. Enable comprehensive logging

### 14.3 Data Encryption

1. Identify sensitive data requiring encryption
2. Implement appropriate encryption algorithms
3. Manage encryption keys securely
4. Monitor encryption effectiveness
5. Regular key rotation procedures

## 15. Key Performance Indicators (KPIs)

### 15.1 Security Metrics

- Mean time to detect (MTTD) security incidents
- Mean time to respond (MTTR) to incidents
- Number of security vulnerabilities identified and remediated
- Percentage of systems with current security patches
- User security training completion rates

### 15.2 Compliance Metrics

- Audit finding resolution time
- Compliance assessment scores
- Regulatory inspection readiness
- Data integrity violation rates

## 16. Emergency Procedures

### 16.1 Critical Security Incident Response

1. **Immediate Actions** (0-15 minutes)

   - Activate incident response team
   - Assess incident severity
   - Implement containment measures
   - Document initial findings

2. **Short-term Response** (15 minutes - 2 hours)

   - Detailed incident analysis
   - Communication to stakeholders
   - Evidence collection and preservation
   - System isolation if required

3. **Recovery Phase** (2-24 hours)

   - Root cause analysis
   - System remediation
   - Security enhancement implementation
   - Service restoration

4. **Post-Incident** (1-7 days)
   - Comprehensive incident report
   - Lessons learned documentation
   - Process improvement recommendations
   - Regulatory notifications if required

## 17. Documentation and Records

### 17.1 Required Documentation

- Security policies and procedures
- Risk assessment reports
- Incident response records
- Audit logs and reports
- Training records and certifications
- Vendor security assessments

### 17.2 Record Retention

- Security logs: 7 years minimum
- Incident reports: 10 years
- Training records: Duration of employment + 3 years
- Audit documentation: 10 years
- Risk assessments: 5 years

## 18. Validation and Testing

### 18.1 Security Testing Program

- Penetration testing (annual)
- Vulnerability assessments (quarterly)
- Security code reviews
- Configuration compliance testing
- Social engineering assessments

### 18.2 Validation Documentation

- Test plans and procedures
- Test execution records
- Deviation reports and resolutions
- Validation summary reports
- Regulatory submission support

## 19. Change Control

All changes to security controls, configurations, or procedures must follow the established change control process as defined in SOP_ChangeControl.md, including:

- Change request documentation
- Risk assessment and impact analysis
- Approval workflows
- Testing and validation requirements
- Implementation and rollback procedures

## 20. References and Standards

### 20.1 Regulatory References

- FDA 21 CFR Part 11 - Electronic Records and Signatures
- EU GMP Annex 11 - Computerised Systems
- ICH Q9 - Quality Risk Management
- ALCOA+ Data Integrity Principles

### 20.2 Industry Standards

- ISO 27001:2013 - Information Security Management
- NIST Cybersecurity Framework
- COBIT 2019 - IT Governance Framework
- OWASP Security Guidelines

### 20.3 Internal References

- URS-SEC-001: Security Requirements Specification
- FS-SEC-001: Security Functional Specification
- RA-SEC-001: Security Risk Assessment
- VMP-SEC-001: Security Validation Master Plan

## 21. Appendices

### Appendix A: Security Incident Report Template

### Appendix B: Risk Assessment Methodology

### Appendix C: Security Configuration Checklists

### Appendix D: Emergency Contact Information

### Appendix E: Regulatory Compliance Mapping

---

## Document Control

| Version | Date       | Author              | Approved By     | Summary of Changes            |
| ------- | ---------- | ------------------- | --------------- | ----------------------------- |
| 1.0     | 2025-09-14 | IT Security Officer | General Manager | Initial comprehensive version |

**Next Review Date**: 2026-09-14  
**Document Location**: Mayan-EDMS Document ID: SOP-IT-SEC-001
