# DS Compliance Mapping Matrix

**Version**: 1.0  
**Date**: 2025-10-16  
**Status**: Draft  
**Purpose**: Трассировка DS структур к регуляторным требованиям

---

## 📋 Матрица Соответствия

### Текущие DS Структуры (v1.0)

| DS ID | Структура | FDA 21 CFR Part 11 | EU GMP Annex 11 | ALCOA+ | Статус |
|-------|-----------|-------------------|-----------------|---------|--------|
| **DS-PLM-001** | Plants | § 11.10(a), (c), (e) | Clause 4, 5, 9 | A,L,O,A | ⚠️ Needs Enhancement |
| **DS-PLM-002** | Plant Events | § 11.10(e) | Clause 9 | A,L,C,O | ✅ Good |
| **DS-PLM-003** | Batches | § 11.10(a), (c) | Clause 4, 5 | A,O,A,C | ⚠️ Needs Enhancement |
| **DS-FIN-001** | Financial Transactions | § 11.10(e) | Clause 9 | A,L,C,O,A | ✅ Good |
| **DS-FIN-002** | General Ledger | § 11.10(c), (e) | Clause 5, 9 | O,C,E | ✅ Good |
| **DS-FIN-003** | Biological Assets | § 11.10(a) | Clause 5 | A,C | ✅ Good |
| **DS-DI-002** | Audit Trail | § 11.10(e) ⭐ | Clause 9 ⭐ | A,L,C,O,E,A | ⚠️ **Needs Enhancement** |
| **DS-ES-001** | Electronic Signatures | § 11.50, 11.70 ⭐ | Clause 9 | A,L,C | ❌ **CRITICAL - Incomplete** |
| **DS-AUTH-001** | Users | § 11.10(d), (g) | Clause 2 | A | ⚠️ Needs Enhancement |
| **DS-AUTH-002** | Roles | § 11.10(d), (g) | Clause 2 | A | ✅ Good |
| **DS-TRAIN-001** | Training Courses | - | Clause 2 | C | ✅ Good |
| **DS-TRAIN-002** | Training Records | - | Clause 2 | A,C,E | ✅ Good |
| **DS-PR-001** | Suppliers | - | Clause 7 | A,C | ⚠️ **Needs Enhancement** |
| **DS-IOT-001** | IoT Sensor Data | § 11.10(a) | Clause 5 | A,L,C | ✅ Good |
| **DS-EQP-001** | Equipment Data | § 11.10(a) | Clause 5 | A,C | ✅ Good |

**Легенда ALCOA+**:

- A = Attributable
- L = Legible
- C = Contemporaneous
- O = Original
- A = Accurate
- C = Complete
- C = Consistent
- E = Enduring
- A = Available

---

### Отсутствующие Критические Структуры

| DS ID | Структура | FDA 21 CFR Part 11 | EU GMP Annex 11 | Приоритет |
|-------|-----------|-------------------|-----------------|-----------|
| **DS-CHG-001** ❌ | Change Requests | § 11.10(k) | **Clause 12** ⭐ | 🔴 P0 |
| **DS-CHG-002** ❌ | Change Approvals | § 11.10(g), (k) | Clause 12 | 🔴 P0 |
| **DS-CHG-003** ❌ | Change History | § 11.10(e), (k) | Clause 12 | 🔴 P0 |
| **DS-DEV-001** ❌ | Deviations | - | **Clause 13** ⭐ | 🔴 P0 |
| **DS-DEV-002** ❌ | Root Cause Analysis | - | Clause 13 | 🔴 P0 |
| **DS-CAPA-001** ❌ | CAPA Records | - | Clause 13 | 🔴 P0 |
| **DS-VAL-001** ❌ | Validation Protocols | **§ 11.10(a)** ⭐ | **Clause 4** ⭐ | 🔴 P0 |
| **DS-VAL-002** ❌ | Validation Test Cases | § 11.10(a) | Clause 4 | 🔴 P0 |
| **DS-VAL-003** ❌ | Periodic Reviews | § 11.10(a) | Clause 4 | 🔴 P0 |
| **DS-DOC-001** ❌ | Controlled Documents | § 11.10(b), (c) | Clause 7 | 🟠 P1 |
| **DS-DOC-002** ❌ | Document Versions | § 11.10(e) | Clause 7 | 🟠 P1 |
| **DS-DOC-003** ❌ | Document Acknowledgements | - | Clause 2, 7 | 🟠 P1 |
| **DS-QE-001** ❌ | Quality Events | - | Clause 13 | 🟠 P1 |
| **DS-DI-004** ❌ | Data Retention Policies | **§ 11.10(c)** ⭐ | Clause 5 | 🔴 P0 |
| **DS-DI-005** ❌ | Archived Records | § 11.10(c) | Clause 5 | 🔴 P0 |
| **DS-WF-004** ❌ | Workflow Definitions | **§ 11.10(f)** ⭐ | Clause 5 | 🔴 P0 |
| **DS-WF-005** ❌ | Workflow Executions | § 11.10(f) | Clause 5 | 🔴 P0 |
| **DS-PR-003** ❌ | Vendor Audits | - | Clause 7 | 🟠 P1 |

⭐ = Критично для compliance

---

## 🔍 FDA 21 CFR Part 11 Coverage

### § 11.10 - Controls for Closed Systems

| Subsection | Requirement | DS Coverage | Status |
|------------|-------------|-------------|--------|
| **(a) Validation** | System validation for accuracy, reliability | ❌ DS-VAL-001/002/003 MISSING | 🔴 CRITICAL |
| **(b) Accurate Copies** | Generate human & electronic readable copies | ⚠️ Partial (no report structures) | 🟠 HIGH |
| **(c) Records Protection** | Protection & retention management | ❌ DS-DI-004/005 MISSING | 🔴 CRITICAL |
| **(d) Access Limitation** | Limit to authorized individuals | ✅ DS-AUTH-001/002 | ✅ GOOD |
| **(e) Audit Trail** | Secure, timestamped audit trail | ⚠️ DS-DI-002 INCOMPLETE | 🟠 HIGH |
| **(f) Operational Checks** | Enforce permitted sequencing | ❌ DS-WF-004/005 MISSING | 🔴 CRITICAL |
| **(g) Authority Checks** | Authority to perform operations | ✅ DS-AUTH-002 (Roles) | ✅ GOOD |
| **(h) Device Checks** | Verify device identity | ⚠️ Partial (mobile devices) | 🟡 MEDIUM |
| **(i) Training** | Personnel training documentation | ✅ DS-TRAIN-001/002 | ✅ GOOD |
| **(j) Documentation Controls** | Written policies & procedures | ❌ DS-DOC-001/002/003 MISSING | 🟠 HIGH |
| **(k) System Documentation** | Documentation of changes | ❌ DS-CHG-001/002/003 MISSING | 🔴 CRITICAL |

### § 11.50 - Signature Manifestations

| Requirement | DS Coverage | Status |
|-------------|-------------|--------|
| Signed record displays: printed name | ⚠️ DS-ES-001 partial | 🟠 HIGH |
| Date & time of signature | ✅ DS-ES-001 `signed_at` | ✅ GOOD |
| **Meaning of signature** (e.g., "review", "approval") | ❌ `meaning` field MISSING | 🔴 **CRITICAL** |

### § 11.70 - Signature/Record Linking

| Requirement | DS Coverage | Status |
|-------------|-------------|--------|
| Signature permanently linked to record | ❌ No `signed_entity_type/id` | 🔴 **CRITICAL** |
| Cannot be excised, copied, or transferred | ⚠️ ImmuDB provides, but no DB field | 🟠 HIGH |
| Hash/cryptographic binding | ❌ `linked_record_hash` MISSING | 🔴 **CRITICAL** |

---

## 🇪🇺 EU GMP Annex 11 Coverage

### Clause-by-Clause Analysis

| Clause | Requirement | DS Coverage | Status |
|--------|-------------|-------------|--------|
| **1. Risk Management** | Risk-based approach to validation | ⚠️ Partial (no risk records) | 🟡 MEDIUM |
| **2. Personnel** | Appropriate qualifications, training | ⚠️ DS-AUTH-001 needs enhancement | 🟠 HIGH |
| **3. Suppliers** | Third-party supplier qualification | ⚠️ DS-PR-001 incomplete | 🟠 HIGH |
| **4. Validation** | Validation through lifecycle | ❌ DS-VAL-001/002/003 MISSING | 🔴 **CRITICAL** |
| **5. Data** | Data integrity, ALCOA+ principles | ⚠️ Partial implementation | 🟠 HIGH |
| **6. Accuracy Checks** | Input/processing checks | ⚠️ Validation schemas exist | 🟡 MEDIUM |
| **7. Data Storage** | Regular backups, secure storage | ✅ DRP/BCP documented | ✅ GOOD |
| **8. Printouts** | Clear, permanent printouts | ⚠️ No report structures | 🟡 MEDIUM |
| **9. Audit Trails** | Record of GxP-relevant changes | ⚠️ DS-DI-002 incomplete | 🟠 HIGH |
| **10. Change Control** | No changes without assessment | ❌ DS-CHG-001/002/003 MISSING | 🔴 **CRITICAL** |
| **11. Periodic Evaluation** | Review system fitness | ❌ DS-VAL-003 MISSING | 🔴 **CRITICAL** |
| **12. Security** | Physical & logical security | ✅ Documented in SOPs | ✅ GOOD |
| **13. Incident Management** | Incidents logged and evaluated | ❌ DS-DEV-001, DS-QE-001 MISSING | 🔴 **CRITICAL** |
| **14. Electronic Signature** | Equivalent to handwritten | ⚠️ DS-ES-001 incomplete | 🟠 HIGH |
| **15. Batch Release** | Compliance verified before release | ⚠️ Workflow needed | 🟠 HIGH |
| **16. Continuity** | Business continuity measures | ✅ DRP/BCP documented | ✅ GOOD |

---

## 📊 Coverage Statistics

### Current State (DS.md v1.0)

```text
FDA 21 CFR Part 11 Coverage:
  § 11.10: 6/11 subsections (55%) ⚠️
  § 11.50: 0/1 requirements (0%) ❌
  § 11.70: 0/1 requirements (0%) ❌
  Overall: 45% ❌

EU GMP Annex 11 Coverage:
  Critical Clauses (4,10,13): 0/3 (0%) ❌
  High-Risk Clauses: 4/8 (50%) ⚠️
  Medium-Risk: 6/8 (75%) ⚠️
  Overall: 55% ⚠️

ALCOA+ Principles:
  Attributable: 80% ✅
  Legible: 90% ✅
  Contemporaneous: 70% ⚠️
  Original: 90% ✅
  Accurate: 75% ⚠️
  Complete: 60% ⚠️
  Consistent: 80% ✅
  Enduring: 50% ❌
  Available: 70% ⚠️
  Overall: 72% ⚠️
```

### Target State (DS.md v2.0)

```text
FDA 21 CFR Part 11 Coverage:
  § 11.10: 11/11 subsections (100%) ✅
  § 11.50: 1/1 requirements (100%) ✅
  § 11.70: 1/1 requirements (100%) ✅
  Overall: 95%+ ✅

EU GMP Annex 11 Coverage:
  Critical Clauses: 3/3 (100%) ✅
  High-Risk Clauses: 8/8 (100%) ✅
  Medium-Risk: 8/8 (100%) ✅
  Overall: 95%+ ✅

ALCOA+ Principles:
  All principles: 90%+ ✅
```

---

## 🎯 Enhancement Requirements

### DS-ES-001 (Electronic Signatures) - CRITICAL

**Current Fields**:

```sql
signature_id, user_id, signed_at, reason, method, 
auth_time, signature_hash, certificate_serial, 
valid, revoked_at, document_hash
```

**Missing Fields (FDA § 11.50 & § 11.70)**:

```sql
meaning                 VARCHAR(100) NOT NULL,  -- § 11.50: "authorship", "review", "approval"
signed_entity_type      VARCHAR(50) NOT NULL,   -- § 11.70: Link to record type
signed_entity_id        UUID NOT NULL,          -- § 11.70: Link to record ID
linked_record_hash      VARCHAR(64) NOT NULL,   -- § 11.70: Permanent binding
witness_signature_id    UUID,                   -- For critical operations
witness_required        BOOLEAN,
manifestation_display   TEXT                    -- § 11.50: Display format
```

---

### DS-DI-002 (Audit Trail) - HIGH

**Current Fields**:

```sql
audit_id, entity_type, entity_id, action, old_value, new_value,
performed_by, performed_at, reason, signature_id, session_id,
correlation_id, source_system, ip_address, user_agent
```

**Missing Fields (FDA § 11.10(e) & EU Annex 11 Clause 9)**:

```sql
-- Periodic Review (EU Annex 11, Clause 11)
review_status           VARCHAR(20),
reviewed_by             UUID,
reviewed_at             TIMESTAMP,
review_notes            TEXT,

-- Validation Lifecycle (FDA § 11.10(a))
validation_status       VARCHAR(20),
validation_date         DATE,

-- Retention Management (FDA § 11.10(c))
retention_category      VARCHAR(50),
retention_expiry        DATE,
archive_status          VARCHAR(20)
```

---

### DS-AUTH-001 (Users) - HIGH

**Current Fields**:

```sql
user_id, username, email, first_name, last_name, employee_id,
department, position, user_type, auditor_certification,
organization, hire_date, termination_date, active, ...
```

**Missing Fields (EU Annex 11, Clause 2)**:

```sql
-- Training Compliance
training_current_status VARCHAR(20),
training_compliance_percent INTEGER,
gxp_training_expiry     DATE,
next_training_due       DATE,

-- Qualification Status
qualification_status    VARCHAR(20),
qualification_date      DATE,
requalification_date    DATE
```

---

### DS-PR-001 (Suppliers) - HIGH

**Current Fields**:

```sql
supplier_id, supplier_name, supplier_code, supplier_type,
legal_entity_name, tax_id, contact_info, payment_terms,
status, qualification_status, quality_rating, ...
```

**Missing Fields (EU Annex 11, Clause 7)**:

```sql
-- GxP Critical Suppliers
gxp_critical            BOOLEAN DEFAULT false,
vendor_qualification_status VARCHAR(20),
quality_agreement_id    UUID,
quality_agreement_expiry DATE,

-- Audit Management
last_audit_date         DATE,
last_audit_result       VARCHAR(20),
next_audit_date         DATE,
audit_frequency         INTERVAL,

-- Performance Tracking
capa_open_count         INTEGER DEFAULT 0,
deviation_count         INTEGER DEFAULT 0
```

---

## ✅ Action Items

### Immediate (Week 1)

- [ ] Create DS-CHG-001, DS-CHG-002, DS-CHG-003 (Change Control)
- [ ] Create DS-DEV-001, DS-DEV-002, DS-CAPA-001 (Deviations)
- [ ] Create DS-VAL-001, DS-VAL-002, DS-VAL-003 (Validation)
- [ ] Enhance DS-ES-001 with FDA § 11.50/11.70 fields
- [ ] Enhance DS-DI-002 with retention and review fields

### Week 2

- [ ] Create DS-DI-004, DS-DI-005 (Retention Management)
- [ ] Create DS-WF-004, DS-WF-005 (Workflow Management)
- [ ] Enhance DS-AUTH-001 with training/qualification fields
- [ ] Enhance DS-PR-001 with vendor qualification fields

### Week 3-4

- [ ] Create DS-DOC-001, DS-DOC-002, DS-DOC-003 (Document Control)
- [ ] Create DS-QE-001 (Quality Events)
- [ ] Create DS-PR-003 (Vendor Audits)
- [ ] Finalize all compliance mappings

---

**Document Status**: Draft  
**Next Review**: After DS.md v2.0 completion  
**Approver**: QA Lead  
**Last Updated**: 2025-10-16
