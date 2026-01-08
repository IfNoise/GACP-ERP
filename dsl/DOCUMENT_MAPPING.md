# Mapping: SOP to Referenced Documents

## Purpose
This document maps all SOP documents to their referenced forms, reports, checklists, and training materials extracted from the analysis.

## Status
- Date: 2026-01-08
- SOPs analyzed: 15 of ~60
- Forms found: 7 explicit + many implicit
- Reports found: 13 explicit + many implicit
- Checklists found: 5 explicit + many implicit
- Trainings found: 13 explicit + many implicit

## Next Steps
1. Complete full SOP analysis (all 60+ files)
2. Create DSL for each SOP
3. Create DSL for all referenced documents
4. Validate DSL against schemas
5. Generate MD documentation from DSL

## Document References by SOP

### SOP_AccessControl.md
**Forms:**
- Access Request Form (creation/modification of user accounts)

**Reports:**
- Incident Report (security incidents and unauthorized access)

**Checklists:**
- (None explicitly mentioned)

**Trainings:**
- (Implicit: Access control training for all users)

---

### SOP_AnalyticalMethods.md
**Forms:**
- Certificate of Analysis

**Reports:**
- Certificate of Analysis (CoA) - detailed test results
- Fair Value Support File Reports

**Checklists:**
- System Suitability Checklist (pre-analytical sequence)
- (Implicit: Pre-analysis equipment checks)

**Trainings:**
- Analytical Methods Training (mandatory for analysts)
- IFRS 41 Biological Assets Training (4 hours)
- Fair Value Measurement Principles (2 hours)
- System Procedures (2 hours)
- Annual Compliance Update (1 hour)

---

### SOP_AuditTrail.md
**Forms:**
- (None explicitly mentioned - all electronic)

**Reports:**
- Daily Activity Summary
- Security Report (failed logins, access violations)
- Data Integrity Report
- Compliance Report
- Performance Report (system metrics and trends)

**Checklists:**
- (None explicitly mentioned)

**Trainings:**
- CUR-003: Audit Trail & e-Signatures (Curriculum v2.0)
- Data Integrity Principles Training (ALCOA+)

---

### SOP_BiologicalAssets.md
**Forms:**
- (Implicit: Asset registration forms, measurement forms)

**Reports:**
- Fair Value Support File Reports
- Asset Valuation Reports

**Checklists:**
- (Implicit: Physical inspection checklists)

**Trainings:**
- IFRS 41 Biological Assets Training
- Fair Value Measurement Training

---

### SOP_CAPA.md
**Forms:**
- CAPA Record (core documentation)
- (Implicit: CAPA initiation, investigation, closure forms)

**Reports:**
- (Implicit: CAPA effectiveness reports, trend analysis)

**Checklists:**
- (Implicit: CAPA closure verification checklist)

**Trainings:**
- CUR-010: CAPA Management (Curriculum v2.0)

---

### SOP_ChainOfCustody.md
**Forms:**
- Chain of Custody Form (all material transfers)

**Reports:**
- (Implicit: CoC audit trail reports)

**Checklists:**
- (Implicit: Material receipt verification checklist)

**Trainings:**
- Chain of Custody Training

---

### SOP_ChangeControl.md
**Forms:**
- Change Request Form (CR-YYYY-NNNN format)
- (Implicit: Impact assessment forms, validation forms)

**Reports:**
- (Implicit: Change control summary reports, trend analysis)

**Checklists:**
- (Implicit: Change implementation checklist, post-implementation review)

**Trainings:**
- CUR-009: Change Control Management (Curriculum v2.0)

---

### SOP_CleaningSanitation.md
**Forms:**
- Cleaning Log / Sanitation Log
- (Implicit: Chemical preparation records, inspection forms)

**Reports:**
- (Implicit: Monthly sanitation summary, microbial monitoring reports)

**Checklists:**
- Daily Cleaning Checklist
- Deep Cleaning Checklist
- Equipment Cleaning Verification Checklist

**Trainings:**
- Sanitation Procedures Training
- Chemical Safety Training
- Environmental Monitoring Training

---

### SOP_DeviationManagement.md
**Forms:**
- Deviation Report Form (initial documentation)
- (Implicit: Investigation forms, impact assessment)

**Reports:**
- Investigation Report (detailed RCA)
- Trend Report (monthly/quarterly deviation trends)

**Checklists:**
- (Implicit: Deviation classification checklist, closure checklist)

**Trainings:**
- CUR-011: Deviation Management (Curriculum v2.0)

---

### SOP_DocumentControl.md
**Forms:**
- (Implicit: Document approval forms, change request forms)

**Reports:**
- (Implicit: Document status reports, review due reports)

**Checklists:**
- (Implicit: Document review checklist, approval checklist)

**Trainings:**
- CUR-015: Document Control & Management (Curriculum v2.0)

---

### SOP_EquipmentCalibration.md
**Forms:**
- Calibration Records Forms
- Equipment Registration Forms

**Reports:**
- (Implicit: Calibration due reports, out-of-tolerance reports)

**Checklists:**
- Pre-Calibration Checklist
- Calibration Verification Checklist (CHKLST-EQP-001 example)

**Trainings:**
- Calibration Procedures Training
- Equipment Operation Training
- SCADA System Operation Training

---

### SOP_EquipmentManagement.md
**Forms:**
- Equipment Registration Forms
- Maintenance Work Order Forms
- (Implicit: Equipment qualification forms)

**Reports:**
- Performance Metrics Report (OEE, MTBF, MTTR)
- Annual Equipment Assessment Reports

**Checklists:**
- Equipment Safety Checklist
- Pre-Operational Checklist
- Weekly Maintenance Checklist

**Trainings:**
- Equipment Operation Training
- Emergency Response Training

---

### SOP_InternalAudits.md
**Forms:**
- (Implicit: Audit plan forms, non-conformance forms)

**Reports:**
- Audit Report (comprehensive findings and CAPA)

**Checklists:**
- Digital Audit Checklist (risk-based, mobile app)
- Self-Audit Checklist (daily employee checks)

**Trainings:**
- Auditor Qualification Training (16 hours advanced)
- Internal Auditor Certification

---

### SOP_Sampling.md
**Forms:**
- Sample Collection Forms
- Sample Label Forms
- (Implicit: Sample disposal forms)

**Reports:**
- (Implicit: Sampling summary reports)

**Checklists:**
- (Implicit: Pre-sampling checklist, container inspection)

**Trainings:**
- Sampling Theory Training (4 hours classroom + exam)
- Sampling Technique Training (hands-on)

---

### SOP_SupplierQualification.md
**Forms:**
- (Implicit: Supplier application forms, qualification status forms)

**Reports:**
- Supplier Performance Reports
- (Implicit: Audit reports, requalification reports)

**Checklists:**
- Minimum Requirements Checklist (pre-qualification)
- Audit Checklist (on-site supplier audits)

**Trainings:**
- (Implicit: Supplier auditor training, GACP supplier requirements)

---

### SOP_Training.md
**Forms:**
- Training Completion Certificates
- Competency Assessment Forms

**Reports:**
- Training Report (RPT-TRN-001) - history, competency, certification status

**Checklists:**
- (Implicit: Training completion checklist, competency verification)

**Trainings:**
- GACP Fundamentals Training (all new employees)
- Annual Refresher Training
- GMP Compliance Training
- Leadership Development Training

---

## Common Pattern Analysis

### Form Types Needed:
1. **Request/Initiation Forms** - Access requests, change requests, CAPA initiation
2. **Log/Record Forms** - Cleaning logs, calibration records, sample collection
3. **Assessment Forms** - Competency, impact assessment, risk assessment
4. **Approval Forms** - Change approval, document approval, deviation closure
5. **Certificate Forms** - Training certificates, CoA, equipment qualification

### Report Types Needed:
1. **Summary Reports** - Daily, weekly, monthly activity summaries
2. **Analytical Reports** - Test results, CoA, performance metrics
3. **Trend Reports** - Deviation trends, performance trends, quality trends
4. **Audit Reports** - Internal audits, supplier audits, system audits
5. **Compliance Reports** - Regulatory compliance, data integrity, security

### Checklist Types Needed:
1. **Verification Checklists** - Equipment, cleaning, calibration verification
2. **Inspection Checklists** - Daily, weekly, pre-op inspections
3. **Audit Checklists** - Internal audits, supplier audits, self-audits
4. **Safety Checklists** - Equipment safety, PPE, emergency readiness
5. **Qualification Checklists** - Personnel, equipment, supplier qualification

### Training Types Needed:
1. **Initial Training** - GACP fundamentals, role-specific initial training
2. **Refresher Training** - Annual refreshers, procedure updates
3. **Specialized Training** - Advanced topics, analytical methods, auditing
4. **Certification Training** - Formal certifications with exams
5. **Awareness Training** - Safety, data integrity, compliance awareness

## Naming Conventions

### Forms
- Format: `FORM-{CATEGORY}-{NUMBER}`
- Example: `FORM-CLN-001` (Cleaning Log)
- Categories: CLN (Cleaning), EQP (Equipment), QA (Quality), TRN (Training), etc.

### Reports
- Format: `RPT-{CATEGORY}-{NUMBER}`
- Example: `RPT-QA-001` (Quality Metrics Report)
- Categories: QA (Quality), AUD (Audit), DEV (Deviation), CAPA, etc.

### Checklists
- Format: `CHKLST-{CATEGORY}-{NUMBER}`
- Example: `CHKLST-EQP-001` (Equipment Calibration Checklist)
- Categories: EQP (Equipment), CLN (Cleaning), AUD (Audit), SAFE (Safety), etc.

### Training
- Format: `TRN-{CATEGORY}-{NUMBER}` or `CUR-{NUMBER}` (Curriculum)
- Example: `TRN-SAN-001` (Sanitation Training) or `CUR-003` (Audit Trail)
- Categories: Aligned with SOP categories

## Implementation Priority

### Phase 1: Critical SOPs (High regulatory impact)
1. SOP_AuditTrail
2. SOP_DeviationManagement
3. SOP_CAPA
4. SOP_ChangeControl
5. SOP_DocumentControl

### Phase 2: Quality & Compliance
6. SOP_AnalyticalMethods
7. SOP_EquipmentCalibration
8. SOP_InternalAudits
9. SOP_DataIntegrity
10. SOP_Sampling

### Phase 3: Operations
11. SOP_CleaningSanitation
12. SOP_EquipmentManagement
13. SOP_SupplierQualification
14. SOP_ChainOfCustody
15. SOP_Training

### Phase 4: Supporting Processes
16-60. Remaining SOPs (see SOP_List.md)

## Notes for DSL Conversion

1. **Missing Information**: When data is not specified in SOP, use:
   - `"defined_by_qa"` for QA-determined values
   - `"defined_by_regulation"` for regulatory requirements
   - `"defined_by_operator"` for operator discretion
   - `"to_be_determined"` for pending decisions

2. **Language-Neutral**: DSL must be English-only, localization at generation

3. **No Assumptions**: Never invent operational details not in source SOP

4. **Traceability**: Each DSL element must trace back to source SOP section

5. **Validation**: All DSL must validate against respective schema

6. **Referential Integrity**: All document references (form_ref, training_ref, etc.) must exist

## Files to Create

Based on analysis, minimum DSL files needed:

### Process DSL (in /dsl/process/):
- `sop_cleaning_sanitation.yaml`
- `sop_equipment_calibration.yaml`
- `sop_audit_trail.yaml`
- `sop_deviation_management.yaml`
- `sop_capa.yaml`
- `sop_change_control.yaml`
- ... (one per SOP)

### Form DSL (in /dsl/forms/):
- `FORM-CLN-001-CLEANING_LOG.yaml`
- `FORM-DEV-001-DEVIATION_REPORT.yaml`
- `FORM-CHG-001-CHANGE_REQUEST.yaml`
- `FORM-CAPA-001-CAPA_RECORD.yaml`
- `FORM-COC-001-CHAIN_OF_CUSTODY.yaml`
- `FORM-EQP-001-EQUIPMENT_REGISTRATION.yaml`
- `FORM-CAL-001-CALIBRATION_RECORD.yaml`
- ... (one per form)

### Report DSL (in /dsl/reports/):
- `REPORT-DAILY-001-ACTIVITY_SUMMARY.yaml`
- `REPORT-SEC-001-SECURITY.yaml`
- `REPORT-DI-001-DATA_INTEGRITY.yaml`
- `REPORT-AUDIT-001-AUDIT.yaml`
- `REPORT-INV-001-INVESTIGATION.yaml`
- `REPORT-TREND-001-TREND_ANALYSIS.yaml`
- `REPORT-PERF-001-PERFORMANCE_METRICS.yaml`
- ... (one per report)

### Checklist DSL (in /dsl/checklists/):
- `CHKLST-EQP-001-EQUIPMENT_CALIBRATION.yaml`
- `CHKLST-CLN-001-CLEANING_VERIFICATION.yaml`
- `CHKLST-AUDIT-001-AUDIT.yaml`
- `CHKLST-SYS-001-SYSTEM_SUITABILITY.yaml`
- `CHKLST-SUP-001-SUPPLIER_AUDIT.yaml`
- `CHKLST-MIN-001-MINIMUM_REQUIREMENTS.yaml`
- ... (one per checklist)

### Training DSL (in /dsl/training/):
- `TRN-AUDIT-003-AUDIT_TRAIL_ESIGNATURES.yaml` (CUR-003)
- `TRN-CHG-009-CHANGE_CONTROL.yaml` (CUR-009)
- `TRN-CAPA-010-CAPA_MANAGEMENT.yaml` (CUR-010)
- `TRN-DEV-011-DEVIATION_MANAGEMENT.yaml` (CUR-011)
- `TRN-DOC-015-DOCUMENT_CONTROL.yaml` (CUR-015)
- `TRN-ANAL-001-ANALYTICAL_METHODS.yaml`
- `TRN-SMPL-001-SAMPLING.yaml`
- ... (one per training)

Total estimated files: 200-300 DSL files across all categories
