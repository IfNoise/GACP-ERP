# DSL Generation Rules - GACP-ERP
# Version: 1.0.0
# Date: 2026-01-09

## CRITICAL: MUST READ BEFORE GENERATING ANY DSL FILE

### Golden Rule
**ALWAYS consult the appropriate schema file BEFORE creating ANY DSL file. NO EXCEPTIONS.**

### Reference Files Location
- **Process Schema**: `/home/noise83/Projects/GACP-ERP/dsl/schemas/sop_schema.yaml`
- **Form Schema**: `/home/noise83/Projects/GACP-ERP/dsl/schemas/form_schema.yaml`
- **Checklist Schema**: `/home/noise83/Projects/GACP-ERP/dsl/schemas/checklist_schema.yaml`
- **Report Schema**: `/home/noise83/Projects/GACP-ERP/dsl/schemas/report_schema.yaml`
- **Training Schema**: `/home/noise83/Projects/GACP-ERP/dsl/schemas/training_schema.yaml`
- **Golden Example**: `/home/noise83/Projects/GACP-ERP/dsl/process/SOP-AUDIT-001-AUDIT_TRAIL.yaml`

---

## 1. PROCESS FILE STRUCTURE (sop_process)

### 1.1 File Header (MANDATORY)
```yaml
# DSL: [Process Name]
# Version: [version]
# Source: [SOP_FileName.md] v[version]
# Date: YYYY-MM-DD

schema_version: "1.0.0"
schema_type: "sop_process"
```

### 1.2 METADATA Section (REQUIRED FIELDS)

```yaml
# ==============================================================================
# METADATA
# ==============================================================================
metadata:
  process_id: "SOP-XXX-001"          # ✓ REQUIRED - Format: SOP-[DOMAIN]-[NUMBER]
  process_type: "sop"                # ✓ REQUIRED - ENUM: sop | work_instruction | policy
  version: "1.0"                     # ✓ REQUIRED
  status: "active"                   # ✓ REQUIRED - ENUM: draft | active | deprecated
  domain: "compliance"               # ✓ REQUIRED - ENUM: cultivation | processing | quality_control | sanitation | equipment | safety | security | documentation | training | compliance
  classification: "critical"         # ✓ REQUIRED - ENUM: critical | important | standard

  effective_date: "YYYY-MM-DD"      # Optional
  supersedes: null                   # Optional - Previous version or null
  review_period_months: 12           # Optional

  related_processes:                 # Optional - Array of process IDs
    - "SOP-XXX-001"
    - "SOP-YYY-001"

  regulatory_refs:                   # Optional - Array of regulatory references
    - "FDA 21 CFR Part 11"
    - "WHO GACP Guidelines"
```

**❌ FORBIDDEN in metadata:**
- `title` field (not in schema)
- `department` field (use `domain` instead)
- Any non-enum values for `process_type`, `status`, `domain`, `classification`

### 1.3 PROCESS Section (REQUIRED)

```yaml
# ==============================================================================
# PROCESS DEFINITION
# ==============================================================================
process:
  purpose: "Short declarative statement of process objective"  # ✓ REQUIRED

  scope_areas:                       # ✓ REQUIRED - Array of applicable areas
    - "area_1"
    - "area_2"

  frequency: "continuous"            # ✓ REQUIRED - String describing execution frequency

  prerequisites:                     # Optional - Array of required conditions
    - "prerequisite_1"
    - "prerequisite_2"

  dependencies:                      # Optional - Array of required resources
    - "dependency_1"
    - "dependency_2"

  duration_estimate: 120             # Optional - Minutes or null
  critical_path: true                # Optional - Boolean
```

### 1.4 ROLES Section (REQUIRED)

```yaml
# ==============================================================================
# ROLES AND RESPONSIBILITIES
# ==============================================================================
roles:
  - role_id: "ROLE-XXX-001"          # ✓ REQUIRED - Unique role identifier
    role_name: "Role Title"          # ✓ REQUIRED
    qualifications:                  # ✓ REQUIRED
      required:                      # Array of required qualifications
        - "Qualification 1"
        - "Qualification 2"
      optional:                      # Array of optional qualifications (can be empty [])
        - "Optional qualification"
        - []                         # Use [] if no optional qualifications
    responsibilities:                # ✓ REQUIRED - Array of responsibility objects
      - action: "Specific responsibility description"
        accountability: "accountable"  # ENUM: responsible | accountable | consulted | informed
        verification: "approved"       # ENUM: none | documented | witnessed | approved
```

**❌ FORBIDDEN in roles:**
- Roles embedded in procedure steps as simple strings
- Missing `role_id`, `qualifications`, or `responsibilities` structure
- Non-enum values for `accountability` or `verification`

### 1.5 PARAMETERS Section (Optional but Recommended)

```yaml
# ==============================================================================
# OPERATIONAL PARAMETERS
# ==============================================================================
parameters:
  environmental:                     # Optional
    temperature:
      min_celsius: null
      max_celsius: null
      target_celsius: 22
      tolerance: 2
      control_required: true
    humidity:
      min_percent: null
      max_percent: null
      target_percent: 50
      tolerance: 10
      control_required: true
    pressure:
      min_pascal: null
      max_pascal: null
      control_required: false
    lighting:
      required: true
      type: "artificial"             # ENUM: natural | artificial | none
      intensity_lux: 500

  temporal:                          # Optional
    exposure_time_min: null
    contact_time_min: 5
    dwell_time_min: null
    pre_operation_wait_min: null
    post_operation_wait_min: null

  physical:                          # Optional
    area_m2: null
    volume_m3: null
    flow_rate_lpm: null
    pressure_kpa: null

  performance:                       # Custom parameters as needed
    max_latency_seconds: 5
    target_efficiency_percent: 95
```

### 1.6 MATERIALS Section (Optional)

```yaml
# ==============================================================================
# MATERIALS AND CHEMICALS
# ==============================================================================
materials:
  - material_id: "MAT-XXX-001"       # ✓ REQUIRED
    material_name: "Material Name"   # ✓ REQUIRED
    cas_number: "123-45-6"           # Optional - CAS number or null
    concentration: "70% v/v"         # Optional - or "defined_by_qa" or null
    volume_ml: 1000                  # Optional - or null
    quantity: "defined_by_operator"  # Optional - or specific quantity or null
    preparation:                     # Optional
      method: "defined_by_manufacturer"
      dilution_ratio: "1:10"
      mixing_order:
        - "Step 1"
        - "Step 2"
    safety_class: "hazardous"        # ✓ REQUIRED - ENUM: hazardous | irritant | corrosive | safe
    storage_requirements: "Cool, dry place"
    disposal_method: "SOP-WASTE-001"
```

### 1.7 EQUIPMENT Section (Optional)

```yaml
# ==============================================================================
# EQUIPMENT AND TOOLS
# ==============================================================================
equipment:
  - equipment_id: "EQP-XXX-001"      # ✓ REQUIRED
    equipment_name: "Equipment Name" # ✓ REQUIRED
    equipment_type: "measuring_instrument"  # ✓ REQUIRED - ENUM: measuring_instrument | cleaning_tool | protective_equipment | monitoring_device | processing_equipment | safety_equipment
    calibration_required: true       # ✓ REQUIRED - Boolean
    calibration_frequency_days: 90   # Optional - or null if not required
    specifications:                  # Optional
      accuracy: "±0.1%"
      range: "0-100 units"
      resolution: "0.01 units"
    maintenance_ref: "SOP-EQMAINT-001"  # Optional
```

### 1.8 PROCEDURE Section (REQUIRED - SINGULAR!)

**⚠️ CRITICAL: Use `procedure:` (SINGULAR), NOT `procedures:` (PLURAL)**

```yaml
# ==============================================================================
# PROCEDURE STEPS
# ==============================================================================
procedure:
  - step_number: 1                   # ✓ REQUIRED - Integer
    step_id: "PROC-XXX-001"          # ✓ REQUIRED - Unique step identifier
    action: "Imperative verb + object description"  # ✓ REQUIRED - Clear action statement

    substeps:                        # Optional - Array or null
      - substep_id: "PROC-XXX-001-01"
        action: "Detailed substep action"
        parameters: null

    parameters:                      # Optional - Object or null
      parameter_name: value

    controls:                        # Optional - Array or null
      - control_type: "verification"  # ENUM: visual | measurement | documentation | verification
        parameter: "parameter_being_controlled"
        acceptance_criteria: "Specific criteria or defined_by_qa"
        frequency: "continuous"      # ENUM: continuous | per_batch | periodic | as_needed

    documentation_required: true     # ✓ REQUIRED - Boolean
    forms:                           # Optional - Array or empty []
      - "FORM-XXX-001"

    safety_considerations:           # Optional - Array or null
      - "Safety point 1"
      - "Safety point 2"

    critical_step: true              # Optional - Boolean
    verification_method: "witnessed"  # Optional - String or null
```

### 1.9 QUALITY CONTROLS Section (REQUIRED)

```yaml
# ==============================================================================
# QUALITY CONTROLS
# ==============================================================================
quality_controls:
  - control_id: "QC-XXX-001"         # ✓ REQUIRED
    control_type: "periodic"         # ✓ REQUIRED - ENUM: continuous | periodic | event_based
    parameter: "Parameter name"      # ✓ REQUIRED
    method: "Test/verification method"  # ✓ REQUIRED
    frequency: "Daily"               # ✓ REQUIRED
    acceptance_criteria: "Specific criteria"  # ✓ REQUIRED
    documentation_form: "FORM-XXX-001"  # Optional
    out_of_spec_action: "SOP-OOS-001"  # Optional
```

### 1.10 SAFETY Section (REQUIRED)

```yaml
# ==============================================================================
# SAFETY REQUIREMENTS
# ==============================================================================
safety:
  ppe_required:                      # ✓ REQUIRED - Object
    head_protection: false           # Boolean
    eye_protection: true             # Boolean
    respiratory_protection: false    # Boolean
    hand_protection: "gloves"        # String or false
    body_protection: "lab_coat"      # String or false
    foot_protection: true            # Boolean

  hazards:                           # ✓ REQUIRED - Array (can be empty if none)
    - hazard_type: "chemical"        # ENUM: chemical | biological | physical | ergonomic | environmental
      hazard_description: "Description"
      risk_level: "medium"           # ENUM: low | medium | high | critical
      mitigation_measures:
        - "Measure 1"
        - "Measure 2"
      emergency_procedure_ref: "SOP-EMERGENCY-001"

  training_required:                 # ✓ REQUIRED - Array (can be empty if none)
    - training_id: "TRN-XXX-001"
      training_name: "Training name"
      frequency_months: 12
      certification_required: true
```

### 1.11 DOCUMENTATION Section (REQUIRED)

```yaml
# ==============================================================================
# DOCUMENTATION REQUIREMENTS
# ==============================================================================
documentation:
  records_generated:                 # ✓ REQUIRED - Array
    - record_id: "REC-XXX-001"
      record_name: "Record name"
      record_type: "log"             # ENUM: log | form | report | certificate | batch_record
      form_ref: "FORM-XXX-001"       # Optional
      retention_years: 7
      storage_location: "electronic"  # ENUM: electronic | paper | both
      access_control: "restricted"   # ENUM: public | restricted | confidential

  data_integrity_requirements:      # ✓ REQUIRED - Object
    alcoa_plus_compliance: true
    electronic_signature_required: true
    audit_trail_required: true
    backup_required: true

  review_requirements:               # ✓ REQUIRED - Object
    review_frequency: "monthly"
    reviewer_role: "QA Manager"
    approval_required: true
    approver_role: "Quality Director"
```

### 1.12 DEVIATIONS Section (REQUIRED)

```yaml
# ==============================================================================
# DEVIATION HANDLING
# ==============================================================================
deviations:
  deviation_handling:                # ✓ REQUIRED - Object
    reporting_required: true
    reporting_procedure_ref: "SOP-DEV-001"
    investigation_required: true
    capa_trigger_criteria: "Any critical deviation"
```

### 1.13 VALIDATION Section (Optional but Recommended)

```yaml
# ==============================================================================
# VALIDATION AND CONTINUOUS IMPROVEMENT
# ==============================================================================
validation:
  validation_status: "validated"     # ENUM: not_required | planned | in_progress | validated | revalidation_required
  validation_protocol_ref: "VAL-XXX-001"
  revalidation_trigger_events:
    - "Event 1"
    - "Event 2"

  performance_indicators:            # Optional - Array
    - kpi_id: "KPI-XXX-001"
      kpi_name: "KPI name"
      measurement_method: "Method"
      target_value: "≥95%"
      review_frequency: "monthly"
```

### 1.14 REFERENCES and DEFINITIONS (Optional)

```yaml
# ==============================================================================
# REFERENCES
# ==============================================================================
references:
  - ref_id: "REF-001"
    reference_text: "Regulatory reference"
    version: "Current"

# ==============================================================================
# DEFINITIONS AND ABBREVIATIONS
# ==============================================================================
definitions:
  - term: "Term"
    definition: "Definition text"
    abbreviation: "ABR"

# ==============================================================================
# CHANGE HISTORY
# ==============================================================================
change_history:
  - version: "1.0"
    date: "YYYY-MM-DD"
    author: "Author name"
    description: "Initial DSL conversion from [source]"
    approved_by: "Approver name"
```

---

## 2. VALIDATION CHECKLIST

Before committing any process DSL file, verify:

### ✅ Metadata
- [ ] `process_id` present and correctly formatted
- [ ] `process_type` is one of: sop | work_instruction | policy
- [ ] `version` present
- [ ] `status` is one of: draft | active | deprecated
- [ ] `domain` is valid enum value from schema
- [ ] `classification` is one of: critical | important | standard
- [ ] NO `title` field
- [ ] NO `department` field (use `domain` instead)

### ✅ Process
- [ ] `purpose` statement present
- [ ] `scope_areas` array present with items
- [ ] `frequency` specified

### ✅ Roles
- [ ] Roles is ARRAY of objects
- [ ] Each role has `role_id`, `role_name`
- [ ] Each role has `qualifications` with `required` and `optional` arrays
- [ ] Each role has `responsibilities` array
- [ ] Each responsibility has `action`, `accountability`, `verification`
- [ ] Accountability values are valid: responsible | accountable | consulted | informed
- [ ] Verification values are valid: none | documented | witnessed | approved

### ✅ Procedure
- [ ] Section is named `procedure:` (SINGULAR) NOT `procedures:`
- [ ] Steps have `step_number`, `step_id`, `action`
- [ ] Steps have `documentation_required` (boolean)
- [ ] Controls use valid `control_type`: visual | measurement | documentation | verification
- [ ] Controls use valid `frequency`: continuous | per_batch | periodic | as_needed

### ✅ Required Sections Present
- [ ] `quality_controls` section exists
- [ ] `safety` section exists with `ppe_required`, `hazards`, `training_required`
- [ ] `documentation` section exists
- [ ] `deviations` section exists

---

## 3. COMMON MISTAKES TO AVOID

### ❌ WRONG:
```yaml
metadata:
  title: "Some Title"              # NOT IN SCHEMA
  department: "Engineering"        # WRONG - use domain
  # Missing process_type
  # Missing status
```

### ✅ CORRECT:
```yaml
metadata:
  process_id: "SOP-EQ-001"
  process_type: "sop"
  version: "1.0"
  status: "active"
  domain: "equipment"
  classification: "critical"
```

### ❌ WRONG:
```yaml
procedures:  # PLURAL - WRONG!
  - procedure_number: 1
    roles: ["Engineer", "Technician"]  # Strings - WRONG!
```

### ✅ CORRECT:
```yaml
procedure:  # SINGULAR
  - step_number: 1
    step_id: "STEP-001"
    action: "Perform action"
    # ... other fields
```

---

## 4. WORKFLOW

### Before Creating ANY DSL File:

1. **READ the appropriate schema file**:
   - For process: `dsl/schemas/sop_schema.yaml`
   - For forms: `dsl/schemas/form_schema.yaml`
   - For checklists: `dsl/schemas/checklist_schema.yaml`
   - For reports: `dsl/schemas/report_schema.yaml`
   - For training: `dsl/schemas/training_schema.yaml`

2. **REVIEW the golden example**: `dsl/process/SOP-AUDIT-001-AUDIT_TRAIL.yaml`

3. **READ the source SOP markdown file** completely

4. **PLAN the structure** based on schema requirements

5. **CREATE the DSL file** following schema exactly

6. **VALIDATE against checklist** above

7. **COMMIT only after validation**

---

## 5. FILE NAMING CONVENTIONS

### Process Files
- Location: `/dsl/process/`
- Format: `SOP-[DOMAIN]-[NUMBER]-[DESCRIPTION].yaml`
- Example: `SOP-AUDIT-001-AUDIT_TRAIL.yaml`

### Form Files
- Location: `/dsl/forms/`
- Format: `FORM-[DOMAIN]-[NUMBER]-[DESCRIPTION].yaml`
- Example: `FORM-CLN-001-CHEMICAL_PREPARATION.yaml`

### Checklist Files
- Location: `/dsl/checklists/`
- Format: `CHKLST-[DOMAIN]-[NUMBER]-[DESCRIPTION].yaml`
- Example: `CHKLST-CLN-001-DAILY_CULTIVATION_CLEANING.yaml`

### Report Files
- Location: `/dsl/reports/`
- Format: `REPORT-[DOMAIN]-[NUMBER]-[DESCRIPTION].yaml`
- Example: `REPORT-CLN-001-MONTHLY_PERFORMANCE.yaml`

### Training Files
- Location: `/dsl/training/`
- Format: `TRN-[DOMAIN]-[NUMBER]-[DESCRIPTION].yaml`
- Example: `TRN-CLN-001-CLEANING_SANITATION_TRAINING.yaml`

---

## 6. TROUBLESHOOTING

### Issue: "Structure doesn't match schema"
**Solution**: Re-read the schema file line by line and compare with your DSL

### Issue: "Missing required section"
**Solution**: Check validation checklist above - all sections marked ✓ REQUIRED must be present

### Issue: "Invalid enum value"
**Solution**: Verify enum values from schema - don't invent your own

### Issue: "Roles not structured correctly"
**Solution**: Roles must be array of objects with role_id, qualifications, responsibilities - NOT strings

---

## 7. QUALITY STANDARDS

All DSL files MUST:
- ✅ Validate against schema
- ✅ Be deterministic and reproducible
- ✅ Contain no prose (use structured data)
- ✅ Use null for undefined values
- ✅ Follow YAML best practices
- ✅ Include comprehensive comments with section markers
- ✅ Use consistent formatting and indentation (2 spaces)

---

## VERSION HISTORY

- **1.0.0** (2026-01-09): Initial comprehensive DSL generation rules based on lessons learned
