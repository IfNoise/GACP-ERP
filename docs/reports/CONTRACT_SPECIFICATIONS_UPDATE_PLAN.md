# Contract Specifications Update Plan

**Document**: CONTRACT_SPECIFICATIONS.md Update Roadmap  
**Version**: 1.0  
**Date**: 2025-10-16  
**Priority**: HIGH  
**Related**: DS v2.0 Implementation  

---

## 🎯 Objective

Обновить CONTRACT_SPECIFICATIONS.md с версии 1.0 до 2.0 для включения всех новых Zod схем, соответствующих обновлённому DS.md v2.0.

---

## 📊 Current Status

**CONTRACT_SPECIFICATIONS.md v1.0**:
- **Date**: 2025-09-14 (устарел на 1 месяц)
- **Status**: Не включает новые compliance модули из DS v2.0
- **Coverage**: ~60% от DS v2.0 структур

**Gap Analysis**:
- ❌ Отсутствуют схемы для 17 новых структур из DS v2.0
- ❌ Не обновлены 4 enhanced структуры (ES-001, DI-002, AUTH-001, GxP tables)
- ❌ Нет валидации для compliance полей (ALCOA+ mappings)
- ❌ Отсутствуют event schemas для новых Kafka topics

---

## ✅ Required Zod Schemas (Phase 1)

### 1. Change Control Module

#### DS-CHG-001: Change Requests
```typescript
// libs/shared/schemas/compliance/change-control.schema.ts

export const ChangeRequestSchema = z.object({
  change_id: z.string().uuid(),
  change_number: z.string().regex(/^CHG-\d{4}-\d{4}$/), // CHG-2025-0001
  change_type: z.enum([
    'data_structure', 
    'process', 
    'equipment', 
    'software', 
    'facility', 
    'documentation'
  ]),
  title: z.string().min(10).max(255),
  description: z.string().min(50),
  justification: z.string().min(50),
  gxp_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  affected_entities: z.array(z.object({
    entity_type: z.string(),
    entity_id: z.string().uuid(),
    impact_description: z.string()
  })),
  risk_assessment: z.object({
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    identified_risks: z.array(z.string()),
    mitigation_measures: z.array(z.string())
  }),
  revalidation_required: z.boolean(),
  training_required: z.boolean(),
  testing_required: z.boolean(),
  status: z.enum([
    'draft',
    'submitted',
    'under_review',
    'pending_approval',
    'approved',
    'rejected',
    'in_implementation',
    'completed',
    'cancelled'
  ]),
  requested_by: z.string().uuid(),
  requested_at: z.coerce.date(),
  target_completion_date: z.coerce.date(),
  actual_completion_date: z.coerce.date().optional(),
  signature_id: z.string().uuid().optional(),
  audit_trail_id: z.string().uuid()
});

export type ChangeRequest = z.infer<typeof ChangeRequestSchema>;
```

#### DS-CHG-002: Change Approvals
```typescript
export const ChangeApprovalSchema = z.object({
  approval_id: z.string().uuid(),
  change_id: z.string().uuid(),
  approver_role: z.enum([
    'quality_assurance',
    'quality_control',
    'production_manager',
    'it_manager',
    'compliance_officer'
  ]),
  approver_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'conditional']),
  conditions: z.string().optional(),
  comments: z.string().optional(),
  approved_at: z.coerce.date(),
  signature_id: z.string().uuid(),
  audit_trail_id: z.string().uuid()
});

export type ChangeApproval = z.infer<typeof ChangeApprovalSchema>;
```

#### DS-CHG-003: Change Implementation History
```typescript
export const ChangeImplementationHistorySchema = z.object({
  implementation_id: z.string().uuid(),
  change_id: z.string().uuid(),
  step_number: z.number().int().positive(),
  step_description: z.string(),
  implemented_by: z.string().uuid(),
  implemented_at: z.coerce.date(),
  verification_required: z.boolean(),
  verified_by: z.string().uuid().optional(),
  verified_at: z.coerce.date().optional(),
  signature_id: z.string().uuid(),
  audit_trail_id: z.string().uuid()
});

export type ChangeImplementationHistory = z.infer<typeof ChangeImplementationHistorySchema>;
```

---

### 2. Deviation Management Module

#### DS-DEV-001: Deviations
```typescript
// libs/shared/schemas/compliance/deviation-management.schema.ts

export const DeviationSchema = z.object({
  deviation_id: z.string().uuid(),
  deviation_number: z.string().regex(/^DEV-\d{4}-\d{4}$/), // DEV-2025-0001
  deviation_type: z.enum([
    'process_deviation',
    'material_deviation',
    'equipment_malfunction',
    'documentation_error',
    'environmental_excursion',
    'test_failure',
    'other'
  ]),
  severity: z.enum(['minor', 'major', 'critical']),
  gxp_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  detected_at: z.coerce.date(),
  detected_by: z.string().uuid(),
  description: z.string().min(50),
  affected_batches: z.array(z.string().uuid()),
  affected_products: z.array(z.string().uuid()),
  immediate_action_taken: z.string(),
  containment_measures: z.string(),
  investigation_required: z.boolean().default(true),
  capa_required: z.boolean().default(true),
  regulatory_reportable: z.boolean().default(false),
  status: z.enum([
    'open',
    'under_investigation',
    'pending_capa',
    'pending_approval',
    'closed',
    'escalated'
  ]),
  investigation_id: z.string().uuid().optional(),
  capa_id: z.string().uuid().optional(),
  closed_by: z.string().uuid().optional(),
  closed_at: z.coerce.date().optional(),
  closure_signature_id: z.string().uuid().optional(),
  audit_trail_id: z.string().uuid()
});

export type Deviation = z.infer<typeof DeviationSchema>;
```

#### DS-DEV-002: Root Cause Analysis
```typescript
export const RootCauseAnalysisSchema = z.object({
  analysis_id: z.string().uuid(),
  deviation_id: z.string().uuid(),
  methodology: z.enum(['5_whys', 'fishbone', 'fault_tree', 'pareto', 'other']),
  root_causes: z.array(z.object({
    category: z.enum(['human', 'machine', 'material', 'method', 'environment', 'measurement']),
    description: z.string(),
    evidence: z.string()
  })),
  contributing_factors: z.array(z.string()),
  performed_by: z.string().uuid(),
  performed_at: z.coerce.date(),
  approved_by: z.string().uuid().optional(),
  approval_signature_id: z.string().uuid().optional(),
  audit_trail_id: z.string().uuid()
});

export type RootCauseAnalysis = z.infer<typeof RootCauseAnalysisSchema>;
```

---

### 3. CAPA System

#### DS-CAPA-001: CAPA Records
```typescript
// libs/shared/schemas/compliance/capa.schema.ts

export const CAPARecordSchema = z.object({
  capa_id: z.string().uuid(),
  capa_number: z.string().regex(/^CAPA-\d{4}-\d{4}$/), // CAPA-2025-0001
  capa_type: z.enum(['corrective', 'preventive', 'combined']),
  source_type: z.enum([
    'deviation',
    'complaint',
    'audit_finding',
    'ooc_oot',
    'regulatory_inspection',
    'self_inspection',
    'risk_assessment'
  ]),
  source_reference_id: z.string().uuid(),
  title: z.string().min(10).max(255),
  description: z.string().min(50),
  root_cause_summary: z.string().min(50),
  action_plan: z.array(z.object({
    action_description: z.string(),
    responsible_person: z.string().uuid(),
    target_date: z.coerce.date(),
    status: z.enum(['pending', 'in_progress', 'completed', 'overdue'])
  })),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum([
    'draft',
    'approved',
    'in_progress',
    'pending_verification',
    'completed',
    'closed',
    'cancelled'
  ]),
  effectiveness_check_required: z.boolean().default(true),
  effectiveness_check_date: z.coerce.date().optional(),
  effectiveness_check_result: z.enum(['effective', 'ineffective', 'partially_effective']).optional(),
  responsible_person: z.string().uuid(),
  target_completion_date: z.coerce.date(),
  actual_completion_date: z.coerce.date().optional(),
  closed_by: z.string().uuid().optional(),
  closure_signature_id: z.string().uuid().optional(),
  audit_trail_id: z.string().uuid()
});

export type CAPARecord = z.infer<typeof CAPARecordSchema>;
```

---

### 4. Validation Management Module

#### DS-VAL-001: Validation Protocols
```typescript
// libs/shared/schemas/compliance/validation-management.schema.ts

export const ValidationProtocolSchema = z.object({
  protocol_id: z.string().uuid(),
  protocol_number: z.string().regex(/^(IQ|OQ|PQ)-\d{3}$/), // IQ-001, OQ-002, PQ-003
  protocol_type: z.enum(['IQ', 'OQ', 'PQ', 'revalidation', 'partial']),
  system_name: z.string().min(3).max(255),
  system_version: z.string(),
  gamp_category: z.enum(['category_3', 'category_4', 'category_5']),
  gxp_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  title: z.string().min(10).max(255),
  purpose: z.string().min(50),
  scope: z.string().min(50),
  acceptance_criteria: z.string().min(50),
  urs_reference: z.string().optional(),
  fs_reference: z.string().optional(),
  ds_reference: z.string().optional(),
  risk_assessment_ref: z.string().optional(),
  author: z.string().uuid(),
  author_signature_id: z.string().uuid().optional(),
  authored_at: z.coerce.date().optional(),
  reviewer: z.string().uuid().optional(),
  reviewer_signature_id: z.string().uuid().optional(),
  reviewed_at: z.coerce.date().optional(),
  approver: z.string().uuid().optional(),
  approver_signature_id: z.string().uuid().optional(),
  approved_at: z.coerce.date().optional(),
  status: z.enum([
    'draft',
    'approved',
    'in_execution',
    'completed',
    'failed',
    'superseded'
  ]),
  execution_start_date: z.coerce.date().optional(),
  execution_end_date: z.coerce.date().optional(),
  executed_by: z.string().uuid().optional(),
  test_cases_total: z.number().int().nonnegative().default(0),
  test_cases_passed: z.number().int().nonnegative().default(0),
  test_cases_failed: z.number().int().nonnegative().default(0),
  test_cases_blocked: z.number().int().nonnegative().default(0),
  overall_result: z.enum(['pass', 'fail', 'pass_with_deviations']).optional(),
  report_id: z.string().uuid().optional(),
  report_signature_id: z.string().uuid().optional(),
  next_review_date: z.coerce.date().optional(),
  audit_trail_id: z.string().uuid()
});

export type ValidationProtocol = z.infer<typeof ValidationProtocolSchema>;
```

#### DS-VAL-002: Validation Test Cases
```typescript
export const ValidationTestCaseSchema = z.object({
  test_case_id: z.string().uuid(),
  protocol_id: z.string().uuid(),
  test_case_number: z.string().regex(/^TC-\d{3}$/), // TC-001
  requirement_id: z.string().optional(),
  test_objective: z.string().min(20),
  prerequisites: z.string().optional(),
  test_steps: z.array(z.object({
    step_number: z.number().int().positive(),
    action: z.string(),
    expected_result: z.string()
  })),
  expected_result: z.string().min(20),
  execution_date: z.coerce.date().optional(),
  executed_by: z.string().uuid().optional(),
  actual_result: z.string().optional(),
  status: z.enum(['not_executed', 'pass', 'fail', 'blocked', 'skipped']),
  evidence_attachments: z.array(z.object({
    file_name: z.string(),
    file_path: z.string(),
    file_type: z.string(),
    uploaded_at: z.coerce.date()
  })),
  deviation_id: z.string().uuid().optional(),
  comments: z.string().optional(),
  signature_id: z.string().uuid().optional(),
  audit_trail_id: z.string().uuid()
});

export type ValidationTestCase = z.infer<typeof ValidationTestCaseSchema>;
```

#### DS-VAL-003: Periodic Reviews
```typescript
export const PeriodicReviewSchema = z.object({
  review_id: z.string().uuid(),
  review_type: z.enum(['annual', 'post_change', 'post_deviation', 'triggered']),
  system_name: z.string().min(3).max(255),
  system_version: z.string(),
  review_period_start: z.coerce.date(),
  review_period_end: z.coerce.date(),
  validation_status: z.enum(['remains_valid', 'revalidation_required']),
  changes_since_last_review: z.array(z.object({
    change_id: z.string().uuid(),
    change_description: z.string(),
    impact_assessment: z.string()
  })),
  deviations_summary: z.object({
    total_deviations: z.number().int().nonnegative(),
    critical_deviations: z.number().int().nonnegative(),
    impact_on_validation: z.string()
  }),
  incidents_summary: z.object({
    total_incidents: z.number().int().nonnegative(),
    system_downtime_hours: z.number().nonnegative(),
    impact_on_validation: z.string()
  }),
  findings: z.array(z.object({
    finding_description: z.string(),
    severity: z.enum(['observation', 'minor', 'major', 'critical'])
  })),
  actions_required: z.array(z.object({
    action_description: z.string(),
    responsible_person: z.string().uuid(),
    target_date: z.coerce.date()
  })),
  reviewed_by: z.string().uuid(),
  reviewed_at: z.coerce.date(),
  review_signature_id: z.string().uuid().optional(),
  approved_by: z.string().uuid().optional(),
  approved_at: z.coerce.date().optional(),
  approval_signature_id: z.string().uuid().optional(),
  next_review_date: z.coerce.date(),
  audit_trail_id: z.string().uuid()
});

export type PeriodicReview = z.infer<typeof PeriodicReviewSchema>;
```

---

### 5. Document Control Module

#### DS-DOC-001: Controlled Documents
```typescript
// libs/shared/schemas/compliance/document-control.schema.ts

export const ControlledDocumentSchema = z.object({
  document_id: z.string().uuid(),
  document_number: z.string().regex(/^(SOP|FORM|POL|PROT|RPT|SPEC)-\d{3}$/),
  document_type: z.enum([
    'SOP',
    'form',
    'policy',
    'protocol',
    'report',
    'specification',
    'work_instruction',
    'record'
  ]),
  title: z.string().min(10).max(255),
  description: z.string().optional(),
  gxp_critical: z.boolean().default(false),
  confidentiality_level: z.enum(['public', 'internal', 'confidential', 'restricted']),
  current_version: z.string().regex(/^\d+\.\d+$/), // 1.0, 2.1, etc.
  status: z.enum([
    'draft',
    'under_review',
    'approved',
    'effective',
    'obsolete',
    'archived'
  ]),
  created_at: z.coerce.date(),
  created_by: z.string().uuid(),
  effective_date: z.coerce.date().optional(),
  review_date: z.coerce.date().optional(),
  next_review_date: z.coerce.date().optional(),
  retirement_date: z.coerce.date().optional(),
  author: z.string().uuid(),
  author_signature_id: z.string().uuid().optional(),
  reviewer: z.string().uuid().optional(),
  reviewer_signature_id: z.string().uuid().optional(),
  approver: z.string().uuid().optional(),
  approver_signature_id: z.string().uuid().optional(),
  training_required: z.boolean().default(false),
  training_course_id: z.string().uuid().optional(),
  distribution_list: z.array(z.string().uuid()),
  read_acknowledgement_required: z.boolean().default(false),
  file_path: z.string(),
  file_checksum: z.string().length(64), // SHA-256
  audit_trail_id: z.string().uuid()
});

export type ControlledDocument = z.infer<typeof ControlledDocumentSchema>;
```

#### DS-DOC-002: Document Versions
```typescript
export const DocumentVersionSchema = z.object({
  version_id: z.string().uuid(),
  document_id: z.string().uuid(),
  version_number: z.string().regex(/^\d+\.\d+$/),
  change_description: z.string().min(20),
  change_reason: z.string().optional(),
  change_request_id: z.string().uuid().optional(),
  file_path: z.string(),
  file_checksum: z.string().length(64),
  file_size_bytes: z.number().int().positive(),
  created_at: z.coerce.date(),
  created_by: z.string().uuid(),
  superseded_at: z.coerce.date().optional(),
  superseded_by: z.string().uuid().optional(),
  approved_at: z.coerce.date().optional(),
  approved_by: z.string().uuid().optional(),
  approval_signature_id: z.string().uuid().optional(),
  audit_trail_id: z.string().uuid()
});

export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
```

#### DS-DOC-003: Document Acknowledgements
```typescript
export const DocumentAcknowledgementSchema = z.object({
  acknowledgement_id: z.string().uuid(),
  document_id: z.string().uuid(),
  version_id: z.string().uuid(),
  user_id: z.string().uuid(),
  acknowledged_at: z.coerce.date(),
  signature_id: z.string().uuid().optional(),
  test_taken: z.boolean().default(false),
  test_score: z.number().int().min(0).max(100).optional(),
  test_passed: z.boolean().optional(),
  audit_trail_id: z.string().uuid()
});

export type DocumentAcknowledgement = z.infer<typeof DocumentAcknowledgementSchema>;
```

---

### 6. Quality Events Module

#### DS-QE-001: Quality Events
```typescript
// libs/shared/schemas/compliance/quality-events.schema.ts

export const QualityEventSchema = z.object({
  event_id: z.string().uuid(),
  event_number: z.string().regex(/^QE-\d{4}-\d{4}$/), // QE-2025-0001
  event_type: z.enum([
    'oos',
    'oot',
    'product_complaint',
    'equipment_failure',
    'environmental_excursion',
    'contamination',
    'labeling_error',
    'other'
  ]),
  detected_at: z.coerce.date(),
  detected_by: z.string().uuid(),
  description: z.string().min(50),
  severity: z.enum(['minor', 'major', 'critical']),
  patient_safety_risk: z.boolean().default(false),
  product_quality_impact: z.boolean().default(false),
  reportable_event: z.boolean().default(false),
  batch_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  equipment_id: z.string().uuid().optional(),
  zone_id: z.string().uuid().optional(),
  investigation_required: z.boolean().default(true),
  investigation_id: z.string().uuid().optional(),
  affected_batches: z.array(z.string().uuid()),
  affected_products: z.array(z.string().uuid()),
  quarantine_required: z.boolean().default(false),
  recall_required: z.boolean().default(false),
  capa_required: z.boolean().default(true),
  capa_id: z.string().uuid().optional(),
  status: z.enum([
    'open',
    'under_investigation',
    'pending_capa',
    'pending_closure',
    'closed'
  ]),
  closed_by: z.string().uuid().optional(),
  closed_at: z.coerce.date().optional(),
  closure_signature_id: z.string().uuid().optional(),
  regulatory_notification_required: z.boolean().default(false),
  notification_sent_at: z.coerce.date().optional(),
  audit_trail_id: z.string().uuid()
});

export type QualityEvent = z.infer<typeof QualityEventSchema>;
```

---

### 7. Data Retention & Archive Module

#### DS-DI-004: Data Retention Policies
```typescript
// libs/shared/schemas/compliance/data-retention.schema.ts

export const DataRetentionPolicySchema = z.object({
  policy_id: z.string().uuid(),
  entity_type: z.string().min(3).max(50),
  retention_period: z.string().regex(/^\d+\s+(years?|months?|days?)$/), // "7 years", "25 years"
  retention_basis: z.string().max(100).optional(),
  archive_after: z.string().regex(/^\d+\s+(years?|months?|days?)$/).optional(),
  destruction_allowed: z.boolean().default(false),
  legal_hold_override: z.boolean().default(false),
  created_at: z.coerce.date(),
  approved_by: z.string().uuid(),
  approval_signature_id: z.string().uuid().optional(),
  effective_date: z.coerce.date(),
  audit_trail_id: z.string().uuid()
});

export type DataRetentionPolicy = z.infer<typeof DataRetentionPolicySchema>;
```

#### DS-DI-005: Archived Records
```typescript
export const ArchivedRecordSchema = z.object({
  archive_id: z.string().uuid(),
  entity_type: z.string().min(3).max(50),
  entity_id: z.string().uuid(),
  archived_at: z.coerce.date(),
  archived_by: z.string().uuid(),
  retention_expiry: z.coerce.date(),
  archive_location: z.string().max(255),
  archive_format: z.enum(['json', 'parquet', 'pdf']),
  archive_checksum: z.string().length(64),
  retrieval_time_estimate: z.string().regex(/^\d+\s+(hours?|days?)$/),
  legal_hold: z.boolean().default(false),
  destruction_date: z.coerce.date().optional(),
  destruction_by: z.string().uuid().optional(),
  destruction_signature_id: z.string().uuid().optional(),
  destruction_certificate: z.string().optional(),
  audit_trail_id: z.string().uuid()
});

export type ArchivedRecord = z.infer<typeof ArchivedRecordSchema>;
```

---

### 8. Workflow Management Module

#### DS-WF-004: Workflow Definitions
```typescript
// libs/shared/schemas/compliance/workflow-management.schema.ts

export const WorkflowDefinitionSchema = z.object({
  workflow_id: z.string().uuid(),
  workflow_name: z.string().min(3).max(100),
  entity_type: z.string().min(3).max(50),
  workflow_type: z.string().max(50).optional(),
  version: z.string().regex(/^\d+\.\d+$/),
  status: z.enum(['active', 'draft', 'retired']),
  states: z.array(z.object({
    state_name: z.string(),
    state_type: z.enum(['initial', 'intermediate', 'final', 'error']),
    allowed_roles: z.array(z.string())
  })),
  transitions: z.array(z.object({
    from_state: z.string(),
    to_state: z.string(),
    trigger_event: z.string(),
    conditions: z.record(z.unknown()).optional()
  })),
  transition_rules: z.record(z.unknown()).optional(),
  approval_requirements: z.record(z.unknown()).optional(),
  sla_timings: z.record(z.unknown()).optional(),
  created_at: z.coerce.date(),
  created_by: z.string().uuid(),
  approved_by: z.string().uuid().optional(),
  approval_signature_id: z.string().uuid().optional(),
  effective_date: z.coerce.date(),
  retirement_date: z.coerce.date().optional(),
  audit_trail_id: z.string().uuid()
});

export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
```

#### DS-WF-005: Workflow Execution Logs
```typescript
export const WorkflowExecutionLogSchema = z.object({
  execution_id: z.string().uuid(),
  workflow_id: z.string().uuid(),
  entity_type: z.string().min(3).max(50),
  entity_id: z.string().uuid(),
  current_state: z.string().max(50),
  previous_state: z.string().max(50).optional(),
  started_at: z.coerce.date(),
  completed_at: z.coerce.date().optional(),
  status: z.enum(['in_progress', 'completed', 'failed']),
  assigned_to: z.string().uuid().optional(),
  assigned_at: z.coerce.date().optional(),
  transition_valid: z.boolean().default(true),
  validation_errors: z.array(z.string()).optional(),
  audit_trail_id: z.string().uuid(),
  signature_required: z.boolean().default(false),
  signature_id: z.string().uuid().optional()
});

export type WorkflowExecutionLog = z.infer<typeof WorkflowExecutionLogSchema>;
```

---

## ✅ Enhanced Schemas (Phase 2)

### 9. Electronic Signatures (DS-ES-001) - Enhanced

```typescript
// libs/shared/schemas/compliance/electronic-signatures.schema.ts

export const ElectronicSignatureSchema = z.object({
  signature_id: z.string().uuid(),
  user_id: z.string().uuid(),
  signed_at: z.coerce.date(),
  reason: z.string().min(10),
  
  // FDA § 11.50 - Signature manifestation
  meaning: z.enum([
    'Reviewed by',
    'Approved by',
    'Verified by',
    'Performed by',
    'Witnessed by',
    'Released by'
  ]),
  
  // FDA § 11.70 - Signature/record linking
  signed_entity_type: z.string().min(3).max(50),
  signed_entity_id: z.string().uuid(),
  signed_entity_version: z.string().optional(),
  linked_record_hash: z.string().length(64), // SHA-256 for integrity
  
  // Authentication tracking
  method: z.enum([
    'password_2fa',
    'qr_badge',
    'hardware_token',
    'pki_certificate',
    'biometric'
  ]),
  auth_time: z.coerce.date(),
  auth_method: z.string().max(50).optional(),
  ip_address: z.string().ip().optional(),
  device_info: z.record(z.unknown()).optional(),
  geolocation: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  
  // Cryptographic details
  signature_hash: z.string().length(64),
  signature_format: z.enum(['pkcs7', 'xades', 'cades', 'simple']).optional(),
  certificate_serial: z.string().optional(),
  certificate_issuer: z.string().optional(),
  certificate_valid_until: z.coerce.date().optional(),
  
  // Biometric details
  biometric_hash: z.string().length(64).optional(),
  biometric_type: z.enum(['fingerprint', 'facial_recognition', 'voice']).optional(),
  
  // Lifecycle management
  valid: z.boolean().default(true),
  revoked_at: z.coerce.date().optional(),
  revoked_by: z.string().uuid().optional(),
  revocation_reason: z.string().optional(),
  
  // Witness support for critical operations
  witness_required: z.boolean().default(false),
  witness_signature_id: z.string().uuid().optional(),
  
  // Approval hierarchy
  parent_signature_id: z.string().uuid().optional(),
  signature_level: z.number().int().positive().default(1),
  
  // Audit trail linkage
  audit_trail_id: z.string().uuid()
});

export type ElectronicSignature = z.infer<typeof ElectronicSignatureSchema>;
```

---

### 10. Audit Trail (DS-DI-002) - Enhanced

```typescript
// libs/shared/schemas/compliance/audit-trail.schema.ts

export const AuditTrailSchema = z.object({
  audit_id: z.string().uuid(),
  entity_type: z.string().min(3).max(50),
  entity_id: z.string().uuid(),
  action: z.enum([
    'CREATE',
    'UPDATE',
    'DELETE',
    'SIGN',
    'APPROVE',
    'REVIEW',
    'ARCHIVE',
    'RESTORE',
    'EXPORT'
  ]),
  
  // Change tracking
  old_value: z.record(z.unknown()).optional(),
  new_value: z.record(z.unknown()).optional(),
  field_changes: z.array(z.object({
    field_name: z.string(),
    old_value: z.unknown(),
    new_value: z.unknown()
  })).optional(),
  
  // Attribution
  performed_by: z.string().uuid(),
  performed_at: z.coerce.date(),
  reason: z.string().optional(),
  
  // Session tracking
  signature_id: z.string().uuid().optional(),
  session_id: z.string().uuid(),
  correlation_id: z.string().uuid(),
  source_system: z.enum(['web', 'mobile', 'api', 'batch_job']),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().optional(),
  geolocation: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  
  // GxP classification
  gxp_critical: z.boolean().default(false),
  
  // Validation tracking
  validation_status: z.enum(['unvalidated', 'validated', 'reviewed']).optional(),
  
  // Auditor review workflow
  review_status: z.enum(['pending_review', 'reviewed', 'flagged']).optional(),
  reviewed_by: z.string().uuid().optional(),
  reviewed_at: z.coerce.date().optional(),
  review_comment: z.string().optional(),
  
  // Retention management
  retention_category: z.enum([
    'gxp_critical',
    'financial',
    'operational',
    'system'
  ]),
  retention_policy_id: z.string().uuid().optional(),
  retention_expiry: z.coerce.date().optional(),
  
  // Archive management
  archive_status: z.enum([
    'active',
    'scheduled_for_archive',
    'archived',
    'scheduled_for_deletion'
  ]).default('active'),
  archived_at: z.coerce.date().optional(),
  
  // Event sourcing support
  kafka_offset: z.number().int().nonnegative().optional(),
  kafka_partition: z.number().int().nonnegative().optional(),
  kafka_topic: z.string().max(100).optional(),
  
  // Immutable storage proof
  immudb_tx_id: z.number().int().positive().optional(),
  checksum: z.string().length(64) // SHA-256 for integrity verification
});

export type AuditTrail = z.infer<typeof AuditTrailSchema>;
```

---

### 11. Users (DS-AUTH-001) - Enhanced

```typescript
// libs/shared/schemas/auth/users.schema.ts

export const UserSchema = z.object({
  user_id: z.string().uuid(),
  username: z.string().min(3).max(100),
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  employee_id: z.string().max(50).optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  
  // User classification
  user_type: z.enum([
    'internal',
    'external_auditor',
    'internal_auditor',
    'third_party_auditor',
    'contractor'
  ]),
  auditor_certification: z.string().max(200).optional(),
  organization: z.string().max(200).optional(),
  
  // Employment tracking
  hire_date: z.coerce.date().optional(),
  termination_date: z.coerce.date().optional(),
  account_expiry_date: z.coerce.date().optional(),
  active: z.boolean().default(true),
  temporary_account: z.boolean().default(false),
  supervisor_required: z.boolean().default(false),
  
  // Security
  last_login: z.coerce.date().optional(),
  failed_login_attempts: z.number().int().nonnegative().default(0),
  password_last_changed: z.coerce.date().optional(),
  two_factor_enabled: z.boolean().default(false),
  
  // Preferences
  preferred_language: z.string().length(2).default('en'),
  timezone: z.string().default('UTC'),
  mobile_device_ids: z.array(z.string().uuid()),
  
  // Compliance
  nda_signed: z.boolean().default(false),
  background_check_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  access_areas: z.array(z.string()),
  
  // Training tracking (NEW - Phase 2 enhancement)
  training_current_status: z.enum([
    'complete',
    'incomplete',
    'overdue'
  ]).default('incomplete'),
  training_compliance_percent: z.number().int().min(0).max(100).default(0),
  mandatory_training_completed: z.boolean().default(false),
  gxp_training_required: z.boolean().default(false),
  gxp_training_current: z.boolean().default(false),
  gxp_training_expiry: z.coerce.date().optional(),
  next_training_due: z.coerce.date().optional(),
  
  // Qualification tracking (NEW - Phase 2 enhancement)
  qualification_status: z.enum([
    'unqualified',
    'in_training',
    'qualified',
    'requalification_needed'
  ]).optional(),
  qualification_date: z.coerce.date().optional(),
  qualification_valid_until: z.coerce.date().optional(),
  qualified_for_roles: z.array(z.string()).default([]),
  
  // Assessment tracking (NEW - Phase 2 enhancement)
  last_training_assessment_date: z.coerce.date().optional(),
  last_training_assessment_score: z.number().int().min(0).max(100).optional(),
  
  // Audit trail
  audit_trail_id: z.string().uuid().optional()
});

export type User = z.infer<typeof UserSchema>;
```

---

### 12. GxP-Critical Tables - Validation Metadata

**Common validation fields to add to existing schemas**:

```typescript
// libs/shared/schemas/common/gxp-validation.schema.ts

export const GxPValidationFieldsSchema = z.object({
  validation_status: z.enum([
    'unvalidated',
    'validated',
    'under_review',
    'superseded'
  ]).default('unvalidated'),
  validation_protocol_id: z.string().uuid().optional(),
  last_validated_at: z.coerce.date().optional(),
  next_review_date: z.coerce.date().optional(),
  change_control_id: z.string().uuid().optional(),
  retention_policy_id: z.string().uuid().optional(),
  audit_trail_id: z.string().uuid()
});

export type GxPValidationFields = z.infer<typeof GxPValidationFieldsSchema>;

// Apply to existing schemas:
// - PlantSchema (DS-PLM-001)
// - BatchSchema (DS-PLM-003)
// - FinancialTransactionSchema (DS-FIN-001)
// - GeneralLedgerSchema (DS-FIN-002)
```

---

## 📋 Implementation Checklist

### Phase 1: Core Compliance Schemas

- [ ] Create `/libs/shared/schemas/compliance/` directory structure
- [ ] Implement Change Control schemas (CHG-001/002/003)
- [ ] Implement Deviation Management schemas (DEV-001/002, CAPA-001)
- [ ] Implement Validation Management schemas (VAL-001/002/003)
- [ ] Implement Document Control schemas (DOC-001/002/003)
- [ ] Implement Quality Events schema (QE-001)
- [ ] Implement Data Retention schemas (DI-004/005)
- [ ] Implement Workflow Management schemas (WF-004/005)

### Phase 2: Enhanced Schemas

- [ ] Enhance ElectronicSignatureSchema with FDA § 11.50/11.70 fields
- [ ] Enhance AuditTrailSchema with retention & review fields
- [ ] Enhance UserSchema with training & qualification tracking
- [ ] Create GxPValidationFieldsSchema mixin
- [ ] Apply GxP validation fields to PlantSchema
- [ ] Apply GxP validation fields to BatchSchema
- [ ] Apply GxP validation fields to FinancialTransactionSchema
- [ ] Apply GxP validation fields to GeneralLedgerSchema

### Phase 3: API Contracts

- [ ] Generate ts-rest API contracts for all new schemas
- [ ] Create REST endpoints definitions
- [ ] Create Kafka event schemas
- [ ] Update OpenAPI specification

### Phase 4: Testing & Validation

- [ ] Unit tests for all Zod schemas
- [ ] Integration tests for API contracts
- [ ] Validation error message testing
- [ ] Performance testing for large payloads

### Phase 5: Documentation Updates

- [ ] Update CONTRACT_SPECIFICATIONS.md to v2.0
- [ ] Add usage examples for all new schemas
- [ ] Document validation rules
- [ ] Create migration guide from v1.0 to v2.0

---

## 📅 Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| Week 1 | Core Compliance Schemas | 17 new schemas implemented |
| Week 2 | Enhanced Schemas | 4 schemas enhanced, GxP mixin created |
| Week 3 | API Contracts | ts-rest contracts, Kafka events |
| Week 4 | Testing | Unit tests, integration tests |
| Week 5 | Documentation | CONTRACT_SPECIFICATIONS.md v2.0 |

---

## 🎯 Success Criteria

- [ ] All DS v2.0 structures have corresponding Zod schemas
- [ ] 100% type coverage with TypeScript inference
- [ ] All schemas have validation tests
- [ ] API contracts generated from schemas
- [ ] OpenAPI specification updated
- [ ] Documentation complete and reviewed
- [ ] QA approval obtained

---

## 📞 Stakeholders

- **Schema Owner**: Frontend/Backend Team Leads
- **Reviewer**: QA Manager
- **Approver**: Technical Architect
- **Related**: DS v2.0 Implementation (completed 2025-10-16)

---

**Status**: 📋 **Plan Ready** - Pending implementation start  
**Created**: 2025-10-16  
**Priority**: HIGH (blocks backend implementation)  
**Dependencies**: DS.md v2.0 (completed)

---

## Related Documents

- [DS.md v2.0](../validation/DS.md) - Data specification source
- [DS_V2_IMPLEMENTATION_SUMMARY.md](./DS_V2_IMPLEMENTATION_SUMMARY.md) - Implementation report
- [CONTRACT_SPECIFICATIONS.md](../CONTRACT_SPECIFICATIONS.md) - Current v1.0 (to be updated)
- [DS_UPDATE_ACTION_PLAN.md](./DS_UPDATE_ACTION_PLAN.md) - Overall action plan
