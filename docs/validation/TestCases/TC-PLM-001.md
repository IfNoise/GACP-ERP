---
title: "Plant Lifecycle Creation Test"
module: "Plant Lifecycle"
urs_id: "URS-PLM-001"
fs_id: "FS-PLM-001"
ds_id: "DS-PLM-001"
iq_oq_pq_step: "OQ-PLM-001"
version: "1.0"
status: "draft"  # Changed from approved - requires re-verification per AI_Assisted_Documentation_Policy.md
author: "QA Manager"
approved_by: "Validation Manager"
last_updated: "2025-09-15"
review_date: "2025-12-15"
gacp_compliance: "WHO GACP Section 4.2 - Plant Material Management"
cfr_compliance: "21 CFR Part 11 - Electronic Records"
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

## Test Case TC-PLM-001: Plant Lifecycle Creation Test

## 1. Purpose and Scope

### 1.1 Objective

Проверка корректного создания нового растения в системе GACP-ERP с полной валидацией данных, записью в Audit Trail и соответствием регулятивным требованиям WHO GACP.

### 1.2 Regulatory Requirements

- **WHO GACP:** Section 4.2 - Proper documentation of plant material
- **21 CFR Part 11:** Electronic records integrity and e-signature requirements
- **ISO 22716:** Good Manufacturing Practices for cosmetics (applicable sections)

### 1.3 Test Scope

- ✅ Plant creation functionality
- ✅ Data validation and integrity
- ✅ Audit trail generation
- ✅ User permission enforcement
- ✅ GACP compliance verification
- ✅ Electronic signature validation

## 2. Prerequisites and Environment Setup

### 2.1 System Prerequisites

- [x] GACP-ERP система запущена и доступна
- [x] База данных инициализирована с тестовыми данными
- [x] Audit Trail модуль активен
- [x] Electronic signature подсистема работает
- [x] Тестовая среда изолирована от production

### 2.2 User Access Requirements

- **Primary User:** `test_cultivation_manager` with role "Cultivation Manager"
- **Secondary User:** `test_qa_officer` with role "QA Officer" (for verification)
- **Required Permissions:**
  - `plant.create`
  - `plant.view`
  - `audit_trail.view`
  - `electronic_signature.verify`

### 2.3 Test Data Preparation

```json
{
  "test_mother_plant": {
    "id": "MOTHER-001-TEST",
    "strain": "Test Strain Alpha",
    "status": "active",
    "genetics": "Sativa Dominant Hybrid"
  },
  "test_zone": {
    "id": "ZONE-VEG-001",
    "type": "vegetative",
    "environment_controlled": true
  }
}
```

## 3. Detailed Test Steps

### 3.1 Initial System Verification (5 minutes)

1. **Login Verification**

   - Navigate to GACP-ERP login page
   - Enter credentials: `test_cultivation_manager` / `SecurePass123!`
   - Verify successful authentication
   - **Expected:** Dashboard displays with "Cultivation Manager" role indicator

2. **Permission Verification**

   - Check main navigation menu
   - Verify "Plant Lifecycle" module is visible and accessible
   - **Expected:** Plant Lifecycle menu item present with "Create Plant" sub-option

3. **Environment Setup Verification**
   - Navigate to Plant Lifecycle → Plant List
   - Verify no existing plants with test IDs
   - **Expected:** Clean test environment confirmed

### 3.2 Primary Plant Creation Test (15 minutes)

#### Step 3.2.1: Navigate to Plant Creation

1. Click "Plant Lifecycle" in main navigation
2. Select "Create Plant" from dropdown menu
3. **Expected:** Plant creation form loads with all required fields

#### Step 3.2.2: Form Field Validation

1. **Plant ID Field Testing:**

   - Leave Plant ID empty, attempt to save
   - **Expected:** Validation error "Plant ID is required"
   - Enter invalid ID format "123-ABC!"
   - **Expected:** Validation error "Invalid Plant ID format"
   - Enter valid ID: "PLT-2025-TEST-001"
   - **Expected:** Field accepts input, no validation errors

2. **Strain Selection Testing:**

   - Verify strain dropdown populates from system
   - Select "Test Strain Alpha"
   - **Expected:** Strain selected successfully

3. **Mother Plant Association:**

   - Open mother plant selector
   - Search for "MOTHER-001-TEST"
   - Select mother plant
   - **Expected:** Mother plant linked with genetic lineage displayed

4. **Date and Zone Assignment:**
   - Set "Date Planted": Current date (2025-09-15)
   - Select "Growth Zone": ZONE-VEG-001
   - **Expected:** Valid date and zone selected

#### Step 3.2.3: Data Integrity Validation

1. **Required Field Enforcement:**

   - Attempt to save with missing strain
   - **Expected:** Form validation prevents submission
   - **Error Message:** "Please complete all required fields"

2. **Business Logic Validation:**
   - Verify mother plant genetics auto-populate
   - Check calculated estimated harvest date
   - **Expected:** Genetic information inherited correctly

#### Step 3.2.4: Electronic Signature Process

1. Click "Save Plant" button
2. **Expected:** Electronic signature dialog appears
3. Enter e-signature credentials:
   - Username: `test_cultivation_manager`
   - Password: `SecurePass123!`
   - Reason: "Creating new plant for production cycle"
4. **Expected:** Signature accepted, plant created successfully

### 3.3 System Response Verification (10 minutes)

#### Step 3.3.1: Plant Record Verification

1. Navigate back to Plant List
2. Search for "PLT-2025-TEST-001"
3. **Expected Results:**
   - ✅ Plant record appears in list
   - ✅ Status shows "Vegetative"
   - ✅ All entered data matches input
   - ✅ Creation timestamp present
   - ✅ Creator user ID logged

#### Step 3.3.2: Database Integrity Check

1. Query plant record directly (if DB access available):

```sql
SELECT * FROM plants WHERE plant_id = 'PLT-2025-TEST-001';
```

2. **Expected:**
   - Record exists with correct data
   - All foreign key relationships intact
   - Created_at timestamp within last 5 minutes
   - Created_by matches test user ID

### 3.4 Audit Trail Verification (10 minutes)

#### Step 3.4.1: Audit Trail Access

1. Navigate to System → Audit Trail
2. Filter by:
   - **Entity Type:** "Plant"
   - **Entity ID:** "PLT-2025-TEST-001"
   - **Date Range:** Today
3. **Expected:** Audit trail entries displayed

#### Step 3.4.2: Audit Trail Content Validation

1. **Verify Audit Trail Entry:**

   ```json
   {
     "timestamp": "2025-09-15T10:30:45.123Z",
     "user_id": "test_cultivation_manager",
     "action": "CREATE",
     "entity_type": "Plant",
     "entity_id": "PLT-2025-TEST-001",
     "changes": {
       "plant_id": "PLT-2025-TEST-001",
       "strain": "Test Strain Alpha",
       "mother_plant_id": "MOTHER-001-TEST",
       "date_planted": "2025-09-15",
       "growth_zone": "ZONE-VEG-001"
     },
     "electronic_signature": {
       "signed_by": "test_cultivation_manager",
       "signed_at": "2025-09-15T10:30:45.123Z",
       "reason": "Creating new plant for production cycle"
     }
   }
   ```

2. **Immutability Verification:**
   - Attempt to edit audit trail entry (should be impossible)
   - Verify timestamp is in ISO 8601 format
   - **Expected:** Audit trail is read-only and complete

### 3.5 GACP Compliance Verification (5 minutes)

#### Step 3.5.1: Traceability Verification

1. Click on plant record to view details
2. Navigate to "Traceability" tab
3. **Expected:**
   - ✅ Complete genetic lineage visible
   - ✅ Mother plant connection established
   - ✅ Chain of custody documented
   - ✅ All required GACP fields populated

#### Step 3.5.2: Documentation Requirements

1. Verify documentation compliance:
   - Plant ID follows naming convention
   - Source materials properly documented
   - Growth environment recorded
   - Responsible personnel identified
2. **Expected:** 100% compliance with WHO GACP Section 4.2

### 3.6 Error Handling and Edge Cases (10 minutes)

#### Step 3.6.1: Duplicate Plant ID Test

1. Attempt to create another plant with ID "PLT-2025-TEST-001"
2. **Expected:**
   - System prevents duplicate creation
   - Clear error message: "Plant ID already exists"
   - User redirected to existing plant record

#### Step 3.6.2: Invalid Data Handling

1. **Test Invalid Date:**

   - Enter future date beyond allowed range
   - **Expected:** Validation error with acceptable date range

2. **Test Zone Capacity:**
   - If zone has capacity limits, test overflow
   - **Expected:** Appropriate warning or restriction

#### Step 3.6.3: Permission Boundary Testing

1. Log out as cultivation manager
2. Log in as user without plant.create permission
3. Navigate to Plant Creation
4. **Expected:** Access denied with clear message

## 4. Expected Results Summary

### 4.1 Functional Requirements

- ✅ **Plant Creation:** System successfully creates new plant record
- ✅ **Data Validation:** All input validation rules enforced
- ✅ **User Interface:** Intuitive form with clear field labels
- ✅ **Error Handling:** Graceful error messages and recovery

### 4.2 Non-Functional Requirements

- ✅ **Performance:** Plant creation completes within 3 seconds
- ✅ **Security:** Electronic signature required and validated
- ✅ **Audit Trail:** Complete and immutable audit records
- ✅ **Compliance:** Full WHO GACP and 21 CFR Part 11 compliance

### 4.3 Integration Requirements

- ✅ **Database:** Proper data persistence and integrity
- ✅ **Audit System:** Automatic audit trail generation
- ✅ **User Management:** Role-based access control enforced
- ✅ **Traceability:** Complete chain of custody established

## 5. Test Data and Evidence

### 5.1 Test Execution Data

```yaml
test_execution:
  plant_id: "PLT-2025-TEST-001"
  strain: "Test Strain Alpha"
  mother_plant: "MOTHER-001-TEST"
  date_planted: "2025-09-15"
  growth_zone: "ZONE-VEG-001"
  created_by: "test_cultivation_manager"
  creation_timestamp: "2025-09-15T10:30:45.123Z"
  electronic_signature_id: "ESIG-PLM-001-2025091501"
```

### 5.2 Screenshots Required

1. Plant creation form (before submission)
2. Electronic signature dialog
3. Successful creation confirmation
4. Plant record in system
5. Audit trail entry
6. Traceability view

## 6. Pass/Fail Criteria

### 6.1 Pass Criteria

All of the following must be met:

- [ ] Plant record created successfully with all data
- [ ] Electronic signature captured and validated
- [ ] Audit trail entry generated automatically
- [ ] All validation rules enforced correctly
- [ ] GACP compliance requirements met
- [ ] No system errors or exceptions
- [ ] Performance within acceptable limits (< 3 seconds)

### 6.2 Fail Criteria

Any of the following constitutes failure:

- [ ] Plant creation fails unexpectedly
- [ ] Data corruption or loss
- [ ] Audit trail missing or incomplete
- [ ] Electronic signature bypassed
- [ ] Validation rules not enforced
- [ ] GACP compliance gaps
- [ ] System errors or crashes

## 7. Test Execution Results

### 7.1 Actual Results

```plain
Test Executed By: ________________
Date: _________________
Start Time: ___________
End Time: _____________
Duration: _____________

Results:
[ ] PASS [ ] FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

### 7.2 Defects Found

| Defect ID | Severity | Description | Status |
| --------- | -------- | ----------- | ------ |
|           |          |             |        |

### 7.3 Sign-off

```plain
Tester Signature: _________________________ Date: _________
QA Review: ________________________________ Date: _________
Validation Manager Approval: ______________ Date: _________
```

## 8. Related Documentation

- **URS:** URS-PLM-001 - Plant Lifecycle Management Requirements
- **FS:** FS-PLM-001 - Plant Creation Functional Specification
- **DS:** DS-PLM-001 - Plant Database Design Specification
- **SOP:** SOP_PlantLifecycle - Plant Management Standard Operating Procedures
- **Traceability Matrix:** RTM-PLM-001

---

**Document Control:** This test case is under version control and requires formal approval for changes.
