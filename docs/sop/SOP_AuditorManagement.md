---
title: "SOP: Auditor Account Management"
version: "1.0"
effective_date: "2025-09-16"
review_date: "2026-09-16"
approved_by: "Compliance Officer, IT Security Manager"
status: "draft"
regulatory_scope: "21 CFR Part 11, EU GMP Annex 11, GACP Guidelines"
---

# SOP: Auditor Account Management

**Document ID**: SOP-SEC-003  
**Version**: 1.0  
**Classification**: Controlled Document

## 1. Purpose and Scope

### 1.1 Purpose

This Standard Operating Procedure (SOP) defines the processes for creating, managing, and deactivating auditor accounts in the GACP-ERP system, ensuring compliance with regulatory requirements and maintaining data integrity during audit activities.

### 1.2 Scope

This SOP applies to:

- External auditors (regulatory agencies, government inspectors)
- Internal auditors (quality assurance personnel)
- Third-party auditors (certification bodies, customer audits)
- All personnel involved in auditor account management

## 2. Responsibilities

| Role                   | Responsibilities                                                         |
| ---------------------- | ------------------------------------------------------------------------ |
| **Compliance Officer** | Approve external and third-party auditor access requests                 |
| **IT Administrator**   | Create, configure, and deactivate auditor accounts                       |
| **Quality Manager**    | Approve internal auditor accounts and scope definitions                  |
| **Security Officer**   | Monitor auditor activities and ensure compliance with security protocols |
| **HR Manager**         | Verify credentials and background checks for all auditor types           |
| **Audit Coordinator**  | Facilitate auditor orientation and provide system training               |

## 3. Procedures

### 3.1 External Auditor Account Management

#### 3.1.1 Account Request Process

**Prerequisites:**

- Official notification from regulatory agency
- 48-hour minimum advance notice (72 hours preferred)
- Completed security clearance requirements

**Process Steps:**

1. **Notification Receipt**

   - Regulatory agency provides official audit notification
   - Compliance Officer logs notification in audit tracking system
   - Estimated audit duration and scope documented

2. **Initial Approval**

   - Compliance Officer reviews notification
   - Confirms regulatory authority and jurisdiction
   - Approves or escalates for management review

3. **Account Request Submission**
   - IT Administrator receives formal request
   - Required information collected:
     - Full name and title of auditor(s)
     - Regulatory agency and badge numbers
     - Estimated audit duration
     - Specific areas/systems requiring access
     - Contact information

#### 3.1.2 Account Provisioning

**Account Configuration:**

```sql
-- External Auditor Account Setup
INSERT INTO users (
    username, user_type, auditor_certification, organization,
    account_expiry_date, temporary_account, supervisor_required,
    nda_signed, access_areas
) VALUES (
    'ext_auditor_[id]', 'external_auditor', '[certification]', '[agency]',
    CURRENT_DATE + INTERVAL '30 days', true, false,
    true, ARRAY['compliance', 'audit_trail', 'documentation']
);

-- Role Assignment
INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u, roles r
WHERE u.username = 'ext_auditor_[id]'
  AND r.role_name = 'external_auditor';
```

**Access Permissions:**

- ✅ Read-only access to all compliance data
- ✅ Full audit trail viewing and export
- ✅ Document access with watermarking
- ✅ Report generation capabilities
- ❌ No modification rights
- ❌ No system configuration access

#### 3.1.3 Orientation and Training

**Mandatory Orientation (Duration: 30 minutes):**

1. **Facility Safety Briefing**

   - Emergency procedures and evacuation routes
   - Safety equipment locations
   - Personal protective equipment requirements

2. **System Access Training**

   - Login procedures and password policies
   - Navigation overview of auditor interface
   - Report generation and export functions

3. **Documentation Structure**

   - Location of SOPs and regulatory documents
   - Electronic signature system overview
   - Audit trail interpretation

4. **Compliance Policies**
   - Photography and recording restrictions
   - Data handling and confidentiality requirements
   - Escort procedures for sensitive areas

### 3.2 Internal Auditor Account Management

#### 3.2.1 Account Request and Approval

**Prerequisites:**

- Internal auditor certification or equivalent qualification
- Completed GACP-ERP training program
- Background check clearance
- Management approval

**Process Steps:**

1. **Qualification Verification**

   - HR Manager verifies auditor credentials
   - Training records reviewed and updated
   - Background check status confirmed

2. **Account Creation**
   - Quality Manager approves account request
   - IT Administrator provisions account with internal_auditor role
   - Account validity period set (typically 1 year)

**Enhanced Permissions:**

- ✅ Read access to operational data
- ✅ CAPA creation and management
- ✅ Risk assessment tools
- ✅ Audit finding documentation
- ⚠️ Limited modification rights (audit-related only)
- ❌ No production data modification

### 3.3 Third-Party Auditor Account Management

#### 3.3.1 Pre-Engagement Requirements

**Documentation Required:**

- Valid third-party auditor certification
- Signed NDA and confidentiality agreement
- Insurance and liability coverage verification
- Background verification completion

#### 3.3.2 Account Setup and Scope Limitation

**Scope-Limited Access:**

- Access restricted to specific audit areas only
- Time-limited account (project duration + 5 days)
- Mandatory escort for physical facility access
- All document exports watermarked and logged

### 3.4 Account Monitoring and Activity Logging

#### 3.4.1 Real-Time Monitoring

**Automated Monitoring Systems:**

```javascript
// Auditor Activity Monitoring
const auditorActivityMonitor = {
  triggers: [
    "login_attempt",
    "data_access",
    "document_export",
    "report_generation",
    "logout",
  ],

  alertConditions: [
    "multiple_failed_logins",
    "access_outside_scope",
    "unusual_data_patterns",
    "extended_session_duration",
  ],

  logLevel: "DETAILED",
  realTimeAlerts: true,
};
```

**Activity Logging Requirements:**

- All auditor actions logged with timestamp
- IP address and device information captured
- Document access and export tracked
- Session duration monitoring
- Failed access attempts recorded

#### 3.4.2 Daily Activity Reports

**Automated Daily Summary:**

- Active auditor sessions
- Data accessed and exported
- System alerts or anomalies
- Session duration statistics

### 3.5 Account Deactivation and Data Retention

#### 3.5.1 Scheduled Deactivation

**Automatic Deactivation Triggers:**

- Account expiry date reached
- Audit completion notification
- Revocation request from authorized personnel

**Deactivation Process:**

```sql
-- Account Deactivation
UPDATE users
SET active = false,
    termination_date = CURRENT_DATE,
    last_login = NULL
WHERE user_type IN ('external_auditor', 'third_party_auditor')
  AND account_expiry_date <= CURRENT_DATE;

-- Session Termination
DELETE FROM active_sessions
WHERE user_id IN (
  SELECT user_id FROM users
  WHERE active = false
);
```

#### 3.5.2 Data Retention and Archival

**Retention Requirements:**

- Auditor activity logs: 7 years minimum
- Exported documents: Permanent retention
- Account details: 5 years after deactivation
- Access logs: 3 years minimum

## 4. Emergency Procedures

### 4.1 Emergency Auditor Access

**Same-Day Access Protocol:**

1. **Emergency Verification**

   - Compliance Officer confirms emergency status
   - Regulatory authority verification required
   - Management notification within 1 hour

2. **Expedited Provisioning**

   - IT Administrator creates emergency access account
   - Enhanced monitoring activated immediately
   - Continuous supervision assigned

3. **Documentation Requirements**
   - All emergency access activities documented
   - Post-audit review and reporting required
   - Lessons learned documentation

### 4.2 Security Incident Response

**Compromise or Misuse Indicators:**

- Unusual data access patterns
- Multiple failed authentication attempts
- Access outside authorized scope
- Unauthorized document exports

**Immediate Response Actions:**

1. Account suspension within 15 minutes
2. Security team notification
3. Activity log preservation
4. Incident investigation initiation

## 5. Quality Control and Compliance

### 5.1 Regular Audits and Reviews

**Monthly Reviews:**

- Account status and utilization
- Access pattern analysis
- Compliance with scope limitations
- Training completion rates

**Quarterly Assessments:**

- Process effectiveness evaluation
- Regulatory requirement updates
- System security reviews
- Staff training needs assessment

### 5.2 Metrics and KPIs

**Key Performance Indicators:**

| Metric                      | Target   | Frequency |
| --------------------------- | -------- | --------- |
| Account provisioning time   | <4 hours | Per case  |
| Orientation completion rate | 100%     | Monthly   |
| Security incidents          | 0        | Monthly   |
| Audit finding closure time  | <30 days | Quarterly |
| Regulatory compliance score | >95%     | Annually  |

## 6. Documentation and Records

### 6.1 Required Documentation

**Master Documents:**

- Auditor account registry
- Access approval forms
- Training completion certificates
- Security clearance records

**Transaction Records:**

- Account creation/modification logs
- Activity monitoring reports
- Document export registers
- Incident reports and resolutions

### 6.2 Document Control

**Version Control:**

- All changes tracked and approved
- Previous versions archived
- Change history maintained
- Regular review and updates

## 7. Training and Competency

### 7.1 Staff Training Requirements

**Personnel Involved in Auditor Management:**

| Role               | Training Requirements                       | Frequency |
| ------------------ | ------------------------------------------- | --------- |
| IT Administrator   | System security and account management      | Annual    |
| Compliance Officer | Regulatory requirements and audit protocols | Annual    |
| Security Officer   | Monitoring and incident response            | Biannual  |
| Audit Coordinator  | Orientation delivery and system training    | Annual    |

### 7.2 Competency Assessment

**Annual Competency Reviews:**

- Process knowledge verification
- System operation proficiency
- Regulatory compliance understanding
- Emergency response capabilities

---

**Document History:**

| Version | Date       | Author             | Changes         |
| ------- | ---------- | ------------------ | --------------- |
| 1.0     | 2025-09-16 | Compliance Officer | Initial version |

**Next Review Date**: 2026-09-16  
**Document Owner**: Compliance Officer  
**Approved By**: IT Security Manager
