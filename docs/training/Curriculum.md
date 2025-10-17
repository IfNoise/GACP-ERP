---
title: "GACP-ERP Training Curriculum"
module: "Training & Competency Management"
version: "1.0"
status: "draft"  # Changed from approved - requires re-verification per AI_Assisted_Documentation_Policy.md
last_updated: "2025-09-15"
approved_by: "HR Manager, Compliance Officer, Farm Manager"
regulatory_scope: "GACP Guidelines, 21 CFR Part 11, EU GMP Annex 11"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_assisted: true
ai_tool: "GitHub Copilot (GPT-4)"
ai_model_version: "gpt-4-turbo-2024-04-09"
ai_usage_date: "2025-10-16"
ai_purpose: "Documentation generation and compliance review"

# Human Verification (per Section 6-7 of AI Policy)
author_id: "noise83"
author_verified: false  # Author must set to true after review
author_verification_date: null
author_signature_id: null  # Link to DS-ES-001 after e-signature

# QA Approval (per Section 6-7 of AI Policy)
qa_reviewer_id: null
qa_approved: false
qa_approval_date: null
qa_signature_id: null  # Link to DS-ES-001 after QA e-signature

# Document Control (per Section 8 of AI Policy)
document_status: "draft"  # draft | under_review | approved | effective
controlled_copy: false  # Must be false until QA approval
---

# GACP-ERP Training Curriculum

Комплексная учебная программа для сотрудников GACP-ERP системы, обеспечивающая соответствие регулятивным требованиям и операционным стандартам медицинского каннабиса.

## Scope

### Covered Personnel

- **Production Staff**: Cultivation Technician, Quality Control Analyst, Harvest Operator
- **Management**: Farm Manager, Production Manager, QA Manager
- **Support Functions**: IT Administrator, Compliance Officer, HR Manager
- **Specialized Roles**: Environmental Monitoring Specialist, Laboratory Technician

### Regulatory Framework

- **GACP Guidelines**: Good Agricultural and Collection Practices
- **21 CFR Part 11**: Electronic Records and Electronic Signatures
- **EU GMP Annex 11**: Computerised Systems

## Foundation Courses

### CUR-001: GACP Fundamentals

**Duration**: 4 hours | **Target Audience**: All Personnel | **Frequency**: Annual

**Learning Objectives**:

- Understand Good Agricultural and Collection Practices (GACP) principles
- Identify regulatory requirements for medical cannabis cultivation
- Recognize quality management system components
- Apply basic compliance concepts in daily operations

**Course Content**:

1. **GACP Introduction** (45 min)

   - History and purpose of GACP
   - Regulatory landscape overview
   - Quality assurance principles
   - Risk-based approach to compliance

2. **Regulatory Framework** (60 min)

   - FDA 21 CFR Part 11 overview
   - EU GMP Annex 11 requirements
   - WHO GACP guidelines
   - ALCOA+ data integrity principles

3. **Quality Management Systems** (45 min)

   - Document control systems
   - Change control procedures
   - CAPA (Corrective and Preventive Actions)
   - Management review processes

4. **GACP-ERP System Overview** (60 min)

   - System architecture and modules
   - User interface navigation
   - Basic data entry procedures
   - Audit trail concepts

5. **Practical Exercise** (30 min)
   - System login and navigation
   - Basic data entry simulation
   - Audit trail review

**Assessment**: EX-001 (85% passing score)
**Prerequisites**: None
**Certification Valid**: 12 months

### CUR-005: SOPs & Change Control

**Duration**: 3 hours | **Target Audience**: All Personnel | **Frequency**: Annual

**Learning Objectives**:

- Execute standard operating procedures correctly
- Understand change control process requirements
- Implement deviation management procedures
- Maintain document control standards

**Course Content**:

1. **SOP Framework** (45 min)

   - SOP hierarchy and structure
   - Document control procedures
   - Version management
   - Training requirements

2. **Change Control Process** (45 min)

   - Change control methodology
   - Risk assessment procedures
   - Approval workflows
   - Implementation validation

3. **Deviation Management** (45 min)

   - Deviation identification and reporting
   - Investigation procedures
   - Root cause analysis
   - CAPA implementation

4. **Practical Workshop** (45 min)
   - SOP review exercise
   - Change control simulation
   - Deviation reporting practice

**Assessment**: EX-005 (85% passing score)
**Prerequisites**: CUR-001
**Certification Valid**: 12 months

## Technical Courses

### CUR-002: Plant Lifecycle Management

**Duration**: 6 hours | **Target Audience**: Cultivation Staff | **Frequency**: Biannual

**Learning Objectives**:

- Manage complete plant lifecycle from seed to harvest
- Implement growth stage protocols
- Monitor environmental parameters
- Execute cultivation SOPs

**Course Content**:

1. **Seed and Clone Management** (90 min)

   - Genetic material sourcing
   - Propagation techniques
   - Quality control procedures
   - Documentation requirements

2. **Growth Stage Management** (90 min)

   - Vegetative growth protocols
   - Flowering stage management
   - Environmental control parameters
   - Nutrient management

3. **Environmental Monitoring** (90 min)

   - IoT sensor systems (EMQX/Telegraf)
   - Climate control systems
   - Data collection procedures
   - Alarm response protocols

4. **Harvest and Post-Harvest** (90 min)
   - Harvest timing and procedures
   - Drying and curing protocols
   - Quality assessment
   - Batch documentation

**Assessment**: EX-002 (85% passing score)
**Prerequisites**: CUR-001
**Certification Valid**: 6 months

### CUR-003: Audit Trail & e-Signatures

**Duration**: 4 hours | **Target Audience**: Compliance, IT, QA | **Frequency**: Annual

**Learning Objectives**:

- Understand electronic record requirements
- Implement e-signature procedures
- Review and analyze audit trails
- Ensure 21 CFR Part 11 compliance

**Course Content**:

1. **21 CFR Part 11 Requirements** (60 min)

   - Electronic record definitions
   - Electronic signature requirements
   - System validation needs
   - Compliance documentation

2. **GACP-ERP Audit Trail System** (90 min)

   - Audit trail architecture
   - Data capture mechanisms
   - Tamper-proof controls
   - Review procedures

3. **e-Signature Implementation** (60 min)

   - Digital signature setup
   - Authentication methods
   - Authorization controls
   - Signature verification

4. **Compliance Monitoring** (30 min)
   - Audit trail review procedures
   - Exception reporting
   - Compliance metrics
   - Corrective actions

**Assessment**: EX-003 (90% passing score)
**Prerequisites**: CUR-001
**Certification Valid**: 12 months

### CUR-004: Environmental Monitoring & IoT

**Duration**: 5 hours | **Target Audience**: Environmental Specialists, Cultivation | **Frequency**: Annual

**Learning Objectives**:

- Operate IoT monitoring systems
- Interpret environmental data
- Respond to environmental alarms
- Maintain monitoring equipment

**Course Content**:

1. **IoT System Architecture** (75 min)

   - EMQX broker configuration
   - Telegraf data collection
   - VictoriaMetrics storage
   - Grafana visualization

2. **Environmental Parameters** (75 min)

   - Temperature and humidity monitoring
   - CO2 level management
   - Light intensity measurement
   - Air quality assessment

3. **Data Analysis and Trending** (75 min)

   - Trend analysis techniques
   - Statistical process control
   - Alarm threshold setting
   - Predictive analytics

4. **Troubleshooting and Maintenance** (75 min)
   - Sensor calibration procedures
   - Equipment maintenance
   - System troubleshooting
   - Backup procedures

**Assessment**: EX-004 (85% passing score)
**Prerequisites**: CUR-001
**Certification Valid**: 12 months

## Technology Courses

### CUR-006: Disaster Recovery & BCP

**Duration**: 4 hours | **Target Audience**: IT, Management | **Frequency**: Annual

**Learning Objectives**:

- Implement disaster recovery procedures
- Execute business continuity plans
- Perform system backup and restore
- Coordinate emergency response

**Course Content**:

1. **Disaster Recovery Planning** (60 min)

   - Risk assessment methodology
   - Recovery time objectives (RTO)
   - Recovery point objectives (RPO)
   - Business impact analysis

2. **Backup and Restore Procedures** (90 min)

   - VictoriaMetrics backup procedures
   - Database backup strategies
   - Document backup protocols
   - Restore testing procedures

3. **Business Continuity Operations** (60 min)

   - Manual operation procedures
   - Alternative communication methods
   - Critical process identification
   - Resource allocation

4. **Emergency Response Coordination** (30 min)
   - Incident command structure
   - Communication protocols
   - Recovery team roles
   - Lessons learned process

**Assessment**: EX-006 (90% passing score)
**Prerequisites**: CUR-001
**Certification Valid**: 12 months

### CUR-007: Security & Access Control

**Duration**: 4 hours | **Target Audience**: All Personnel | **Frequency**: Annual

**Learning Objectives**:

- Implement information security practices
- Use multi-factor authentication
- Follow access control procedures
- Recognize security threats

**Course Content**:

1. **Information Security Fundamentals** (60 min)

   - Confidentiality, Integrity, Availability
   - Threat landscape overview
   - Security policies and procedures
   - Personal responsibility

2. **Access Control Systems** (90 min)

   - Role-based access control (RBAC)
   - Principle of least privilege
   - User account management
   - Access review procedures

3. **Authentication and Authorization** (60 min)

   - Multi-factor authentication setup
   - Password security practices
   - Session management
   - Single sign-on (SSO)

4. **Incident Response** (30 min)
   - Security incident identification
   - Reporting procedures
   - Containment actions
   - Recovery processes

**Assessment**: EX-007 (85% passing score)
**Prerequisites**: CUR-001
**Certification Valid**: 12 months

## Specialized Courses

### CUR-008: Incident Management

**Duration**: 3 hours | **Target Audience**: All Personnel | **Frequency**: Annual

**Learning Objectives**:

- Identify and report incidents
- Execute incident response procedures
- Participate in incident investigations
- Implement corrective actions

**Course Content**:

1. **Incident Classification** (45 min)

   - Incident types and categories
   - Severity level determination
   - Escalation criteria
   - Notification requirements

2. **Incident Response Process** (60 min)

   - Initial response procedures
   - Evidence preservation
   - Investigation techniques
   - Root cause analysis

3. **Documentation and Reporting** (45 min)

   - Incident report preparation
   - Timeline documentation
   - Evidence collection
   - Regulatory notifications

4. **Corrective and Preventive Actions** (30 min)
   - CAPA development
   - Effectiveness verification
   - Implementation monitoring
   - Closure procedures

**Assessment**: EX-008 (85% passing score)
**Prerequisites**: CUR-001
**Certification Valid**: 12 months

## Assessment and Certification

### Examination Requirements

| Course  | Exam ID | Questions | Duration | Passing Score | Retake Policy |
| ------- | ------- | --------- | -------- | ------------- | ------------- |
| CUR-001 | EX-001  | 50        | 60 min   | 85%           | 24 hrs wait   |
| CUR-002 | EX-002  | 40        | 60 min   | 85%           | 48 hrs wait   |
| CUR-003 | EX-003  | 45        | 60 min   | 90%           | 48 hrs wait   |
| CUR-004 | EX-004  | 40        | 60 min   | 85%           | 24 hrs wait   |
| CUR-005 | EX-005  | 35        | 45 min   | 85%           | 24 hrs wait   |
| CUR-006 | EX-006  | 40        | 60 min   | 90%           | 48 hrs wait   |
| CUR-007 | EX-007  | 40        | 60 min   | 85%           | 24 hrs wait   |
| CUR-008 | EX-008  | 30        | 45 min   | 85%           | 24 hrs wait   |

### Certification Management

**Certificate Generation**: Automatic upon exam completion
**Validity Tracking**: Automated reminder system 30 days before expiration
**Renewal Process**: Re-examination or refresher course completion
**Record Retention**: Permanent electronic records in GACP-ERP system

## Training Delivery Methods

### Modalities

1. **Instructor-Led Training (ILT)**

   - Classroom sessions for complex topics
   - Hands-on workshops and simulations
   - Group discussions and case studies
   - Expert guest speakers

2. **E-Learning Modules**

   - Self-paced online courses
   - Interactive multimedia content
   - Progress tracking and bookmarking
   - Mobile device accessibility

3. **Blended Learning**

   - Combination of online and classroom
   - Pre-work and post-training assignments
   - Virtual instructor support
   - Collaborative online platforms

4. **On-the-Job Training (OJT)**
   - Mentoring and coaching programs
   - Practical skill development
   - Real-time feedback and correction
   - Competency-based progression

### Training Resources

**Learning Management System (LMS)**: Integrated with GACP-ERP
**Training Materials**:

- Course handbooks and guides
- Video demonstrations and tutorials
- Interactive simulations
- Quick reference cards

**Instructor Qualifications**:

- Subject matter expertise
- Adult learning certification
- GACP compliance knowledge
- Teaching experience

## Training Effectiveness

### Evaluation Methods

**Level 1 - Reaction**: Course satisfaction surveys
**Level 2 - Learning**: Examination scores and competency assessments  
**Level 3 - Behavior**: On-the-job performance observation
**Level 4 - Results**: Business impact metrics and compliance indicators

### Performance Metrics

| Metric                 | Target             | Measurement           |
| ---------------------- | ------------------ | --------------------- |
| Course Completion Rate | >98%               | Monthly tracking      |
| Average Exam Score     | >90%               | Quarterly analysis    |
| Training Effectiveness | >85% satisfaction  | Post-training surveys |
| Time to Competency     | <30 days new hires | Performance tracking  |
| Training ROI           | Positive impact    | Annual assessment     |

## Continuous Improvement

### Review Process

- **Quarterly Reviews**: Training metrics and feedback analysis
- **Annual Updates**: Content refresh and regulatory alignment
- **Incident-Driven Updates**: Following quality events or changes
- **SME Input**: Subject matter expert content validation

### Feedback Integration

- **Learner Feedback**: Course evaluations and suggestions
- **Instructor Feedback**: Delivery challenges and improvements
- **Manager Feedback**: Workplace application effectiveness
- **Audit Findings**: Regulatory inspection outcomes

## Approval and Maintenance

### Document Control

| Role                   | Responsibility                                     |
| ---------------------- | -------------------------------------------------- |
| **HR Manager**         | Training program oversight and resource allocation |
| **Compliance Officer** | Regulatory requirement compliance verification     |
| **Farm Manager**       | Business alignment and operational effectiveness   |
| **IT Administrator**   | System integration and technical delivery          |
| **QA Manager**         | Quality standards and assessment validation        |

### Review Schedule

- **Quarterly Review**: Training metrics and completion rates
- **Annual Review**: Full curriculum review and updates
- **Regulatory Review**: Following any regulatory changes
- **Incident Review**: After significant quality events

**Next Review Date**: December 15, 2025
**Document Valid Until**: September 15, 2026

---

_This Training Curriculum is a controlled document and must be updated following the change control procedure._
