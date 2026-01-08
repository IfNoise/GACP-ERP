# DSL Implementation Guide

## Overview

This directory contains the Domain-Specific Language (DSL) definitions for the GACP-ERP documentation system. The DSL serves as the **single source of truth** for all operational procedures, forms, reports, checklists, and training materials.

## Core Principles

1. **The internal DSL is the single source of truth** - All human-readable documentation (SOP, WI, Policies) is generated FROM the DSL, never the other way around.

2. **Markdown documents are derived artifacts** - They are never authoritative and are regenerated from DSL whenever changes occur.

3. **Missing information is explicitly marked**:
   - `"defined_by_qa"` - Quality Assurance defines this value
   - `"defined_by_regulation"` - Regulatory requirement specifies this
   - `"defined_by_manufacturer"` - Equipment/chemical manufacturer specifies
   - `"defined_by_operator"` - Operator determines based on conditions
   - `"defined_by_management"` - Management decision required
   - `"to_be_determined"` - Pending determination
   - `"not_applicable"` - Does not apply to this process

4. **Never optimize or modify processes** - DSL compiler role is to normalize and structure, not to invent or improve.

5. **No operational facts are invented** - Parameters, limits, concentrations, timings, or equipment are never created; they must come from source documents.

## Directory Structure

```
dsl/
├── schemas/              # Schema definitions
│   ├── sop_schema.yaml           # SOP process schema
│   ├── form_schema.yaml          # Forms schema
│   ├── training_schema.yaml      # Training schema
│   ├── checklist_schema.yaml     # Checklists schema (NEW)
│   └── report_schema.yaml        # Reports schema (NEW)
│
├── process/              # SOP process definitions
│   ├── SOP-COC-001-CHAIN_OF_CUSTODY.yaml # Example: Complete CoC SOP
│   └── ... (one YAML per SOP)
│
├── forms/                # Form definitions
│   ├── FORM-COC-001-RECEIPT.yaml    # Example: CoC receipt form
│   └── ... (one YAML per form)
│
├── checklists/           # Checklist definitions
│   ├── CHKLST-COC-001-VERIFICATION.yaml # Example: CoC verification
│   └── ... (one YAML per checklist)
│
├── reports/              # Report definitions
│   └── ... (one YAML per report)
│
├── training/             # Training material definitions
│   ├── TRN-COC-001-PROCEDURES.yaml # Example: CoC training
│   └── ... (one YAML per training)
│
├── GENERATION_GUIDE.md   # Guide for generating documentation from DSL
├── DOCUMENT_MAPPING.md   # Mapping of SOPs to referenced documents
└── README.md             # This file
```

## Naming Conventions

### Process (SOP) Files
- **Format**: `sop_{topic_name}.yaml`
- **Example**: `sop_chain_of_custody.yaml`
- **ID in file**: `SOP-{CATEGORY}-{NUMBER}` (e.g., `SOP-COC-001`)

### Form Files
- **Format**: `form_{form_purpose}.yaml`
- **Example**: `form_coc_receipt.yaml`
- **ID in file**: `FORM-{CATEGORY}-{NUMBER}` (e.g., `FORM-COC-001`)

### Checklist Files
- **Format**: `checklist_{checklist_purpose}.yaml`
- **Example**: `checklist_coc_verification.yaml`
- **ID in file**: `CHKLST-{CATEGORY}-{NUMBER}` (e.g., `CHKLST-COC-001`)

### Report Files
- **Format**: `report_{report_name}.yaml`
- **Example**: `report_daily_activity.yaml`
- **ID in file**: `RPT-{CATEGORY}-{NUMBER}` (e.g., `RPT-QA-001`)

### Training Files
- **Format**: `training_{training_topic}.yaml`
- **Example**: `training_chain_of_custody.yaml`
- **ID in file**: `TRN-{CATEGORY}-{NUMBER}` or `CUR-{NUMBER}` (e.g., `TRN-COC-001`, `CUR-003`)

## Category Codes

### Common Categories
- **COC** - Chain of Custody
- **CLN** - Cleaning/Sanitation
- **EQP** - Equipment
- **QA** - Quality Assurance
- **QC** - Quality Control
- **TRN** - Training
- **DEV** - Deviation
- **CAPA** - Corrective/Preventive Action
- **AUD** - Audit
- **DOC** - Document Control
- **SAM** - Sampling
- **SAN** - Sanitation
- **SAFE** - Safety

## Workflow: From SOP to DSL

### Step 1: Analyze Source SOP
1. Read the SOP Markdown document completely
2. Identify all sections and their content
3. Extract all references to forms, reports, checklists, and training
4. Note any missing information (mark with appropriate placeholder)

### Step 2: Create Process DSL
1. Use `sop_schema.yaml` as reference
2. Create `process/sop_{name}.yaml`
3. Populate all sections according to schema
4. Use `"defined_by_*"` markers for missing information
5. Never invent data not in source document

### Step 3: Create Referenced Documents
For each form, report, checklist, or training mentioned in the SOP:
1. Create corresponding YAML file in appropriate directory
2. Use relevant schema as reference
3. Extract all available information from source
4. Mark missing information appropriately

### Step 4: Validate
1. Check all required fields are present
2. Verify referential integrity (all referenced IDs exist)
3. Ensure no invented operational facts
4. Confirm language-neutral structure

## Example: Complete Document Set

For **SOP_ChainOfCustody.md**, we created:

### Process DSL
- `process/SOP-COC-001-CHAIN_OF_CUSTODY.yaml` - Main SOP definition

### Forms DSL
- `forms/FORM-COC-001-RECEIPT.yaml` - Material receipt form (FORM-COC-001)
- `forms/FORM-COC-003-INTERNAL_TRANSFER.yaml` - Internal transfer form (FORM-COC-003)
- `forms/FORM-COC-004-SHIPPING.yaml` - Shipping form (FORM-COC-004)
- `forms/FORM-DEV-001-DEVIATION.yaml` - Deviation report (FORM-DEV-001)

### Checklists DSL
- `checklists/CHKLST-COC-001-VERIFICATION.yaml` - CoC verification (CHKLST-COC-001)

### Training DSL
- `training/TRN-COC-001-PROCEDURES.yaml` - CoC procedures training (TRN-COC-001)

### Reports DSL
(To be created based on requirements)
- `reports/report_coc_breach.yaml` - CoC breach investigation report

## Validation Rules

### Required Information
- All `required: true` fields in schema must be populated
- No `null` values for required fields
- Use placeholders only for truly undefined values

### Referential Integrity
- All referenced IDs (form_ref, training_ref, etc.) must exist as files
- All role IDs must be defined in roles section
- All equipment IDs must be defined in equipment section

### Language Neutrality
- DSL must be in English only
- No colloquial language
- Use official regulatory terminology
- Localization happens ONLY at generation stage

### Data Integrity
- Numbers must have units
- Dates must be ISO 8601 format
- IDs must follow established patterns
- No operational facts invented

## Error Handling

### If DSL is Incomplete
- **Action**: Report missing fields
- **Example**: "Parameter 'temperature.min_celsius' is missing. Source: SOP-COC-001 Section 7.3 does not specify minimum temperature."

### If DSL is Ambiguous
- **Action**: Request clarification
- **Example**: "Step 3 substep order unclear. Source document lists items without sequential numbering."

### If Markdown Contradicts DSL
- **Action**: DSL wins
- **Reason**: DSL is source of truth. Update DSL if needed, regenerate Markdown.

## Documentation Generation

See [GENERATION_GUIDE.md](GENERATION_GUIDE.md) for instructions on generating human-readable documentation from DSL.

### Generation Process
1. Read DSL YAML file
2. Apply localization (EN/RU)
3. Apply regulatory language templates
4. Generate Markdown in appropriate structure
5. Export to PDF if needed

### Generated Output
- `/docs/generated/en/` - English documentation
- `/docs/generated/ru/` - Russian documentation

## Current Status

### Completed
- ✅ Schema definitions for all document types (SOP, Form, Checklist, Report, Training)
- ✅ Directory structure created
- ✅ Example complete document set (Chain of Custody)
- ✅ Documentation and guides

### In Progress
- 🔄 Analysis of remaining SOPs (45+ documents)
- 🔄 Creation of DSL for all forms mentioned in SOPs
- 🔄 Creation of DSL for all checklists mentioned in SOPs
- 🔄 Creation of DSL for all reports mentioned in SOPs
- 🔄 Creation of DSL for all trainings mentioned in SOPs

### Next Steps
1. **Priority 1: Critical SOPs** (Regulatory compliance)
   - SOP_AuditTrail
   - SOP_DeviationManagement
   - SOP_CAPA
   - SOP_ChangeControl
   - SOP_DocumentControl

2. **Priority 2: Quality & Compliance**
   - SOP_AnalyticalMethods
   - SOP_EquipmentCalibration
   - SOP_InternalAudits
   - SOP_DataIntegrity
   - SOP_Sampling

3. **Priority 3: Operations**
   - SOP_CleaningSanitation
   - SOP_EquipmentManagement
   - SOP_SupplierQualification
   - SOP_Training
   - Remaining SOPs

## Tools and Automation

### Validation Script
```bash
python dsl/validate_schema.py --schema sop --file dsl/process/sop_chain_of_custody.yaml
```

### Generation Script
```bash
python dsl/generate_docs.py --dsl dsl/process/sop_chain_of_custody.yaml --lang en --output docs/generated/en/
```

### Bulk Processing
```bash
python dsl/process_all.py --input dsl/process/ --output docs/generated/
```

## Best Practices

### DO
- ✅ Extract exact information from source documents
- ✅ Use explicit placeholders for undefined values
- ✅ Maintain strict schema compliance
- ✅ Cross-reference all document IDs
- ✅ Validate after every change

### DON'T
- ❌ Invent operational parameters
- ❌ Optimize or improve processes
- ❌ Add steps not in source document
- ❌ Translate or localize DSL content
- ❌ Make assumptions about missing data

## Contributing

### Adding New SOP
1. Create new file in `process/` directory
2. Follow naming convention
3. Populate using `sop_schema.yaml`
4. Identify all referenced documents
5. Create DSL for each referenced document
6. Validate all files
7. Update DOCUMENT_MAPPING.md

### Updating Existing DSL
1. Never edit generated Markdown directly
2. Update DSL source file
3. Validate changes
4. Regenerate documentation
5. Update version number
6. Document changes in revision_history

## Support and Questions

For questions or issues:
1. Check this README and GENERATION_GUIDE.md
2. Review schema files for structure
3. Examine example files (Chain of Custody set)
4. Check DOCUMENT_MAPPING.md for overview

## References

- Schema definitions: `/dsl/schemas/`
- Example implementation: Chain of Custody document set
- Document mapping: `/dsl/DOCUMENT_MAPPING.md`
- Generation guide: `/dsl/GENERATION_GUIDE.md`

---

**Remember**: DSL is declarative, deterministic, and localization-independent. No prose, no interpretation, no assumptions.
