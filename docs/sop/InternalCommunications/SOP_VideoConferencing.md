---
title: "SOP: Video Conferencing System"
document_number: "SOP-GACP-VID-004"
version: "2.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approved_by: "Quality Assurance Manager"
department: "IT Operations / Quality Management"
classification: "Critical Infrastructure"
related_procedures:
  [
    "SOP_InternalMessaging",
    "SOP_InternalAlerts",
    "SOP_VoiceCalls",
    "SOP_Training",
    "SOP_InternalAudits",
  ]
regulatory_references:
  [
    "ALCOA+ Data Integrity",
    "MHRA Data Integrity Guidelines",
    "FDA 21 CFR Part 11",
  ]
---

# SOP: Video Conferencing System

## 1. Purpose and Scope

### 1.1 Purpose

This Standard Operating Procedure establishes procedures for secure video communications within the GACP-compliant cannabis cultivation enterprise using Jitsi Meet platform, ensuring:

- **Professional Video Conferencing**: Secure business communications for operational coordination
- **Regulatory Compliance**: Full ALCOA+ compliance for business-critical video communications
- **Training Delivery**: Video-based training sessions with recording capabilities
- **Audit Support**: Recorded video sessions for internal and external audits
- **Remote Collaboration**: Screen sharing and document collaboration capabilities

### 1.2 Scope

This procedure covers:

- Scheduling and conducting video conferences
- Recording conferences for compliance purposes
- Screen sharing for training and presentations
- Managing participants and conference security
- Emergency video conference activation
- Integration with GACP-ERP calendar system

### 1.3 Regulatory Framework

All video communication activities must comply with:

- **ALCOA+ Principles**: Data integrity throughout the communication lifecycle
- **GACP Guidelines**: Good Agricultural and Collection Practices
- **MHRA Data Integrity**: UK regulatory requirements
- **FDA 21 CFR Part 11**: Electronic records and signatures requirements

## 2. System Overview

### 2.1 Jitsi Meet Platform Components

**Core Infrastructure:**

- **Jitsi Meet**: Web-based video conferencing interface
- **Authentication**: Keycloak SSO integration for corporate access
- **Recording**: Automatic recording for compliance-required meetings
- **Storage**: Secure recording storage integrated with GACP-ERP document management
- **Mobile Access**: iOS and Android applications with corporate authentication

### 2.2 Conference Types

#### 2.2.1 Standard Business Conferences

- Team meetings and coordination
- Project planning sessions
- Vendor and supplier meetings
- Training sessions

#### 2.2.2 Regulatory Conferences (Recording Required)

- Internal audit sessions
- External auditor meetings
- Compliance reviews
- Incident investigation meetings
- Management reviews

## 3. Roles and Responsibilities

### 3.1 Conference Moderator

**Qualifications**: Supervisory role or designated meeting leader

**Responsibilities**:

- Schedule conferences through GACP-ERP calendar
- Manage participant access and permissions
- Control recording for compliance purposes
- Ensure proper meeting documentation
- Moderate discussions and maintain focus

### 3.2 Conference Participants

**Qualifications**: Authorized GACP-ERP system users

**Responsibilities**:

- Join conferences using corporate authentication
- Follow confidentiality protocols
- Participate actively when required
- Report technical issues immediately

### 3.3 IT Support Staff

**Qualifications**: Certified system administrators

**Responsibilities**:

- Maintain system availability (99.9% uptime SLA)
- Monitor conference quality and performance
- Provide technical support during meetings
- Ensure recording compliance with retention policies

## 4. Conference Scheduling Procedures

### 4.1 Standard Conference Scheduling

#### 4.1.1 Access Conference Scheduler

1. Log into GACP-ERP using corporate credentials
2. Navigate to **Calendar** → **Video Conferences**
3. Click **"Schedule New Conference"**

#### 4.1.2 Configure Conference Details

1. **Meeting Information**

   - Enter descriptive meeting title
   - Add detailed agenda or description
   - Set date, start time, and estimated duration

2. **Participant Management**

   - Select participants from GACP directory
   - Assign moderator privileges as needed
   - Set participant permissions (view-only, full participation)

3. **Conference Settings**

   - Choose conference type (Standard/Regulatory/Training)
   - Enable recording if required for compliance
   - Set data classification level
   - Configure screen sharing permissions

4. **Review and Submit**
   - Verify all participant details
   - Confirm regulatory requirements
   - Submit scheduling request

#### 4.1.3 Automatic Notifications

- System sends calendar invitations via email
- Participants receive Jitsi Meet links and access instructions
- Automatic reminders sent 24 hours and 1 hour before meeting

### 4.2 Emergency Conference Activation

#### 4.2.1 Immediate Conference Creation

1. Access **Emergency Conference** button in GACP-ERP dashboard
2. Select incident type:
   - Safety Emergency
   - Quality Issue
   - Security Incident
   - Environmental Emergency
3. System automatically invites predefined emergency response team
4. Conference room created within 30 seconds

#### 4.2.2 Escalation Procedures

- If no response within 5 minutes, system escalates to management
- SMS and voice call backup notifications triggered
- Conference bridge remains active for maximum 4 hours

## 5. Joining Conference Procedures

### 5.1 Web Browser Access

#### 5.1.1 Pre-Meeting Preparation

1. **System Requirements Check**

   - Chrome, Firefox, or Safari browser (latest version)
   - Stable internet connection (minimum 2 Mbps upload/download)
   - Working microphone and camera
   - Quiet, professional environment

2. **Equipment Testing**

   - Test audio/video using browser test page
   - Adjust microphone and camera settings
   - Ensure adequate lighting for video

3. **Document Preparation**
   - Review meeting agenda
   - Prepare required documents
   - Close unnecessary applications

#### 5.1.2 Conference Access

1. **Join Conference**

   - Click Jitsi Meet link from email invitation
   - Enter your full name as it appears in GACP-ERP
   - Wait in lobby if moderator approval required

2. **Audio/Video Setup**

   - Test microphone and camera before joining
   - Mute microphone when not speaking
   - Enable video for professional appearance

3. **Meeting Participation**
   - Follow meeting etiquette and protocols
   - Use chat function for questions if needed
   - Participate actively in discussions

### 5.2 Mobile Application Access

#### 5.2.1 Mobile App Installation

1. Download **Jitsi Meet** from official app store (iOS/Android)
2. Verify app authenticity and permissions
3. Configure with corporate SSO settings

#### 5.2.2 Mobile Conference Access

1. Tap meeting link or enter meeting ID manually
2. Authenticate using corporate credentials
3. Enable notifications for meeting updates
4. Use professional background if available

## 6. Conference Management Procedures

### 6.1 Moderator Controls

#### 6.1.1 Starting Conference

1. **Pre-Meeting Setup**

   - Join conference 5 minutes before start time
   - Test all technical functionality
   - Review participant list and agenda

2. **Conference Initiation**
   - Welcome participants as they join
   - Start recording if required for compliance
   - Review meeting objectives and agenda
   - Establish ground rules and etiquette

#### 6.1.2 During Conference Management

1. **Participant Management**

   - Admit participants from lobby
   - Manage speaking permissions
   - Mute disruptive participants if necessary
   - Monitor participant engagement

2. **Technical Management**
   - Monitor audio/video quality
   - Troubleshoot technical issues
   - Manage screen sharing requests
   - Control recording start/stop

#### 6.1.3 Conference Conclusion

1. **Meeting Wrap-up**

   - Summarize key decisions and action items
   - Confirm next steps and responsibilities
   - Schedule follow-up meetings if needed

2. **Post-Meeting Actions**
   - Stop recording and save to GACP-ERP
   - Send meeting summary to participants
   - File meeting documents properly
   - Update project status if applicable

### 6.2 Screen Sharing Procedures

#### 6.2.1 Initiating Screen Share

1. **Request Permission**

   - Ask moderator for screen sharing approval
   - Ensure content is appropriate for all participants
   - Close confidential applications and documents

2. **Start Screen Sharing**
   - Click screen share button in Jitsi Meet
   - Select application or screen to share
   - Choose audio sharing if presenting videos

#### 6.2.2 Screen Sharing Best Practices

1. **Content Guidelines**

   - Share only relevant applications/windows
   - Avoid displaying personal or confidential information
   - Use pointer and annotations effectively
   - Speak clearly while presenting

2. **Technical Considerations**
   - Ensure stable internet connection
   - Close unnecessary applications for performance
   - Monitor participant feedback and questions
   - Stop sharing when presentation is complete

## 7. Recording and Documentation

### 7.1 Conference Recording Requirements

#### 7.1.1 Mandatory Recording Sessions

- Internal audit meetings
- External auditor conferences
- Compliance review sessions
- Incident investigation meetings
- Management reviews and decisions
- Training sessions requiring documentation

#### 7.1.2 Recording Procedures

1. **Pre-Recording Checklist**

   - Verify recording is enabled in conference settings
   - Inform all participants about recording
   - Obtain verbal consent from external participants
   - Document recording purpose and retention requirements

2. **Recording Management**
   - Start recording at beginning of meeting
   - Monitor recording status throughout session
   - Stop recording at end of meeting
   - Verify recording was saved successfully

### 7.2 Post-Conference Documentation

#### 7.2.1 Meeting Documentation Requirements

1. **Meeting Minutes** (for compliance sessions)

   - Date, time, and duration
   - List of participants and roles
   - Key discussion points and decisions
   - Action items and responsible parties
   - Next steps and follow-up requirements

2. **Recording Management**
   - Upload recording to GACP-ERP document management
   - Apply appropriate classification and retention labels
   - Ensure recording is accessible to authorized personnel
   - Create audit trail entry for recording access

#### 7.2.2 File Naming and Storage

1. **Naming Convention**

   - Format: `YYYY-MM-DD_MeetingType_Topic_RecordingID`
   - Example: `2025-09-14_AuditMeeting_Q3Review_REC001`

2. **Storage Requirements**
   - Store in appropriate GACP-ERP folder structure
   - Apply data classification labels
   - Set retention period according to policy
   - Ensure backup and disaster recovery coverage

## 8. Troubleshooting and Support

### 8.1 Common Technical Issues

#### 8.1.1 Audio/Video Problems

**Issue**: Poor audio quality or no sound
**Resolution Steps**:

1. Check microphone permissions in browser
2. Test microphone in system settings
3. Refresh browser and rejoin conference
4. Contact IT support if problems persist

**Issue**: Video not working or poor quality
**Resolution Steps**:

1. Check camera permissions in browser
2. Ensure adequate lighting
3. Close other applications using camera
4. Reduce video quality if bandwidth is limited

#### 8.1.2 Connection Issues

**Issue**: Unable to join conference
**Resolution Steps**:

1. Verify internet connection stability
2. Try different browser or clear cache
3. Check if corporate firewall is blocking access
4. Use mobile app as backup connection method

**Issue**: Frequent disconnections
**Resolution Steps**:

1. Check network stability and bandwidth
2. Close unnecessary applications
3. Move closer to Wi-Fi router if using wireless
4. Contact IT support for network diagnostics

### 8.2 Emergency Support Procedures

#### 8.2.1 Critical Meeting Support

1. **During Business Hours**

   - Contact IT Help Desk: ext. 2500
   - Email: <itsupport@gacp-erp.com>
   - Expected response time: 5 minutes

2. **After Hours Emergency**
   - Emergency IT hotline: [Emergency Number]
   - On-call system administrator
   - Expected response time: 15 minutes

#### 8.2.2 Backup Communication Methods

1. **Primary Backup**: Conference call bridge
2. **Secondary Backup**: Microsoft Teams (if available)
3. **Emergency Backup**: Phone conference with group messaging

## 9. Security and Compliance

### 9.1 Security Requirements

#### 9.1.1 Access Controls

- All participants must authenticate via corporate SSO
- Guest access disabled for confidential meetings
- Conference rooms protected with unique meeting IDs
- Lobby functionality enabled for external participants

#### 9.1.2 Data Protection

- All communications encrypted in transit
- Recording storage encrypted at rest
- Access logs maintained for audit purposes
- Data retention policies strictly enforced

### 9.2 Compliance Monitoring

#### 9.2.1 Audit Trail Requirements

- Conference initiation and termination logs
- Participant join/leave timestamps
- Recording start/stop events
- Screen sharing and file transfer activities
- All events stored in immudb for compliance

#### 9.2.2 Regular Compliance Reviews

- Monthly review of conference usage patterns
- Quarterly assessment of recording compliance
- Annual audit of system security controls
- Continuous monitoring of data integrity

## 10. Training and Competency

### 10.1 User Training Requirements

#### 10.1.1 Basic User Training

**Target Audience**: All GACP-ERP users
**Training Content**:

- Conference joining procedures
- Basic participant etiquette
- Screen sharing fundamentals
- Mobile application usage

**Training Method**: Online self-paced training
**Competency Assessment**: Online quiz (80% passing score)
**Frequency**: Annual refresh training

#### 10.1.2 Moderator Training

**Target Audience**: Department heads and project leaders
**Training Content**:

- Conference scheduling and management
- Recording procedures and compliance
- Troubleshooting common issues
- Emergency conference activation

**Training Method**: Instructor-led training session
**Competency Assessment**: Practical demonstration
**Frequency**: Initial training + annual updates

### 10.2 Training Documentation

#### 10.2.1 User Guides

- Quick Start Guide for new users
- Mobile Application Setup Guide
- Troubleshooting Reference Card
- Screen Sharing Best Practices

#### 10.2.2 Training Records

- Individual training completion records
- Competency assessment results
- Training effectiveness measurements
- Continuous improvement feedback

## 11. Document Control and Review

### 11.1 Document Information

**Document Owner**: IT Operations Manager
**Technical Reviewer**: System Administrator
**Compliance Reviewer**: Quality Assurance Manager

### 11.2 Revision History

| Version | Date       | Changes                                | Approved By |
| ------- | ---------- | -------------------------------------- | ----------- |
| 1.0     | 2025-09-14 | Initial release with XMPP architecture | QA Manager  |
| 2.0     | 2025-09-14 | Updated for Jitsi Meet platform        | QA Manager  |

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
