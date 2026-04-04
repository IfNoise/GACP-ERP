import { z } from 'zod';

import { SoftDeletableSchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import {
  BatchIdSchema,
  FacilityIdSchema,
  PlantIdSchema,
  StrainIdSchema,
  UserIdSchema,
  ZoneIdSchema,
} from '../common/branded-ids';

// ─── COMPLIANCE STATUS ──────────────────────────────────────────────────────────
export const ComplianceStatusEnum = z.enum(['pending', 'approved', 'rejected']);
export type ComplianceStatus = z.infer<typeof ComplianceStatusEnum>;

// ─── BATCH STATUS ─────────────────────────────────────────────────────────────
export const BatchStatusEnum = z.enum([
  'PLANNED',
  'ACTIVE',
  'HARVESTING',
  'COMPLETED',
  'DESTROYED',
  'ON_HOLD', // Deviation/investigation hold
]);
export type BatchStatus = z.infer<typeof BatchStatusEnum>;

// ─── BATCH ────────────────────────────────────────────────────────────────────
/**
 * A batch is a group of plants from the same strain started at the same time.
 * Batch management is central to GACP traceability requirements.
 */
export const BatchSchema = SoftDeletableSchema.extend({
  id: BatchIdSchema,
  /**
   * Human-readable batch number, e.g. BATCH-2026-001.
   * Must be unique across the facility.
   */
  batch_number: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, {
      message: 'batch_number must be uppercase alphanumeric with _ and -',
    }),
  /** Parent batch (for splits/clones) */
  parent_batch_id: BatchIdSchema.nullable().optional(),
  strain_id: StrainIdSchema,
  facility_id: FacilityIdSchema,
  status: BatchStatusEnum.default('PLANNED'),
  /** QA compliance review status */
  compliance_status: ComplianceStatusEnum.default('pending'),
  /** Planned number of plants for this batch */
  planned_plant_count: z.number().int().positive(),
  /** Current actual plant count (decrements on destruction) */
  actual_plant_count: z.number().int().nonnegative().default(0),
  notes: z.string().max(2000).optional(),
  /** When batch planting is planned to start */
  planned_start_date: z.string().datetime({ offset: true }).optional(),
  /** When batch planting actually started (first plant planted) */
  actual_start_date: z.string().datetime({ offset: true }).optional(),
  /** Target harvest date (planning) */
  planned_harvest_date: z.string().datetime({ offset: true }).optional(),
  /** When batch was actually harvested/completed */
  actual_harvest_date: z.string().datetime({ offset: true }).optional(),
});
export type Batch = z.infer<typeof BatchSchema>;

// ─── CREATE/UPDATE DTOs ───────────────────────────────────────────────────────
export const CreateBatchSchema = z.object({
  batch_number: z.string().min(1).max(50),
  parent_batch_id: BatchIdSchema.nullable().optional(),
  strain_id: StrainIdSchema,
  facility_id: FacilityIdSchema,
  compliance_status: ComplianceStatusEnum.optional(),
  planned_plant_count: z.number().int().positive(),
  notes: z.string().max(2000).optional(),
  planned_start_date: z.string().datetime({ offset: true }).optional(),
  planned_harvest_date: z.string().datetime({ offset: true }).optional(),
});
export type CreateBatch = z.infer<typeof CreateBatchSchema>;

export const UpdateBatchSchema = z.object({
  notes: z.string().max(2000).optional(),
  planned_harvest_date: z.string().datetime({ offset: true }).optional(),
  status: BatchStatusEnum.optional(),
});
export type UpdateBatch = z.infer<typeof UpdateBatchSchema>;

// ─── HARVEST RECORD ──────────────────────────────────────────────────────────
export const QualityGradeEnum = z.enum(['AAA', 'AA', 'A', 'B', 'C', 'REJECTED']);
export type QualityGrade = z.infer<typeof QualityGradeEnum>;

/**
 * Harvest record captures the final yield data for a batch.
 * Requires electronic signature from CULTIVATION_MANAGER or higher.
 */
export const HarvestRecordSchema = z.object({
  id: z.string().uuid(),
  batch_id: BatchIdSchema,
  /** Total wet weight at harvest in grams */
  wet_weight_grams: z.number().positive(),
  /** Post-drying yield weight in grams (nullable until drying complete) */
  dry_weight_grams: z.number().positive().nullable(),
  /** Moisture content as percentage at time of harvest */
  moisture_content_percent: z.number().min(0).max(100),
  /** Target moisture content after drying */
  target_moisture_percent: z.number().min(0).max(100).optional(),
  quality_grade: QualityGradeEnum,
  /** Who performed the harvest */
  harvested_by: UserIdSchema,
  harvested_at: z.string().datetime({ offset: true }),
  /** Approval signature (CULTIVATION_MANAGER) */
  electronic_signature: ElectronicSignatureSchema,
  /** QC release signature (QUALITY_MANAGER) */
  qc_release_signature: ElectronicSignatureSchema.nullable(),
  qc_released_at: z.string().datetime({ offset: true }).nullable(),
  notes: z.string().max(2000).optional(),
  created_at: z.string().datetime({ offset: true }),
  created_by: UserIdSchema,
});
export type HarvestRecord = z.infer<typeof HarvestRecordSchema>;

export const CreateHarvestSchema = z.object({
  batch_id: BatchIdSchema,
  wet_weight_grams: z.number().positive(),
  moisture_content_percent: z.number().min(0).max(100),
  quality_grade: QualityGradeEnum,
  harvested_at: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(2000).optional(),
  electronic_signature: ElectronicSignatureSchema,
});
export type CreateHarvest = z.infer<typeof CreateHarvestSchema>;

// ─── CLONE BATCH ───────────────────────────────────────────────────────────
/**
 * DTO for cloning a batch from a mother plant.
 * Creates a new child batch with N clone plants linked to the source mother.
 */
export const CloneBatchSchema = z.object({
  /** The mother plant that cuttings are taken from (must be in MOTHER_PLANT stage) */
  mother_plant_id: PlantIdSchema,
  /** Number of cuttings/clones to produce */
  clone_count: z.number().int().positive().max(500),
  /** Batch number for the new clone batch */
  batch_number: z.string().min(1).max(50),
  /** Facility where clones will be placed */
  facility_id: FacilityIdSchema,
  /** Zone for clone rooting (required — initial placement for clone plants) */
  zone_id: ZoneIdSchema,
  /** Optional plant code prefix — clones will be numbered: PREFIX-001, PREFIX-002, etc. */
  plant_code_prefix: z
    .string()
    .min(2)
    .max(14)
    .regex(/^[A-Z0-9-]+$/)
    .optional(),
  notes: z.string().max(2000).optional(),
  planned_harvest_date: z.string().datetime({ offset: true }).optional(),
});
export type CloneBatch = z.infer<typeof CloneBatchSchema>;
