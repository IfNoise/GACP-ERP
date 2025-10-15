---
title: "FDA 21 CFR Part 11: Electronic Records and Electronic Signatures"
version: "Final Rule (1997), Guidance (2003), Current Interpretation (2024)"
status: "active"
last_updated: "2025-10-15"
regulatory_authority: "U.S. Food and Drug Administration"
scope: "Electronic records, electronic signatures, and handwritten signatures executed to electronic records"
---

# FDA 21 CFR Part 11: Electronic Records & Electronic Signatures

## 1. Executive Summary

**21 CFR Part 11** устанавливает критерии, при соблюдении которых FDA рассматривает электронные записи, электронные подписи и подписи, выполненные на электронных записях, как эквивалентные бумажным документам и рукописным подписям.

**Key Principle**: Электронные системы должны обеспечивать **целостность**, **достоверность** и **надёжность** данных на уровне, эквивалентном или превосходящем бумажные системы.

### 1.1 Applicability to GACP-ERP

GACP-ERP система попадает под действие 21 CFR Part 11, так как:

- ✅ Используется для хранения GxP-критичных данных
- ✅ Применяет электронные подписи для критических операций
- ✅ Заменяет бумажные batch records электронными
- ✅ Используется для регуляторных submission и inspections

## 2. Regulatory Structure

### 2.1 Part 11 Subparts

```yaml
Subpart_A_General_Provisions:
  §11.1: "Scope"
  §11.2: "Implementation"
  §11.3: "Definitions"

Subpart_B_Electronic_Records:
  §11.10: "Controls for closed systems"
  §11.30: "Controls for open systems"
  §11.50: "Signature manifestations"
  §11.70: "Signature/record linking"

Subpart_C_Electronic_Signatures:
  §11.100: "General requirements"
  §11.200: "Electronic signature components and controls"
  §11.300: "Controls for identification codes/passwords"
```

### 2.2 FDA Guidance Documents

**Primary Guidance:**

- **Part 11 Guidance (2003)**: "Scope and Application of 21 CFR Part 11"
- **Data Integrity Guidance (2018)**: "Data Integrity and Compliance with cGMP"
- **Computer System Validation (2002)**: "General Principles"

## 3. Detailed Requirements Analysis

### 3.1 Subpart A: General Provisions

#### §11.1 Scope

**Regulatory Text:**
> "The regulations in this part set forth the criteria under which the agency considers electronic records, electronic signatures, and handwritten signatures executed to electronic records to be trustworthy, reliable, and generally equivalent to paper records and handwritten signatures executed on paper."

**ERP Implementation:**

```yaml
GACP_ERP_Approach:
  predicate_rules:
    - "FDA 21 CFR Part 11 (Electronic Records)"
    - "EU GMP Annex 11 (Computerised Systems)"
    - "WHO GACP Guidelines"
    - "MHRA Data Integrity Guidance"
    
  system_categorization:
    - "GxP Critical System"
    - "GAMP Category 5 (Custom Application)"
    - "High Risk per ICH Q9"
```

#### §11.3 Definitions

| Term | FDA Definition | ERP Implementation |
|------|---------------|-------------------|
| **Closed system** | Environment where system access is controlled by persons responsible for content | GACP-ERP with Keycloak authentication, RBAC, internal network |
| **Electronic record** | Any combination of text, graphics, data, audio, pictorial, or other information representation in digital form | All database records, JSON events in Kafka, audit trail entries, batch records |
| **Electronic signature** | Computer data compilation of any symbol or series of symbols executed, adopted, or authorized by an individual | E-signature with password/MFA, digital signature with PKI |
| **Handwritten signature** | Scripted name or legal mark of an individual | Not applicable (fully electronic system) |

### 3.2 Subpart B: Electronic Records

#### §11.10 Controls for Closed Systems

**CRITICAL REQUIREMENT**: Persons who use closed systems to create, modify, maintain, or transmit electronic records shall employ procedures and controls designed to ensure the authenticity, integrity, and, when appropriate, the confidentiality of electronic records.

##### §11.10(a) Validation of Systems

**Requirement:**
> "Validation of systems to ensure accuracy, reliability, consistent intended performance, and the ability to discern invalid or altered records."

**ERP Validation Approach:**

```yaml
Validation_Lifecycle:
  phase_1_planning:
    - Validation Master Plan (VMP)
    - Risk Assessment (ICH Q9)
    - Validation Strategy Document
    
  phase_2_requirements:
    - User Requirements Specification (URS)
    - Functional Specification (FS)
    - Design Specification (DS)
    - Traceability Matrix
    
  phase_3_testing:
    - Installation Qualification (IQ)
    - Operational Qualification (OQ)
    - Performance Qualification (PQ)
    - Test Cases with expected results
    
  phase_4_maintenance:
    - Change Control процедура
    - Periodic Review (Annual)
    - Revalidation triggers
    - Continuous monitoring
```

**Validation Deliverables:**

- ✅ VMP: `/docs/validation/VMP.md`
- ✅ Test Cases: `/docs/validation/TestCases/*.md`
- ✅ SOPs: `/docs/sop/SOP_*.md`
- ✅ Compliance mapping: This document

##### §11.10(b) Ability to Generate Accurate and Complete Copies

**Requirement:**
> "The ability to generate accurate and complete copies of records in both human readable and electronic form suitable for inspection, review, and copying by the agency."

**ERP Implementation:**

```typescript
// Report generation with FDA-compliant format
interface FDACompliantReport {
  metadata: {
    reportType: string;           // "Batch Record", "Audit Trail", etc.
    generatedAt: string;          // ISO 8601 timestamp
    generatedBy: string;          // User ID + name
    dateRange: { start: string; end: string };
    systemInfo: {
      erpVersion: string;
      databaseVersion: string;
      reportGeneratorVersion: string;
    };
  };
  
  data: {
    records: Array<{
      recordId: string;
      timestamp: string;
      user: { id: string; name: string; role: string };
      action: string;
      oldValue: any;
      newValue: any;
      digitalSignature?: string;
      auditTrailHash: string;
    }>;
  };
  
  integrity: {
    recordCount: number;
    firstRecord: string;       // Hash of first record
    lastRecord: string;        // Hash of last record
    reportHash: string;        // SHA-256 of entire report
    digitalSignature: string;  // System signature
  };
  
  export: {
    formats: ["PDF", "CSV", "JSON", "XML"];
    readableFormat: true;      // Human-readable PDF
    machineFormat: true;       // JSON for re-import
  };
}
```

**Report Features:**

- 📄 **PDF**: Human-readable with watermark
- 📊 **CSV**: Spreadsheet import for analysis
- 🔧 **JSON**: Machine-readable for validation tools
- 📋 **XML**: Regulatory submission format

##### §11.10(c) Protection of Records

**Requirement:**
> "Protection of records to enable their accurate and ready retrieval throughout the records retention period."

**ERP Data Protection Strategy:**

**Primary Storage (ImmuDB):**

```yaml
Immutable_Database:
  technology: "ImmuDB (WORM storage)"
  features:
    - Cryptographic verification
    - Tamper-proof history
    - Point-in-time queries
    - Merkle tree for integrity
    
  retention:
    active: "3 years (online)"
    archive: "7+ years (cold storage)"
    permanent: "Critical GxP records"
```

**Backup & Disaster Recovery:**

```yaml
Backup_Strategy:
  incremental:
    frequency: "Every 4 hours"
    retention: "7 days"
    
  daily:
    frequency: "Daily at 02:00 UTC"
    retention: "30 days"
    
  weekly:
    frequency: "Sunday 02:00 UTC"
    retention: "52 weeks"
    
  monthly:
    frequency: "1st of month"
    retention: "7 years"
    
  geographic:
    primary: "On-premise data center"
    secondary: "Cloud backup (encrypted)"
    tertiary: "Offsite tape archive"
```

##### §11.10(d) Limiting System Access

**Requirement:**
> "Limiting system access to authorized individuals."

**ERP Access Control:**

**Authentication Layers:**

```yaml
Layer_1_Identity_Provider:
  system: "Keycloak"
  methods:
    - Username/Password (mandatory)
    - MFA/2FA (for privileged users)
    - SSO integration
    - Session management
    
Layer_2_Authorization:
  model: "RBAC (Role-Based Access Control)"
  roles:
    - System Administrator
    - Quality Manager
    - Production Manager
    - Laboratory Analyst
    - Operator (Read-Only)
    
Layer_3_Data_Access:
  model: "ABAC (Attribute-Based)"
  rules:
    - Department-based filtering
    - Facility-based access
    - Time-based restrictions
```

**Implementation Reference:**

- 📋 See `SOP_AccessControl.md` for detailed procedures

##### §11.10(e) Use of Secure, Computer-Generated, Time-Stamped Audit Trails

**Requirement:**
> "Use of secure, computer-generated, time-stamped audit trails to independently record the date and time of operator entries and actions that create, modify, or delete electronic records."

**ERP Audit Trail Architecture:**

```typescript
// Audit Event Schema (Zod-validated)
const AuditEventSchema = z.object({
  // §11.10(e) required fields
  eventId: z.string().uuid(),
  timestamp: z.string().datetime({ offset: true }), // ISO 8601 with timezone
  
  // Operator identification
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
  sessionId: z.string(),
  
  // Action details
  operation: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT']),
  tableName: z.string(),
  recordId: z.string(),
  
  // Change tracking
  oldValue: z.any().nullable(),
  newValue: z.any().nullable(),
  changeReason: z.string().optional(),
  
  // Security & integrity
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  digitalSignature: z.string().optional(),
  payloadHash: z.string(), // SHA-256
  
  // System info
  sourceModule: z.string(),
  erpVersion: z.string(),
});
```

**Audit Trail Properties:**

- ✅ **Secure**: ImmuDB prevents tampering
- ✅ **Computer-generated**: Automatic capture via database triggers + app hooks
- ✅ **Time-stamped**: NTP-synchronized timestamps in UTC
- ✅ **Independent**: Cannot be disabled by users
- ✅ **Immutable**: Write-once, cannot be modified or deleted

**Implementation Reference:**

- 📋 See `SOP_AuditTrail.md` for detailed procedures

##### §11.10(f) Use of Operational System Checks

**Requirement:**
> "Use of operational system checks to enforce permitted sequencing of steps and events, as appropriate."

**ERP Workflow Controls:**

```typescript
// Batch Release Workflow Example
class BatchReleaseWorkflow {
  private validTransitions: Record<BatchStatus, BatchStatus[]> = {
    'IN_PRODUCTION': ['QC_TESTING'],
    'QC_TESTING': ['QC_APPROVED', 'QC_REJECTED'],
    'QC_APPROVED': ['QA_REVIEW'],
    'QA_REVIEW': ['RELEASED', 'REJECTED'],
    'RELEASED': ['SHIPPED'],
    'REJECTED': [], // Terminal state
    'SHIPPED': []   // Terminal state
  };
  
  async transitionBatch(
    batchId: string,
    targetStatus: BatchStatus,
    user: User
  ): Promise<Result> {
    // §11.10(f) - Enforce permitted sequencing
    const currentStatus = await this.getBatchStatus(batchId);
    
    if (!this.validTransitions[currentStatus]?.includes(targetStatus)) {
      throw new InvalidTransitionError(
        `Cannot transition from ${currentStatus} to ${targetStatus}`
      );
    }
    
    // §11.10(g) - Authority check
    if (!user.hasPermission(`batch:transition:${targetStatus}`)) {
      throw new UnauthorizedError('Insufficient privileges');
    }
    
    // §11.10(i) - E-signature required for critical steps
    if (this.requiresSignature(targetStatus)) {
      await this.requestElectronicSignature(user, batchId, targetStatus);
    }
    
    return this.executeTransition(batchId, targetStatus, user);
  }
}
```

##### §11.10(g) Use of Authority Checks

**Requirement:**
> "Use of authority checks to ensure that only authorized individuals can use the system, electronically sign a record, access the operation or computer system input or output device, alter a record, or perform the operation at hand."

**ERP Permission Model:**

```yaml
Permission_Structure:
  batch_operations:
    batch:create: ["Production Manager", "Supervisor"]
    batch:modify: ["Production Manager"]
    batch:qc_test: ["Laboratory Analyst", "QC Manager"]
    batch:approve: ["QA Manager"]
    batch:release: ["QA Manager", "Quality Director"]
    batch:reject: ["QA Manager", "Quality Director"]
    
  esignature_operations:
    esignature:sign: ["All authenticated users"]
    esignature:approve: ["Manager level and above"]
    esignature:release: ["QA Manager", "Quality Director"]
    
  system_operations:
    system:admin: ["System Administrator"]
    system:audit_view: ["QA", "Compliance Officer", "Auditors"]
    system:backup: ["System Administrator", "DBA"]
```

**Real-time Authority Verification:**

```typescript
// Middleware for API endpoint protection
async function authorityCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user; // From authentication
  const action = req.route.action; // e.g., "batch:release"
  
  // §11.10(g) - Authority check
  if (!user.hasPermission(action)) {
    await auditLog.record({
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      userId: user.id,
      action: action,
      result: 'DENIED'
    });
    
    return res.status(403).json({
      error: 'Insufficient privileges',
      required: action
    });
  }
  
  next();
}
```

##### §11.10(h) Use of Device Checks

**Requirement:**
> "Use of device checks to determine, as appropriate, the validity of the source of data input or operational instruction."

**ERP Device Validation:**

```yaml
Device_Checks:
  user_devices:
    - Browser fingerprinting
    - IP whitelist (optional)
    - Geolocation validation
    - Device registration
    
  iot_sensors:
    - Device authentication (TLS certificates)
    - Data integrity (HMAC signatures)
    - Calibration status check
    - Last communication timestamp
    
  laboratory_instruments:
    - Equipment ID verification
    - Calibration status (must be current)
    - Qualification status (IQ/OQ/PQ)
    - Automated data transfer (no manual entry)
```

**Example: Sensor Data Validation**

```typescript
async function validateSensorData(data: SensorReading) {
  // §11.10(h) - Device check
  const sensor = await getSensorById(data.sensorId);
  
  if (!sensor.isCalibrated) {
    throw new ValidationError('Sensor not calibrated');
  }
  
  if (sensor.calibrationExpiry < new Date()) {
    throw new ValidationError('Sensor calibration expired');
  }
  
  // Verify HMAC signature
  const expectedHmac = calculateHmac(data.payload, sensor.secretKey);
  if (data.signature !== expectedHmac) {
    throw new SecurityError('Invalid sensor signature');
  }
  
  return true;
}
```

##### §11.10(i) Determination of Record Invalidity

**Requirement:**
> "Determination that persons who develop, maintain, or use electronic record/electronic signature systems have the education, training, and experience to perform their assigned tasks."

**ERP Training Management:**

```yaml
Training_Requirements:
  system_users:
    - "Introduction to GACP-ERP" (4 hours)
    - "Data Integrity Principles" (2 hours)
    - "Electronic Signatures" (1 hour)
    - "Role-specific training" (varies)
    - Annual refresher (2 hours)
    
  system_administrators:
    - All user training (above)
    - "System Administration" (16 hours)
    - "Backup & Recovery" (8 hours)
    - "Security Management" (8 hours)
    - "Audit Trail Management" (4 hours)
    
  developers:
    - "GxP Systems Development" (24 hours)
    - "21 CFR Part 11 Compliance" (8 hours)
    - "Data Integrity" (4 hours)
    - "Change Control" (4 hours)
```

**Training Tracking:**

```typescript
interface TrainingRecord {
  userId: string;
  courseName: string;
  completionDate: string;
  instructorSignature: string;
  assessmentScore: number; // Must be >= 80%
  certificateId: string;
  expiryDate: string;
  status: 'CURRENT' | 'EXPIRED' | 'PENDING';
}
```

**Implementation Reference:**

- 📋 See `TC-TRAIN-001.md` for training validation test case

##### §11.10(k) Documentation Controls

**Requirement:**
> "Use of appropriate controls over systems documentation including adequate controls over the distribution of, access to, and use of documentation for system operation and maintenance."

**ERP Documentation Management:**

```yaml
Document_Control:
  sop_documents:
    location: "/docs/sop/*.md"
    version_control: "Git with signed commits"
    access: "Authenticated users (read), QA Manager (write)"
    review_cycle: "Annual"
    
  validation_documents:
    location: "/docs/validation/**"
    version_control: "Git with approval workflow"
    access: "QA/Compliance team"
    retention: "Lifetime of system + 1 year"
    
  technical_documents:
    location: "/docs/services/*.md, /docs/infrastructure/*.md"
    version_control: "Git"
    access: "Development team, QA review"
```

**Document Versioning:**

```yaml
version_format: "major.minor"
status_values: ["draft", "active", "retired"]
metadata_required:
  - version
  - status
  - last_updated
  - author
  - approver (for active)
  - effective_date (for active)
```

#### §11.30 Controls for Open Systems

**Requirement:**
> "Persons who use open systems to create, modify, maintain, or transmit electronic records shall employ procedures and controls designed to ensure the authenticity, integrity, and, as appropriate, the confidentiality of electronic records from the point of their creation to the point of their receipt."

**Note:** GACP-ERP primarily operates as a **closed system** (internal network, controlled access). However, for external integrations:

```yaml
Open_System_Controls:
  api_integrations:
    - TLS 1.3 encryption (in transit)
    - API key authentication
    - OAuth 2.0 / JWT tokens
    - Rate limiting
    - IP whitelisting
    
  data_transfers:
    - PGP encryption (at rest)
    - Secure FTP (SFTP)
    - Digital signatures
    - Checksum verification
    
  cloud_backups:
    - AES-256 encryption
    - Zero-knowledge architecture
    - Access logging
```

#### §11.50 Signature Manifestations

**Requirement:**
> "Signed electronic records shall contain information associated with the signing that clearly indicates all of the following: (a) The printed name of the signer; (b) The date and time when the signature was executed; and (c) The meaning (such as review, approval, responsibility, or authorship) associated with the signature."

**ERP E-Signature Display:**

```typescript
interface SignatureManifestation {
  // §11.50(a) - Printed name
  signerName: string;           // "Dr. Jane Smith"
  signerRole: string;           // "Quality Manager"
  signerUserId: string;         // "jsmith@company.com"
  
  // §11.50(b) - Date and time
  signedAt: string;             // "2025-10-15T14:32:15.123Z"
  signedAtDisplay: string;      // "October 15, 2025 at 2:32 PM UTC"
  
  // §11.50(c) - Meaning
  signatureMeaning: string;     // "Approved for Release"
  actionDescription: string;    // "Batch B-2025-1015 approved for distribution"
  
  // Additional context
  documentId: string;
  documentType: string;         // "Batch Record", "SOP", etc.
  signatureHash: string;        // Cryptographic proof
}
```

**Visual Representation (PDF):**

```text
┌─────────────────────────────────────────────────────────────┐
│ ELECTRONIC SIGNATURE                                         │
├─────────────────────────────────────────────────────────────┤
│ Signed By:        Dr. Jane Smith (Quality Manager)          │
│ User ID:          jsmith@company.com                         │
│ Date & Time:      October 15, 2025 at 2:32:15 PM UTC       │
│ Action:           Approved for Release                       │
│ Document:         Batch Record B-2025-1015                   │
│ Reason:           All QC tests passed, ready for shipment    │
│ Signature Hash:   a3f8b9c2d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9  │
└─────────────────────────────────────────────────────────────┘
```

#### §11.70 Signature/Record Linking

**Requirement:**
> "Electronic signatures and handwritten signatures executed to electronic records shall be linked to their respective electronic records to ensure that the signatures cannot be excised, copied, or otherwise transferred to falsify an electronic record by ordinary means."

**ERP Cryptographic Linking:**

```typescript
// Generate signature hash that binds signature to record
function generateSignatureHash(
  recordId: string,
  recordData: any,
  userId: string,
  timestamp: string,
  action: string
): string {
  const payload = JSON.stringify({
    recordId,
    recordHash: sha256(JSON.stringify(recordData)),
    userId,
    timestamp,
    action
  });
  
  return sha256(payload);
}

// Verification function
async function verifySignatureIntegrity(
  signatureId: string
): Promise<VerificationResult> {
  const signature = await getSignature(signatureId);
  const record = await getRecord(signature.recordId);
  
  // Recalculate hash
  const calculatedHash = generateSignatureHash(
    signature.recordId,
    record.data,
    signature.userId,
    signature.timestamp,
    signature.action
  );
  
  // §11.70 - Verify linking
  if (calculatedHash !== signature.hash) {
    return {
      valid: false,
      reason: 'Signature-record linkage broken (tampering detected)'
    };
  }
  
  // Additional checks
  const recordModified = record.lastModified > signature.timestamp;
  if (recordModified) {
    return {
      valid: false,
      reason: 'Record modified after signature'
    };
  }
  
  return { valid: true };
}
```

**ImmuDB Storage:**

```
Record Entry:
  recordId: "BATCH-2025-1015"
  data: { ... batch data ... }
  hash: "abc123..."
  
Signature Entry:
  signatureId: "SIG-2025-1015-001"
  recordId: "BATCH-2025-1015"
  recordHash: "abc123..."          ← Links to specific version
  signatureHash: "def456..."       ← Includes recordHash
  userId: "jsmith@company.com"
  timestamp: "2025-10-15T14:32:15Z"
  
Immutable Guarantee:
  - Cannot modify record without breaking signature
  - Cannot copy signature to different record
  - Cannot backdate signature
  - Merkle tree proves order of operations
```

### 3.3 Subpart C: Electronic Signatures

#### §11.100 General Requirements

**§11.100(a) Unique Identification**

**Requirement:**
> "Each electronic signature shall be unique to one individual and shall not be reused by, or reassigned to, anyone else."

**ERP Implementation:**

```yaml
User_Identity:
  primary_key: "Email address (company domain)"
  example: "jsmith@company.com"
  uniqueness: "Enforced by Keycloak"
  reuse_prevention:
    - Account deactivation (not deletion)
    - Historical records retained
    - Audit trail preserved
  reassignment: "Never allowed"
```

**§11.100(b) Identity Verification**

**Requirement:**
> "Before an organization establishes, assigns, certifies, or otherwise sanctions an individual's electronic signature, or any element of such electronic signature, the organization shall verify the identity of the individual."

**ERP Identity Verification Process:**

```yaml
New_User_Registration:
  step_1_hr_verification:
    - Employee ID verification
    - Background check completed
    - Job description review
    
  step_2_identity_proof:
    - Government ID (passport/driver's license)
    - In-person verification or notarized document
    - Photo capture
    
  step_3_account_creation:
    - Unique email assigned
    - Initial password (temporary)
    - MFA enrollment required
    
  step_4_training:
    - System training completed
    - Assessment passed (≥80%)
    - Certificate issued
    
  step_5_approval:
    - Line manager approval
    - IT Security approval
    - QA approval (for GxP roles)
```

**§11.100(c) Certification**

**Requirement:**
> "Persons using electronic signatures shall, prior to or at the time of such use, certify to the agency that the electronic signatures in their system, used on or after August 20, 1997, are intended to be the legally binding equivalent of traditional handwritten signatures."

**ERP Certification:**

**User Acknowledgment (one-time):**

```
┌────────────────────────────────────────────────────────────┐
│ ELECTRONIC SIGNATURE CERTIFICATION                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ I certify that my electronic signature, when applied to    │
│ electronic records within the GACP-ERP system, is intended │
│ to be the legally binding equivalent of my traditional     │
│ handwritten signature.                                     │
│                                                            │
│ I understand that:                                         │
│ • My electronic signature has the same legal force as a    │
│   handwritten signature                                    │
│ • I am responsible for all actions performed using my      │
│   credentials                                              │
│ • I must not share my password or authentication factors   │
│ • Electronic signatures cannot be repudiated               │
│                                                            │
│ User: _____________________  Date: ___________________     │
│                                                            │
│ ☐ I acknowledge and accept these terms                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Organizational Certification (FDA submission):**

```
Company: [Organization Name]
Date: October 15, 2025

We certify to the Food and Drug Administration that electronic 
signatures executed in our GACP-ERP system (version 1.0.0) on or 
after October 15, 2025, are intended to be the legally binding 
equivalent of traditional handwritten signatures, pursuant to 
21 CFR Part 11.100(c).

Authorized Representative: _____________________
Title: Chief Executive Officer
Signature: _____________________
Date: _____________________
```

#### §11.200 Electronic Signature Components

**Requirement:**
> "Electronic signatures that are not based upon biometrics shall: (1) Employ at least two distinct identification components such as an identification code and password."

**ERP Authentication Methods:**

**Password-Based (Standard Users):**

```yaml
Two_Factor_Authentication:
  factor_1_knowledge:
    type: "Password"
    requirements:
      - Minimum 12 characters
      - Uppercase + lowercase
      - Numbers + special characters
      - No dictionary words
      - Not previously used (last 12)
    expiration: "90 days"
    
  factor_2_possession:
    type: "Time-based One-Time Password (TOTP)"
    implementation: "Authenticator app"
    alternatives:
      - SMS code (less secure)
      - Email code (emergency only)
      - Hardware token
```

**Biometric (Optional for High-Security Areas):**

```yaml
Biometric_Authentication:
  methods:
    - Fingerprint scanner
    - Facial recognition
    - Retina scan (research facility)
    
  compliance:
    - FDA guidance: "Biometric-based signatures"
    - GDPR compliance (EU data protection)
    - Local consent required
```

#### §11.300 Controls for Identification Codes/Passwords

**§11.300(a) Uniqueness**

**Requirement:**
> "Maintaining the uniqueness of each combined identification code and password, such that no two individuals have the same combination of identification code and password."

**ERP Enforcement:**

```typescript
// Database constraint
CREATE UNIQUE INDEX unique_username ON users(username);

// Application-level check
async function validateUniqueCredentials(username: string): Promise<void> {
  const existing = await User.findOne({ username });
  
  if (existing) {
    throw new ValidationError(
      'Username already exists. Each user must have unique credentials.'
    );
  }
}
```

**§11.300(b) Periodic Change**

**Requirement:**
> "Ensuring that identification code and password issuances are periodically checked, recalled, or revised (e.g., to cover such events as password aging)."

**ERP Password Policy:**

```yaml
Password_Management:
  aging:
    maximum_age: "90 days"
    warning_period: "15 days before expiry"
    grace_period: "7 days after expiry"
    force_change: true
    
  complexity:
    min_length: 12
    require_uppercase: true
    require_lowercase: true
    require_numbers: true
    require_special: true
    
  history:
    prevent_reuse: 12  # Cannot reuse last 12 passwords
    
  lockout:
    failed_attempts: 3
    lockout_duration: 30  # minutes
    
  events:
    password_changed: "Log to audit trail"
    password_expired: "Force change at next login"
    account_locked: "Notify user + IT Security"
```

**§11.300(c) Loss Management**

**Requirement:**
> "Following loss management procedures to electronically deauthorize lost, stolen, missing, or otherwise potentially compromised tokens, cards, and other devices that bear or generate identification code or password information."

**ERP Incident Response:**

```yaml
Lost_Credentials_Procedure:
  step_1_user_reports:
    channels:
      - IT Help Desk
      - Direct manager
      - Security hotline
    response_time: "< 15 minutes"
    
  step_2_immediate_action:
    - Revoke all active sessions
    - Disable account temporarily
    - Generate incident ticket
    - Log to audit trail
    
  step_3_investigation:
    - Review recent activity
    - Check for unauthorized access
    - Assess data exposure risk
    - Document findings
    
  step_4_remediation:
    - Identity re-verification
    - Password reset (forced)
    - MFA re-enrollment
    - Security awareness training
    
  step_5_monitoring:
    - Enhanced logging (30 days)
    - Unusual activity alerts
    - Periodic review
```

**§11.300(d) Use of Transaction Safeguards**

**Requirement:**
> "Use of transaction safeguards to prevent unauthorized use of passwords and/or identification codes, and to detect and report in an immediate and urgent manner any attempts at their unauthorized use to the system security unit, and, as appropriate, to organizational management."

**ERP Security Monitoring:**

```typescript
// Real-time security monitoring
class SecurityMonitor {
  async detectUnauthorizedAccess(event: AuthEvent): Promise<void> {
    const alerts: Alert[] = [];
    
    // Check 1: Unusual time
    if (this.isUnusualTime(event.timestamp, event.userId)) {
      alerts.push({
        type: 'UNUSUAL_TIME',
        severity: 'MEDIUM',
        message: `Login at unusual time: ${event.timestamp}`
      });
    }
    
    // Check 2: Unusual location
    if (await this.isUnusualLocation(event.ipAddress, event.userId)) {
      alerts.push({
        type: 'UNUSUAL_LOCATION',
        severity: 'HIGH',
        message: `Login from new location: ${event.location}`
      });
    }
    
    // Check 3: Multiple failed attempts
    const recentFailures = await this.getRecentFailures(event.userId);
    if (recentFailures >= 3) {
      alerts.push({
        type: 'BRUTE_FORCE',
        severity: 'CRITICAL',
        message: `${recentFailures} failed login attempts`
      });
      
      // §11.300(d) - Immediate reporting
      await this.notifySecurityTeam(alerts);
      await this.lockAccount(event.userId);
    }
    
    // Check 4: Concurrent sessions from different locations
    const activeSessions = await this.getActiveSessions(event.userId);
    if (activeSessions.length > 1) {
      const locations = activeSessions.map(s => s.location);
      if (this.areGeographicallyDistant(locations)) {
        alerts.push({
          type: 'IMPOSSIBLE_TRAVEL',
          severity: 'CRITICAL',
          message: 'Concurrent sessions from distant locations'
        });
        
        await this.notifySecurityTeam(alerts);
        await this.revokeAllSessions(event.userId);
      }
    }
    
    if (alerts.length > 0) {
      await this.logSecurityIncident(event, alerts);
    }
  }
}
```

**Automated Alerts:**

```yaml
Alert_Configuration:
  critical_events:
    - Multiple failed logins (3+)
    - Impossible travel detected
    - After-hours admin access
    - Privilege escalation attempt
    - Bulk data export
    
  notification_channels:
    - Email (immediate)
    - SMS (for critical)
    - Dashboard alert
    - Audit log entry
    
  recipients:
    - IT Security Officer
    - System Administrator
    - User's manager (for user events)
    - Compliance Officer (for GxP events)
```

## 4. ERP Compliance Matrix

### 4.1 Requirement Traceability

| 21 CFR Part 11 Section | Requirement Summary | ERP Implementation | Evidence Location |
|------------------------|--------------------|--------------------|-------------------|
| **§11.10(a)** | System validation | VMP + IQ/OQ/PQ | `/docs/validation/` |
| **§11.10(b)** | Accurate copies | PDF/CSV/JSON reports | Batch reports, audit exports |
| **§11.10(c)** | Record protection | ImmuDB + backups | `/docs/drp_bcp/` |
| **§11.10(d)** | Access control | Keycloak + RBAC | `SOP_AccessControl.md` |
| **§11.10(e)** | Audit trail | Kafka → ImmuDB | `SOP_AuditTrail.md` |
| **§11.10(f)** | Workflow controls | Status transitions | Batch workflow, approval flows |
| **§11.10(g)** | Authority checks | Permission system | RBAC implementation |
| **§11.10(h)** | Device checks | Sensor validation | IoT module, calibration tracking |
| **§11.10(i)** | Personnel training | Training module | `TC-TRAIN-001.md` |
| **§11.10(k)** | Documentation | Git version control | This document, all SOPs |
| **§11.30** | Open systems | TLS, encryption | API security layer |
| **§11.50** | Signature display | E-signature UI | E-signature module |
| **§11.70** | Signature linking | Cryptographic hash | ImmuDB signature records |
| **§11.100** | E-sig requirements | Unique, verified IDs | User management |
| **§11.200** | Two-factor auth | Password + TOTP | Keycloak configuration |
| **§11.300** | Password controls | Policy enforcement | `SOP_AccessControl.md` |

### 4.2 System Architecture Mapping

```yaml
Part_11_Compliance_Architecture:
  frontend:
    - User authentication (§11.10d, §11.200)
    - E-signature UI (§11.50, §11.70)
    - Report generation (§11.10b)
    
  backend:
    - Authorization middleware (§11.10g)
    - Workflow engine (§11.10f)
    - Audit event capture (§11.10e)
    - Session management (§11.300d)
    
  data_layer:
    - ImmuDB (§11.10c, §11.10e)
    - Kafka (§11.10e)
    - PostgreSQL (business data)
    
  infrastructure:
    - Keycloak (§11.10d, §11.200, §11.300)
    - Backup systems (§11.10c)
    - Monitoring & alerting (§11.300d)
```

## 5. Validation Evidence

### 5.1 Test Cases

| Test Case ID | Description | Part 11 Section | Status |
|--------------|-------------|-----------------|--------|
| TC-ES-001 | Electronic signature validation | §11.50, §11.70, §11.100 | ✅ Active |
| TC-TRAIN-001 | Training completion tracking | §11.10(i) | ✅ Active |
| TC-BACKUP-001 | Disaster recovery | §11.10(c) | ✅ Active |
| TC-REPORT-001 | Report generation | §11.10(b) | ✅ Active |

**Reference:** `/docs/validation/TestCases/`

### 5.2 Periodic Review Schedule

```yaml
Compliance_Reviews:
  quarterly:
    - Audit trail integrity check
    - Access control review
    - Password compliance report
    - Security incident review
    
  annually:
    - Full system validation review
    - Part 11 compliance audit
    - Risk assessment update
    - Regulatory guidance review
    
  change_triggered:
    - Major system upgrades
    - Regulatory updates
    - Security incidents
    - Audit findings
```

## 6. Glossary

| Term | Definition |
|------|------------|
| **21 CFR Part 11** | Title 21 Code of Federal Regulations Part 11 - Electronic Records; Electronic Signatures |
| **Closed System** | Environment where system access is controlled by responsible persons |
| **Open System** | Environment where system access is not controlled by responsible persons |
| **Electronic Record** | Any combination of information in digital form created, modified, maintained, archived, retrieved, or distributed by a computer system |
| **Electronic Signature** | Computer data compilation executed by individual to sign electronic record |
| **WORM** | Write Once Read Many - immutable storage |
| **ALCOA+** | Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available |

## 7. Revision History

| Version | Date | Description | Author | Approved By |
|---------|------|-------------|--------|-------------|
| 0.1 | 2025-09-01 | Initial reference document | System | - |
| 1.0 | 2025-10-15 | Comprehensive FDA 21 CFR Part 11 compliance guide with detailed requirements, ERP implementation mapping, validation evidence, and traceability matrix | Compliance Team | Quality Director |

## 8. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Author** | Compliance Officer | _________________ | __________ |
| **Technical Reviewer** | IT Security Officer | _________________ | __________ |
| **Quality Reviewer** | Quality Manager | _________________ | __________ |
| **Final Approver** | General Manager | _________________ | __________ |

---

**Document Control:**

- Document ID: COMP-FDA-001
- Location: /docs/compliance/FDA_21CFR_Part11.md
- Classification: Internal - Restricted
- Next Review Date: 2026-10-15

## 9. References

- **FDA 21 CFR Part 11**: Electronic Records; Electronic Signatures (Final Rule, March 20, 1997)
- **FDA Guidance (2003)**: Part 11, Electronic Records; Electronic Signatures — Scope and Application
- **FDA Data Integrity Guidance (2018)**: Data Integrity and Compliance with cGMP
- **SOP_AccessControl.md**: Access control procedures
- **SOP_AuditTrail.md**: Audit trail management
- **SOP_DeviationManagement.md**: Deviation and CAPA procedures
- **TC-ES-001.md**: Electronic signature test case
- **VMP.md**: Validation Master Plan
