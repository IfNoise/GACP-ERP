---
title: "Contract Specifications Document"
version: "2.0"
status: "active"
last_updated: "2025-10-17"
type: "specifications"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: under_review
change_summary: "Major update: Added 17 new Zod schemas for compliance modules (Change Control, CAPA, Deviation, Validation, QualityEvent, Training, Documents, Analytics); Enhanced 4 existing schemas with GxP validation fields; Added GxPValidationFieldsSchema mixin; Updated event schemas and API contracts"
---

# 📋 Contract Specifications

**Документ**: Contract Specifications Document  
**Версия**: 2.0  
**Дата**: 17 октября 2025  
**Статус**: CRITICAL - Основа для type safety  
**Предыдущая версия**: 1.0 (2025-09-14)  
**Изменения**: Полная синхронизация с DS v2.0, добавлены compliance модули

---

## 🎯 **1. ВВЕДЕНИЕ**

### 1.1 Zod-First Architecture

Все контракты в GACP-ERP системе определяются через **Zod схемы** для обеспечения:

- **Runtime validation** всех данных
- **Type inference** без дублирования типов
- **OpenAPI generation** из схем
- **Единый источник истины** для frontend/backend
- **Автоматическое тестирование** контрактов

### 1.2 Принципы контрактов

```typescript
// ❌ НЕ ИСПОЛЬЗУЕМ: TypeScript интерфейсы
interface User {
  id: string;
  email: string;
}

// ✅ ИСПОЛЬЗУЕМ: Zod схемы с runtime validation
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>; // Автоматический type inference
```

### 1.3 Структура контрактов

```text
libs/
├── shared/
│   ├── schemas/
│   │   ├── plants/           # Plant domain schemas
│   │   ├── iot/             # IoT sensors schemas
│   │   ├── workforce/       # Workforce schemas
│   │   ├── quality/         # Quality control schemas
│   │   ├── logistics/       # Logistics schemas
│   │   ├── compliance/      # Compliance schemas
│   │   ├── auth/            # Authentication schemas
│   │   └── common/          # Shared base schemas
│   ├── events/              # Kafka event schemas
│   └── api-contracts/       # HTTP API contracts
```

---

## 🌱 **2. CORE DOMAIN SCHEMAS**

### 2.1 Common Base Schemas

```typescript
// libs/shared/schemas/common/base.schema.ts
import { z } from "zod";

// Base entity schema
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid().optional(),
});

// Electronic Signature Schema (21 CFR Part 11 §11.50, §11.70, §11.200, §11.300)
export const ElectronicSignatureSchema = z.object({
  signature_id: z.string().uuid(),
  
  // Signatory Information (§11.50 - Signature manifestations)
  signed_by: z.string().uuid(),
  signed_by_name: z.string(),
  signed_by_role: z.string(),
  
  // Signature Details
  signature_type: z.enum([
    'approval',
    'review',
    'verification',
    'witnessed',
    'authorization'
  ]),
  
  // Signature Meaning (§11.50(a) - Printed name)
  signature_meaning: z.string(), // e.g., "Approved by", "Reviewed by"
  
  // Timestamp (§11.50(a) - Date and time)
  signed_at: z.coerce.date(),
  
  // Authentication (§11.200 - ID/Password)
  authentication_method: z.enum([
    'password',
    'biometric',
    'token',
    'two_factor',
    'pki_certificate'
  ]),
  
  // Reason for Signing
  signature_reason: z.string().optional(),
  comments: z.string().optional(),
  
  // Linked Record (§11.70 - Signature/record linking)
  entity_id: z.string().uuid(),
  entity_type: z.string(),
  entity_version: z.string().optional(),
  
  // Cryptographic Elements (§11.70)
  digital_signature: z.string(), // Cryptographic hash
  signature_algorithm: z.string().default('RSA-SHA256'),
  certificate_serial: z.string().optional(),
  
  // Session & Context
  session_id: z.string().uuid(),
  ip_address: z.string().ip(),
  
  // Biometric/Component Signatures (§11.200(a))
  biometric_data_hash: z.string().optional(),
  biometric_type: z.enum(['fingerprint', 'retina', 'voice', 'none']).default('none'),
  
  // Two-Factor Authentication Evidence
  second_factor_method: z.enum(['sms', 'totp', 'email', 'hardware_token', 'none']).default('none'),
  second_factor_verified_at: z.coerce.date().optional(),
  
  // Regulatory Compliance
  gxp_critical: z.boolean().default(true),
  regulatory_requirements: z.array(z.string()).default(['21_CFR_Part_11']),
  
  // Validation Status
  is_valid: z.boolean().default(true),
  invalidated_at: z.coerce.date().optional(),
  invalidation_reason: z.string().optional(),
  invalidated_by: z.string().uuid().optional(),
});

export type ElectronicSignature = z.infer<typeof ElectronicSignatureSchema>;

// Audit trail schema (21 CFR Part 11 Compliant)
export const AuditTrailSchema = z.object({
  audit_id: z.string().uuid(),
  
  // Entity Information
  entity_id: z.string().uuid(),
  entity_type: z.string(),
  
  // Action Details
  action: z.enum([
    "CREATE", 
    "UPDATE", 
    "DELETE", 
    "VIEW", 
    "SIGN", 
    "APPROVE", 
    "REJECT",
    "PRINT",
    "EXPORT",
    "LOCK",
    "UNLOCK"
  ]),
  action_category: z.enum(['data_entry', 'approval', 'review', 'access', 'system']),
  
  // Data Changes (ALCOA+ Attributable & Complete)
  old_values: z.record(z.unknown()).optional(),
  new_values: z.record(z.unknown()).optional(),
  changed_fields: z.array(z.string()).optional(),
  
  // User Attribution (ALCOA+ Attributable)
  performed_by: z.string().uuid(),
  performed_by_name: z.string(),
  performed_by_role: z.string(),
  
  // Timestamp (ALCOA+ Contemporaneous & Original)
  performed_at: z.coerce.date(),
  timestamp_source: z.enum(['system', 'ntp_synced']).default('ntp_synced'),
  
  // Session & Access Information
  session_id: z.string().uuid(),
  ip_address: z.string().ip(),
  user_agent: z.string(),
  access_method: z.enum(['web', 'api', 'mobile', 'batch']),
  
  // Security & Integrity (ALCOA+ Original)
  compliance_hash: z.string(),
  previous_record_hash: z.string().optional(), // Blockchain-style chaining
  digital_signature: z.string().optional(),
  
  // Reason for Change (GxP Requirement)
  change_reason: z.string().optional(),
  change_reason_category: z.enum([
    'correction',
    'amendment',
    'approval',
    'routine_update',
    'system_generated'
  ]).optional(),
  
  // Electronic Signature Link
  electronic_signature_id: z.string().uuid().optional(),
  requires_signature: z.boolean().default(false),
  
  // Regulatory Compliance
  gxp_critical: z.boolean().default(false),
  regulatory_comment: z.string().optional(),
  
  // Retention & Archival
  retention_period_years: z.number().int().positive().default(7),
  archive_status: z.enum(['active', 'archived', 'purged']).default('active'),
  archived_at: z.coerce.date().optional(),
});

// Location schema
export const LocationSchema = z.object({
  facility_id: z.string().uuid(),
  room_id: z.string().uuid(),
  area_id: z.string().uuid(),
  zone_id: z.string().uuid().optional(),
  coordinates: z
    .object({
      x: z.number().min(0),
      y: z.number().min(0),
      z: z.number().min(0).optional(),
    })
    .optional(),
});

// Measurement schema
export const MeasurementSchema = z.object({
  value: z.number(),
  unit: z.string(),
  timestamp: z.coerce.date(),
  sensor_id: z.string().uuid().optional(),
  precision: z.number().positive().optional(),
  confidence_level: z.number().min(0).max(1).optional(),
});

// File/Document schema
export const DocumentSchema = z.object({
  filename: z.string(),
  content_type: z.string(),
  size: z.number().positive(),
  checksum: z.string(),
  storage_path: z.string(),
  mayan_document_id: z.number().positive().optional(),
  signed: z.boolean().default(false),
  signature_hash: z.string().optional(),
});
```

### 2.2 Plants Domain Schemas

```typescript
// libs/shared/schemas/plants/plant.schema.ts
import { z } from "zod";
import {
  BaseEntitySchema,
  LocationSchema,
  DocumentSchema,
} from "../common/base.schema";

// Plant genetics schema
export const PlantGeneticsSchema = z.object({
  strain_name: z.string().min(1).max(100),
  genetics_type: z.enum(["INDICA", "SATIVA", "HYBRID"]),
  thc_percentage: z.number().min(0).max(100).optional(),
  cbd_percentage: z.number().min(0).max(100).optional(),
  terpene_profile: z.record(z.number().min(0)).optional(),
  breeder: z.string().optional(),
  seed_bank: z.string().optional(),
});

// Plant lifecycle stages
export const PlantStageSchema = z.enum([
  "SEED",
  "GERMINATION",
  "SEEDLING",
  "VEGETATIVE",
  "FLOWERING",
  "HARVEST",
  "DRYING",
  "CURING",
  "TESTING",
  "PACKAGED",
  "DESTROYED",
]);

// Plant schema
export const PlantSchema = BaseEntitySchema.extend({
  plant_tag: z.string().regex(/^P\d{8}$/), // P12345678 format
  batch_id: z.string().uuid(),
  genetics: PlantGeneticsSchema,
  current_stage: PlantStageSchema,
  location: LocationSchema,
  planted_date: z.coerce.date(),
  expected_harvest_date: z.coerce.date().optional(),
  actual_harvest_date: z.coerce.date().optional(),
  mother_plant_id: z.string().uuid().optional(),
  clone_generation: z.number().int().min(0).default(0),
  health_status: z.enum([
    "HEALTHY",
    "SICK",
    "PEST_DAMAGE",
    "NUTRIENT_DEFICIENCY",
    "DEAD",
  ]),
  photos: z.array(DocumentSchema).default([]),
  notes: z.string().optional(),
  destroyed: z.boolean().default(false),
  destruction_reason: z.string().optional(),
  destruction_date: z.coerce.date().optional(),
});

// Plant measurement schema
export const PlantMeasurementSchema = BaseEntitySchema.extend({
  plant_id: z.string().uuid(),
  measurement_type: z.enum([
    "HEIGHT",
    "WIDTH",
    "STEM_DIAMETER",
    "LEAF_COUNT",
    "BRANCH_COUNT",
    "BUD_WEIGHT",
    "TOTAL_WEIGHT",
  ]),
  value: z.number().positive(),
  unit: z.string(),
  measured_at: z.coerce.date(),
  measured_by: z.string().uuid(),
  notes: z.string().optional(),
});

// Batch schema
export const BatchSchema = BaseEntitySchema.extend({
  batch_number: z.string().regex(/^B\d{8}$/), // B12345678 format
  genetics: PlantGeneticsSchema,
  plant_count: z.number().int().positive(),
  planted_date: z.coerce.date(),
  expected_harvest_date: z.coerce.date(),
  actual_harvest_date: z.coerce.date().optional(),
  location: LocationSchema,
  status: z.enum(["ACTIVE", "HARVESTED", "DESTROYED"]),
  notes: z.string().optional(),
});

// Type inference for TypeScript
export type Plant = z.infer<typeof PlantSchema>;
export type PlantMeasurement = z.infer<typeof PlantMeasurementSchema>;
export type Batch = z.infer<typeof BatchSchema>;
export type PlantStage = z.infer<typeof PlantStageSchema>;
```

### 2.3 IoT Sensors Schemas

```typescript
// libs/shared/schemas/iot/sensor.schema.ts
import { z } from "zod";
import {
  BaseEntitySchema,
  LocationSchema,
  MeasurementSchema,
} from "../common/base.schema";

// Sensor types
export const SensorTypeSchema = z.enum([
  "TEMPERATURE",
  "HUMIDITY",
  "CO2",
  "PH",
  "EC", // Electrical Conductivity
  "LIGHT_INTENSITY",
  "SOIL_MOISTURE",
  "WATER_LEVEL",
  "PRESSURE",
  "MOTION",
  "DOOR_CONTACT",
  "CAMERA",
  "SCALE",
]);

// Sensor schema
export const SensorSchema = BaseEntitySchema.extend({
  sensor_tag: z.string().regex(/^S\d{8}$/), // S12345678 format
  sensor_type: SensorTypeSchema,
  manufacturer: z.string(),
  model: z.string(),
  serial_number: z.string(),
  firmware_version: z.string().optional(),
  location: LocationSchema,
  calibration_date: z.coerce.date(),
  next_calibration_date: z.coerce.date(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "ERROR"]),
  measurement_interval: z.number().positive(), // seconds
  accuracy: z.number().positive().optional(),
  measurement_range: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.string(),
  }),
  alert_thresholds: z
    .object({
      min_warning: z.number().optional(),
      max_warning: z.number().optional(),
      min_critical: z.number().optional(),
      max_critical: z.number().optional(),
    })
    .optional(),
});

// Sensor reading schema
export const SensorReadingSchema = BaseEntitySchema.extend({
  sensor_id: z.string().uuid(),
  measurement: MeasurementSchema,
  quality_score: z.number().min(0).max(1).default(1),
  alert_level: z.enum(["NORMAL", "WARNING", "CRITICAL"]).default("NORMAL"),
  processed: z.boolean().default(false),
  anomaly_detected: z.boolean().default(false),
});

// Sensor calibration schema
export const SensorCalibrationSchema = BaseEntitySchema.extend({
  sensor_id: z.string().uuid(),
  calibration_type: z.enum([
    "ROUTINE",
    "DRIFT_CORRECTION",
    "REPAIR",
    "INSTALLATION",
  ]),
  reference_value: z.number(),
  measured_value: z.number(),
  adjustment_applied: z.number(),
  calibration_date: z.coerce.date(),
  performed_by: z.string().uuid(),
  certificate_number: z.string().optional(),
  notes: z.string().optional(),
});

export type Sensor = z.infer<typeof SensorSchema>;
export type SensorReading = z.infer<typeof SensorReadingSchema>;
export type SensorCalibration = z.infer<typeof SensorCalibrationSchema>;
export type SensorType = z.infer<typeof SensorTypeSchema>;
```

### 2.4 Workforce Schemas

```typescript
// libs/shared/schemas/workforce/user.schema.ts
import { z } from "zod";
import { BaseEntitySchema } from "../common/base.schema";

// User roles
export const UserRoleSchema = z.enum([
  "ADMIN",
  "QA_MANAGER",
  "CULTIVATION_MANAGER",
  "GROWER",
  "HARVESTER",
  "PROCESSOR",
  "PACKAGER",
  "LOGISTICS_COORDINATOR",
  "COMPLIANCE_OFFICER",
  "VIEWER",
]);

// User schema
export const UserSchema = BaseEntitySchema.extend({
  // Basic Information
  employee_id: z.string().regex(/^E\d{6}$/), // E123456 format
  email: z.string().email(),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  
  // Role & Access
  role: UserRoleSchema,
  department: z.string(),
  job_title: z.string(),
  
  // Employment Status
  hire_date: z.coerce.date(),
  termination_date: z.coerce.date().optional(),
  active: z.boolean().default(true),
  employment_status: z.enum(['active', 'on_leave', 'terminated', 'suspended']).default('active'),
  
  // Authentication & Security (21 CFR Part 11 §11.300)
  two_factor_enabled: z.boolean().default(false),
  last_login: z.coerce.date().optional(),
  password_changed_at: z.coerce.date(),
  password_expiry_date: z.coerce.date(),
  failed_login_attempts: z.number().int().min(0).default(0),
  account_locked: z.boolean().default(false),
  account_locked_until: z.coerce.date().optional(),
  
  // GxP Training & Qualifications
  training_completed: z.array(z.string().uuid()).default([]),
  training_status: z.enum(['current', 'expiring_soon', 'expired', 'not_trained']).default('not_trained'),
  gmp_training_current: z.boolean().default(false),
  gmp_training_expiry: z.coerce.date().optional(),
  
  // Certifications
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        issued_date: z.coerce.date(),
        expiry_date: z.coerce.date().optional(),
        certificate_number: z.string(),
        status: z.enum(['valid', 'expired', 'revoked']).default('valid'),
      })
    )
    .default([]),
  
  // Electronic Signature Configuration (21 CFR Part 11 §11.100, §11.200)
  electronic_signature_enabled: z.boolean().default(false),
  signature_biometric_enrolled: z.boolean().default(false),
  signature_certificate_id: z.string().optional(),
  signature_certificate_expiry: z.coerce.date().optional(),
  
  // Access Control & Authorization
  authorized_systems: z.array(z.string()).default([]),
  authorized_areas: z.array(z.string().uuid()).default([]),
  data_access_level: z.enum(['read_only', 'read_write', 'admin', 'super_admin']).default('read_only'),
  
  // Audit & Compliance
  requires_supervision: z.boolean().default(false),
  supervisor_id: z.string().uuid().optional(),
  gxp_critical_role: z.boolean().default(false),
  
  // User Preferences
  preferred_language: z.string().default('en'),
  timezone: z.string().default('UTC'),
});

// Training record schema
export const TrainingRecordSchema = BaseEntitySchema.extend({
  user_id: z.string().uuid(),
  training_module: z.string(),
  completion_date: z.coerce.date(),
  score: z.number().min(0).max(100).optional(),
  certificate_issued: z.boolean().default(false),
  certificate_number: z.string().optional(),
  valid_until: z.coerce.date().optional(),
  instructor: z.string().uuid().optional(),
});

// Work session schema
export const WorkSessionSchema = BaseEntitySchema.extend({
  user_id: z.string().uuid(),
  clock_in: z.coerce.date(),
  clock_out: z.coerce.date().optional(),
  location: z.string(),
  activities: z
    .array(
      z.object({
        activity_type: z.string(),
        start_time: z.coerce.date(),
        end_time: z.coerce.date().optional(),
        notes: z.string().optional(),
      })
    )
    .default([]),
  total_hours: z.number().min(0).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type TrainingRecord = z.infer<typeof TrainingRecordSchema>;
export type WorkSession = z.infer<typeof WorkSessionSchema>;
```

---

## � **2.5 Compliance Domain Schemas**

> **NEW in v2.0**: Complete compliance modules aligned with DS v2.0

### 2.5.1 GxP Validation Fields Mixin

```typescript
// libs/shared/schemas/compliance/gxp-validation-fields.schema.ts
import { z } from "zod";

/**
 * GxP Validation Fields Schema - ALCOA+ Compliance
 * 
 * Reusable mixin for GxP-compliant tables requiring:
 * - Validation status tracking
 * - Electronic signatures
 * - Audit trail integration
 * - Regulatory compliance metadata
 */
export const GxPValidationFieldsSchema = z.object({
  // Validation Status
  validation_status: z.enum([
    'draft',           // Initial creation, not validated
    'pending_review',  // Awaiting QA review
    'validated',       // QA approved
    'rejected',        // QA rejected
    'superseded',      // Replaced by newer version
    'archived'         // Historical record
  ]),
  
  // Electronic Signature Reference
  signature_id: z.string().uuid()
    .describe("References electronic_signatures table (FDA 21 CFR Part 11)"),
  
  // Validation Metadata
  validated_by: z.string().uuid().optional()
    .describe("User who validated/approved the record"),
  validated_at: z.coerce.date().optional()
    .describe("Timestamp of validation/approval"),
  
  // Audit Trail Reference
  audit_trail_id: z.string().uuid()
    .describe("References audit_trail table for complete history"),
  
  // ALCOA+ Compliance Fields
  alcoa_attributable: z.boolean().default(true)
    .describe("Record is attributable to specific user"),
  alcoa_legible: z.boolean().default(true)
    .describe("Record is legible and permanent"),
  alcoa_contemporaneous: z.boolean().default(true)
    .describe("Record created at time of activity"),
  alcoa_original: z.boolean().default(true)
    .describe("Record is original or true copy"),
  alcoa_accurate: z.boolean().default(true)
    .describe("Record is accurate and complete"),
  
  // Data Integrity Hash (for tamper detection)
  compliance_hash: z.string()
    .describe("SHA-256 hash of critical fields for integrity verification"),
  
  // Version Control
  version: z.number().int().positive().default(1)
    .describe("Record version number for change tracking"),
  superseded_by: z.string().uuid().optional()
    .describe("ID of record that supersedes this one"),
});

export type GxPValidationFields = z.infer<typeof GxPValidationFieldsSchema>;
```

### 2.5.2 Change Control Module

```typescript
// libs/shared/schemas/compliance/change-control.schema.ts
import { z } from "zod";
import { BaseEntitySchema } from "../common/base.schema";
import { GxPValidationFieldsSchema } from "./gxp-validation-fields.schema";

/**
 * DS-CHG-001: Change Requests
 * Manages all system changes with impact assessment and approval workflows
 */
export const ChangeRequestSchema = BaseEntitySchema.extend({
  change_id: z.string().uuid(),
  change_number: z.string().regex(/^CHG-\d{4}-\d{4}$/)
    .describe("Format: CHG-2025-0001"),
  
  // Change Classification
  change_type: z.enum([
    'data_structure',
    'process',
    'equipment',
    'software',
    'facility',
    'documentation',
    'procedure',
    'system_configuration'
  ]),
  
  // Change Details
  title: z.string().min(10).max(255),
  description: z.string().min(50)
    .describe("Detailed description of proposed change"),
  justification: z.string().min(50)
    .describe("Business or regulatory justification"),
  
  // Impact Assessment
  gxp_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  affected_entities: z.array(z.object({
    entity_type: z.string().describe("Table/module name"),
    entity_id: z.string().uuid(),
    impact_description: z.string()
  })).min(1),
  
  // Risk Assessment
  risk_assessment: z.object({
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    identified_risks: z.array(z.string()).min(1),
    mitigation_measures: z.array(z.string()).min(1),
    residual_risk: z.enum(['low', 'medium', 'high']).optional()
  }),
  
  // Regulatory Requirements
  revalidation_required: z.boolean().default(false),
  training_required: z.boolean().default(false),
  testing_required: z.boolean().default(false),
  documentation_update_required: z.boolean().default(false),
  
  // Workflow Status
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
  
  // Timeline
  requested_by: z.string().uuid(),
  requested_at: z.coerce.date(),
  target_completion_date: z.coerce.date(),
  actual_completion_date: z.coerce.date().optional(),
  
  // Approval Chain
  approval_chain: z.array(z.object({
    role: z.string(),
    required: z.boolean(),
    approved: z.boolean().optional(),
    approver_id: z.string().uuid().optional(),
    approved_at: z.coerce.date().optional()
  })).default([]),
  
  // Related Records
  related_deviations: z.array(z.string().uuid()).default([]),
  related_capas: z.array(z.string().uuid()).default([]),
  
  // Attachments
  attachments: z.array(z.object({
    filename: z.string(),
    file_path: z.string(),
    uploaded_by: z.string().uuid(),
    uploaded_at: z.coerce.date()
  })).default([]),
  
}).merge(GxPValidationFieldsSchema);

/**
 * DS-CHG-002: Change Approvals
 * Individual approvals within change control workflow
 */
export const ChangeApprovalSchema = BaseEntitySchema.extend({
  approval_id: z.string().uuid(),
  change_id: z.string().uuid(),
  
  // Approver Information
  approver_role: z.enum([
    'quality_assurance',
    'quality_control',
    'production_manager',
    'it_manager',
    'compliance_officer',
    'regulatory_affairs',
    'facility_manager'
  ]),
  approver_id: z.string().uuid(),
  
  // Approval Decision
  decision: z.enum(['approved', 'rejected', 'conditional']),
  conditions: z.string().optional()
    .describe("Conditions for conditional approval"),
  comments: z.string().optional(),
  
  // Metadata
  reviewed_at: z.coerce.date(),
  approved_at: z.coerce.date(),
  
}).merge(GxPValidationFieldsSchema);

/**
 * DS-CHG-003: Change Implementation History
 * Step-by-step implementation tracking
 */
export const ChangeImplementationHistorySchema = BaseEntitySchema.extend({
  implementation_id: z.string().uuid(),
  change_id: z.string().uuid(),
  
  // Implementation Step
  step_number: z.number().int().positive(),
  step_description: z.string(),
  expected_duration_minutes: z.number().int().positive().optional(),
  
  // Execution
  implemented_by: z.string().uuid(),
  implemented_at: z.coerce.date(),
  completion_notes: z.string().optional(),
  
  // Verification
  verification_required: z.boolean().default(true),
  verified_by: z.string().uuid().optional(),
  verified_at: z.coerce.date().optional(),
  verification_result: z.enum(['pass', 'fail']).optional(),
  verification_notes: z.string().optional(),
  
  // Evidence
  evidence_files: z.array(z.object({
    filename: z.string(),
    file_path: z.string(),
    uploaded_at: z.coerce.date()
  })).default([]),
  
}).merge(GxPValidationFieldsSchema);

export type ChangeRequest = z.infer<typeof ChangeRequestSchema>;
export type ChangeApproval = z.infer<typeof ChangeApprovalSchema>;
export type ChangeImplementationHistory = z.infer<typeof ChangeImplementationHistorySchema>;
```

### 2.5.3 CAPA Module (Corrective and Preventive Actions)

```typescript
// libs/shared/schemas/compliance/capa.schema.ts
import { z } from "zod";
import { BaseEntitySchema } from "../common/base.schema";
import { GxPValidationFieldsSchema } from "./gxp-validation-fields.schema";

/**
 * DS-CAPA-001: CAPA Records
 * Corrective and Preventive Action management
 */
export const CAPASchema = BaseEntitySchema.extend({
  capa_id: z.string().uuid(),
  capa_number: z.string().regex(/^CAPA-\d{4}-\d{4}$/)
    .describe("Format: CAPA-2025-0001"),
  
  // Classification
  capa_type: z.enum(['corrective', 'preventive', 'both']),
  severity: z.enum(['minor', 'major', 'critical']),
  
  // Source
  source_type: z.enum([
    'deviation',
    'audit_finding',
    'customer_complaint',
    'internal_review',
    'regulatory_inspection',
    'quality_event',
    'risk_assessment'
  ]),
  source_id: z.string().uuid().optional()
    .describe("ID of source record (deviation, audit, etc.)"),
  
  // Problem Description
  title: z.string().min(10).max(255),
  problem_description: z.string().min(50),
  identified_date: z.coerce.date(),
  identified_by: z.string().uuid(),
  
  // Root Cause Analysis
  root_cause_analysis: z.object({
    method: z.enum(['5_whys', 'fishbone', 'fault_tree', 'pareto', 'other']),
    findings: z.string().min(50),
    root_causes: z.array(z.string()).min(1),
    contributing_factors: z.array(z.string()).default([])
  }),
  
  // Corrective Actions
  corrective_actions: z.array(z.object({
    action_description: z.string(),
    responsible_person: z.string().uuid(),
    target_date: z.coerce.date(),
    completed_date: z.coerce.date().optional(),
    status: z.enum(['planned', 'in_progress', 'completed', 'verified']),
    verification_notes: z.string().optional()
  })).default([]),
  
  // Preventive Actions
  preventive_actions: z.array(z.object({
    action_description: z.string(),
    responsible_person: z.string().uuid(),
    target_date: z.coerce.date(),
    completed_date: z.coerce.date().optional(),
    status: z.enum(['planned', 'in_progress', 'completed', 'verified'])
  })).default([]),
  
  // Effectiveness Check
  effectiveness_check_required: z.boolean().default(true),
  effectiveness_check_date: z.coerce.date().optional(),
  effectiveness_check_result: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
  effectiveness_check_notes: z.string().optional(),
  
  // Workflow
  status: z.enum([
    'open',
    'investigation',
    'action_plan',
    'implementation',
    'verification',
    'closed',
    'cancelled'
  ]),
  
  // Timeline
  target_closure_date: z.coerce.date(),
  actual_closure_date: z.coerce.date().optional(),
  
}).merge(GxPValidationFieldsSchema);

/**
 * DS-CAPA-002: CAPA Action Items
 * Individual action items within a CAPA
 */
export const CAPAActionItemSchema = BaseEntitySchema.extend({
  action_item_id: z.string().uuid(),
  capa_id: z.string().uuid(),
  
  // Action Details
  action_type: z.enum(['corrective', 'preventive']),
  action_number: z.number().int().positive(),
  description: z.string().min(20),
  
  // Assignment
  assigned_to: z.string().uuid(),
  assigned_by: z.string().uuid(),
  assigned_at: z.coerce.date(),
  
  // Timeline
  target_completion_date: z.coerce.date(),
  actual_completion_date: z.coerce.date().optional(),
  
  // Status
  status: z.enum([
    'pending',
    'in_progress',
    'completed',
    'verified',
    'overdue'
  ]),
  
  // Evidence
  completion_evidence: z.array(z.object({
    filename: z.string(),
    file_path: z.string(),
    uploaded_at: z.coerce.date()
  })).default([]),
  
  // Verification
  verified_by: z.string().uuid().optional(),
  verified_at: z.coerce.date().optional(),
  verification_notes: z.string().optional(),
  
}).merge(GxPValidationFieldsSchema);

/**
 * DS-CAPA-003: CAPA Effectiveness Checks
 * Follow-up verification of CAPA effectiveness
 */
export const CAPAEffectivenessCheckSchema = BaseEntitySchema.extend({
  check_id: z.string().uuid(),
  capa_id: z.string().uuid(),
  
  // Check Details
  check_number: z.number().int().positive(),
  scheduled_date: z.coerce.date(),
  performed_date: z.coerce.date().optional(),
  performed_by: z.string().uuid().optional(),
  
  // Assessment
  effectiveness_criteria: z.array(z.object({
    criterion: z.string(),
    target: z.string(),
    actual: z.string().optional(),
    met: z.boolean().optional()
  })).min(1),
  
  overall_result: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
  findings: z.string().optional(),
  
  // Follow-up Actions
  follow_up_required: z.boolean().default(false),
  follow_up_actions: z.string().optional(),
  
}).merge(GxPValidationFieldsSchema);

export type CAPA = z.infer<typeof CAPASchema>;
export type CAPAActionItem = z.infer<typeof CAPAActionItemSchema>;
export type CAPAEffectivenessCheck = z.infer<typeof CAPAEffectivenessCheckSchema>;
```

### 2.5.4 Deviation Management Module

```typescript
// libs/shared/schemas/compliance/deviation-management.schema.ts
import { z } from "zod";
import { BaseEntitySchema } from "../common/base.schema";
import { GxPValidationFieldsSchema } from "./gxp-validation-fields.schema";

/**
 * DS-DEV-001: Deviations
 * Tracks any deviation from standard procedures or specifications
 */
export const DeviationSchema = BaseEntitySchema.extend({
  deviation_id: z.string().uuid(),
  deviation_number: z.string().regex(/^DEV-\d{4}-\d{4}$/)
    .describe("Format: DEV-2025-0001"),
  
  // Classification
  deviation_type: z.enum([
    'process_deviation',
    'material_deviation',
    'equipment_malfunction',
    'documentation_error',
    'environmental_excursion',
    'test_failure',
    'specification_failure',
    'procedure_not_followed',
    'system_error',
    'other'
  ]),
  
  severity: z.enum(['minor', 'major', 'critical']),
  gxp_critical: z.boolean().default(false)
    .describe("Impacts GxP compliance"),
  
  // Deviation Details
  title: z.string().min(10).max(255),
  description: z.string().min(50)
    .describe("Detailed description of what deviated"),
  
  // Occurrence Information
  occurred_at: z.coerce.date(),
  discovered_at: z.coerce.date(),
  discovered_by: z.string().uuid(),
  location: z.string().optional(),
  
  // Impact Assessment
  affected_products: z.array(z.object({
    product_id: z.string().uuid(),
    batch_number: z.string(),
    quantity_affected: z.number().positive(),
    disposition: z.enum(['quarantine', 'rework', 'reject', 'accept_with_justification']).optional()
  })).default([]),
  
  affected_processes: z.array(z.string()).default([]),
  customer_impact: z.enum(['none', 'potential', 'actual']),
  regulatory_reportable: z.boolean().default(false),
  
  // Investigation
  investigation_required: z.boolean().default(true),
  investigation_started_at: z.coerce.date().optional(),
  investigation_completed_at: z.coerce.date().optional(),
  investigation_findings: z.string().optional(),
  
  immediate_actions: z.array(z.object({
    action: z.string(),
    taken_by: z.string().uuid(),
    taken_at: z.coerce.date()
  })).default([]),
  
  root_cause: z.string().optional(),
  
  // CAPA Linkage
  capa_required: z.boolean().default(false),
  capa_id: z.string().uuid().optional(),
  
  // Workflow
  status: z.enum([
    'open',
    'investigation',
    'pending_review',
    'capa_initiated',
    'closed',
    'cancelled'
  ]),
  
  // Quality Review
  qa_reviewed_by: z.string().uuid().optional(),
  qa_reviewed_at: z.coerce.date().optional(),
  qa_disposition: z.enum(['approved', 'rejected', 'needs_more_info']).optional(),
  qa_comments: z.string().optional(),
  
  // Closure
  closure_date: z.coerce.date().optional(),
  closure_approved_by: z.string().uuid().optional(),
  
}).merge(GxPValidationFieldsSchema);

/**
 * DS-DEV-002: Deviation Investigations
 * Detailed investigation records for deviations
 */
export const DeviationInvestigationSchema = BaseEntitySchema.extend({
  investigation_id: z.string().uuid(),
  deviation_id: z.string().uuid(),
  
  // Investigation Team
  lead_investigator: z.string().uuid(),
  team_members: z.array(z.string().uuid()).default([]),
  
  // Investigation Details
  started_at: z.coerce.date(),
  target_completion_date: z.coerce.date(),
  actual_completion_date: z.coerce.date().optional(),
  
  // Findings
  investigation_method: z.enum(['5_whys', 'fishbone', 'fault_tree', 'timeline_analysis', 'other']),
  findings: z.string().min(100),
  
  root_cause_identified: z.boolean(),
  root_causes: z.array(z.object({
    cause_description: z.string(),
    evidence: z.string(),
    verification: z.string().optional()
  })).default([]),
  
  contributing_factors: z.array(z.string()).default([]),
  
  // Recommendations
  recommendations: z.array(z.object({
    recommendation: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    responsible_person: z.string().uuid().optional()
  })).default([]),
  
  // Attachments
  investigation_documents: z.array(z.object({
    filename: z.string(),
    file_path: z.string(),
    uploaded_at: z.coerce.date()
  })).default([]),
  
}).merge(GxPValidationFieldsSchema);

/**
 * DS-DEV-003: Deviation Impact Assessments
 * Quality impact assessment for deviations
 */
export const DeviationImpactAssessmentSchema = BaseEntitySchema.extend({
  assessment_id: z.string().uuid(),
  deviation_id: z.string().uuid(),
  
  // Assessor
  assessed_by: z.string().uuid(),
  assessed_at: z.coerce.date(),
  
  // Product Impact
  product_quality_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  product_safety_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  product_efficacy_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  
  // Process Impact
  process_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  data_integrity_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  
  // Regulatory Impact
  regulatory_impact: z.enum(['none', 'low', 'medium', 'high', 'critical']),
  regulatory_reporting_required: z.boolean(),
  reporting_timeline: z.string().optional(),
  
  // Business Impact
  financial_impact: z.object({
    estimated_cost: z.number().positive().optional(),
    currency: z.string().default('USD')
  }).optional(),
  
  schedule_impact: z.enum(['none', 'minor', 'moderate', 'major']),
  
  // Disposition
  recommended_disposition: z.enum([
    'no_action',
    'investigate_further',
    'initiate_capa',
    'quarantine_product',
    'reject_batch',
    'notify_regulatory',
    'customer_notification'
  ]),
  
  justification: z.string(),
  
}).merge(GxPValidationFieldsSchema);

export type Deviation = z.infer<typeof DeviationSchema>;
export type DeviationInvestigation = z.infer<typeof DeviationInvestigationSchema>;
export type DeviationImpactAssessment = z.infer<typeof DeviationImpactAssessmentSchema>;
```


### 2.5.5 Validation Management

#### 2.5.5.1 Validation Protocol Schema

```typescript
// libs/shared/schemas/compliance/validation-protocol.schema.ts
import { z } from "zod";
import { GxPValidationFieldsSchema } from "./gxp-validation-fields.schema";

export const ValidationProtocolSchema = z.object({
  protocol_id: z.string().uuid(),
  protocol_number: z.string().regex(/^VP-\d{4}-\d{4}$/),
  title: z.string().min(1).max(500),
  
  // Classification
  validation_type: z.enum([
    'installation_qualification',
    'operational_qualification', 
    'performance_qualification',
    'process_validation',
    'cleaning_validation',
    'method_validation',
    'computerized_system_validation',
    'revalidation',
    'concurrent_validation'
  ]),
  
  criticality: z.enum(['critical', 'non_critical']),
  gamp_category: z.enum(['1', '3', '4', '5']).optional(),
  
  // Scope
  scope_description: z.string(),
  system_equipment_id: z.string().uuid().optional(),
  process_id: z.string().uuid().optional(),
  
  // Validation Team
  validation_owner_id: z.string().uuid(),
  validation_team: z.array(z.object({
    user_id: z.string().uuid(),
    role: z.enum(['lead', 'engineer', 'qa', 'sme', 'approver']),
    responsibilities: z.string()
  })),
  
  // Schedule
  planned_start_date: z.coerce.date(),
  planned_completion_date: z.coerce.date(),
  actual_start_date: z.coerce.date().optional(),
  actual_completion_date: z.coerce.date().optional(),
  
  // Test Cases
  total_test_cases: z.number().int().min(0),
  
  // Status
  status: z.enum([
    'draft',
    'under_review',
    'approved',
    'in_execution',
    'completed',
    'failed',
    'cancelled'
  ]),
  
  // Results
  overall_result: z.enum(['pass', 'fail', 'conditional_pass']).optional(),
  conclusion: z.string().optional(),
  
  // References
  related_protocols: z.array(z.string().uuid()).default([]),
  reference_documents: z.array(z.string()).default([]),
  
}).merge(GxPValidationFieldsSchema);

export type ValidationProtocol = z.infer<typeof ValidationProtocolSchema>;
```

#### 2.5.5.2 Validation Test Case Schema

```typescript
// libs/shared/schemas/compliance/validation-test-case.schema.ts
import { z } from "zod";
import { GxPValidationFieldsSchema } from "./gxp-validation-fields.schema";

export const ValidationTestCaseSchema = z.object({
  test_case_id: z.string().uuid(),
  protocol_id: z.string().uuid(),
  test_case_number: z.string().regex(/^TC-\d{4}$/),
  
  // Test Definition
  title: z.string().min(1).max(500),
  objective: z.string(),
  test_type: z.enum([
    'functional',
    'performance',
    'security',
    'user_acceptance',
    'integration',
    'stress',
    'regression'
  ]),
  
  // Test Procedure
  prerequisites: z.string(),
  test_procedure: z.string(),
  acceptance_criteria: z.string(),
  
  // Expected Results
  expected_result: z.string(),
  actual_result: z.string().optional(),
  
  // Execution
  test_result: z.enum(['pass', 'fail', 'not_executed', 'blocked']).optional(),
  executed_by_id: z.string().uuid().optional(),
  execution_date: z.coerce.date().optional(),
  execution_duration_minutes: z.number().positive().optional(),
  
  // Evidence
  evidence_attachments: z.array(z.string()).default([]),
  screenshots: z.array(z.string()).default([]),
  
  // Deviation Handling
  deviation_id: z.string().uuid().optional(),
  deviation_justification: z.string().optional(),
  
  // Retest
  retest_required: z.boolean().default(false),
  retest_count: z.number().int().min(0).default(0),
  
}).merge(GxPValidationFieldsSchema);

export type ValidationTestCase = z.infer<typeof ValidationTestCaseSchema>;
```

---

### 2.6 Quality Events

```typescript
// libs/shared/schemas/compliance/quality-event.schema.ts
import { z } from "zod";
import { GxPValidationFieldsSchema } from "./gxp-validation-fields.schema";

export const QualityEventSchema = z.object({
  event_id: z.string().uuid(),
  event_number: z.string().regex(/^QE-\d{4}-\d{6}$/),
  
  // Classification
  event_type: z.enum([
    'complaint',
    'adverse_event',
    'product_defect',
    'recall',
    'out_of_specification',
    'audit_finding',
    'regulatory_inspection_finding',
    'other'
  ]),
  
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  // Details
  title: z.string().min(1).max(500),
  description: z.string(),
  
  // Source
  reported_by_id: z.string().uuid(),
  reported_date: z.coerce.date(),
  source: z.enum([
    'internal_audit',
    'external_audit',
    'customer',
    'regulatory_authority',
    'employee',
    'supplier',
    'laboratory',
    'production'
  ]),
  
  // Impact
  product_affected: z.boolean(),
  affected_batch_ids: z.array(z.string().uuid()).default([]),
  patient_safety_impact: z.boolean(),
  
  // Investigation
  investigation_required: z.boolean(),
  deviation_id: z.string().uuid().optional(),
  capa_id: z.string().uuid().optional(),
  
  // Status
  status: z.enum([
    'open',
    'under_investigation',
    'pending_capa',
    'resolved',
    'closed'
  ]),
  
  resolution: z.string().optional(),
  closed_date: z.coerce.date().optional(),
  
  // Regulatory
  regulatory_reportable: z.boolean(),
  reported_to_authority: z.boolean().default(false),
  authority_reference: z.string().optional(),
  
}).merge(GxPValidationFieldsSchema);

export type QualityEvent = z.infer<typeof QualityEventSchema>;
```

---

### 2.7 Training Management

```typescript
// libs/shared/schemas/compliance/training-record.schema.ts
import { z } from "zod";
import { GxPValidationFieldsSchema } from "./gxp-validation-fields.schema";

export const TrainingRecordSchema = z.object({
  training_id: z.string().uuid(),
  training_number: z.string().regex(/^TRN-\d{4}-\d{6}$/),
  
  // Training Details
  training_title: z.string().min(1).max(500),
  training_type: z.enum([
    'gmp_training',
    'sop_training',
    'equipment_training',
    'safety_training',
    'compliance_training',
    'technical_training',
    'refresher_training',
    'on_the_job_training'
  ]),
  
  // Trainee
  trainee_user_id: z.string().uuid(),
  job_role: z.string(),
  department: z.string(),
  
  // Training Content
  sop_id: z.string().uuid().optional(),
  training_materials: z.array(z.string()).default([]),
  learning_objectives: z.array(z.string()),
  
  // Delivery
  trainer_id: z.string().uuid(),
  training_method: z.enum([
    'classroom',
    'online',
    'hands_on',
    'self_study',
    'workshop',
    'webinar'
  ]),
  
  training_date: z.coerce.date(),
  duration_hours: z.number().positive(),
  location: z.string().optional(),
  
  // Assessment
  assessment_required: z.boolean(),
  assessment_score: z.number().min(0).max(100).optional(),
  passing_score: z.number().min(0).max(100).default(80),
  assessment_result: z.enum(['pass', 'fail', 'not_assessed']).optional(),
  
  // Completion
  completion_status: z.enum([
    'scheduled',
    'in_progress',
    'completed',
    'failed',
    'cancelled',
    'expired'
  ]),
  
  completion_date: z.coerce.date().optional(),
  certificate_issued: z.boolean().default(false),
  certificate_number: z.string().optional(),
  
  // Validity
  valid_from: z.coerce.date(),
  valid_until: z.coerce.date().optional(),
  retraining_required: z.boolean().default(false),
  retraining_frequency_months: z.number().int().positive().optional(),
  
  // Effectiveness
  effectiveness_check_required: z.boolean(),
  effectiveness_check_date: z.coerce.date().optional(),
  effectiveness_result: z.enum(['effective', 'needs_improvement', 'not_evaluated']).optional(),
  
}).merge(GxPValidationFieldsSchema);

export type TrainingRecord = z.infer<typeof TrainingRecordSchema>;
```

---

### 2.8 Document Management

```typescript
// libs/shared/schemas/compliance/document.schema.ts
import { z } from "zod";
import { GxPValidationFieldsSchema } from "./gxp-validation-fields.schema";

export const DocumentSchema = z.object({
  document_id: z.string().uuid(),
  document_number: z.string().regex(/^DOC-[A-Z]+-\d{4}-\d{4}$/),
  
  // Document Details
  title: z.string().min(1).max(500),
  document_type: z.enum([
    'sop',
    'work_instruction',
    'form',
    'specification',
    'protocol',
    'report',
    'policy',
    'procedure',
    'manual',
    'drawing',
    'certificate'
  ]),
  
  // Version Control
  version: z.string().regex(/^\d+\.\d+$/),
  revision_history: z.array(z.object({
    version: z.string(),
    revision_date: z.coerce.date(),
    revised_by_id: z.string().uuid(),
    change_description: z.string(),
    sections_changed: z.array(z.string())
  })),
  
  // Classification
  confidentiality: z.enum(['public', 'internal', 'confidential', 'highly_confidential']),
  department: z.string(),
  category: z.string(),
  
  // Content
  content: z.string(),
  purpose: z.string(),
  scope: z.string(),
  
  // Lifecycle
  status: z.enum([
    'draft',
    'in_review',
    'approved',
    'effective',
    'superseded',
    'obsolete',
    'archived'
  ]),
  
  effective_date: z.coerce.date().optional(),
  next_review_date: z.coerce.date().optional(),
  review_frequency_months: z.number().int().positive().default(12),
  
  // Approval Workflow
  author_id: z.string().uuid(),
  reviewers: z.array(z.object({
    user_id: z.string().uuid(),
    review_date: z.coerce.date().optional(),
    approved: z.boolean().optional(),
    comments: z.string().optional()
  })),
  
  approver_id: z.string().uuid().optional(),
  approval_date: z.coerce.date().optional(),
  
  // Distribution
  distribution_list: z.array(z.string().uuid()).default([]),
  training_required: z.boolean().default(false),
  
  // Attachments
  attachments: z.array(z.object({
    filename: z.string(),
    file_path: z.string(),
    file_size_bytes: z.number().int().positive(),
    checksum: z.string()
  })).default([]),
  
  // References
  related_documents: z.array(z.string().uuid()).default([]),
  supersedes_document_id: z.string().uuid().optional(),
  
}).merge(GxPValidationFieldsSchema);

export type Document = z.infer<typeof DocumentSchema>;
```

---

### 2.9 Analytics & Reporting

#### 2.9.1 Compliance Dashboard Metrics Schema

```typescript
// libs/shared/schemas/analytics/compliance-metrics.schema.ts
import { z } from "zod";

export const ComplianceMetricsSchema = z.object({
  metric_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  facility_id: z.string().uuid().optional(),
  
  // Time Period
  period_start: z.coerce.date(),
  period_end: z.coerce.date(),
  reporting_frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']),
  
  // Change Control Metrics
  change_control: z.object({
    total_changes: z.number().int().min(0),
    pending_approval: z.number().int().min(0),
    approved: z.number().int().min(0),
    rejected: z.number().int().min(0),
    average_approval_time_days: z.number().min(0),
    overdue_changes: z.number().int().min(0)
  }),
  
  // CAPA Metrics
  capa: z.object({
    total_capas: z.number().int().min(0),
    open: z.number().int().min(0),
    in_progress: z.number().int().min(0),
    completed_on_time: z.number().int().min(0),
    overdue: z.number().int().min(0),
    average_closure_time_days: z.number().min(0),
    effectiveness_rate: z.number().min(0).max(100)
  }),
  
  // Deviation Metrics
  deviation: z.object({
    total_deviations: z.number().int().min(0),
    by_severity: z.record(z.enum(['minor', 'major', 'critical']), z.number().int().min(0)),
    under_investigation: z.number().int().min(0),
    closed: z.number().int().min(0),
    average_investigation_time_days: z.number().min(0),
    repeat_deviations: z.number().int().min(0)
  }),
  
  // Training Metrics
  training: z.object({
    total_trainings: z.number().int().min(0),
    completed: z.number().int().min(0),
    pass_rate: z.number().min(0).max(100),
    overdue_trainings: z.number().int().min(0),
    certifications_expiring_30_days: z.number().int().min(0),
    average_effectiveness_score: z.number().min(0).max(100)
  }),
  
  // Document Metrics
  documents: z.object({
    total_documents: z.number().int().min(0),
    pending_review: z.number().int().min(0),
    pending_approval: z.number().int().min(0),
    expired_documents: z.number().int().min(0),
    documents_due_review_30_days: z.number().int().min(0)
  }),
  
  // Audit Trail Metrics
  audit_trail: z.object({
    total_audit_records: z.number().int().min(0),
    critical_records: z.number().int().min(0),
    data_integrity_score: z.number().min(0).max(100)
  }),
  
  // Quality Events
  quality_events: z.object({
    total_events: z.number().int().min(0),
    by_severity: z.record(z.enum(['low', 'medium', 'high', 'critical']), z.number().int().min(0)),
    open: z.number().int().min(0),
    closed: z.number().int().min(0),
    customer_complaints: z.number().int().min(0)
  }),
  
  // Overall Compliance Score
  overall_compliance_score: z.number().min(0).max(100),
  
  calculated_at: z.coerce.date(),
});

export type ComplianceMetrics = z.infer<typeof ComplianceMetricsSchema>;
```

#### 2.9.2 Audit Report Schema

```typescript
// libs/shared/schemas/analytics/audit-report.schema.ts
import { z } from "zod";
import { GxPValidationFieldsSchema } from "../compliance/gxp-validation-fields.schema";

export const AuditReportSchema = z.object({
  report_id: z.string().uuid(),
  report_number: z.string().regex(/^AR-\d{4}-\d{4}$/),
  
  // Report Type
  report_type: z.enum([
    'internal_audit',
    'regulatory_inspection',
    'supplier_audit',
    'system_audit',
    'process_audit',
    'compliance_audit'
  ]),
  
  // Scope
  title: z.string().min(1).max(500),
  audit_scope: z.string(),
  facility_id: z.string().uuid().optional(),
  department: z.string().optional(),
  
  // Audit Details
  audit_start_date: z.coerce.date(),
  audit_end_date: z.coerce.date(),
  lead_auditor_id: z.string().uuid(),
  audit_team: z.array(z.string().uuid()),
  
  // Findings Summary
  total_findings: z.number().int().min(0),
  critical_findings: z.number().int().min(0),
  major_findings: z.number().int().min(0),
  minor_findings: z.number().int().min(0),
  observations: z.number().int().min(0),
  
  // Findings Details
  findings: z.array(z.object({
    finding_number: z.string(),
    severity: z.enum(['critical', 'major', 'minor', 'observation']),
    area: z.string(),
    description: z.string(),
    regulation_reference: z.string().optional(),
    evidence: z.string(),
    recommendation: z.string(),
    capa_id: z.string().uuid().optional()
  })),
  
  // Overall Assessment
  overall_compliance_rating: z.enum([
    'compliant',
    'substantially_compliant',
    'partially_compliant',
    'non_compliant'
  ]),
  
  executive_summary: z.string(),
  conclusion: z.string(),
  
  // Follow-up
  follow_up_required: z.boolean(),
  follow_up_date: z.coerce.date().optional(),
  
  // Report Status
  status: z.enum(['draft', 'under_review', 'finalized', 'distributed']),
  finalized_date: z.coerce.date().optional(),
  
}).merge(GxPValidationFieldsSchema);

export type AuditReport = z.infer<typeof AuditReportSchema>;
```

#### 2.9.3 KPI Dashboard Schema

```typescript
// libs/shared/schemas/analytics/kpi-dashboard.schema.ts
import { z } from "zod";

export const KPIDashboardSchema = z.object({
  dashboard_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  
  // Time Period
  period: z.object({
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    comparison_period_start: z.coerce.date().optional(),
    comparison_period_end: z.coerce.date().optional()
  }),
  
  // Quality KPIs
  quality_kpis: z.object({
    first_pass_yield: z.number().min(0).max(100),
    batch_rejection_rate: z.number().min(0).max(100),
    out_of_specification_rate: z.number().min(0).max(100),
    customer_complaint_rate: z.number().min(0),
    right_first_time_rate: z.number().min(0).max(100)
  }),
  
  // Compliance KPIs
  compliance_kpis: z.object({
    sop_compliance_rate: z.number().min(0).max(100),
    training_completion_rate: z.number().min(0).max(100),
    capa_on_time_closure_rate: z.number().min(0).max(100),
    document_review_on_time_rate: z.number().min(0).max(100),
    audit_finding_closure_rate: z.number().min(0).max(100),
    deviation_investigation_on_time_rate: z.number().min(0).max(100)
  }),
  
  // Operational KPIs
  operational_kpis: z.object({
    overall_equipment_effectiveness: z.number().min(0).max(100),
    batch_cycle_time_days: z.number().min(0),
    yield_percentage: z.number().min(0).max(100),
    capacity_utilization: z.number().min(0).max(100)
  }),
  
  // Data Integrity KPIs
  data_integrity_kpis: z.object({
    audit_trail_completeness: z.number().min(0).max(100),
    electronic_signature_compliance: z.number().min(0).max(100),
    data_backup_success_rate: z.number().min(0).max(100),
    system_availability: z.number().min(0).max(100)
  }),
  
  // Trends
  trends: z.object({
    quality_trend: z.enum(['improving', 'stable', 'declining']),
    compliance_trend: z.enum(['improving', 'stable', 'declining']),
    operational_trend: z.enum(['improving', 'stable', 'declining'])
  }),
  
  generated_at: z.coerce.date(),
});

export type KPIDashboard = z.infer<typeof KPIDashboardSchema>;
```

---

## �📡 **3. KAFKA EVENT SCHEMAS**

### 3.1 Base Event Schema

```typescript
// libs/shared/events/base-event.schema.ts
import { z } from "zod";

// Base event schema for all Kafka events
export const BaseEventSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.string(),
  event_version: z.string().default("1.0"),
  aggregate_id: z.string().uuid(),
  aggregate_type: z.string(),
  sequence_number: z.number().int().positive(),
  occurred_at: z.coerce.date(),
  correlation_id: z.string().uuid().optional(),
  causation_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).default({}),
});

// Event envelope for Kafka messages
export const EventEnvelopeSchema = z.object({
  topic: z.string(),
  partition: z.number().int().min(0),
  offset: z.number().int().min(0),
  timestamp: z.coerce.date(),
  key: z.string(),
  headers: z.record(z.string()).default({}),
  payload: BaseEventSchema,
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
```

### 3.2 Plant Events

```typescript
// libs/shared/events/plant-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";
import { PlantSchema, PlantStageSchema } from "../schemas/plants/plant.schema";

// Plant created event
export const PlantCreatedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("plant.created"),
  data: PlantSchema,
});

// Plant stage changed event
export const PlantStageChangedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("plant.stage_changed"),
  data: z.object({
    plant_id: z.string().uuid(),
    previous_stage: PlantStageSchema,
    new_stage: PlantStageSchema,
    changed_at: z.coerce.date(),
    reason: z.string().optional(),
  }),
});

// Plant measurement recorded event
export const PlantMeasurementRecordedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("plant.measurement_recorded"),
  data: z.object({
    plant_id: z.string().uuid(),
    measurement_type: z.string(),
    value: z.number(),
    unit: z.string(),
    measured_by: z.string().uuid(),
    measured_at: z.coerce.date(),
  }),
});

// Plant destroyed event
export const PlantDestroyedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("plant.destroyed"),
  data: z.object({
    plant_id: z.string().uuid(),
    reason: z.string(),
    destroyed_by: z.string().uuid(),
    destroyed_at: z.coerce.date(),
    witness: z.string().uuid().optional(),
    destruction_method: z.string(),
  }),
});

// Union of all plant events
export const PlantEventSchema = z.discriminatedUnion("event_type", [
  PlantCreatedEventSchema,
  PlantStageChangedEventSchema,
  PlantMeasurementRecordedEventSchema,
  PlantDestroyedEventSchema,
]);

export type PlantCreatedEvent = z.infer<typeof PlantCreatedEventSchema>;
export type PlantStageChangedEvent = z.infer<
  typeof PlantStageChangedEventSchema
>;
export type PlantEvent = z.infer<typeof PlantEventSchema>;
```

### 3.3 IoT Events

```typescript
// libs/shared/events/iot-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";
import {
  SensorReadingSchema,
  SensorSchema,
} from "../schemas/iot/sensor.schema";

// Sensor reading recorded event
export const SensorReadingRecordedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("sensor.reading_recorded"),
  data: SensorReadingSchema.pick({
    sensor_id: true,
    measurement: true,
    quality_score: true,
    alert_level: true,
  }),
});

// Sensor alert triggered event
export const SensorAlertTriggeredEventSchema = BaseEventSchema.extend({
  event_type: z.literal("sensor.alert_triggered"),
  data: z.object({
    sensor_id: z.string().uuid(),
    alert_level: z.enum(["WARNING", "CRITICAL"]),
    threshold_type: z.enum(["MIN", "MAX"]),
    threshold_value: z.number(),
    actual_value: z.number(),
    triggered_at: z.coerce.date(),
  }),
});

// Sensor offline event
export const SensorOfflineEventSchema = BaseEventSchema.extend({
  event_type: z.literal("sensor.offline"),
  data: z.object({
    sensor_id: z.string().uuid(),
    last_reading_at: z.coerce.date(),
    offline_detected_at: z.coerce.date(),
  }),
});

// Union of all IoT events
export const IoTEventSchema = z.discriminatedUnion("event_type", [
  SensorReadingRecordedEventSchema,
  SensorAlertTriggeredEventSchema,
  SensorOfflineEventSchema,
]);

export type SensorReadingRecordedEvent = z.infer<
  typeof SensorReadingRecordedEventSchema
>;
export type SensorAlertTriggeredEvent = z.infer<
  typeof SensorAlertTriggeredEventSchema
>;
export type IoTEvent = z.infer<typeof IoTEventSchema>;
```

---

### 3.4 Compliance Events

#### 3.4.1 Change Control Events

```typescript
// libs/shared/events/change-control-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";
import { ChangeControlSchema } from "../schemas/compliance/change-control.schema";

// Change Control Created
export const ChangeControlCreatedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("change_control.created"),
  data: ChangeControlSchema,
});

// Change Control Submitted for Review
export const ChangeControlSubmittedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("change_control.submitted"),
  data: z.object({
    change_id: z.string().uuid(),
    change_number: z.string(),
    submitter_id: z.string().uuid(),
    submitted_at: z.coerce.date(),
  }),
});

// Change Control Approved
export const ChangeControlApprovedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("change_control.approved"),
  data: z.object({
    change_id: z.string().uuid(),
    change_number: z.string(),
    approver_id: z.string().uuid(),
    approved_at: z.coerce.date(),
    approval_comments: z.string().optional(),
  }),
});

// Change Control Rejected
export const ChangeControlRejectedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("change_control.rejected"),
  data: z.object({
    change_id: z.string().uuid(),
    change_number: z.string(),
    rejector_id: z.string().uuid(),
    rejected_at: z.coerce.date(),
    rejection_reason: z.string(),
  }),
});

// Change Control Implemented
export const ChangeControlImplementedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("change_control.implemented"),
  data: z.object({
    change_id: z.string().uuid(),
    change_number: z.string(),
    implemented_by_id: z.string().uuid(),
    implementation_date: z.coerce.date(),
    implementation_notes: z.string().optional(),
  }),
});

// Change Control Closed
export const ChangeControlClosedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("change_control.closed"),
  data: z.object({
    change_id: z.string().uuid(),
    change_number: z.string(),
    closed_by_id: z.string().uuid(),
    closed_at: z.coerce.date(),
    effectiveness_verified: z.boolean(),
  }),
});

export const ChangeControlEventSchema = z.discriminatedUnion("event_type", [
  ChangeControlCreatedEventSchema,
  ChangeControlSubmittedEventSchema,
  ChangeControlApprovedEventSchema,
  ChangeControlRejectedEventSchema,
  ChangeControlImplementedEventSchema,
  ChangeControlClosedEventSchema,
]);

export type ChangeControlEvent = z.infer<typeof ChangeControlEventSchema>;
```

#### 3.4.2 CAPA Events

```typescript
// libs/shared/events/capa-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";
import { CAPASchema } from "../schemas/compliance/capa.schema";

// CAPA Created
export const CAPACreatedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("capa.created"),
  data: CAPASchema,
});

// CAPA Assigned
export const CAPAAssignedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("capa.assigned"),
  data: z.object({
    capa_id: z.string().uuid(),
    capa_number: z.string(),
    assigned_to_id: z.string().uuid(),
    assigned_by_id: z.string().uuid(),
    assigned_at: z.coerce.date(),
  }),
});

// Root Cause Identified
export const CAPARootCauseIdentifiedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("capa.root_cause_identified"),
  data: z.object({
    capa_id: z.string().uuid(),
    capa_number: z.string(),
    root_cause: z.string(),
    identified_by_id: z.string().uuid(),
    identified_at: z.coerce.date(),
  }),
});

// Action Plan Approved
export const CAPAActionPlanApprovedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("capa.action_plan_approved"),
  data: z.object({
    capa_id: z.string().uuid(),
    capa_number: z.string(),
    approved_by_id: z.string().uuid(),
    approved_at: z.coerce.date(),
  }),
});

// Action Completed
export const CAPAActionCompletedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("capa.action_completed"),
  data: z.object({
    capa_id: z.string().uuid(),
    capa_number: z.string(),
    action_id: z.string().uuid(),
    completed_by_id: z.string().uuid(),
    completed_at: z.coerce.date(),
  }),
});

// Effectiveness Check Passed
export const CAPAEffectivenessPassedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("capa.effectiveness_passed"),
  data: z.object({
    capa_id: z.string().uuid(),
    capa_number: z.string(),
    checked_by_id: z.string().uuid(),
    checked_at: z.coerce.date(),
    effectiveness_result: z.string(),
  }),
});

// CAPA Closed
export const CAPAClosedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("capa.closed"),
  data: z.object({
    capa_id: z.string().uuid(),
    capa_number: z.string(),
    closed_by_id: z.string().uuid(),
    closed_at: z.coerce.date(),
  }),
});

export const CAPAEventSchema = z.discriminatedUnion("event_type", [
  CAPACreatedEventSchema,
  CAPAAssignedEventSchema,
  CAPARootCauseIdentifiedEventSchema,
  CAPAActionPlanApprovedEventSchema,
  CAPAActionCompletedEventSchema,
  CAPAEffectivenessPassedEventSchema,
  CAPAClosedEventSchema,
]);

export type CAPAEvent = z.infer<typeof CAPAEventSchema>;
```

#### 3.4.3 Deviation Events

```typescript
// libs/shared/events/deviation-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";
import { DeviationSchema } from "../schemas/compliance/deviation.schema";

// Deviation Reported
export const DeviationReportedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("deviation.reported"),
  data: DeviationSchema,
});

// Deviation Investigation Started
export const DeviationInvestigationStartedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("deviation.investigation_started"),
  data: z.object({
    deviation_id: z.string().uuid(),
    deviation_number: z.string(),
    investigator_id: z.string().uuid(),
    started_at: z.coerce.date(),
  }),
});

// Deviation Impact Assessment Completed
export const DeviationImpactAssessedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("deviation.impact_assessed"),
  data: z.object({
    deviation_id: z.string().uuid(),
    deviation_number: z.string(),
    product_quality_impact: z.string(),
    regulatory_impact: z.string(),
    assessed_by_id: z.string().uuid(),
    assessed_at: z.coerce.date(),
  }),
});

// CAPA Required from Deviation
export const DeviationCAPARequiredEventSchema = BaseEventSchema.extend({
  event_type: z.literal("deviation.capa_required"),
  data: z.object({
    deviation_id: z.string().uuid(),
    deviation_number: z.string(),
    capa_id: z.string().uuid().optional(),
    justification: z.string(),
  }),
});

// Deviation Closed
export const DeviationClosedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("deviation.closed"),
  data: z.object({
    deviation_id: z.string().uuid(),
    deviation_number: z.string(),
    closed_by_id: z.string().uuid(),
    closed_at: z.coerce.date(),
    disposition: z.string(),
  }),
});

export const DeviationEventSchema = z.discriminatedUnion("event_type", [
  DeviationReportedEventSchema,
  DeviationInvestigationStartedEventSchema,
  DeviationImpactAssessedEventSchema,
  DeviationCAPARequiredEventSchema,
  DeviationClosedEventSchema,
]);

export type DeviationEvent = z.infer<typeof DeviationEventSchema>;
```

#### 3.4.4 Validation Events

```typescript
// libs/shared/events/validation-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";

// Validation Protocol Created
export const ValidationProtocolCreatedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("validation.protocol_created"),
  data: z.object({
    protocol_id: z.string().uuid(),
    protocol_number: z.string(),
    validation_type: z.string(),
    created_by_id: z.string().uuid(),
  }),
});

// Protocol Execution Started
export const ValidationExecutionStartedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("validation.execution_started"),
  data: z.object({
    protocol_id: z.string().uuid(),
    protocol_number: z.string(),
    started_by_id: z.string().uuid(),
    started_at: z.coerce.date(),
  }),
});

// Test Case Executed
export const ValidationTestCaseExecutedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("validation.test_case_executed"),
  data: z.object({
    test_case_id: z.string().uuid(),
    protocol_id: z.string().uuid(),
    test_result: z.enum(['pass', 'fail', 'blocked']),
    executed_by_id: z.string().uuid(),
    executed_at: z.coerce.date(),
  }),
});

// Protocol Completed
export const ValidationProtocolCompletedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("validation.protocol_completed"),
  data: z.object({
    protocol_id: z.string().uuid(),
    protocol_number: z.string(),
    overall_result: z.enum(['pass', 'fail', 'conditional_pass']),
    completed_at: z.coerce.date(),
  }),
});

export const ValidationEventSchema = z.discriminatedUnion("event_type", [
  ValidationProtocolCreatedEventSchema,
  ValidationExecutionStartedEventSchema,
  ValidationTestCaseExecutedEventSchema,
  ValidationProtocolCompletedEventSchema,
]);

export type ValidationEvent = z.infer<typeof ValidationEventSchema>;
```

#### 3.4.5 Quality Event & Training Events

```typescript
// libs/shared/events/quality-training-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";

// Quality Event Reported
export const QualityEventReportedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("quality_event.reported"),
  data: z.object({
    event_id: z.string().uuid(),
    event_number: z.string(),
    event_type: z.string(),
    severity: z.string(),
    reported_by_id: z.string().uuid(),
  }),
});

// Quality Event Closed
export const QualityEventClosedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("quality_event.closed"),
  data: z.object({
    event_id: z.string().uuid(),
    event_number: z.string(),
    resolution: z.string(),
    closed_by_id: z.string().uuid(),
    closed_at: z.coerce.date(),
  }),
});

// Training Scheduled
export const TrainingScheduledEventSchema = BaseEventSchema.extend({
  event_type: z.literal("training.scheduled"),
  data: z.object({
    training_id: z.string().uuid(),
    training_number: z.string(),
    trainee_user_id: z.string().uuid(),
    trainer_id: z.string().uuid(),
    training_date: z.coerce.date(),
  }),
});

// Training Completed
export const TrainingCompletedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("training.completed"),
  data: z.object({
    training_id: z.string().uuid(),
    training_number: z.string(),
    trainee_user_id: z.string().uuid(),
    completion_date: z.coerce.date(),
    assessment_result: z.enum(['pass', 'fail', 'not_assessed']),
    assessment_score: z.number().optional(),
  }),
});

// Training Certificate Issued
export const TrainingCertificateIssuedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("training.certificate_issued"),
  data: z.object({
    training_id: z.string().uuid(),
    certificate_number: z.string(),
    trainee_user_id: z.string().uuid(),
    valid_until: z.coerce.date(),
  }),
});

// Document Approved
export const DocumentApprovedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("document.approved"),
  data: z.object({
    document_id: z.string().uuid(),
    document_number: z.string(),
    version: z.string(),
    approver_id: z.string().uuid(),
    approved_at: z.coerce.date(),
  }),
});

// Document Effective
export const DocumentEffectiveEventSchema = BaseEventSchema.extend({
  event_type: z.literal("document.effective"),
  data: z.object({
    document_id: z.string().uuid(),
    document_number: z.string(),
    version: z.string(),
    effective_date: z.coerce.date(),
  }),
});

export const QualityTrainingEventSchema = z.discriminatedUnion("event_type", [
  QualityEventReportedEventSchema,
  QualityEventClosedEventSchema,
  TrainingScheduledEventSchema,
  TrainingCompletedEventSchema,
  TrainingCertificateIssuedEventSchema,
  DocumentApprovedEventSchema,
  DocumentEffectiveEventSchema,
]);

export type QualityTrainingEvent = z.infer<typeof QualityTrainingEventSchema>;
```

---

## 🔌 **4. HTTP API CONTRACTS**

### 4.1 Request/Response Patterns

```typescript
// libs/shared/api-contracts/common/http.schema.ts
import { z } from "zod";

// Pagination schema
export const PaginationRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export const PaginationResponseSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  has_next: z.boolean(),
  has_prev: z.boolean(),
});

// Standard API response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: z.coerce.date(),
    request_id: z.string().uuid(),
  });

// Error response schema
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    validation_errors: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
          value: z.unknown().optional(),
        })
      )
      .optional(),
  }),
  timestamp: z.coerce.date(),
  request_id: z.string().uuid(),
});

// Paginated response schema
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationResponseSchema,
    }),
    timestamp: z.coerce.date(),
    request_id: z.string().uuid(),
  });

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
```

### 4.2 Plants API Contracts

```typescript
// libs/shared/api-contracts/plants/plants.contract.ts
import { z } from "zod";
import {
  PlantSchema,
  PlantMeasurementSchema,
  BatchSchema,
} from "../../schemas/plants/plant.schema";
import {
  PaginationRequestSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  ApiErrorResponseSchema,
} from "../common/http.schema";

// GET /api/plants - List plants with filtering
export const ListPlantsRequestSchema = PaginationRequestSchema.extend({
  batch_id: z.string().uuid().optional(),
  stage: z.string().optional(),
  location_facility: z.string().uuid().optional(),
  health_status: z.string().optional(),
  created_after: z.coerce.date().optional(),
  created_before: z.coerce.date().optional(),
});

export const ListPlantsResponseSchema = PaginatedResponseSchema(PlantSchema);

// GET /api/plants/:id - Get single plant
export const GetPlantRequestSchema = z.object({
  id: z.string().uuid(),
});

export const GetPlantResponseSchema = ApiResponseSchema(PlantSchema);

// POST /api/plants - Create new plant
export const CreatePlantRequestSchema = PlantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const CreatePlantResponseSchema = ApiResponseSchema(PlantSchema);

// PUT /api/plants/:id - Update plant
export const UpdatePlantRequestSchema = z.object({
  id: z.string().uuid(),
  data: PlantSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).partial(),
});

export const UpdatePlantResponseSchema = ApiResponseSchema(PlantSchema);

// POST /api/plants/:id/measurements - Record measurement
export const RecordPlantMeasurementRequestSchema = z.object({
  plant_id: z.string().uuid(),
  data: PlantMeasurementSchema.omit({
    id: true,
    plant_id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }),
});

export const RecordPlantMeasurementResponseSchema = ApiResponseSchema(
  PlantMeasurementSchema
);

// Plants API contract type
export const PlantsApiContract = {
  listPlants: {
    method: "GET" as const,
    path: "/api/plants" as const,
    request: {
      query: ListPlantsRequestSchema,
    },
    responses: {
      200: ListPlantsResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  getPlant: {
    method: "GET" as const,
    path: "/api/plants/:id" as const,
    request: {
      params: GetPlantRequestSchema,
    },
    responses: {
      200: GetPlantResponseSchema,
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  createPlant: {
    method: "POST" as const,
    path: "/api/plants" as const,
    request: {
      body: CreatePlantRequestSchema,
    },
    responses: {
      201: CreatePlantResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  updatePlant: {
    method: "PUT" as const,
    path: "/api/plants/:id" as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: UpdatePlantRequestSchema.shape.data,
    },
    responses: {
      200: UpdatePlantResponseSchema,
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  recordMeasurement: {
    method: "POST" as const,
    path: "/api/plants/:id/measurements" as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: RecordPlantMeasurementRequestSchema.shape.data,
    },
    responses: {
      201: RecordPlantMeasurementResponseSchema,
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
} as const;

export type PlantsApiContractType = typeof PlantsApiContract;
```

### 4.3 IoT API Contracts

```typescript
// libs/shared/api-contracts/iot/sensors.contract.ts
import { z } from "zod";
import {
  SensorSchema,
  SensorReadingSchema,
  SensorCalibrationSchema,
} from "../../schemas/iot/sensor.schema";
import {
  PaginationRequestSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  ApiErrorResponseSchema,
} from "../common/http.schema";

// GET /api/sensors - List sensors
export const ListSensorsRequestSchema = PaginationRequestSchema.extend({
  sensor_type: z.string().optional(),
  location_facility: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const ListSensorsResponseSchema = PaginatedResponseSchema(SensorSchema);

// GET /api/sensors/:id/readings - Get sensor readings
export const GetSensorReadingsRequestSchema = PaginationRequestSchema.extend({
  sensor_id: z.string().uuid(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  alert_level: z.string().optional(),
});

export const GetSensorReadingsResponseSchema =
  PaginatedResponseSchema(SensorReadingSchema);

// POST /api/sensors/:id/readings - Record sensor reading (for manual entries)
export const RecordSensorReadingRequestSchema = z.object({
  sensor_id: z.string().uuid(),
  data: SensorReadingSchema.omit({
    id: true,
    sensor_id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }),
});

export const RecordSensorReadingResponseSchema =
  ApiResponseSchema(SensorReadingSchema);

// Sensors API contract
export const SensorsApiContract = {
  listSensors: {
    method: "GET" as const,
    path: "/api/sensors" as const,
    request: {
      query: ListSensorsRequestSchema,
    },
    responses: {
      200: ListSensorsResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  getSensorReadings: {
    method: "GET" as const,
    path: "/api/sensors/:id/readings" as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      query: GetSensorReadingsRequestSchema.omit({ sensor_id: true }),
    },
    responses: {
      200: GetSensorReadingsResponseSchema,
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  recordReading: {
    method: "POST" as const,
    path: "/api/sensors/:id/readings" as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: RecordSensorReadingRequestSchema.shape.data,
    },
    responses: {
      201: RecordSensorReadingResponseSchema,
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
} as const;

export type SensorsApiContractType = typeof SensorsApiContract;
```

---

### 4.4 Compliance API Contracts

#### 4.4.1 Change Control API

```typescript
// libs/shared/api-contracts/change-control.contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { 
  ChangeControlSchema, 
  ChangeControlReviewSchema 
} from "../schemas/compliance/change-control.schema";
import { ApiResponseSchema, ApiErrorResponseSchema, PaginatedResponseSchema } from "./common.schema";

const c = initContract();

export const ChangeControlApiContract = c.router({
  // Create Change Control
  createChangeControl: {
    method: "POST",
    path: "/change-controls",
    body: ChangeControlSchema.omit({ change_id: true, created_at: true, updated_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: ChangeControlSchema,
      }),
      400: ApiErrorResponseSchema,
      401: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Get Change Control by ID
  getChangeControl: {
    method: "GET",
    path: "/change-controls/:id",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: ChangeControlSchema,
      }),
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // List Change Controls
  listChangeControls: {
    method: "GET",
    path: "/change-controls",
    query: z.object({
      status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'implemented', 'closed', 'cancelled']).optional(),
      change_type: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    }),
    responses: {
      200: PaginatedResponseSchema.extend({
        data: z.array(ChangeControlSchema),
      }),
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Update Change Control
  updateChangeControl: {
    method: "PATCH",
    path: "/change-controls/:id",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: ChangeControlSchema.partial(),
    responses: {
      200: ApiResponseSchema.extend({
        data: ChangeControlSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Submit for Review
  submitChangeControl: {
    method: "POST",
    path: "/change-controls/:id/submit",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      submission_comments: z.string().optional(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: ChangeControlSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Add Review
  addReview: {
    method: "POST",
    path: "/change-controls/:id/reviews",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: ChangeControlReviewSchema.omit({ review_id: true, reviewed_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: ChangeControlReviewSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Approve Change Control
  approveChangeControl: {
    method: "POST",
    path: "/change-controls/:id/approve",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      approval_comments: z.string().optional(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: ChangeControlSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Mark as Implemented
  markImplemented: {
    method: "POST",
    path: "/change-controls/:id/implement",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      implementation_notes: z.string().optional(),
      implementation_date: z.coerce.date(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: ChangeControlSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
});

export type ChangeControlApiContractType = typeof ChangeControlApiContract;
```

#### 4.4.2 CAPA API

```typescript
// libs/shared/api-contracts/capa.contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { 
  CAPASchema, 
  CAPAActionSchema 
} from "../schemas/compliance/capa.schema";
import { ApiResponseSchema, ApiErrorResponseSchema, PaginatedResponseSchema } from "./common.schema";

const c = initContract();

export const CAPAApiContract = c.router({
  // Create CAPA
  createCAPA: {
    method: "POST",
    path: "/capas",
    body: CAPASchema.omit({ capa_id: true, created_at: true, updated_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: CAPASchema,
      }),
      400: ApiErrorResponseSchema,
      401: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Get CAPA by ID
  getCAPA: {
    method: "GET",
    path: "/capas/:id",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: CAPASchema,
      }),
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // List CAPAs
  listCAPAs: {
    method: "GET",
    path: "/capas",
    query: z.object({
      status: z.enum(['open', 'assigned', 'root_cause_analysis', 'action_plan_pending', 'implementation', 'effectiveness_check', 'closed', 'cancelled']).optional(),
      type: z.enum(['corrective', 'preventive', 'both']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      assigned_to: z.string().uuid().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    }),
    responses: {
      200: PaginatedResponseSchema.extend({
        data: z.array(CAPASchema),
      }),
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Add Action Plan
  addActionPlan: {
    method: "POST",
    path: "/capas/:id/actions",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: CAPAActionSchema.omit({ action_id: true, created_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: CAPAActionSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Complete Action
  completeAction: {
    method: "POST",
    path: "/capas/:capaId/actions/:actionId/complete",
    pathParams: z.object({
      capaId: z.string().uuid(),
      actionId: z.string().uuid(),
    }),
    body: z.object({
      completion_evidence: z.string(),
      completed_date: z.coerce.date(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: CAPAActionSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Record Effectiveness Check
  recordEffectivenessCheck: {
    method: "POST",
    path: "/capas/:id/effectiveness-check",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      effectiveness_check_date: z.coerce.date(),
      effectiveness_result: z.string(),
      is_effective: z.boolean(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: CAPASchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
});

export type CAPAApiContractType = typeof CAPAApiContract;
```

#### 4.4.3 Deviation API

```typescript
// libs/shared/api-contracts/deviation.contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { 
  DeviationSchema, 
  DeviationInvestigationSchema,
  DeviationImpactAssessmentSchema
} from "../schemas/compliance/deviation.schema";
import { ApiResponseSchema, ApiErrorResponseSchema, PaginatedResponseSchema } from "./common.schema";

const c = initContract();

export const DeviationApiContract = c.router({
  // Report Deviation
  reportDeviation: {
    method: "POST",
    path: "/deviations",
    body: DeviationSchema.omit({ deviation_id: true, created_at: true, updated_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: DeviationSchema,
      }),
      400: ApiErrorResponseSchema,
      401: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Get Deviation by ID
  getDeviation: {
    method: "GET",
    path: "/deviations/:id",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: DeviationSchema,
      }),
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // List Deviations
  listDeviations: {
    method: "GET",
    path: "/deviations",
    query: z.object({
      status: z.enum(['open', 'under_investigation', 'pending_capa', 'closed']).optional(),
      severity: z.enum(['minor', 'major', 'critical']).optional(),
      classification: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    }),
    responses: {
      200: PaginatedResponseSchema.extend({
        data: z.array(DeviationSchema),
      }),
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Start Investigation
  startInvestigation: {
    method: "POST",
    path: "/deviations/:id/investigation",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: DeviationInvestigationSchema.omit({ investigation_id: true, created_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: DeviationInvestigationSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Submit Impact Assessment
  submitImpactAssessment: {
    method: "POST",
    path: "/deviations/:id/impact-assessment",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: DeviationImpactAssessmentSchema.omit({ assessment_id: true, created_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: DeviationImpactAssessmentSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Close Deviation
  closeDeviation: {
    method: "POST",
    path: "/deviations/:id/close",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      closure_summary: z.string(),
      disposition: z.string(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: DeviationSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
});

export type DeviationApiContractType = typeof DeviationApiContract;
```

#### 4.4.4 Validation API

```typescript
// libs/shared/api-contracts/validation.contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { 
  ValidationProtocolSchema,
  ValidationTestCaseSchema
} from "../schemas/compliance/validation-protocol.schema";
import { ApiResponseSchema, ApiErrorResponseSchema, PaginatedResponseSchema } from "./common.schema";

const c = initContract();

export const ValidationApiContract = c.router({
  // Create Validation Protocol
  createProtocol: {
    method: "POST",
    path: "/validation/protocols",
    body: ValidationProtocolSchema.omit({ protocol_id: true, created_at: true, updated_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: ValidationProtocolSchema,
      }),
      400: ApiErrorResponseSchema,
      401: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Get Protocol by ID
  getProtocol: {
    method: "GET",
    path: "/validation/protocols/:id",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: ValidationProtocolSchema,
      }),
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // List Protocols
  listProtocols: {
    method: "GET",
    path: "/validation/protocols",
    query: z.object({
      status: z.enum(['draft', 'under_review', 'approved', 'in_execution', 'completed', 'failed', 'cancelled']).optional(),
      validation_type: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    }),
    responses: {
      200: PaginatedResponseSchema.extend({
        data: z.array(ValidationProtocolSchema),
      }),
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Add Test Case
  addTestCase: {
    method: "POST",
    path: "/validation/protocols/:protocolId/test-cases",
    pathParams: z.object({
      protocolId: z.string().uuid(),
    }),
    body: ValidationTestCaseSchema.omit({ test_case_id: true, created_at: true }),
    responses: {
      201: ApiResponseSchema.extend({
        data: ValidationTestCaseSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Execute Test Case
  executeTestCase: {
    method: "POST",
    path: "/validation/test-cases/:id/execute",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      actual_result: z.string(),
      test_result: z.enum(['pass', 'fail', 'blocked']),
      execution_duration_minutes: z.number().positive().optional(),
      evidence_attachments: z.array(z.string()).optional(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: ValidationTestCaseSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },

  // Complete Protocol
  completeProtocol: {
    method: "POST",
    path: "/validation/protocols/:id/complete",
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    body: z.object({
      overall_result: z.enum(['pass', 'fail', 'conditional_pass']),
      conclusion: z.string(),
    }),
    responses: {
      200: ApiResponseSchema.extend({
        data: ValidationProtocolSchema,
      }),
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
});

export type ValidationApiContractType = typeof ValidationApiContract;
```

---

## 🛡️ **5. INTEGRATION CONTRACTS**

### 5.1 Mayan EDMS Integration

```typescript
// libs/shared/integrations/mayan-edms.schema.ts
import { z } from "zod";

// Mayan document schema
export const MayanDocumentSchema = z.object({
  id: z.number().positive(),
  uuid: z.string().uuid(),
  label: z.string(),
  description: z.string().optional(),
  document_type: z.object({
    id: z.number().positive(),
    label: z.string(),
  }),
  file_latest: z.object({
    id: z.number().positive(),
    filename: z.string(),
    size: z.number().positive(),
    mimetype: z.string(),
    checksum: z.string(),
    encoding: z.string(),
    timestamp: z.coerce.date(),
  }),
  metadata: z
    .array(
      z.object({
        metadata_type: z.object({
          id: z.number().positive(),
          name: z.string(),
          label: z.string(),
        }),
        value: z.string(),
      })
    )
    .default([]),
});

// Document upload request
export const MayanUploadDocumentRequestSchema = z.object({
  document_type_id: z.number().positive(),
  label: z.string().min(1),
  description: z.string().optional(),
  file: z.object({
    filename: z.string(),
    content: z.string(), // base64 encoded
    content_type: z.string(),
  }),
  metadata: z.record(z.string()).optional(),
});

// Document search request
export const MayanSearchDocumentsRequestSchema = z.object({
  q: z.string().optional(),
  document_type_id: z.number().positive().optional(),
  metadata_filters: z.record(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(100).default(20),
});

export const MayanSearchDocumentsResponseSchema = z.object({
  count: z.number().int().min(0),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(MayanDocumentSchema),
});

export type MayanDocument = z.infer<typeof MayanDocumentSchema>;
export type MayanUploadDocumentRequest = z.infer<
  typeof MayanUploadDocumentRequestSchema
>;
export type MayanSearchDocumentsRequest = z.infer<
  typeof MayanSearchDocumentsRequestSchema
>;
```

### 5.2 XeoKit 3D Integration

```typescript
// libs/shared/integrations/xeokit.schema.ts
import { z } from "zod";

// 3D model schema
export const XeoKit3DModelSchema = z.object({
  model_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  model_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  metadata: z.object({
    facility_id: z.string().uuid(),
    room_ids: z.array(z.string().uuid()).default([]),
    last_updated: z.coerce.date(),
    version: z.string(),
    format: z.enum(["XKT", "IFC", "GLB", "GLTF"]),
    file_size: z.number().positive(),
  }),
});

// Object selection/highlighting request
export const XeoKitObjectSelectionSchema = z.object({
  model_id: z.string(),
  object_ids: z.array(z.string()),
  action: z.enum(["SELECT", "HIGHLIGHT", "HIDE", "SHOW", "COLOR"]),
  color: z
    .object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
      a: z.number().min(0).max(1).default(1),
    })
    .optional(),
});

// Plant location overlay
export const XeoKitPlantOverlaySchema = z.object({
  plant_id: z.string().uuid(),
  model_id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  rotation: z
    .object({
      x: z.number().default(0),
      y: z.number().default(0),
      z: z.number().default(0),
    })
    .default({}),
  scale: z
    .object({
      x: z.number().positive().default(1),
      y: z.number().positive().default(1),
      z: z.number().positive().default(1),
    })
    .default({}),
  metadata: z.record(z.unknown()).default({}),
});

export type XeoKit3DModel = z.infer<typeof XeoKit3DModelSchema>;
export type XeoKitObjectSelection = z.infer<typeof XeoKitObjectSelectionSchema>;
export type XeoKitPlantOverlay = z.infer<typeof XeoKitPlantOverlaySchema>;
```

---

## 🔨 **6. RUNTIME VALIDATION & UTILITIES**

### 6.1 Validation Middleware

```typescript
// libs/shared/validation/middleware.ts
import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiErrorResponseSchema } from "../api-contracts/common/http.schema";

// Generic validation middleware factory
export function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  target: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const validated = schema.parse(data);
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: z.infer<typeof ApiErrorResponseSchema> = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            validation_errors: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
              value: err.input,
            })),
          },
          timestamp: new Date(),
          request_id:
            (req.headers["x-request-id"] as string) || crypto.randomUUID(),
        };
        return res.status(400).json(errorResponse);
      }
      next(error);
    }
  };
}

// Usage example
export const validateCreatePlant = validateSchema(
  CreatePlantRequestSchema,
  "body"
);
export const validatePlantQuery = validateSchema(
  ListPlantsRequestSchema,
  "query"
);
export const validatePlantParams = validateSchema(
  GetPlantRequestSchema,
  "params"
);
```

### 6.2 Event Validation Utilities

```typescript
// libs/shared/validation/events.ts
import { z } from "zod";
import { PlantEventSchema } from "../events/plant-events.schema";
import { IoTEventSchema } from "../events/iot-events.schema";

// Event validator factory
export function createEventValidator<T extends z.ZodTypeAny>(schema: T) {
  return {
    validate: (data: unknown): z.infer<T> => {
      return schema.parse(data);
    },
    safeParse: (data: unknown): z.SafeParseReturnType<unknown, z.infer<T>> => {
      return schema.safeParse(data);
    },
    is: (data: unknown): data is z.infer<T> => {
      return schema.safeParse(data).success;
    },
  };
}

// Pre-created validators for main event types
export const plantEventValidator = createEventValidator(PlantEventSchema);
export const iotEventValidator = createEventValidator(IoTEventSchema);

// Kafka message validator
export function validateKafkaMessage(topic: string, message: unknown) {
  switch (topic) {
    case "plants.events":
      return plantEventValidator.validate(message);
    case "iot.readings":
    case "iot.alerts":
      return iotEventValidator.validate(message);
    default:
      throw new Error(`Unknown topic: ${topic}`);
  }
}
```

### 6.3 OpenAPI Generation

```typescript
// tools/generate-openapi.ts
import { z } from "zod";
import { generateSchema } from "@anatine/zod-openapi";
import { PlantsApiContract } from "../libs/shared/api-contracts/plants/plants.contract";
import { SensorsApiContract } from "../libs/shared/api-contracts/iot/sensors.contract";

// Generate OpenAPI spec from Zod schemas
export function generateOpenAPISpec() {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "GACP-ERP API",
      version: "1.0.0",
      description: "Cannabis cultivation ERP system API",
    },
    servers: [
      {
        url: "https://api.gacp-erp.farm",
        description: "Production server",
      },
      {
        url: "https://staging-api.gacp-erp.farm",
        description: "Staging server",
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };

  // Generate paths from API contracts
  Object.entries(PlantsApiContract).forEach(([operationId, contract]) => {
    const path = contract.path.replace(/:(\w+)/g, "{$1}");

    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    spec.paths[path][contract.method.toLowerCase()] = {
      operationId,
      summary: `${contract.method} ${path}`,
      parameters: contract.request?.params
        ? [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ]
        : [],
      requestBody: contract.request?.body
        ? {
            required: true,
            content: {
              "application/json": {
                schema: generateSchema(contract.request.body),
              },
            },
          }
        : undefined,
      responses: Object.fromEntries(
        Object.entries(contract.responses).map(([status, schema]) => [
          status,
          {
            description: status === "200" ? "Success" : "Error",
            content: {
              "application/json": {
                schema: generateSchema(schema),
              },
            },
          },
        ])
      ),
      security: [{ BearerAuth: [] }],
    };
  });

  return spec;
}

// CLI script to generate and save OpenAPI spec
if (require.main === module) {
  const spec = generateOpenAPISpec();
  require("fs").writeFileSync(
    "./docs/api/openapi.json",
    JSON.stringify(spec, null, 2)
  );
  console.log("OpenAPI spec generated at ./docs/api/openapi.json");
}
```

---

## 📋 **7. TYPE SAFETY & BEST PRACTICES**

### 7.1 Type Inference Patterns

```typescript
// Best practices for working with Zod schemas

// ✅ GOOD: Use type inference
const user = UserSchema.parse(userData);
type User = z.infer<typeof UserSchema>; // Automatic type generation

// ✅ GOOD: Create derived schemas
const PublicUserSchema = UserSchema.omit({
  password_changed_at: true,
  two_factor_enabled: true,
});
type PublicUser = z.infer<typeof PublicUserSchema>;

// ✅ GOOD: Extend base schemas
const AdminUserSchema = UserSchema.extend({
  admin_level: z.number().min(1).max(5),
  permissions: z.array(z.string()),
});

// ✅ GOOD: Use discriminated unions for polymorphism
const NotificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    email: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  z.object({
    type: z.literal("sms"),
    phone: z.string(),
    message: z.string(),
  }),
]);

// ❌ BAD: Don't duplicate interfaces
// interface User { ... } // This creates duplication!
```

### 7.2 Validation Patterns

```typescript
// Robust validation patterns

// ✅ GOOD: Use transforms for data normalization
const EmailSchema = z.string().trim().toLowerCase().email();

const PhoneSchema = z
  .string()
  .transform((phone) => phone.replace(/\D/g, ""))
  .refine((phone) => phone.length >= 10, {
    message: "Phone number must be at least 10 digits",
  });

// ✅ GOOD: Custom validation with context
const PlantTagSchema = z
  .string()
  .regex(/^P\d{8}$/, "Plant tag must be in format P12345678")
  .refine(
    async (tag) => {
      // Check uniqueness in database
      const exists = await checkPlantTagExists(tag);
      return !exists;
    },
    {
      message: "Plant tag already exists",
    }
  );

// ✅ GOOD: Conditional validation
const PlantSchema = z
  .object({
    stage: PlantStageSchema,
    harvest_date: z.coerce.date().optional(),
    destruction_date: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.stage === "HARVEST" && !data.harvest_date) {
        return false;
      }
      if (data.stage === "DESTROYED" && !data.destruction_date) {
        return false;
      }
      return true;
    },
    {
      message: "Required dates missing for current stage",
    }
  );
```

### 7.3 Error Handling

```typescript
// Comprehensive error handling with Zod

export class ValidationService {
  static validateAndTransform<T extends z.ZodTypeAny>(
    schema: T,
    data: unknown,
    context?: string
  ): z.infer<T> {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(
          `Validation failed${context ? ` for ${context}` : ""}`,
          error.errors
        );
        throw validationError;
      }
      throw error;
    }
  }

  static async safeValidate<T extends z.ZodTypeAny>(
    schema: T,
    data: unknown
  ): Promise<
    { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError }
  > {
    const result = await schema.safeParseAsync(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error };
    }
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly zodErrors: z.ZodIssue[]) {
    super(message);
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.zodErrors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    };
  }
}
```

---

## 🎯 **8. IMPLEMENTATION CHECKLIST**

### 8.1 Development Tasks

- [ ] **Create schema libraries structure**

  - [ ] `libs/shared/schemas/` - All domain schemas
  - [ ] `libs/shared/events/` - All Kafka event schemas
  - [ ] `libs/shared/api-contracts/` - All HTTP API contracts
  - [ ] `libs/shared/integrations/` - External service schemas

- [ ] **Implement validation middleware**

  - [ ] Generic validation middleware factory
  - [ ] Request/response validation
  - [ ] Error handling middleware
  - [ ] Custom validation functions

- [ ] **Generate OpenAPI documentation**

  - [ ] Automated OpenAPI spec generation
  - [ ] Swagger UI integration
  - [ ] API documentation website
  - [ ] Contract testing setup

- [ ] **Update existing code**
  - [ ] Replace TypeScript interfaces with Zod schemas
  - [ ] Add runtime validation to all APIs
  - [ ] Update Kafka event handling
  - [ ] Migrate integration contracts

### 8.2 Quality Assurance

- [ ] **Type safety verification**

  - [ ] Ensure all APIs use Zod validation
  - [ ] Verify type inference works correctly
  - [ ] Test schema composition and extension
  - [ ] Validate error handling

- [ ] **Performance testing**

  - [ ] Benchmark validation performance
  - [ ] Test large data set validation
  - [ ] Optimize schema parsing
  - [ ] Cache validation results where appropriate

- [ ] **Integration testing**
  - [ ] Test API contract compliance
  - [ ] Verify Kafka event validation
  - [ ] Test external service integrations
  - [ ] End-to-end contract testing

---

## 📚 **9. СВЯЗАННАЯ ДОКУМЕНТАЦИЯ**

### Архитектурные документы

- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Общая архитектура системы
- **[EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md)** - Kafka события и паттерны

### Операционная документация

- **[API Documentation](./api/)** - Автогенерируемая OpenAPI документация
- **[Integration Guide](./integrations/)** - Руководства по интеграциям

### Валидационная документация

- **[Validation Standards](./validation/)** - Стандарты валидации данных
- **[Testing Procedures](./testing/)** - Процедуры тестирования контрактов

---

**Документация актуальна на**: 14 сентября 2025 г.  
**Следующий review**: 14 декабря 2025 г.
