---
title: "SOP: Document Control and Management"
module: "Quality Management System"
version: "1.0"
status: "active"
last_updated: "2025-09-14"
author: "Document Controller"
approver: "Quality Manager"
effective_date: "2025-09-14"
review_date: "2026-09-14"
related_sops:
  - SOP_ChangeControl.md
  - SOP_AuditTrail.md
  - SOP_Training.md
  - SOP_QMS_Governance.md
related_modules:
  - DocumentManagement
  - MayanEDMS
  - AuditModule
  - WorkflowEngine
compliance_standards:
  - "FDA 21 CFR Part 11"
  - "EU GMP Annex 11"
  - "ISO 9001:2015"
  - "ALCOA+ principles"
---

# SOP: Document Control and Management

## 1. Purpose

This Standard Operating Procedure (SOP) establishes a comprehensive document control system for the GACP-ERP environment to ensure that all controlled documents are properly managed throughout their lifecycle, maintaining compliance with regulatory requirements including FDA 21 CFR Part 11, EU GMP Annex 11, and ALCOA+ principles.

## 2. Scope

This SOP applies to all controlled documents within the organization, including but not limited to:

- Standard Operating Procedures (SOPs)
- Policies and procedures
- Technical specifications and drawings
- Forms and templates
- Training materials and curricula
- Validation documents (URS, FS, DS, IQ, OQ, PQ)
- Quality manuals and work instructions
- Regulatory submissions and correspondence
- Batch records and manufacturing records
- Laboratory test methods and protocols

## 3. Responsibilities

### 3.1 Document Controller

- Overall responsibility for document control system
- Document numbering and registration
- Distribution list management
- Document lifecycle oversight
- System administration for Mayan-EDMS
- Training on document control procedures
- Audit support and compliance monitoring

### 3.2 Document Authors

- Document creation and content development
- Technical accuracy and completeness
- Initial review and self-check
- Version control during development
- Collaboration with subject matter experts
- Incorporation of review comments

### 3.3 Document Reviewers

- Technical and regulatory review
- Compliance verification
- Cross-reference validation
- Impact assessment on related documents
- Review comment documentation
- Sign-off on reviewed documents

### 3.4 Document Approvers

- Final approval authority
- Regulatory compliance confirmation
- Business impact assessment
- Resource allocation approval
- Implementation authorization
- Electronic signature application

### 3.5 Quality Assurance Manager

- Document control system oversight
- Audit and compliance monitoring
- Process improvement initiatives
- Training program coordination
- Deviation investigation support

### 3.6 IT Administrator

- Mayan-EDMS system maintenance
- User access management
- System backup and recovery
- Integration with ERP modules
- Technical support and troubleshooting

## 4. Document Management System Architecture

### 4.1 Mayan-EDMS Integration

The organization utilizes Mayan-EDMS as the primary document management system, integrated with the GACP-ERP platform to provide:

- Centralized document repository
- Version control and tracking
- Workflow automation
- Electronic signatures
- Audit trail generation
- Search and retrieval capabilities
- Access control and permissions
- Retention and disposition management

### 4.2 Document Hierarchy Structure

```text
Organization Documents/
├── Policies/
│   ├── Quality Policy
│   ├── Environmental Policy
│   └── Information Security Policy
├── SOPs/
│   ├── Quality Management/
│   ├── Production/
│   ├── Laboratory/
│   └── Support Functions/
├── Work Instructions/
├── Forms and Templates/
├── Specifications/
├── Validation Documents/
├── Training Materials/
└── Records/
```

### 4.3 Document Categories and Classification

- **Category A**: Critical GMP documents requiring formal review
- **Category B**: Important operational documents with simplified review
- **Category C**: Supporting documents with minimal review requirements
- **Category D**: Reference documents and external standards

## 5. Document Identification and Numbering

### 5.1 Document Numbering System

Format: `[ORG]-[CATEGORY]-[TYPE]-[NUMBER]-[VERSION]`

Examples:

- GACP-SOP-QMS-001-v1.0 (Quality Management SOP)
- GACP-WI-PROD-015-v2.1 (Production Work Instruction)
- GACP-FORM-LAB-008-v1.2 (Laboratory Form)
- GACP-SPEC-EQU-003-v3.0 (Equipment Specification)

### 5.2 Version Control Schema

- **Major versions** (x.0): Significant changes requiring revalidation
- **Minor versions** (x.y): Editorial changes and corrections
- **Draft versions** (x.y-DRAFT): Under development or review

### 5.3 Document Status Indicators

- **DRAFT**: Under development or revision
- **UNDER REVIEW**: Formal review in progress
- **APPROVED**: Effective and current
- **SUPERSEDED**: Replaced by newer version
- **OBSOLETE**: No longer applicable
- **ARCHIVED**: Retained for historical purposes

## 6. Document Lifecycle Management

### 6.1 Document Creation Process

#### 6.1.1 Initiation Phase

1. **Document Request**

   - Business need identification
   - Stakeholder consultation
   - Resource allocation
   - Timeline establishment

2. **Template Selection**

   - Appropriate template identification
   - Customization requirements
   - Format standardization
   - Accessibility considerations

3. **Author Assignment**
   - Subject matter expert selection
   - Responsibility confirmation
   - Timeline agreement
   - Resource provision

#### 6.1.2 Development Phase

1. **Content Development**

   - Research and information gathering
   - Technical content creation
   - Cross-reference validation
   - Regulatory requirement incorporation

2. **Internal Review**

   - Self-review by author
   - Peer review coordination
   - Technical accuracy verification
   - Completeness assessment

3. **Quality Check**
   - Format compliance verification
   - Template adherence confirmation
   - Numbering system compliance
   - Metadata completion

### 6.2 Review and Approval Process

#### 6.2.1 Formal Review Workflow

1. **Review Assignment**

   - Reviewer selection based on expertise
   - Review timeline establishment
   - Review criteria communication
   - Access provision to draft documents

2. **Review Execution**

   - Technical content evaluation
   - Regulatory compliance verification
   - Cross-reference validation
   - Impact assessment completion

3. **Review Consolidation**
   - Comment compilation
   - Conflict resolution
   - Consensus building
   - Review report generation

#### 6.2.2 Approval Workflow

1. **Approval Routing**

   - Automated workflow initiation
   - Approver notification
   - Document package preparation
   - Supporting documentation provision

2. **Approval Execution**

   - Document review by approver
   - Business impact assessment
   - Regulatory compliance confirmation
   - Electronic signature application

3. **Approval Completion**
   - Approval notification
   - Status update in system
   - Distribution list activation
   - Training requirement assessment

### 6.3 Distribution and Implementation

#### 6.3.1 Distribution Management

1. **Distribution List Creation**

   - Stakeholder identification
   - Role-based access assignment
   - Notification preference setting
   - Training requirement flagging

2. **Document Publication**

   - System upload and activation
   - Notification generation
   - Previous version supersession
   - Training material preparation

3. **Implementation Support**
   - Training session coordination
   - Q&A session facilitation
   - Feedback collection
   - Issue resolution

### 6.4 Maintenance and Review

#### 6.4.1 Periodic Review Schedule

- **Critical Documents**: Annual review
- **Standard Documents**: Biennial review
- **Supporting Documents**: Triennial review
- **Reference Documents**: As needed

#### 6.4.2 Change Management

1. **Change Request Process**

   - Change need identification
   - Impact assessment
   - Resource requirement evaluation
   - Approval for change initiation

2. **Change Implementation**
   - Document revision
   - Review and approval process
   - Distribution and training
   - Effectiveness monitoring

### 6.5 Retention and Disposal

#### 6.5.1 Retention Requirements

- **GMP Critical Documents**: 10+ years or product lifecycle + 1 year
- **Quality Records**: 7 years minimum
- **Training Records**: Employment duration + 3 years
- **Technical Documents**: 5-10 years depending on type
- **Reference Documents**: Until superseded + 2 years

#### 6.5.2 Disposal Process

1. **Retention Review**

   - Retention period verification
   - Legal hold assessment
   - Regulatory requirement confirmation
   - Business value evaluation

2. **Disposal Authorization**

   - Formal disposal request
   - Management approval
   - Legal clearance
   - Audit trail documentation

3. **Secure Disposal**
   - Data destruction procedures
   - Certificate of destruction
   - Audit trail completion
   - Stakeholder notification

## 7. Electronic Document Management

### 7.1 Mayan-EDMS Configuration

#### 7.1.1 System Setup

- Document type configuration
- Metadata field definition
- Workflow design and implementation
- User role and permission setup
- Integration with ERP modules

#### 7.1.2 Security Controls

- Access control implementation
- Audit trail configuration
- Backup and recovery procedures
- Data integrity verification
- Encryption at rest and in transit

### 7.2 Electronic Signatures

#### 7.2.1 e-Signature Requirements (21 CFR Part 11)

- Unique user identification
- Biometric or password authentication
- Non-repudiation mechanisms
- Signature integrity protection
- Audit trail generation

#### 7.2.2 Signature Workflow

1. **Signature Preparation**

   - Document finalization
   - Signer identification
   - Signature location marking
   - Approval workflow initiation

2. **Signature Execution**

   - User authentication
   - Document presentation
   - Signature application
   - Timestamp generation

3. **Signature Verification**
   - Signature integrity check
   - Certificate validation
   - Audit trail generation
   - Document finalization

### 7.3 Version Control System

#### 7.3.1 Automated Version Management

- Version numbering automation
- Change tracking and comparison
- Branch and merge capabilities
- Rollback and recovery options
- Integration with change control

#### 7.3.2 Document Comparison

- Side-by-side comparison tools
- Change highlighting
- Comment and annotation support
- Review workflow integration
- Approval tracking

## 8. Quality Control and Compliance

### 8.1 Document Quality Standards

#### 8.1.1 Content Requirements

- Clear and concise language
- Logical organization and flow
- Complete and accurate information
- Regulatory compliance verification
- Cross-reference accuracy

#### 8.1.2 Format Standards

- Template compliance
- Consistent styling and formatting
- Proper heading hierarchy
- Table and figure numbering
- Footer and header information

### 8.2 Compliance Monitoring

#### 8.2.1 Regular Audits

- Document control system audits
- Compliance verification reviews
- Process effectiveness assessments
- Training adequacy evaluations
- Technology performance reviews

#### 8.2.2 Metrics and KPIs

- Document approval cycle time
- Review completion rates
- Training compliance percentages
- System availability and performance
- User satisfaction scores

## 9. Training and Competency

### 9.1 Training Program Structure

#### 9.1.1 Initial Training

- Document control system overview
- Mayan-EDMS user training
- Role-specific procedures
- Compliance requirements
- Hands-on practice sessions

#### 9.1.2 Ongoing Training

- Annual refresher training
- New feature and process updates
- Regulatory change communications
- Best practice sharing
- Advanced user training

### 9.2 Competency Assessment

- Initial competency evaluation
- Annual competency reviews
- Performance monitoring
- Remedial training provision
- Competency record maintenance

## 10. Audit Trail and ALCOA+ Compliance

### 10.1 Audit Trail Requirements

All document management activities must maintain complete audit trails including:

- User identification and authentication
- Date and time stamps for all actions
- Original data preservation
- Change descriptions and rationales
- Electronic signature records

### 10.2 ALCOA+ Implementation

- **Attributable**: Clear user identification for all actions
- **Legible**: Readable and understandable records
- **Contemporaneous**: Real-time or near-real-time recording
- **Original**: First capture of data and information
- **Accurate**: Correct and reliable information
- **Complete**: All relevant data captured and retained
- **Consistent**: Uniform format and chronological order
- **Enduring**: Durable and permanent record keeping
- **Available**: Accessible throughout retention period

## 11. Backup and Recovery

### 11.1 Backup Strategy

- Daily incremental backups
- Weekly full system backups
- Monthly backup integrity testing
- Quarterly disaster recovery testing
- Annual backup system validation

### 11.2 Recovery Procedures

- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 1 hour
- Data integrity verification
- User access restoration
- Audit trail preservation

## 12. Integration with ERP Modules

### 12.1 Workflow Integration

- Change control process automation
- Training requirement triggers
- Approval workflow routing
- Notification and alert systems
- Reporting and analytics

### 12.2 Data Synchronization

- User and role synchronization
- Document metadata integration
- Audit trail consolidation
- Reporting data compilation
- Performance metric calculation

## 13. Continuous Improvement

### 13.1 Process Monitoring

- Key performance indicator tracking
- User feedback collection
- System performance monitoring
- Compliance gap identification
- Technology advancement evaluation

### 13.2 Improvement Implementation

- Process optimization initiatives
- Technology upgrade planning
- Training program enhancement
- Policy and procedure updates
- Best practice adoption

## 14. Emergency Procedures

### 14.1 System Failure Response

1. **Immediate Response** (0-30 minutes)

   - System status assessment
   - Impact evaluation
   - Stakeholder notification
   - Alternative process activation

2. **Short-term Mitigation** (30 minutes - 4 hours)

   - Manual process implementation
   - Critical document access provision
   - Workflow continuity maintenance
   - Recovery planning initiation

3. **Recovery Implementation** (4-24 hours)
   - System restoration procedures
   - Data integrity verification
   - User access restoration
   - Normal operation resumption

### 14.2 Business Continuity

- Alternative document access methods
- Manual approval processes
- Critical document identification
- Communication procedures
- Recovery priority establishment

## 15. Validation and Testing

### 15.1 System Validation

- User requirement verification
- Functional specification testing
- Performance qualification
- Security assessment
- Compliance verification

### 15.2 Ongoing Testing

- Annual system testing
- Quarterly backup verification
- Monthly security assessments
- Weekly performance monitoring
- Daily integrity checks

## 16. References and Standards

### 16.1 Regulatory References

- FDA 21 CFR Part 11 - Electronic Records and Signatures
- EU GMP Annex 11 - Computerised Systems
- ICH Q10 - Pharmaceutical Quality System
- ISO 9001:2015 - Quality Management Systems

### 16.2 Internal References

- URS-DOC-001: Document Management System Requirements
- FS-DOC-001: Document Management Functional Specification
- VMP-DOC-001: Document Management Validation Master Plan
- RA-DOC-001: Document Management Risk Assessment

## 17. Appendices

### Appendix A: Document Templates

### Appendix B: Approval Matrix

### Appendix C: Training Curriculum

### Appendix D: System Configuration Guide

### Appendix E: Troubleshooting Procedures

---

## Document Control

| Version | Date       | Author              | Approved By     | Summary of Changes            |
| ------- | ---------- | ------------------- | --------------- | ----------------------------- |
| 1.0     | 2025-09-14 | Document Controller | Quality Manager | Initial comprehensive version |

**Next Review Date**: 2026-09-14  
**Document Location**: Mayan-EDMS Document ID: SOP-DOC-CTRL-001
