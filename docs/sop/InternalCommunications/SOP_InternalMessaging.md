---
title: "SOP: Internal Messaging System"
document_number: "SOP-GACP-MSG-001"
version: "2.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approved_by: "Quality Assurance Manager"
department: "IT Operations / Quality Management"
classification: "Critical Infrastructure"
related_procedures:
  [
    "SOP_InternalAlerts",
    "SOP_VoiceCalls",
    "SOP_AuditTrail",
    "SOP_ITSecurity",
    "SOP_DataIntegrity",
  ]
regulatory_references:
  [
    "ALCOA+ Data Integrity",
    "MHRA Data Integrity Guidelines",
    "FDA 21 CFR Part 11",
  ]
---

# SOP: Internal Messaging System

## 1. Purpose and Scope

### 1.1 Purpose

This Standard Operating Procedure establishes procedures for secure internal text communication within the GACP-compliant cannabis cultivation enterprise using Jitsi-Prosody XMPP infrastructure, ensuring:

- **Real-time Communication**: Instant messaging between employees for operational coordination
- **Regulatory Compliance**: Full ALCOA+ compliance for production-related communications
- **Data Integrity**: Immutable audit trail for all business-critical messages
- **Security**: Secure communication with role-based access controls
- **Integration**: Seamless integration with Jitsi ecosystem and ERP modules

### 1.2 Scope

This procedure covers:

- One-to-one messaging between employees
- Group communications via multi-user chat rooms
- System notifications from ERP modules and IoT systems
- File sharing through secure messaging channels
- Message archival and retrieval procedures
- Integration with Jitsi Meet for escalation to video calls

### 1.3 Regulatory Framework

All messaging activities must comply with:

- **ALCOA+ Principles**: Data integrity throughout the communication lifecycle
- **GACP Guidelines**: Good Agricultural and Collection Practices
- **MHRA Data Integrity**: UK regulatory requirements
- **FDA 21 CFR Part 11**: Electronic records and signatures requirements

## 2. System Overview

### 2.1 Jitsi-Prosody Messaging Infrastructure

**Core Components:**

- **Prosody XMPP Server**: Backend messaging server integrated with Jitsi ecosystem
- **Keycloak SSO**: Single sign-on authentication for corporate access
- **Web Client**: Browser-based messaging interface
- **Mobile Applications**: iOS and Android messaging clients
- **Audit Trail**: Immutable logging via immudb integration
- **File Storage**: Secure attachment storage via MinIO

### 2.2 Message Classifications

#### 2.2.1 Business-Critical Messages

- Production planning and coordination
- Quality control communications
- Compliance-related discussions
- Emergency notifications
- Batch documentation references

#### 2.2.2 Operational Messages

- Shift communications
- Maintenance coordination
- Training announcements
- General business communications

#### 2.2.3 Administrative Messages

- HR announcements
- Policy updates
- Meeting notifications
- General company information

## 3. User Roles and Responsibilities

### 3.1 Message Sender

**Qualifications**: Authorized GACP-ERP system users

**Responsibilities**:

- Send clear, professional messages
- Use appropriate message classification
- Follow confidentiality protocols
- Include required documentation references
- Escalate urgent matters appropriately

### 3.2 Message Recipient

**Qualifications**: Authorized GACP-ERP system users

**Responsibilities**:

- Monitor messages during working hours
- Respond promptly to business-critical communications
- Follow up on action items
- Report technical issues immediately
- Maintain message confidentiality

### 3.3 Chat Room Moderator

**Qualifications**: Supervisory role or designated team leader

**Responsibilities**:

- Manage chat room membership
- Maintain discussion focus and professionalism
- Archive important decisions and communications
- Ensure compliance with communication policies
- Escalate issues to management when necessary

## 4. Messaging Procedures

### 4.1 Accessing the Messaging System

#### 4.1.1 Web Browser Access

1. **Login to GACP-ERP**

   - Navigate to GACP-ERP portal
   - Use corporate credentials for authentication
   - Complete multi-factor authentication if required

2. **Access Messaging Interface**

   - Click on "Messages" in the main navigation
   - Wait for contact list to load
   - Verify your online status is displayed

3. **Initial Setup**
   - Review your contact list and availability
   - Set appropriate status message
   - Configure notification preferences

#### 4.1.2 Mobile Application Access

1. **Install Corporate Messaging App**

   - Download approved XMPP client from company app store
   - Verify app authenticity and permissions
   - Configure with corporate server settings

2. **Authentication Setup**
   - Enter corporate credentials
   - Complete device registration process
   - Enable push notifications for important messages

### 4.2 One-to-One Messaging

#### 4.2.1 Starting a Conversation

1. **Select Recipient**

   - Browse contact list or use search function
   - Verify recipient's availability status
   - Check if recipient is authorized for the discussion topic

2. **Compose Message**

   - Type clear, concise message
   - Include context and background if necessary
   - Add relevant document references or batch numbers
   - Review message before sending

3. **Send and Monitor**
   - Send message and verify delivery confirmation
   - Monitor for read receipts if enabled
   - Follow up if urgent response is needed

#### 4.2.2 Message Content Guidelines

1. **Professional Communication**

   - Use proper business language and tone
   - Include sufficient context for understanding
   - Reference relevant SOPs or procedures when applicable
   - Avoid personal or non-business content

2. **Compliance Requirements**
   - Include batch numbers or lot IDs when discussing production
   - Reference quality documentation when discussing deviations
   - Use proper terminology for regulatory communications
   - Ensure messages are clear and unambiguous

### 4.3 Group Messaging and Chat Rooms

#### 4.3.1 Joining Chat Rooms

1. **Browse Available Rooms**

   - Access chat room directory
   - Review room descriptions and purposes
   - Check membership requirements and permissions

2. **Request Access**

   - Submit join request to room moderator
   - Provide business justification for access
   - Wait for approval before participating

3. **Room Participation**
   - Review room history and ongoing discussions
   - Introduce yourself and your role if first time joining
   - Follow established room etiquette and guidelines

#### 4.3.2 Creating New Chat Rooms

1. **Room Planning**

   - Define clear purpose and scope for the room
   - Identify required participants and permissions
   - Determine data classification and retention requirements

2. **Room Creation Process**

   - Access room creation interface in messaging system
   - Enter room name using standard naming convention
   - Add room description and purpose statement
   - Set initial membership and moderator roles

3. **Room Configuration**
   - Configure message history and archival settings
   - Set participation permissions (read-only, full participation)
   - Enable or disable file sharing based on requirements
   - Configure integration with audit trail systems

#### 4.3.3 Room Management

1. **Member Management**

   - Add new members based on business needs
   - Remove inactive or unauthorized members
   - Update member permissions as roles change
   - Monitor membership for compliance requirements

2. **Content Moderation**
   - Ensure discussions stay on topic
   - Archive important decisions and communications
   - Remove inappropriate or non-business content
   - Escalate policy violations to management

### 4.4 File Sharing Procedures

#### 4.4.1 Sharing Documents

1. **File Preparation**

   - Ensure document is finalized and approved
   - Verify file format is supported (PDF, DOC, XLS, images)
   - Check file size limits (maximum 25MB per file)
   - Scan for viruses and malware

2. **Upload Process**

   - Click file attachment button in message interface
   - Select file from local storage or network drive
   - Add descriptive filename and comments
   - Set access permissions and expiration if applicable

3. **Recipient Notification**
   - Send message with file attachment
   - Include description of file contents and purpose
   - Provide any special handling instructions
   - Monitor download confirmations

#### 4.4.2 File Security Requirements

1. **Access Controls**

   - Only share files with authorized recipients
   - Use password protection for sensitive documents
   - Set appropriate expiration dates for temporary access
   - Monitor file access and download activities

2. **Data Classification**
   - Label files according to company data classification policy
   - Apply appropriate retention and deletion schedules
   - Ensure compliance with regulatory requirements
   - Document file sharing for audit purposes

## 5. System Notifications and Automated Messages

### 5.1 ERP System Integration

#### 5.1.1 Production Notifications

- Batch completion alerts
- Quality test results
- Equipment maintenance reminders
- Inventory level warnings
- Compliance deadline notifications

#### 5.1.2 Notification Management

1. **Receiving System Notifications**

   - Monitor dedicated system notification channels
   - Acknowledge receipt of critical notifications
   - Take required action based on notification type
   - Escalate issues according to established procedures

2. **Notification Response Procedures**
   - Review notification details and context
   - Access related ERP modules if necessary
   - Document actions taken in response to notifications
   - Update notification status in system

### 5.2 IoT Sensor Alerts

#### 5.2.1 Environmental Monitoring Alerts

- Temperature and humidity deviations
- Equipment status changes
- Security system notifications
- Utility system alerts

#### 5.2.2 Alert Response Procedures

1. **Immediate Response**

   - Assess alert severity and impact
   - Take immediate corrective action if required
   - Notify appropriate personnel and supervisors
   - Document response actions

2. **Follow-up Actions**
   - Investigate root cause of alert condition
   - Update monitoring parameters if necessary
   - File incident report if deviation occurred
   - Review and improve response procedures

## 6. Message Archival and Retrieval

### 6.1 Automatic Archival

#### 6.1.1 Archival Categories

- **Critical Messages**: Production, quality, compliance communications
- **Standard Messages**: General business communications
- **Administrative Messages**: Announcements, notifications
- **System Messages**: Automated notifications and alerts

#### 6.1.2 Retention Schedules

- **Critical Messages**: 7 years minimum retention
- **Standard Messages**: 2 years retention
- **Administrative Messages**: 1 year retention
- **System Messages**: 6 months retention

### 6.2 Message Retrieval Procedures

#### 6.2.1 Search and Retrieval

1. **Access Archive System**

   - Log into GACP-ERP message archive module
   - Select appropriate date range and message categories
   - Enter search criteria (sender, recipient, keywords)

2. **Review Search Results**
   - Review message metadata and summaries
   - Select specific messages for detailed review
   - Export messages if required for investigations
   - Document retrieval activities for audit purposes

#### 6.2.2 Audit and Compliance Support

1. **Audit Preparation**

   - Prepare message archives for auditor review
   - Ensure all required metadata is available
   - Verify message integrity and authenticity
   - Provide access controls for auditor accounts

2. **Compliance Reporting**
   - Generate communication compliance reports
   - Document adherence to retention policies
   - Report any data integrity issues
   - Maintain audit trail of all archive access

## 7. Emergency Communication Procedures

### 7.1 Emergency Message Broadcasting

#### 7.1.1 Emergency Notification Triggers

- Safety incidents requiring immediate response
- Security breaches or threats
- Environmental emergencies
- Equipment failures affecting production
- Regulatory compliance emergencies

#### 7.1.2 Emergency Broadcasting Process

1. **Initiate Emergency Broadcast**

   - Access emergency communication interface
   - Select appropriate emergency category
   - Compose urgent notification message
   - Specify target recipient groups

2. **Message Distribution**
   - Send to all relevant personnel immediately
   - Escalate to video conference if necessary
   - Follow up with phone calls if no response
   - Document emergency communication activities

### 7.2 Emergency Response Coordination

#### 7.2.1 Response Team Communication

1. **Establish Emergency Chat Room**

   - Create dedicated emergency response chat room
   - Add all relevant emergency response team members
   - Enable recording for incident documentation
   - Set up integration with incident management system

2. **Coordinate Response Activities**
   - Share real-time updates on emergency status
   - Coordinate resource allocation and assignments
   - Document all response activities and decisions
   - Maintain communication until incident is resolved

## 8. Troubleshooting and Support

### 8.1 Common Technical Issues

#### 8.1.1 Connection Problems

**Issue**: Unable to connect to messaging server
**Resolution Steps**:

1. Check internet connectivity and firewall settings
2. Verify corporate credentials and authentication
3. Clear browser cache and restart application
4. Contact IT support if problems persist

**Issue**: Messages not being delivered
**Resolution Steps**:

1. Check recipient's online status and availability
2. Verify message size and format requirements
3. Retry sending message after brief delay
4. Use alternative communication method if urgent

#### 8.1.2 Performance Issues

**Issue**: Slow message loading or delivery
**Resolution Steps**:

1. Check network bandwidth and connectivity
2. Close unnecessary applications and browser tabs
3. Clear application cache and temporary files
4. Report persistent performance issues to IT support

### 8.2 Support Resources

#### 8.2.1 Technical Support

- **IT Help Desk**: ext. 2500 during business hours
- **Email Support**: <itsupport@gacp-erp.com>
- **Emergency Support**: [Emergency IT Hotline]
- **Self-Service**: Online knowledge base and user guides

#### 8.2.2 Training Resources

- **User Training Videos**: Available in GACP-ERP training portal
- **Quick Reference Guides**: Downloadable PDF guides
- **Interactive Tutorials**: Built-in system tutorials
- **Regular Training Sessions**: Monthly group training sessions

## 9. Compliance and Quality Assurance

### 9.1 Data Integrity Requirements

#### 9.1.1 ALCOA+ Compliance

- **Attributable**: All messages linked to authenticated users
- **Legible**: Messages stored in readable format
- **Contemporaneous**: Real-time timestamping
- **Original**: Immutable storage and audit trail
- **Accurate**: Message integrity verification
- **Complete**: Full message context preservation
- **Consistent**: Standardized formatting and protocols
- **Enduring**: Long-term preservation with format migration
- **Available**: Secure access with proper controls

#### 9.1.2 Audit Trail Requirements

- Message creation, modification, and deletion events
- User authentication and authorization activities
- File sharing and download activities
- System access and usage patterns
- All events stored in immudb with cryptographic verification

### 9.2 Regular Quality Reviews

#### 9.2.1 Monthly Communication Reviews

- Review message usage patterns and compliance
- Assess system performance and reliability
- Evaluate user training effectiveness
- Identify areas for improvement

#### 9.2.2 Annual System Audits

- Comprehensive review of communication practices
- Verification of data integrity and retention compliance
- Assessment of security controls and access management
- Update procedures based on audit findings

## 10. Training and Competency

### 10.1 User Training Requirements

#### 10.1.1 Basic User Training

**Target Audience**: All GACP-ERP users
**Training Content**:

- Basic messaging procedures and etiquette
- File sharing and security requirements
- Emergency communication procedures
- Compliance and data integrity requirements

**Training Method**: Online self-paced training
**Competency Assessment**: Online quiz (80% passing score)
**Frequency**: Initial training plus annual refresh

#### 10.1.2 Moderator Training

**Target Audience**: Chat room moderators and team leaders
**Training Content**:

- Advanced messaging features and administration
- Room management and moderation techniques
- Compliance monitoring and reporting
- Escalation procedures and incident management

**Training Method**: Instructor-led training session
**Competency Assessment**: Practical demonstration
**Frequency**: Initial training plus biannual updates

### 10.2 Training Documentation

#### 10.2.1 Training Materials

- **User Manual**: Comprehensive messaging system guide
- **Quick Start Guide**: Essential procedures for new users
- **Video Tutorials**: Step-by-step instructional videos
- **Reference Cards**: Handy reference for common tasks

#### 10.2.2 Training Records

- Individual training completion records
- Competency assessment results
- Training effectiveness measurements
- Continuous improvement feedback and actions

## 11. Document Control and Review

### 11.1 Document Information

**Document Owner**: IT Operations Manager
**Technical Reviewer**: System Administrator
**Compliance Reviewer**: Quality Assurance Manager

### 11.2 Revision History

| Version | Date       | Changes                                      | Approved By |
| ------- | ---------- | -------------------------------------------- | ----------- |
| 1.0     | 2025-09-14 | Initial release with extensive Python code   | QA Manager  |
| 2.0     | 2025-09-14 | Converted to proper SOP format, removed code | QA Manager  |

### 11.3 Next Review

- **Scheduled Review Date**: September 14, 2026
- **Trigger Events**: System upgrades, regulatory changes, audit findings
- **Review Criteria**: Effectiveness, compliance, user feedback

---

**Document Control Notice**

- **Reviewed by**: Quality Assurance Manager, [Signature Required]
- **Approved by**: Operations Director, [Signature Required]

---

_This document is controlled under the GACP-ERP Document Management System. Printed copies are uncontrolled unless specifically marked otherwise._
