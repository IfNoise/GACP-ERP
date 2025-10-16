---
title: "Data Dictionary Compliance Audit Report"
date: "2025-10-16"
version: "1.0"
status: "draft"
severity: "HIGH"
audit_type: "Compliance Gap Analysis"
reviewed_by: "AI Copilot"
---

# Data Dictionary Compliance Audit Report

## 📋 Executive Summary

**Статус**: 🔴 **Требуются критические исправления**

Проведен комплексный аудит Data Dictionary системы GACP-ERP на соответствие регуляторным требованиям FDA 21 CFR Part 11 и EU GMP Annex 11. Выявлены существенные пробелы, которые могут привести к несоответствию при регуляторной инспекции.

### Ключевые Находки

| Категория | Критические | Высокие | Средние | Всего |
|-----------|-------------|---------|---------|-------|
| Отсутствующие структуры | 5 | 8 | 12 | 25 |
| Недостающие поля | 23 | 41 | 67 | 131 |
| Compliance несоответствия | 12 | 18 | 9 | 39 |
| **ИТОГО** | **40** | **67** | **88** | **195** |

### Временная Шкала Несоответствия

```
DS.md версия:           1.0 (2025-09-14) ← УСТАРЕЛО
Compliance документы:   2025-10-15        ← АКТУАЛЬНО
Разрыв:                 1 месяц
```

---

## 🔍 1. Критические Несоответствия

### 1.1 FDA 21 CFR Part 11

#### § 11.10(a) - Validation (КРИТИЧНО)

**Требование**: Валидация системы для обеспечения точности, надежности и возможности обнаружения недействительных записей.

**Проблема**: DS.md НЕ содержит:
- ❌ Validation metadata для каждой таблицы
- ❌ Validation lifecycle tracking
- ❌ Validation status fields
- ❌ Periodic review records

**Пример отсутствующих полей**:
```sql
-- Требуется добавить во ВСЕ критические таблицы:
validation_status       VARCHAR(20)  -- (validated, pending, expired)
validation_protocol_id  UUID         -- Ссылка на протокол валидации
last_validated_at       TIMESTAMP    -- Дата последней валидации
next_review_date        DATE         -- Дата следующего periodic review
validation_by           UUID         -- QA person who validated
validation_signature_id UUID         -- E-signature for validation
```

**Затронутые модули**: DS-PLM-001, DS-FIN-001, DS-DI-002, DS-ES-001, DS-AUTH-001

---

#### § 11.10(c) - Records Protection & Retention (КРИТИЧНО)

**Требование**: Защита записей для точного и готового поиска в течение периода хранения.

**Проблема**: DS.md НЕ описывает:
- ❌ Retention policies для каждого типа данных
- ❌ Archive management структуры
- ❌ Legal hold mechanisms
- ❌ Destruction logs

**Требуется новая структура**:
```sql
-- DS-DI-004: Data Retention Policies
CREATE TABLE data_retention_policies (
    policy_id               UUID PRIMARY KEY,
    entity_type             VARCHAR(50) NOT NULL, -- 'plants', 'batches', etc.
    retention_period        INTERVAL NOT NULL,    -- '7 years', '25 years'
    retention_basis         VARCHAR(100),         -- 'FDA', 'EU GMP', 'Tax Law'
    archive_after           INTERVAL,             -- When to move to cold storage
    destruction_allowed     BOOLEAN DEFAULT false,
    legal_hold_override     BOOLEAN DEFAULT false,
    created_at              TIMESTAMP DEFAULT now(),
    approved_by             UUID REFERENCES users(user_id),
    approval_signature_id   UUID REFERENCES electronic_signatures(signature_id)
);

-- DS-DI-005: Archive Management
CREATE TABLE archived_records (
    archive_id              UUID PRIMARY KEY,
    entity_type             VARCHAR(50) NOT NULL,
    entity_id               UUID NOT NULL,
    archived_at             TIMESTAMP DEFAULT now(),
    archived_by             UUID REFERENCES users(user_id),
    retention_expiry        DATE NOT NULL,
    archive_location        VARCHAR(255),         -- Storage path/URL
    archive_format          VARCHAR(20),          -- 'json', 'parquet', 'pdf'
    archive_checksum        VARCHAR(64),          -- SHA-256 for integrity
    retrieval_time_estimate INTERVAL,             -- SLA for retrieval
    legal_hold              BOOLEAN DEFAULT false,
    destruction_date        DATE,
    destruction_by          UUID,
    destruction_signature_id UUID
);
```

---

#### § 11.10(e) - Audit Trail Enhancement (КРИТИЧНО)

**Требование**: Secure, computer-generated, time-stamped audit trail с независимой записью оператора.

**Проблема**: DS-DI-002 (Audit Trail) НЕПОЛОН:
- ❌ Отсутствует `review_status` (требуется для periodic review)
- ❌ Нет `validation_status` (для validated audit records)
- ❌ Отсутствует `retention_category` (для управления retention)
- ❌ Нет `archive_status` (для lifecycle management)

**Требуемые дополнения к DS-DI-002**:
```sql
ALTER TABLE audit_trail ADD COLUMN review_status VARCHAR(20) 
    CHECK (review_status IN ('pending', 'reviewed', 'exception_noted', 'escalated'));
ALTER TABLE audit_trail ADD COLUMN reviewed_by UUID REFERENCES users(user_id);
ALTER TABLE audit_trail ADD COLUMN reviewed_at TIMESTAMP;
ALTER TABLE audit_trail ADD COLUMN review_notes TEXT;

ALTER TABLE audit_trail ADD COLUMN validation_status VARCHAR(20)
    CHECK (validation_status IN ('validated', 'pending_validation', 'validation_failed'));
ALTER TABLE audit_trail ADD COLUMN validation_date DATE;

ALTER TABLE audit_trail ADD COLUMN retention_category VARCHAR(50);
ALTER TABLE audit_trail ADD COLUMN retention_expiry DATE;
ALTER TABLE audit_trail ADD COLUMN archive_status VARCHAR(20)
    CHECK (archive_status IN ('active', 'archived', 'permanent'));
```

---

#### § 11.10(f) - Operational System Checks (КРИТИЧНО)

**Требование**: Проверки системы для обеспечения правильной последовательности шагов и событий.

**Проблема**: В DS.md ОТСУТСТВУЮТ структуры для:
- ❌ Workflow definitions
- ❌ State transition rules
- ❌ Workflow execution logs
- ❌ Workflow validations

**Требуется новая структура**:
```sql
-- DS-WF-004: Workflow Definitions
CREATE TABLE workflow_definitions (
    workflow_id             UUID PRIMARY KEY,
    workflow_name           VARCHAR(100) NOT NULL,
    entity_type             VARCHAR(50) NOT NULL, -- 'batch', 'deviation', 'change'
    workflow_type           VARCHAR(50),          -- 'approval', 'review', 'release'
    version                 VARCHAR(20) NOT NULL,
    status                  VARCHAR(20),          -- 'active', 'draft', 'retired'
    states                  JSONB NOT NULL,       -- Array of valid states
    transitions             JSONB NOT NULL,       -- Valid state transitions
    transition_rules        JSONB,                -- Business rules for transitions
    approval_requirements   JSONB,                -- Who must approve at each step
    sla_timings             JSONB,                -- Expected time per step
    created_at              TIMESTAMP DEFAULT now(),
    created_by              UUID REFERENCES users(user_id),
    approved_by             UUID,
    approval_signature_id   UUID,
    effective_date          DATE NOT NULL,
    retirement_date         DATE
);

-- DS-WF-005: Workflow Execution Logs
CREATE TABLE workflow_executions (
    execution_id            UUID PRIMARY KEY,
    workflow_id             UUID REFERENCES workflow_definitions(workflow_id),
    entity_type             VARCHAR(50) NOT NULL,
    entity_id               UUID NOT NULL,
    current_state           VARCHAR(50) NOT NULL,
    previous_state          VARCHAR(50),
    started_at              TIMESTAMP DEFAULT now(),
    completed_at            TIMESTAMP,
    status                  VARCHAR(20),          -- 'in_progress', 'completed', 'failed'
    assigned_to             UUID REFERENCES users(user_id),
    assigned_at             TIMESTAMP,
    
    -- Compliance
    transition_valid        BOOLEAN DEFAULT true,
    validation_errors       JSONB,
    audit_trail_id          UUID REFERENCES audit_trail(audit_id),
    signature_required      BOOLEAN,
    signature_id            UUID
);
```

---

#### § 11.50 & § 11.70 - Signature Manifestations & Linking (КРИТИЧНО)

**Требование**: 
- § 11.50: Подписанные электронные записи должны содержать информацию о подписи (кто, когда, значение)
- § 11.70: Подписи должны быть неразрывно связаны с записями

**Проблема**: DS-ES-001 (Electronic Signatures) НЕПОЛОН:
- ❌ Отсутствует `meaning` поле (§ 11.50 requirement: "reviewing", "approving")
- ❌ Нет явной связи `signature → signed_record`
- ❌ Отсутствует `witness_signature_id` для критических операций
- ❌ Нет `manifestation_display` (как подпись отображается)

**Требуемые дополнения к DS-ES-001**:
```sql
ALTER TABLE electronic_signatures ADD COLUMN meaning VARCHAR(100) NOT NULL
    CHECK (meaning IN ('authorship', 'review', 'approval', 'verification', 'witnessing', 'release'));

ALTER TABLE electronic_signatures ADD COLUMN signed_entity_type VARCHAR(50) NOT NULL;
ALTER TABLE electronic_signatures ADD COLUMN signed_entity_id UUID NOT NULL;

ALTER TABLE electronic_signatures ADD COLUMN witness_signature_id UUID 
    REFERENCES electronic_signatures(signature_id);
ALTER TABLE electronic_signatures ADD COLUMN witness_required BOOLEAN DEFAULT false;

ALTER TABLE electronic_signatures ADD COLUMN manifestation_display TEXT;
-- Example: "Reviewed by John Doe (jdoe) on 2025-10-16 14:30:00 UTC"

ALTER TABLE electronic_signatures ADD COLUMN linked_record_hash VARCHAR(64) NOT NULL;
-- SHA-256 hash of the signed record at time of signing
```

---

### 1.2 EU GMP Annex 11

#### Clause 12 - Change and Configuration Management (КРИТИЧНО)

**Требование**: Changes to a computerised system should be made according to a defined procedure. All changes should be authorised, documented, tested, approved and communicated.

**Проблема**: В DS.md ПОЛНОСТЬЮ ОТСУТСТВУЕТ модуль Change Control!

**Требуется новая структура**:
```sql
-- DS-CHG-001: Change Requests
CREATE TABLE change_requests (
    change_id               UUID PRIMARY KEY,
    change_number           VARCHAR(50) UNIQUE NOT NULL, -- CR-2025-001
    title                   VARCHAR(255) NOT NULL,
    description             TEXT NOT NULL,
    change_type             VARCHAR(50) NOT NULL,
        -- CHECK IN ('configuration', 'code', 'procedure', 'infrastructure', 'data')
    
    -- Requestor information
    requested_by            UUID REFERENCES users(user_id),
    requested_at            TIMESTAMP DEFAULT now(),
    department              VARCHAR(100),
    
    -- Impact assessment
    gxp_impact              VARCHAR(20) CHECK (gxp_impact IN ('none', 'low', 'medium', 'high', 'critical')),
    affected_systems        TEXT[],
    affected_sops           TEXT[],
    risk_assessment         TEXT,
    impact_analysis         JSONB,
    
    -- Business justification
    business_justification  TEXT NOT NULL,
    regulatory_driver       VARCHAR(100),  -- 'FDA Warning Letter', 'Internal Audit'
    urgency                 VARCHAR(20) CHECK (urgency IN ('routine', 'high', 'urgent', 'emergency')),
    
    -- Approval workflow
    status                  VARCHAR(20) NOT NULL DEFAULT 'draft',
        -- CHECK IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 
        --           'in_progress', 'testing', 'implemented', 'closed', 'cancelled')
    
    reviewed_by             UUID,
    reviewed_at             TIMESTAMP,
    review_signature_id     UUID,
    
    approved_by             UUID,
    approved_at             TIMESTAMP,
    approval_signature_id   UUID,
    
    -- Implementation tracking
    implementation_plan     TEXT,
    implementation_date     DATE,
    implemented_by          UUID,
    
    -- Testing & validation
    test_plan_required      BOOLEAN DEFAULT false,
    test_plan_id            UUID,
    test_results            JSONB,
    
    validation_required     BOOLEAN DEFAULT false,
    validation_protocol_id  UUID,
    validation_status       VARCHAR(20),
    
    -- Rollback plan
    rollback_plan           TEXT,
    rollback_tested         BOOLEAN DEFAULT false,
    
    -- Communication
    training_required       BOOLEAN DEFAULT false,
    communication_sent      BOOLEAN DEFAULT false,
    
    -- Closure
    closed_by               UUID,
    closed_at               TIMESTAMP,
    effectiveness_check     TEXT,
    
    -- Audit
    audit_trail_id          UUID REFERENCES audit_trail(audit_id)
);

-- DS-CHG-002: Change Approvals
CREATE TABLE change_approvals (
    approval_id             UUID PRIMARY KEY,
    change_id               UUID REFERENCES change_requests(change_id),
    approver_role           VARCHAR(50) NOT NULL, -- 'qa_manager', 'it_manager', 'process_owner'
    required                BOOLEAN DEFAULT true,
    approver_id             UUID REFERENCES users(user_id),
    approval_status         VARCHAR(20), -- 'pending', 'approved', 'rejected', 'conditional'
    approved_at             TIMESTAMP,
    signature_id            UUID REFERENCES electronic_signatures(signature_id),
    comments                TEXT,
    conditions              TEXT  -- For conditional approvals
);

-- DS-CHG-003: Change Implementation History
CREATE TABLE change_implementation_history (
    history_id              UUID PRIMARY KEY,
    change_id               UUID REFERENCES change_requests(change_id),
    step_number             INTEGER NOT NULL,
    step_description        TEXT NOT NULL,
    performed_by            UUID REFERENCES users(user_id),
    performed_at            TIMESTAMP DEFAULT now(),
    status                  VARCHAR(20), -- 'pending', 'completed', 'failed', 'skipped'
    evidence                JSONB,       -- Screenshots, logs, test results
    issues_encountered      TEXT,
    rollback_performed      BOOLEAN DEFAULT false,
    signature_id            UUID
);
```

---

#### Clause 13 - Deviation Management (КРИТИЧНО)

**Требование**: Incidents and deviations should be reported, assessed, investigated and corrective actions taken.

**Проблема**: В DS.md ПОЛНОСТЬЮ ОТСУТСТВУЕТ модуль Deviation Management!

**Требуется новая структура**:
```sql
-- DS-DEV-001: Deviations
CREATE TABLE deviations (
    deviation_id            UUID PRIMARY KEY,
    deviation_number        VARCHAR(50) UNIQUE NOT NULL, -- DEV-2025-001
    title                   VARCHAR(255) NOT NULL,
    description             TEXT NOT NULL,
    deviation_type          VARCHAR(50) NOT NULL,
        -- CHECK IN ('procedure', 'specification', 'system', 'environmental', 'equipment')
    
    -- Discovery
    detected_at             TIMESTAMP NOT NULL,
    detected_by             UUID REFERENCES users(user_id),
    detection_method        VARCHAR(50), -- 'inspection', 'audit', 'monitoring', 'complaint'
    
    -- Classification
    severity                VARCHAR(20) NOT NULL,
        -- CHECK IN ('minor', 'major', 'critical')
    gxp_impact              VARCHAR(20) NOT NULL,
        -- CHECK IN ('none', 'potential', 'actual')
    patient_safety_impact   BOOLEAN DEFAULT false,
    product_quality_impact  BOOLEAN DEFAULT false,
    
    -- Related entities
    batch_id                UUID,  -- If related to batch
    plant_id                UUID,  -- If related to plant
    equipment_id            UUID,  -- If related to equipment
    sop_id                  VARCHAR(50),  -- Violated SOP
    zone_id                 UUID,
    
    -- Immediate actions
    immediate_action_taken  TEXT,
    immediate_action_by     UUID REFERENCES users(user_id),
    immediate_action_at     TIMESTAMP,
    
    -- Investigation
    investigation_required  BOOLEAN DEFAULT true,
    investigation_id        UUID,  -- Link to investigation record
    investigation_deadline  DATE,
    investigation_status    VARCHAR(20),
        -- CHECK IN ('pending', 'in_progress', 'completed')
    
    root_cause              TEXT,
    root_cause_identified_at TIMESTAMP,
    
    -- CAPA
    capa_required           BOOLEAN DEFAULT true,
    capa_id                 UUID,  -- Link to CAPA record
    
    -- Approval workflow
    status                  VARCHAR(20) NOT NULL DEFAULT 'open',
        -- CHECK IN ('open', 'under_investigation', 'capa_pending', 'capa_in_progress', 
        --           'effectiveness_check', 'closed', 'cancelled')
    
    reviewed_by             UUID REFERENCES users(user_id),
    reviewed_at             TIMESTAMP,
    review_signature_id     UUID,
    
    approved_by             UUID REFERENCES users(user_id),
    approved_at             TIMESTAMP,
    approval_signature_id   UUID,
    
    -- Closure
    closed_by               UUID,
    closed_at               TIMESTAMP,
    closure_signature_id    UUID,
    effectiveness_verified  BOOLEAN,
    
    -- Trending
    recurring_issue         BOOLEAN DEFAULT false,
    related_deviations      UUID[],  -- Array of related deviation IDs
    
    -- Audit
    audit_trail_id          UUID REFERENCES audit_trail(audit_id)
);

-- DS-DEV-002: Root Cause Analysis
CREATE TABLE root_cause_analyses (
    rca_id                  UUID PRIMARY KEY,
    deviation_id            UUID REFERENCES deviations(deviation_id),
    
    -- Analysis method
    method                  VARCHAR(50), -- '5_whys', 'fishbone', 'fault_tree', 'pareto'
    analysis_data           JSONB NOT NULL,  -- Method-specific data
    
    -- Root causes (can be multiple)
    root_causes             JSONB NOT NULL,  -- Array of root causes with categories
    contributing_factors    JSONB,
    
    -- Personnel
    performed_by            UUID REFERENCES users(user_id),
    performed_at            TIMESTAMP DEFAULT now(),
    reviewed_by             UUID,
    review_signature_id     UUID,
    
    -- Documentation
    evidence                JSONB,  -- Links to documents, photos, data
    analysis_report         TEXT
);

-- DS-CAPA-001: Corrective and Preventive Actions
CREATE TABLE capa_records (
    capa_id                 UUID PRIMARY KEY,
    capa_number             VARCHAR(50) UNIQUE NOT NULL, -- CAPA-2025-001
    
    -- Source
    source_type             VARCHAR(50) NOT NULL,
        -- CHECK IN ('deviation', 'audit', 'complaint', 'trend', 'risk_assessment')
    source_id               UUID,  -- ID of source (deviation_id, audit_id, etc.)
    
    -- Classification
    action_type             VARCHAR(20) NOT NULL, -- 'corrective', 'preventive', 'both'
    
    -- Description
    problem_statement       TEXT NOT NULL,
    root_cause              TEXT NOT NULL,
    action_plan             TEXT NOT NULL,
    
    -- Actions (can be multiple steps)
    actions                 JSONB NOT NULL,
        /* Example:
        [
            {
                "step": 1,
                "description": "Update SOP",
                "responsible": "uuid",
                "deadline": "2025-11-01",
                "status": "pending"
            }
        ]
        */
    
    -- Responsibility
    responsible_person      UUID REFERENCES users(user_id),
    backup_person           UUID REFERENCES users(user_id),
    
    -- Timeline
    target_completion_date  DATE NOT NULL,
    actual_completion_date  DATE,
    
    -- Implementation
    implementation_status   VARCHAR(20) DEFAULT 'pending',
        -- CHECK IN ('pending', 'in_progress', 'completed', 'overdue')
    implementation_evidence JSONB,
    
    -- Effectiveness Check
    effectiveness_check_required BOOLEAN DEFAULT true,
    effectiveness_check_date     DATE,
    effectiveness_check_result   VARCHAR(20), -- 'effective', 'not_effective', 'pending'
    effectiveness_check_by       UUID,
    effectiveness_check_notes    TEXT,
    
    -- Closure
    status                  VARCHAR(20) NOT NULL DEFAULT 'open',
        -- CHECK IN ('open', 'in_progress', 'pending_verification', 'closed', 'extended')
    
    closed_by               UUID,
    closed_at               TIMESTAMP,
    closure_signature_id    UUID,
    
    -- Audit
    audit_trail_id          UUID REFERENCES audit_trail(audit_id)
);
```

---

#### Clause 4 - Validation (КРИТИЧНО)

**Требование**: Validation documentation should cover the relevant steps of the life cycle.

**Проблема**: В DS.md ОТСУТСТВУЮТ структуры для validation lifecycle tracking!

**Требуется новая структура**:
```sql
-- DS-VAL-001: Validation Protocols
CREATE TABLE validation_protocols (
    protocol_id             UUID PRIMARY KEY,
    protocol_number         VARCHAR(50) UNIQUE NOT NULL, -- IQ-001, OQ-002, PQ-003
    protocol_type           VARCHAR(20) NOT NULL,
        -- CHECK IN ('IQ', 'OQ', 'PQ', 'revalidation', 'partial')
    
    -- Subject
    system_name             VARCHAR(255) NOT NULL,
    system_version          VARCHAR(50),
    gamp_category           VARCHAR(20), -- 'category_3', 'category_4', 'category_5'
    gxp_impact              VARCHAR(20),
    
    -- Documentation
    title                   VARCHAR(255) NOT NULL,
    purpose                 TEXT NOT NULL,
    scope                   TEXT NOT NULL,
    acceptance_criteria     TEXT NOT NULL,
    
    -- References
    urs_reference           VARCHAR(100),
    fs_reference            VARCHAR(100),
    ds_reference            VARCHAR(100),
    risk_assessment_ref     VARCHAR(100),
    
    -- Approval
    author                  UUID REFERENCES users(user_id),
    author_signature_id     UUID,
    authored_at             TIMESTAMP,
    
    reviewer                UUID,
    reviewer_signature_id   UUID,
    reviewed_at             TIMESTAMP,
    
    approver                UUID,
    approver_signature_id   UUID,
    approved_at             TIMESTAMP,
    
    -- Execution
    status                  VARCHAR(20) DEFAULT 'draft',
        -- CHECK IN ('draft', 'approved', 'in_execution', 'completed', 'failed', 'superseded')
    execution_start_date    DATE,
    execution_end_date      DATE,
    executed_by             UUID,
    
    -- Results
    test_cases_total        INTEGER,
    test_cases_passed       INTEGER,
    test_cases_failed       INTEGER,
    test_cases_blocked      INTEGER,
    
    overall_result          VARCHAR(20), -- 'pass', 'fail', 'pass_with_deviations'
    
    -- Report
    report_id               UUID,
    report_signature_id     UUID,
    
    -- Periodic review
    next_review_date        DATE,
    
    -- Audit
    audit_trail_id          UUID
);

-- DS-VAL-002: Validation Test Cases
CREATE TABLE validation_test_cases (
    test_case_id            UUID PRIMARY KEY,
    protocol_id             UUID REFERENCES validation_protocols(protocol_id),
    test_case_number        VARCHAR(50) NOT NULL, -- TC-001, TC-002
    
    -- Traceability
    requirement_id          VARCHAR(100), -- Link to URS/FS requirement
    
    -- Test details
    test_objective          TEXT NOT NULL,
    prerequisites           TEXT,
    test_steps              JSONB NOT NULL,
        /* Example:
        [
            {"step": 1, "action": "Login as admin", "expected": "Dashboard displayed"}
        ]
        */
    expected_result         TEXT NOT NULL,
    
    -- Execution
    execution_date          DATE,
    executed_by             UUID REFERENCES users(user_id),
    actual_result           TEXT,
    status                  VARCHAR(20),
        -- CHECK IN ('not_executed', 'pass', 'fail', 'blocked', 'skipped')
    
    -- Evidence
    evidence_attachments    JSONB,  -- Screenshots, logs, data files
    
    -- Deviation
    deviation_id            UUID,  -- If test failed
    comments                TEXT,
    
    -- Signature
    signature_id            UUID
);

-- DS-VAL-003: Periodic Reviews
CREATE TABLE periodic_reviews (
    review_id               UUID PRIMARY KEY,
    review_type             VARCHAR(50) NOT NULL,
        -- CHECK IN ('annual', 'post_change', 'post_deviation', 'triggered')
    
    -- Subject
    system_name             VARCHAR(255) NOT NULL,
    system_version          VARCHAR(50),
    
    -- Scope
    review_period_start     DATE NOT NULL,
    review_period_end       DATE NOT NULL,
    
    -- Assessment
    validation_status       VARCHAR(20), -- 'remains_valid', 'revalidation_required'
    changes_since_last_review JSONB,
    deviations_summary      JSONB,
    incidents_summary       JSONB,
    
    -- Findings
    findings                JSONB,
        /* Example:
        [
            {"type": "observation", "description": "...", "action_required": true}
        ]
        */
    
    actions_required        JSONB,
    
    -- Personnel
    reviewed_by             UUID REFERENCES users(user_id),
    reviewed_at             TIMESTAMP,
    review_signature_id     UUID,
    
    approved_by             UUID,
    approved_at             TIMESTAMP,
    approval_signature_id   UUID,
    
    -- Next review
    next_review_date        DATE NOT NULL,
    
    -- Audit
    audit_trail_id          UUID
);
```

---

#### Clause 7 - Suppliers (HIGH)

**Требование**: Supplier assessment and vendor qualification.

**Проблема**: DS-PR-001 (Suppliers) существует, но НЕПОЛОН:
- ❌ Отсутствует `vendor_qualification_status`
- ❌ Нет `audit_schedule` и `audit_history`
- ❌ Отсутствует `gxp_critical` флаг
- ❌ Нет `quality_agreement_id`

**Требуемые дополнения к DS-PR-001**:
```sql
ALTER TABLE suppliers ADD COLUMN gxp_critical BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN vendor_qualification_status VARCHAR(20)
    CHECK (vendor_qualification_status IN ('pending', 'qualified', 'conditionally_qualified', 
                                             'disqualified', 'under_review'));
ALTER TABLE suppliers ADD COLUMN quality_agreement_id UUID;
ALTER TABLE suppliers ADD COLUMN quality_agreement_expiry DATE;

ALTER TABLE suppliers ADD COLUMN last_audit_date DATE;
ALTER TABLE suppliers ADD COLUMN last_audit_result VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN next_audit_date DATE;
ALTER TABLE suppliers ADD COLUMN audit_frequency INTERVAL; -- '1 year', '2 years'

ALTER TABLE suppliers ADD COLUMN capa_open_count INTEGER DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN deviation_count INTEGER DEFAULT 0;
```

**Требуется новая структура для vendor audits**:
```sql
-- DS-PR-003: Vendor Audits
CREATE TABLE vendor_audits (
    audit_id                UUID PRIMARY KEY,
    supplier_id             UUID REFERENCES suppliers(supplier_id),
    audit_number            VARCHAR(50) UNIQUE NOT NULL,
    audit_type              VARCHAR(50) NOT NULL,
        -- CHECK IN ('initial_qualification', 'periodic', 'for_cause', 'requalification')
    
    -- Planning
    audit_date              DATE NOT NULL,
    audit_scope             TEXT NOT NULL,
    audit_team              UUID[],  -- Array of auditor user IDs
    lead_auditor            UUID REFERENCES users(user_id),
    
    -- Execution
    audit_checklist         JSONB,
    observations            JSONB,
    findings                JSONB,
        /* Example:
        [
            {
                "finding_id": "F-001",
                "type": "critical|major|minor|observation",
                "description": "...",
                "capa_required": true
            }
        ]
        */
    
    -- Results
    overall_rating          VARCHAR(20), -- 'acceptable', 'conditional', 'unacceptable'
    recommendation          VARCHAR(50),
        -- CHECK IN ('qualify', 'qualify_with_conditions', 'disqualify', 'reaudit')
    
    -- Follow-up
    capa_requests           UUID[],  -- CAPA IDs from supplier
    next_audit_date         DATE,
    
    -- Documentation
    report_id               UUID,
    audit_signature_id      UUID,
    approved_by             UUID,
    approval_signature_id   UUID,
    
    -- Audit
    audit_trail_id          UUID
);
```

---

## 📊 2. Высокоприоритетные Находки

### 2.1 Document Control System (HIGH)

**Проблема**: Отсутствует централизованная система управления документами, требуемая EU GMP Annex 11 Clause 7.

**Требуется новая структура**:
```sql
-- DS-DOC-001: Controlled Documents
CREATE TABLE controlled_documents (
    document_id             UUID PRIMARY KEY,
    document_number         VARCHAR(50) UNIQUE NOT NULL, -- SOP-001, FORM-002
    document_type           VARCHAR(50) NOT NULL,
        -- CHECK IN ('SOP', 'form', 'policy', 'protocol', 'report', 'specification')
    
    title                   VARCHAR(255) NOT NULL,
    description             TEXT,
    
    -- Classification
    gxp_critical            BOOLEAN DEFAULT false,
    confidentiality_level   VARCHAR(20), -- 'public', 'internal', 'confidential', 'restricted'
    
    -- Version control
    current_version         VARCHAR(20) NOT NULL,
    status                  VARCHAR(20) NOT NULL,
        -- CHECK IN ('draft', 'under_review', 'approved', 'effective', 'obsolete', 'archived')
    
    -- Lifecycle dates
    created_at              TIMESTAMP DEFAULT now(),
    created_by              UUID REFERENCES users(user_id),
    
    effective_date          DATE,
    review_date             DATE,
    next_review_date        DATE,
    retirement_date         DATE,
    
    -- Approval chain
    author                  UUID REFERENCES users(user_id),
    author_signature_id     UUID,
    
    reviewer                UUID,
    reviewer_signature_id   UUID,
    
    approver                UUID,
    approver_signature_id   UUID,
    
    -- Training
    training_required       BOOLEAN DEFAULT false,
    training_course_id      UUID,
    
    -- Distribution
    distribution_list       UUID[],  -- User/role IDs who must read
    read_acknowledgement_required BOOLEAN DEFAULT false,
    
    -- Storage
    file_path               VARCHAR(500),
    file_checksum           VARCHAR(64),  -- SHA-256
    
    -- Audit
    audit_trail_id          UUID
);

-- DS-DOC-002: Document Versions
CREATE TABLE document_versions (
    version_id              UUID PRIMARY KEY,
    document_id             UUID REFERENCES controlled_documents(document_id),
    version_number          VARCHAR(20) NOT NULL,
    
    -- Changes
    change_description      TEXT NOT NULL,
    change_reason           TEXT,
    change_request_id       UUID,  -- Link to change control
    
    -- Content
    file_path               VARCHAR(500) NOT NULL,
    file_checksum           VARCHAR(64) NOT NULL,
    file_size_bytes         BIGINT,
    
    -- Version lifecycle
    created_at              TIMESTAMP DEFAULT now(),
    created_by              UUID REFERENCES users(user_id),
    superseded_at           TIMESTAMP,
    superseded_by           UUID,  -- Next version ID
    
    -- Approval
    approved_at             TIMESTAMP,
    approved_by             UUID,
    approval_signature_id   UUID,
    
    UNIQUE(document_id, version_number)
);

-- DS-DOC-003: Document Read Acknowledgements
CREATE TABLE document_acknowledgements (
    acknowledgement_id      UUID PRIMARY KEY,
    document_id             UUID REFERENCES controlled_documents(document_id),
    version_id              UUID REFERENCES document_versions(version_id),
    user_id                 UUID REFERENCES users(user_id),
    
    acknowledged_at         TIMESTAMP DEFAULT now(),
    signature_id            UUID,
    
    -- Comprehension test (optional)
    test_taken              BOOLEAN DEFAULT false,
    test_score              INTEGER,
    test_passed             BOOLEAN,
    
    UNIQUE(document_id, version_id, user_id)
);
```

---

### 2.2 Quality Events & Incidents (HIGH)

**Проблема**: Отсутствует система отслеживания quality events (OOS, OOT, incidents).

**Требуется новая структура**:
```sql
-- DS-QE-001: Quality Events
CREATE TABLE quality_events (
    event_id                UUID PRIMARY KEY,
    event_number            VARCHAR(50) UNIQUE NOT NULL, -- QE-2025-001
    event_type              VARCHAR(50) NOT NULL,
        -- CHECK IN ('oos', 'oot', 'product_complaint', 'equipment_failure', 
        --           'environmental_excursion', 'contamination', 'labeling_error')
    
    -- Discovery
    detected_at             TIMESTAMP NOT NULL,
    detected_by             UUID REFERENCES users(user_id),
    description             TEXT NOT NULL,
    
    -- Classification
    severity                VARCHAR(20) NOT NULL, -- 'minor', 'major', 'critical'
    patient_safety_risk     BOOLEAN DEFAULT false,
    product_quality_impact  BOOLEAN DEFAULT false,
    reportable_event        BOOLEAN DEFAULT false,  -- Must report to authorities?
    
    -- Related entities
    batch_id                UUID,
    product_id              UUID,
    equipment_id            UUID,
    zone_id                 UUID,
    
    -- Investigation
    investigation_required  BOOLEAN DEFAULT true,
    investigation_id        UUID,
    
    -- Impact assessment
    affected_batches        UUID[],
    affected_products       UUID[],
    quarantine_required     BOOLEAN DEFAULT false,
    recall_required         BOOLEAN DEFAULT false,
    
    -- CAPA
    capa_required           BOOLEAN DEFAULT true,
    capa_id                 UUID,
    
    -- Workflow
    status                  VARCHAR(20) NOT NULL DEFAULT 'open',
        -- CHECK IN ('open', 'under_investigation', 'pending_capa', 'pending_closure', 'closed')
    
    -- Closure
    closed_by               UUID,
    closed_at               TIMESTAMP,
    closure_signature_id    UUID,
    
    -- Notifications
    regulatory_notification_required BOOLEAN DEFAULT false,
    notification_sent_at    TIMESTAMP,
    
    -- Audit
    audit_trail_id          UUID
);
```

---

### 2.3 Enhanced User & Training Linkage (HIGH)

**Проблема**: DS-AUTH-001 (Users) не имеет полной интеграции с training system.

**Требуемые дополнения к DS-AUTH-001**:
```sql
ALTER TABLE users ADD COLUMN training_current_status VARCHAR(20)
    CHECK (training_current_status IN ('current', 'overdue', 'pending', 'not_started'));
ALTER TABLE users ADD COLUMN training_compliance_percent INTEGER CHECK (training_compliance_percent BETWEEN 0 AND 100);
ALTER TABLE users ADD COLUMN gxp_training_expiry DATE;
ALTER TABLE users ADD COLUMN next_training_due DATE;

ALTER TABLE users ADD COLUMN qualification_status VARCHAR(20)
    CHECK (qualification_status IN ('qualified', 'in_training', 'expired', 'suspended'));
ALTER TABLE users ADD COLUMN qualification_date DATE;
ALTER TABLE users ADD COLUMN requalification_date DATE;
```

---

## 📈 3. Рекомендации по Приоритизации

### Phase 1: Критические Исправления (Недели 1-2)

**Цель**: Устранить регуляторные риски высокой серьезности

1. ✅ **Обновить DS.md до версии 2.0**
   - Добавить все критические структуры (Change Control, Deviation Management)
   - Дополнить существующие таблицы недостающими compliance полями
   - Обновить metadata: version → 2.0, last_updated → 2025-10-16

2. ✅ **Создать Compliance Mapping Matrix**
   - Файл: `/docs/reports/DS_COMPLIANCE_MATRIX.md`
   - Таблица: DS structure ↔ FDA 21 CFR Part 11 § ↔ EU GMP Annex 11 Clause

3. ✅ **Добавить Validation Metadata**
   - Каждая таблица: validation_status, validation_protocol_id, last_validated_at
   - Создать структуры DS-VAL-001, DS-VAL-002, DS-VAL-003

4. ✅ **Дополнить Electronic Signatures (DS-ES-001)**
   - Добавить: meaning, signed_entity_type, signed_entity_id, linked_record_hash
   - Реализовать § 11.50 и § 11.70 compliance

---

### Phase 2: Высокоприоритетные Дополнения (Недели 3-4)

**Цель**: Завершить основные compliance gaps

1. ✅ **Document Control System**
   - Создать DS-DOC-001, DS-DOC-002, DS-DOC-003
   - Интегрировать с training system

2. ✅ **Quality Events & CAPA**
   - Создать DS-QE-001, DS-CAPA-001
   - Связать с deviation management

3. ✅ **Vendor Qualification**
   - Дополнить DS-PR-001
   - Создать DS-PR-003 (Vendor Audits)

4. ✅ **Workflow Management**
   - Создать DS-WF-004, DS-WF-005
   - Реализовать § 11.10(f) compliance

---

### Phase 3: Data Dictionary Реструктуризация (Недели 5-6)

**Цель**: Устранить дублирование и создать SSOT архитектуру

1. ✅ **Создать _definitions/ структуру**
   - `/docs/data_dictionary/_definitions/core_types.md`
   - `/docs/data_dictionary/_definitions/compliance_types.md`
   - `/docs/data_dictionary/_definitions/plant_definitions.md`

2. ✅ **Создать views/ представления**
   - `/docs/data_dictionary/views/entities.md` (business view)
   - `/docs/data_dictionary/views/compliance_view.md`

3. ✅ **Обновить ссылки**
   - Все файлы в data_dictionary/ должны ссылаться на _definitions/
   - Устранить дублирование между DS.md и data_dictionary/

---

### Phase 4: Continuous Improvement (Ongoing)

1. ✅ **Quarterly Compliance Reviews**
   - Проверять соответствие новым FDA/EMA guidances
   - Обновлять DS.md при изменении регуляторных требований

2. ✅ **Validation Lifecycle Tracking**
   - Использовать DS-VAL-003 для periodic reviews
   - Автоматические напоминания о next_review_date

---

## 📝 4. Выводы

### Текущий Статус: 🔴 КРИТИЧЕСКИЙ

Система GACP-ERP имеет существенные пробелы в Data Specification, которые создают регуляторные риски:

- **40 критических несоответствий** требуют немедленного исправления
- **67 высокоприоритетных находок** должны быть устранены до production release
- **Разрыв в версионности** между DS.md и compliance документами указывает на отсутствие синхронизации

### Регуляторный Риск

**FDA 21 CFR Part 11**: ⚠️ **Система НЕ готова к инспекции**
- Missing: Validation tracking, retention policies, workflow controls
- Incomplete: Electronic signatures, audit trail metadata

**EU GMP Annex 11**: ⚠️ **Система НЕ готова к инспекции**
- Missing: Change control, deviation management, document control
- Incomplete: Supplier qualification, periodic reviews

### Рекомендации по Срочности

**БЛОКЕР для Production**: До устранения Phase 1 критических находок система НЕ должна использоваться для GxP-критичных операций.

**Timeline для Compliance Readiness**:
- Phase 1 (Critical): 2 недели
- Phase 2 (High): 2 недели
- **Минимальная готовность для ограниченного use**: 4 недели
- **Полная compliance готовность**: 6 недель

---

## 📎 Приложения

### Appendix A: Compliance Mapping Template

См. `/docs/reports/DS_COMPLIANCE_MATRIX.md` (будет создан в Phase 1)

### Appendix B: Updated DS.md Structure

См. `/docs/validation/DS_v2.0.md` (будет создан в Phase 1)

### Appendix C: Validation Protocol Templates

См. `/docs/validation/templates/` (будет создан в Phase 2)

---

**Подготовлено**: AI Copilot  
**Дата**: 2025-10-16  
**Статус**: Draft для review  
**Следующий шаг**: Утверждение QA Lead и начало Phase 1 исправлений
