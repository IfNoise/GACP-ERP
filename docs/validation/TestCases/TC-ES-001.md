---
title: "Electronic Signature Validation (FDA 21 CFR Part 11)"
module: "Electronic Signatures & Records"
urs_id: "URS-ES-001"
fs_id: "FS-ES-001"
ds_id: "DS-ES-001"
iq_oq_pq_step: "OQ-ES-001"
version: "1.0"
status: "active"
last_updated: "2025-10-15"
test_priority: "Critical"
regulatory_impact: "Critical - FDA 21 CFR Part 11, EU GMP Annex 11"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: draft
---

# TC-ES-001: Electronic Signature Validation (FDA 21 CFR Part 11)

## 1. Purpose

Валидация функциональности электронной подписи в соответствии с требованиями FDA 21 CFR Part 11, включая:
- Уникальность электронных подписей
- Связь подписи с конкретным действием/документом
- Невозможность повторного использования (non-repudiation)
- Полная audit trail для всех подписей
- Защита от несанкционированного использования

**Regulatory Requirements:**
- FDA 21 CFR Part 11.50 - Signature manifestations
- FDA 21 CFR Part 11.70 - Signature/record linking
- FDA 21 CFR Part 11.100 - General requirements
- FDA 21 CFR Part 11.200 - Electronic signature components
- FDA 21 CFR Part 11.300 - Controls for identification codes/passwords

## 2. Scope

**Тестируемая функциональность:**
- Создание электронной подписи (password-based)
- Multi-factor authentication для критичных операций
- Signature manifestation (отображение подписи)
- Signature-record linking
- Non-repudiation механизмы
- Audit trail для подписей
- Попытки fraud/tampering

## 3. Preconditions

### 3.1 System State
- ✅ GACP-ERP запущена
- ✅ E-Signature модуль активен
- ✅ Audit Consumer записывает события
- ✅ Password policy enforced

### 3.2 Test Data
- **Plant Record**: PLANT-SIG-001 (требует подписи для stage change)
- **Document**: SOP-001 "Germination Procedure" (требует подписи для approval)
- **Batch Release**: BATCH-REL-001 (требует 2 подписи для release)

### 3.3 Users
- **QA Manager**: `qa.manager@gacp-test.com` / `SecurePass123!`
  - Права: `esignature:sign`, `esignature:approve`, `batch:release`
- **Production Manager**: `prod.manager@gacp-test.com` / `SecurePass456!`
  - Права: `esignature:sign`, `plant:modify`, `batch:release`
- **Operator**: `operator@gacp-test.com` / `OperPass789!`
  - Права: `plant:view`, `plant:modify` (без права подписи для критичных операций)

### 3.4 E-Signature Configuration
- ✅ Password complexity требования активны (min 12 chars)
- ✅ Password expiration: 90 days
- ✅ Password reuse prevention: last 5 passwords
- ✅ Account lockout: 3 failed attempts
- ✅ Session timeout: 15 minutes of inactivity

## 4. Test Steps

### Step 1: Вход и навигация к записи

**Action:**
```
1.1. Login as prod.manager@gacp-test.com
1.2. Navigate to Plants module
1.3. Open plant record PLANT-SIG-001
1.4. Verify current stage: "Vegetative"
```

**Expected Result:**
- ✅ Login successful
- ✅ Plant record displayed
- ✅ Current stage: "Vegetative"
- ✅ "Change Stage" button available

---

### Step 2: Попытка критического изменения (Stage Change)

**Action:**
```
2.1. Click "Change Stage"
2.2. Select new stage: "Flowering"
2.3. Add reason: "Plant reached 8-week vegetative period"
2.4. Click "Save Changes"
```

**Expected Result:**
- ✅ E-Signature dialog appears
- ✅ Dialog содержит:
  - Message: "This action requires electronic signature"
  - Action being signed: "Change Plant Stage: Vegetative → Flowering"
  - Reason field (pre-filled)
  - Username field (read-only): prod.manager@gacp-test.com
  - Password field (blank)
  - Warning: "By signing, you certify this action is correct and compliant"
- ✅ "Cancel" and "Sign" buttons available
- ✅ Changes NOT yet applied (pending signature)

---

### Step 3: Cancel signature (negative test)

**Action:**
```
3.1. Click "Cancel" in E-Signature dialog
```

**Expected Result:**
- ✅ Dialog closed
- ✅ Changes NOT applied
- ✅ Plant stage remains: "Vegetative"
- ✅ No audit trail entry for signature
- ✅ UI message: "Action cancelled"

---

### Step 4: Apply E-Signature with incorrect password

**Action:**
```
4.1. Click "Change Stage" again
4.2. Select "Flowering" again
4.3. In E-Signature dialog, enter wrong password: "WrongPass123"
4.4. Click "Sign"
```

**Expected Result:**
- ✅ Error message: "Invalid password"
- ✅ Dialog remains open
- ✅ Password field cleared
- ✅ Changes NOT applied
- ✅ Audit trail records: ESIGNATURE_FAILED event
- ✅ Failed attempt counter incremented (1/3)

---

### Step 5: Apply E-Signature with correct password

**Action:**
```
5.1. Enter correct password: "SecurePass456!"
5.2. Click "Sign"
5.3. Wait for confirmation
```

**Expected Result:**
- ✅ Success message: "Electronic signature applied"
- ✅ Changes applied: Plant stage changed to "Flowering"
- ✅ E-Signature block displayed on plant record:
  ```
  Signed By: Production Manager (prod.manager@gacp-test.com)
  Signed At: 2025-10-15 14:32:15 UTC
  Action: Plant Stage Changed: Vegetative → Flowering
  Reason: Plant reached 8-week vegetative period
  Signature Hash: a3f8b9c...d4e5f6 (SHA-256)
  ```
- ✅ Record marked as "Signed" (lock icon)

---

### Step 6: Verify Audit Trail for E-Signature

**Action:**
```
6.1. Navigate to Audit Trail
6.2. Filter by:
     - Table: plants
     - Record ID: PLANT-SIG-001
     - Event Type: UPDATE, ESIGNATURE_APPLIED
6.3. Review audit entries
```

**Expected Result:**
- ✅ Two audit entries found:
  
  **Entry 1: Plant Update**
  - Operation: UPDATE
  - Table: plants
  - Record ID: PLANT-SIG-001
  - Old Value: stage = "Vegetative"
  - New Value: stage = "Flowering"
  - Changed By: prod.manager@gacp-test.com
  - Changed At: 2025-10-15 14:32:15
  - Session ID: [session_id]
  
  **Entry 2: E-Signature Applied**
  - Operation: ESIGNATURE_APPLIED
  - Document Type: plant_record
  - Document ID: PLANT-SIG-001
  - Signed By: prod.manager@gacp-test.com
  - Signed At: 2025-10-15 14:32:15
  - Action: "Change Plant Stage: Vegetative → Flowering"
  - Reason: "Plant reached 8-week vegetative period"
  - Signature Hash: a3f8b9c...d4e5f6
  - IP Address: [user_ip]

- ✅ Both entries have identical timestamp (linked)
- ✅ Signature hash is unique (non-repudiation)

---

### Step 7: Attempt unauthorized modification (security test)

**Action:**
```
7.1. Logout
7.2. Login as operator@gacp-test.com (lower privileges)
7.3. Open PLANT-SIG-001
7.4. Attempt to change stage to "Harvest Ready"
```

**Expected Result:**
- ✅ "Change Stage" button disabled OR
- ✅ Error message: "Insufficient privileges. Stage changes require QA/Production Manager signature"
- ✅ Cannot modify signed record
- ✅ Audit trail records: UNAUTHORIZED_ATTEMPT

---

### Step 8: Document Approval with E-Signature

**Action:**
```
8.1. Logout and login as qa.manager@gacp-test.com
8.2. Navigate to Documents → SOPs
8.3. Open SOP-001 "Germination Procedure"
8.4. Click "Approve Document"
8.5. In E-Signature dialog:
     - Verify action: "Approve SOP-001 v1.2"
     - Enter password: SecurePass123!
     - Add comment: "Reviewed and approved per GMP requirements"
8.6. Click "Sign"
```

**Expected Result:**
- ✅ Document approved
- ✅ Document status: "Approved"
- ✅ Approval signature displayed:
  ```
  Approved By: QA Manager (qa.manager@gacp-test.com)
  Approved At: 2025-10-15 14:45:30
  Version: 1.2
  Comment: "Reviewed and approved per GMP requirements"
  Signature Hash: f7g8h9i...j0k1l2
  ```
- ✅ Document becomes effective (active)
- ✅ Audit trail записан

---

### Step 9: Dual Signature for Batch Release

**Action:**
```
9.1. Navigate to Batches → BATCH-REL-001
9.2. Click "Release Batch for Distribution"
9.3. System prompts: "This requires 2 signatures: Production Manager + QA Manager"
9.4. As prod.manager (already logged in), provide first signature:
     - Password: SecurePass456!
     - Comment: "Production complete, all parameters within spec"
9.5. Click "Sign (1/2)"
```

**Expected Result:**
- ✅ First signature accepted
- ✅ UI shows: "Awaiting 2nd signature from QA Manager"
- ✅ Batch status: "Pending Release (1/2 signatures)"
- ✅ First signature block visible:
  ```
  1st Signature: Production Manager (prod.manager@gacp-test.com)
  Signed At: 2025-10-15 15:00:10
  Comment: "Production complete, all parameters within spec"
  ```

---

### Step 10: Second Signature for Batch Release

**Action:**
```
10.1. Logout
10.2. Login as qa.manager@gacp-test.com
10.3. Navigate to BATCH-REL-001
10.4. Click "Sign Release (2/2)"
10.5. Review first signature details
10.6. Provide second signature:
      - Password: SecurePass123!
      - Comment: "QC results reviewed, batch released"
10.7. Click "Sign & Release"
```

**Expected Result:**
- ✅ Second signature accepted
- ✅ Batch status: "Released"
- ✅ Both signatures displayed:
  ```
  1st Signature: Production Manager
  Signed At: 2025-10-15 15:00:10
  
  2nd Signature: QA Manager (qa.manager@gacp-test.com)
  Signed At: 2025-10-15 15:05:22
  Comment: "QC results reviewed, batch released"
  ```
- ✅ Batch release date set: 2025-10-15
- ✅ Batch available for distribution
- ✅ Audit trail contains both signatures with linking

---

### Step 11: Signature Hash Verification

**Action:**
```
11.1. Navigate to E-Signatures log
11.2. Select signature for PLANT-SIG-001
11.3. Click "Verify Signature Hash"
11.4. System recalculates hash from:
      - Document ID
      - Action
      - Reason
      - Signed By
      - Signed At timestamp
      - User password hash
11.5. Compare calculated vs stored hash
```

**Expected Result:**
- ✅ Calculated hash MATCHES stored hash
- ✅ Verification status: "✅ Signature Valid"
- ✅ Message: "Signature integrity verified"
- ✅ Timestamp unchanged (confirms non-tampering)

---

### Step 12: Attempt to replay signature (security test)

**Action:**
```
12.1. Capture signature data from PLANT-SIG-001:
      - Signature Hash
      - Timestamp
      - User ID
12.2. Create new plant record PLANT-SIG-002
12.3. Attempt to apply captured signature to new record (API call simulation)
```

**Expected Result:**
- ✅ Replay attack BLOCKED
- ✅ Error: "Signature validation failed - signature hash does not match action"
- ✅ Changes NOT applied
- ✅ Audit trail: SIGNATURE_REPLAY_ATTEMPTED
- ✅ Security alert generated
- ✅ User account flagged for review

---

### Step 13: Password expiration test

**Action:**
```
13.1. Set system date to +91 days (simulate password expiration)
13.2. Login as prod.manager@gacp-test.com
```

**Expected Result:**
- ✅ Login allowed BUT
- ✅ Prompt: "Your password has expired. Please change it now."
- ✅ Cannot proceed without password change
- ✅ Cannot apply e-signatures with expired password
- ✅ After password change, e-signature functionality restored

---

### Step 14: Account lockout after failed attempts

**Action:**
```
14.1. Attempt to sign document with wrong password (3 times):
      - Attempt 1: Wrong password → Failed (1/3)
      - Attempt 2: Wrong password → Failed (2/3)
      - Attempt 3: Wrong password → Failed (3/3)
14.2. Attempt 4: Correct password
```

**Expected Result:**
- ✅ After 3 failed attempts: Account locked
- ✅ Error message: "Account locked due to multiple failed signature attempts. Contact administrator."
- ✅ Even correct password doesn't work
- ✅ Audit trail: ACCOUNT_LOCKED event
- ✅ Email notification sent to user and IT admin
- ✅ Admin must manually unlock account

---

### Step 15: Signature report generation

**Action:**
```
15.1. Navigate to Reports → E-Signature Report
15.2. Generate report for:
      - Date Range: Today
      - Users: All
      - Action Types: All
15.3. Export to PDF
```

**Expected Result:**
- ✅ Report generated with all signatures:
  - Total signatures: [count]
  - By User: breakdown
  - By Action Type: breakdown
  - Failed Attempts: [count]
  - Security Incidents: [count]
- ✅ Each signature entry contains:
  - Timestamp
  - User
  - Action
  - Document/Record
  - Signature Hash
  - Verification Status
- ✅ PDF includes watermark
- ✅ PDF digitally signed by system

## 5. Expected Results (Summary)

### Functional Requirements
- ✅ E-signatures correctly applied to records
- ✅ Signature manifestation displayed properly
- ✅ Multi-signature workflow functions
- ✅ Signature hashes unique and verifiable

### Security Requirements
- ✅ Password protection enforced
- ✅ Account lockout after failed attempts
- ✅ Replay attacks blocked
- ✅ Unauthorized modifications prevented
- ✅ Password expiration enforced

### Compliance Requirements (FDA 21 CFR Part 11)
- ✅ §11.50: Signed records contain signature manifestation
- ✅ §11.70: Signatures linked to records (cannot reuse)
- ✅ §11.100: Cannot repudiate signature
- ✅ §11.200: Signatures uniquely identify signer
- ✅ §11.300: Password controls implemented

### Audit Trail Requirements
- ✅ All signature events logged
- ✅ Failed attempts logged
- ✅ Security incidents logged
- ✅ Audit trail complete and unalterable

## 6. Actual Results

**Test Execution Date:** _________________  
**Tester:** _________________  
**Environment:** _________________

| Step | Status | Comments | Evidence |
|------|--------|----------|----------|
| 1-5 | ☐ Pass ☐ Fail | | |
| 6 | ☐ Pass ☐ Fail | | |
| 7 | ☐ Pass ☐ Fail | | |
| 8 | ☐ Pass ☐ Fail | | |
| 9-10 | ☐ Pass ☐ Fail | | |
| 11 | ☐ Pass ☐ Fail | | |
| 12 | ☐ Pass ☐ Fail | | |
| 13 | ☐ Pass ☐ Fail | | |
| 14 | ☐ Pass ☐ Fail | | |
| 15 | ☐ Pass ☐ Fail | | |

**Overall Test Result:** ☐ PASS ☐ FAIL  
**FDA 21 CFR Part 11 Compliant:** ☐ YES ☐ NO

## 7. Test Evidence

**Required Attachments:**
1. Screenshots для каждого signature dialog
2. Audit trail exports (CSV/PDF)
3. Signature verification reports
4. E-Signature Report (PDF)
5. Security incident logs (if any)

## 8. Cleanup

**Post-Test Actions:**
```
1. Unlock test accounts (if locked)
2. Reset password expiration dates
3. Archive test signatures
4. Clear security alerts
```

## 9. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Author | | | |
| Test Reviewer | | | |
| QA Manager | | | |
| Compliance Officer | | | |

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-09-01 | Initial | Draft version |
| 1.0 | 2025-10-15 | AI Assistant | Complete FDA 21 CFR Part 11 compliant test case |
