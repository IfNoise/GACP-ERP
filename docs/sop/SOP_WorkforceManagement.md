# SOP-WF-001: Workforce Management and Task Assignment

**Document ID:** SOP-WF-001  
**Version:** 1.0  
**Effective Date:** 2025-09-14  
**Review Date:** 2026-09-14  
**Owner:** HR Manager  
**Approved By:** QA Manager  

## 1. Purpose and Scope

This SOP defines procedures for workforce management, task assignment, competency verification, and mobile device operations within the GACP-ERP system.

### 1.1 Scope
- Employee onboarding and competency management
- Shift scheduling and time tracking
- Task assignment and completion verification
- Android terminal operations and data synchronization
- Training record maintenance

### 1.2 Compliance Requirements
- GACP personnel qualification requirements
- Training record maintenance per regulatory standards
- Audit trail for all workforce activities
- Electronic documentation of competencies

## 2. Responsibilities

| Role | Responsibility |
|------|----------------|
| HR Manager | Overall workforce planning and competency management |
| Shift Supervisor | Daily task assignment and crew management |
| Operations Manager | Shift scheduling and resource allocation |
| QA Manager | Training program oversight and compliance verification |
| IT Support | Mobile device management and technical support |

## 3. Employee Onboarding Procedures

### 3.1 Initial Setup

**Step 1: Employee Profile Creation**
1. Log into GACP-ERP Workforce module
2. Navigate to Employee Management → New Employee
3. Enter required personal information:
   - Full name and employee ID
   - Department and position
   - Hire date and supervisor assignment
   - Emergency contact information
4. Assign initial security role and permissions
5. Create training profile and competency matrix

**Step 2: Competency Assessment**
1. Review position-specific skill requirements
2. Conduct initial competency evaluation
3. Document current skill levels in system
4. Identify training gaps and requirements
5. Create personalized training plan

**Step 3: System Access Provisioning**
1. Issue employee badge with QR/NFC capability
2. Assign Android terminal if required
3. Configure mobile device settings:
   - Employee profile synchronization
   - Zone access permissions
   - Offline data allowances
4. Conduct system orientation training

### 3.2 Training and Certification

**Step 1: Training Assignment**
1. Navigate to Training Management module
2. Assign mandatory courses based on position
3. Set completion deadlines
4. Configure automatic notifications
5. Track progress and completion status

**Step 2: Competency Verification**
1. Conduct practical skill assessments
2. Document results in competency matrix
3. Update skill levels in employee profile
4. Issue certificates for completed training
5. Schedule periodic recertification

## 4. Shift Management Procedures

### 4.1 Shift Scheduling

**Step 1: Schedule Creation**
1. Access Shift Management dashboard
2. Review production requirements and zone needs
3. Check employee availability and certifications
4. Create shift assignments considering:
   - Required skill mix
   - Regulatory compliance needs
   - Overtime constraints
   - Training schedules

**Step 2: Schedule Publication**
1. Review and approve shift schedules
2. Publish schedules to employee mobile devices
3. Send automated notifications
4. Handle schedule change requests
5. Maintain minimum staffing levels

### 4.2 Time and Attendance

**Step 1: Shift Start Procedures**
1. Employee scans badge at zone entrance
2. System verifies:
   - Scheduled shift time
   - Zone access permissions
   - Required certifications
   - Health and safety training status
3. Android terminal syncs latest data
4. Displays assigned tasks for the shift

**Step 2: Time Tracking**
1. System automatically tracks time on tasks
2. Monitors break periods and meal times
3. Calculates overtime as appropriate
4. Flags compliance violations (max hours, mandatory rest)
5. Integrates with payroll calculations

## 5. Task Assignment and Management

### 5.1 Task Creation

**Step 1: Automatic Task Generation**
1. Production planning system creates batch-related tasks
2. Equipment maintenance generates scheduled tasks
3. Quality events trigger investigation tasks
4. Training system creates assignment tasks

**Step 2: Manual Task Creation**
1. Navigate to Task Management module
2. Create new task with required details:
   - Task type and priority
   - Required skills and certifications
   - Estimated duration
   - Zone/location assignment
   - Associated SOPs and instructions

### 5.2 Task Assignment Logic

**Step 1: Automatic Assignment**
1. System evaluates available employees based on:
   - Current shift status
   - Required competencies
   - Workload balance
   - Zone accessibility
   - Certification status
2. Assigns tasks to optimal candidates
3. Sends push notifications to mobile devices

**Step 2: Manual Assignment Override**
1. Supervisor can reassign tasks as needed
2. System validates competency requirements
3. Documents reason for manual override
4. Updates workload calculations

### 5.3 Task Execution on Android Terminals

**Step 1: Task Acceptance**
1. Employee receives notification on device
2. Reviews task details and SOPs
3. Confirms acceptance or requests reassignment
4. Downloads required reference materials
5. Starts task timer

**Step 2: SOP-Guided Execution**
1. Device displays step-by-step instructions
2. Employee completes checkpoints
3. Captures photos/videos as required
4. Records measurements and observations
5. Completes electronic signatures for critical steps

**Step 3: Task Completion**
1. Employee marks task complete on device
2. Uploads collected data and media
3. Applies electronic signature
4. Syncs data to central system
5. Updates task status and time records

## 6. Mobile Device Management

### 6.1 Device Provisioning

**Step 1: Initial Setup**
1. Configure device with employee profile
2. Install latest GACP-ERP mobile app
3. Set up offline data synchronization
4. Configure security settings:
   - Screen lock requirements
   - Remote wipe capability
   - App-specific permissions
5. Test connectivity and functionality

**Step 2: Ongoing Management**
1. Monitor device health and performance
2. Push app updates automatically
3. Manage offline data storage limits
4. Perform security compliance checks
5. Handle device replacement/repair

### 6.2 Data Synchronization

**Step 1: Offline Operation**
1. Device operates independently when network unavailable
2. Stores data locally in encrypted SQLite database
3. Continues task execution with cached SOPs
4. Queues data for upload when connectivity restored
5. Maintains security controls offline

**Step 2: Data Synchronization**
1. Automatic sync when connectivity available
2. Conflict resolution for concurrent updates
3. Verification of data integrity
4. Update confirmation notifications
5. Cleanup of synchronized offline data

## 7. Competency Management

### 7.1 Skill Matrix Maintenance

**Step 1: Regular Assessment**
1. Quarterly competency reviews
2. Document skill level changes
3. Update training requirements
4. Plan career development paths
5. Maintain certification records

**Step 2: Gap Analysis**
1. Identify skill deficiencies
2. Create targeted training plans
3. Schedule additional assessments
4. Track improvement progress
5. Document compliance status

## 8. Quality Assurance

### 8.1 Data Integrity Controls
- All workforce activities logged in audit trail
- Electronic signatures for critical procedures
- Regular synchronization verification
- Automated compliance monitoring
- Periodic access reviews

### 8.2 Performance Monitoring
- Task completion metrics
- Training compliance rates
- Time and attendance accuracy
- Mobile device performance
- Error rates and quality indicators

## 9. Documentation and Records

### 9.1 Required Records
- Employee profiles and training records
- Competency assessments and certifications
- Time and attendance data
- Task execution records
- Mobile device management logs

### 9.2 Retention Periods
- Training records: 7 years after employment termination
- Time records: 7 years
- Competency assessments: 5 years
- Audit trail: Permanent retention
- Mobile device logs: 3 years

## 10. Emergency Procedures

### 10.1 System Outage
- Switch to paper-based documentation
- Manual time tracking procedures
- Priority task identification
- Post-outage data reconciliation
- Incident reporting requirements

### 10.2 Device Failure
- Immediate replacement procedures
- Data recovery from backup
- Temporary manual procedures
- Investigation of data loss
- Preventive action implementation

## 11. Training Requirements

### 11.1 Initial Training
- 4-hour workforce module overview
- Hands-on Android terminal training
- SOP execution procedures
- Emergency response protocols
- Security and compliance requirements

### 11.2 Ongoing Training
- Monthly system updates
- Quarterly competency refreshers
- Annual compliance training
- New feature orientations
- Cross-training opportunities

## 12. References

- WHO GACP Personnel Requirements
- Company HR Policies and Procedures
- Mobile Device Security Standards
- Training and Development Guidelines
- 21 CFR Part 11 Electronic Records

## 13. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-09-14 | Initial version | HR Manager |

---
**Document Control**  
Controlled copies are maintained electronically in the GACP-ERP document management system. Printed copies are uncontrolled and subject to immediate retrieval upon revision.