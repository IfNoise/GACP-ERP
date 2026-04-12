import { z } from 'zod';

import {
  BaseEntitySchema,
  ElectronicSignatureSchema,
  SoftDeletableSchema,
} from '../common/base-entity.schema';
import {
  BatchIdSchema,
  PlantIdSchema,
  StrainIdSchema,
  SupplierIdSchema,
  UserIdSchema,
  ZoneIdSchema,
} from '../common/branded-ids';
import { IncomingInspectionStatusEnum } from '../quality/incoming-inspection.schema';

// ─── PLANT SOURCE TYPE ──────────────────────────────────────────────────────
/**
 * How this plant originated. Critical for GACP traceability:
 * - seed: grown from seed
 * - clone: cutting taken from a mother plant
 * - tissue_culture: tissue-culture plantlet
 */
export const PlantSourceTypeEnum = z.enum(['seed', 'clone', 'tissue_culture']);
export type PlantSourceType = z.infer<typeof PlantSourceTypeEnum>;

// ─── GROWTH STAGE ENUM ───────────────────────────────────────────────────────
/**
 * Plant lifecycle stages per GACP cultivation protocol.
 * Transitions are enforced by GrowthStageStateMachine in the cultivation service.
 */
export const GrowthStageEnum = z.enum([
  'SEED',
  'GERMINATION',
  'CLONING',
  'VEGETATIVE',
  'MOTHER_PLANT',
  'FLOWERING',
  'HARVESTING',
  'HARVESTED',
  'DESTROYED', // Deviation outcome: plant destroyed before harvest
]);
export type GrowthStage = z.infer<typeof GrowthStageEnum>;

/** Valid state machine transitions */
export const VALID_STAGE_TRANSITIONS: Readonly<Record<GrowthStage, readonly GrowthStage[]>> = {
  SEED: ['GERMINATION', 'DESTROYED'],
  GERMINATION: ['CLONING', 'VEGETATIVE', 'DESTROYED'],
  CLONING: ['VEGETATIVE', 'DESTROYED'],
  VEGETATIVE: ['FLOWERING', 'MOTHER_PLANT', 'DESTROYED'],
  MOTHER_PLANT: ['VEGETATIVE', 'DESTROYED'],
  FLOWERING: ['HARVESTING', 'DESTROYED'],
  HARVESTING: ['HARVESTED', 'DESTROYED'],
  HARVESTED: [],
  DESTROYED: [],
} as const;

// ─── STRAIN SPECIES ─────────────────────────────────────────────────────────
export const StrainSpeciesEnum = z.enum([
  'Cannabis sativa',
  'Cannabis indica',
  'Cannabis ruderalis',
  'hybrid',
]);
export type StrainSpecies = z.infer<typeof StrainSpeciesEnum>;

// ─── STRAIN SOURCE TYPE ─────────────────────────────────────────────────────
/** How the genetics were originally obtained (seed bank, breeder, etc.) */
export const StrainSourceTypeEnum = z.enum(['seed', 'clone', 'tissue_culture']);
export type StrainSourceType = z.infer<typeof StrainSourceTypeEnum>;

// ─── TERPENE PROFILE ────────────────────────────────────────────────────────
/** Terpene analysis: { myrcene: 1.2, limonene: 0.8, ... } (% dry weight) */
export const TerpeneProfileSchema = z.record(z.string(), z.number().nonnegative());
export type TerpeneProfile = z.infer<typeof TerpeneProfileSchema>;

// ─── LINEAGE ────────────────────────────────────────────────────────────────
/** Structured genetic lineage for backward traceability */
export const LineageSchema = z.object({
  mother: z.string().max(255).optional(),
  father: z.string().max(255).optional(),
  generation: z.number().int().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});
export type Lineage = z.infer<typeof LineageSchema>;

// ─── STRAIN ──────────────────────────────────────────────────────────────────
export const StrainSchema = SoftDeletableSchema.extend({
  id: StrainIdSchema,
  name: z.string().min(1).max(200),
  cultivar_code: z.string().min(1).max(50).toUpperCase(),
  species: StrainSpeciesEnum,
  genetics: z.string().max(255).optional(),
  /** Breeder or breeding company (backward traceability per SOP 8.1) */
  breeder: z.string().max(255).optional(),
  /** Seed bank source (WHO GACP seed banking) */
  seed_bank: z.string().max(255).optional(),
  /** How the genetics were obtained */
  source_type: StrainSourceTypeEnum,
  // ── Cannabinoid profile ──
  thc_percentage_min: z.number().min(0).max(100).optional(),
  thc_percentage_max: z.number().min(0).max(100).optional(),
  cbd_percentage_min: z.number().min(0).max(100).optional(),
  cbd_percentage_max: z.number().min(0).max(100).optional(),
  // ── Growth parameters ──
  flowering_time_days_min: z.number().int().positive().optional(),
  flowering_time_days_max: z.number().int().positive().optional(),
  expected_yield_grams_min: z.number().positive().optional(),
  expected_yield_grams_max: z.number().positive().optional(),
  /** Terpene analysis profile (SOP 9.1) */
  terpene_profile: TerpeneProfileSchema.optional(),
  /** URL to DNA fingerprinting report (mandatory per SOP 9.1 / WHO GACP 3.1.1) */
  dna_profile_url: z.string().url().optional(),
  /** Structured genetic lineage (WHO GACP backward traceability) */
  lineage: LineageSchema.optional(),
  // ── Procurement / Cost ──
  /** Total acquisition cost for this genetics */
  acquisition_cost: z.number().nonnegative().optional(),
  /** Currency for cost fields (ISO 4217, default EUR) */
  currency: z.string().length(3).default('EUR'),
  /** Cost per seed or clone unit */
  cost_per_unit: z.number().nonnegative().optional(),
  /** Unit type for cost_per_unit */
  unit_type: z.string().max(20).optional(),
  // ── Regulatory ──
  /** Required quarantine period in days (seeds: 7-14, clones: 14-21) */
  quarantine_days: z.number().int().positive().optional(),
  /** Multi-generation consistency verified (SOP 4.1 stability testing) */
  stability_verified: z.boolean().default(false),
  /** EU regulatory registration number */
  registration_number: z.string().max(100).optional(),
  // ── Common ──
  notes: z.string().max(2000).optional(),
  certificate_url: z.string().url().optional(),
  supplier_id: SupplierIdSchema.optional(),
  is_active: z.boolean().default(true),
  /** Latest inspection status from incoming_inspections (null = no inspection yet) */
  current_inspection_status: IncomingInspectionStatusEnum.nullable().default(null),
});
export type Strain = z.infer<typeof StrainSchema>;

// ─── STRAIN CREATE/UPDATE/DEACTIVATE ────────────────────────────────────────
export const CreateStrainSchema = z.object({
  name: z.string().min(1).max(200),
  cultivar_code: z.string().min(1).max(50).toUpperCase(),
  species: StrainSpeciesEnum.default('hybrid'),
  genetics: z.string().max(255).optional(),
  breeder: z.string().max(255).optional(),
  seed_bank: z.string().max(255).optional(),
  source_type: StrainSourceTypeEnum.default('seed'),
  // Cannabinoids
  thc_percentage_min: z.number().min(0).max(100).optional(),
  thc_percentage_max: z.number().min(0).max(100).optional(),
  cbd_percentage_min: z.number().min(0).max(100).optional(),
  cbd_percentage_max: z.number().min(0).max(100).optional(),
  // Growth
  flowering_time_days_min: z.number().int().positive().optional(),
  flowering_time_days_max: z.number().int().positive().optional(),
  expected_yield_grams_min: z.number().positive().optional(),
  expected_yield_grams_max: z.number().positive().optional(),
  // Terpenes & DNA
  terpene_profile: TerpeneProfileSchema.optional(),
  dna_profile_url: z.string().url().optional(),
  lineage: LineageSchema.optional(),
  // Cost
  acquisition_cost: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('EUR'),
  cost_per_unit: z.number().nonnegative().optional(),
  unit_type: z.string().max(20).optional(),
  // Regulatory
  quarantine_days: z.number().int().positive().optional(),
  stability_verified: z.boolean().optional(),
  registration_number: z.string().max(100).optional(),
  // Common
  supplier_id: SupplierIdSchema.optional(),
  notes: z.string().max(2000).optional(),
  certificate_url: z.string().url().optional(),
});
export type CreateStrain = z.infer<typeof CreateStrainSchema>;

export const UpdateStrainSchema = CreateStrainSchema.partial();
export type UpdateStrain = z.infer<typeof UpdateStrainSchema>;

export const DeactivateStrainSchema = z.object({
  reason: z.string().max(500).optional(),
});
export type DeactivateStrain = z.infer<typeof DeactivateStrainSchema>;

// ─── PLANT ───────────────────────────────────────────────────────────────────
export const PlantSchema = SoftDeletableSchema.extend({
  id: PlantIdSchema,
  /** Batch this plant belongs to */
  batch_id: BatchIdSchema,
  /** Genetic strain */
  strain_id: StrainIdSchema,
  /** Current lifecycle stage */
  current_stage: GrowthStageEnum,
  /** How this plant originated (seed, clone, tissue_culture) */
  source_type: PlantSourceTypeEnum.default('seed'),
  /** ID of the mother plant this clone was taken from (null for seed-grown plants) */
  mother_plant_id: PlantIdSchema.nullable().optional(),
  /**
   * Clone generation number. Seed = 0, first clone from seed-grown mother = 1,
   * clone from that clone's mother = 2, etc. Used for genetic drift tracking.
   */
  generation: z.number().int().nonnegative().default(0),
  /** Current zone (sole spatial reference — room/building/facility derive from hierarchy) */
  zone_id: ZoneIdSchema,
  /**
   * Structured plant code: PLANT-YYYY-NNN (max 20 chars).
   * Unique across the system. Regex: /^[A-Z0-9-]+$/
   */
  plant_code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9-]+$/, { message: 'plant_code must be uppercase alphanumeric with hyphens' }),
  /** Health score 0-100 (100 = healthy, 0 = critical) */
  health_score: z.number().int().min(0).max(100).optional(),
  /** When the last stage change occurred */
  last_stage_change_at: z.string().datetime({ offset: true }).optional(),
  /**
   * Timestamp of the most recent plant_operation for this plant.
   * Denormalized field — updated by the service on every operation insert.
   * Use for sorting/filtering by activity without aggregation.
   */
  last_operation_at: z.string().datetime({ offset: true }).optional(),
  /** Optional free-text notes */
  notes: z.string().max(2000).optional(),
});
export type Plant = z.infer<typeof PlantSchema>;

// ─── CREATE/UPDATE DTOs ──────────────────────────────────────────────────────
export const CreatePlantSchema = z.object({
  batch_id: BatchIdSchema,
  strain_id: StrainIdSchema,
  zone_id: ZoneIdSchema,
  plant_code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9-]+$/),
  source_type: PlantSourceTypeEnum.default('seed'),
  /** Required when source_type is 'clone' — the mother plant ID */
  mother_plant_id: PlantIdSchema.nullable().optional(),
  /** Clone generation (auto-calculated from mother if not provided) */
  generation: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});
export type CreatePlant = z.infer<typeof CreatePlantSchema>;

export const UpdatePlantSchema = z.object({
  health_score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdatePlant = z.infer<typeof UpdatePlantSchema>;

// ─── MOVE PLANT ──────────────────────────────────────────────────────────────
export const MovePlantSchema = z.object({
  zone_id: ZoneIdSchema,
  reason: z.string().max(500).optional(),
});
export type MovePlant = z.infer<typeof MovePlantSchema>;

// ─── STAGE TRANSITION ────────────────────────────────────────────────────────
export const StageTransitionSchema = z.object({
  target_stage: GrowthStageEnum,
  notes: z.string().max(2000).optional(),
  /** Required for critical transitions (HARVESTING → HARVESTED, any → DESTROYED) */
  electronic_signature: ElectronicSignatureSchema.optional(),
  /** Environmental readings at time of transition */
  temperature_celsius: z.number().min(-20).max(60).optional(),
  humidity_percent: z.number().min(0).max(100).optional(),
});
export type StageTransition = z.infer<typeof StageTransitionSchema>;

// ─── PLANT STAGE TRANSITION RECORD ──────────────────────────────────────────
/**
 * Matches the `stage_records` DB table.
 * Records a completed stage transition (audit trail).
 */
export const PlantStageTransitionRecordSchema = z.object({
  id: z.string().uuid(),
  plant_id: PlantIdSchema,
  from_stage: GrowthStageEnum,
  to_stage: GrowthStageEnum,
  /** Operator who performed the physical stage transition */
  transitioned_by: UserIdSchema,
  /**
   * Supervisor who authorized the transition.
   * REQUIRED for transitions to HARVESTING, HARVESTED, DESTROYED.
   */
  authorized_by: UserIdSchema.optional(),
  authorized_at: z.string().datetime({ offset: true }).optional(),
  /** E-signature of the operator (21 CFR §11.50) */
  electronic_signature: ElectronicSignatureSchema.optional(),
  /** E-signature of the authorizing supervisor */
  authorization_signature: ElectronicSignatureSchema.optional(),
  notes: z.string().max(2000).optional(),
  transitioned_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
});
export type PlantStageTransitionRecord = z.infer<typeof PlantStageTransitionRecordSchema>;

// ─── GROWTH STAGE RECORD ─────────────────────────────────────────────────────
export const GrowthStageRecordSchema = BaseEntitySchema.extend({
  plant_id: PlantIdSchema,
  stage: GrowthStageEnum,
  started_at: z.string().datetime({ offset: true }),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  duration_days: z.number().nonnegative().nullable(),
  recorded_by: UserIdSchema,
  notes: z.string().max(2000).optional(),
  electronic_signature: ElectronicSignatureSchema.nullable(),
  temperature_celsius: z.number().optional(),
  humidity_percent: z.number().optional(),
});
export type GrowthStageRecord = z.infer<typeof GrowthStageRecordSchema>;

// ─── PLANT OPERATION TYPE ENUM ───────────────────────────────────────────────
/**
 * Physical operations on plants (matches plant_operation_type PG enum).
 * NOT to be confused with Kafka domain events.
 */
export const PlantOperationTypeEnum = z.enum([
  'stage_change',
  'transplant',
  'pruning',
  'watering',
  'fertilizing',
  'health_check',
  'pest_treatment',
  'cloning', // Taking cuttings from a mother plant
  'harvest',
  'destruction',
  'observation',
]);
export type PlantOperationType = z.infer<typeof PlantOperationTypeEnum>;

/**
 * Operations requiring supervisor authorization (authorized_by REQUIRED).
 * Used for validation in the service layer.
 */
export const OPERATIONS_REQUIRING_AUTHORIZATION: ReadonlySet<PlantOperationType> = new Set([
  'pest_treatment',
  'destruction',
  'harvest',
]);

/**
 * Operations requiring QA review (qa_reviewed_by REQUIRED before marking complete).
 * Aligns with EU GMP Annex 11 §12 and SOP-COC-001.
 */
export const OPERATIONS_REQUIRING_QA_REVIEW: ReadonlySet<PlantOperationType> = new Set([
  'pest_treatment',
  'destruction',
]);

// ─── PLANT OPERATION RECORD ───────────────────────────────────────────────────
/**
 * Matches the `plant_operations` DB table.
 * Append-only physical operation journal — full responsibility chain per ALCOA+.
 */
export const PlantOperationRecordSchema = z.object({
  id: z.string().uuid(),
  plant_id: PlantIdSchema,
  operation_type: PlantOperationTypeEnum,
  operation_data: z.record(z.unknown()).default({}),
  /** Operator who physically performed the operation */
  performed_by: UserIdSchema,
  performed_at: z.string().datetime({ offset: true }),
  /**
   * Supervisor / shift-lead authorization.
   * REQUIRED for: pest_treatment, destruction, harvest.
   * See OPERATIONS_REQUIRING_AUTHORIZATION.
   */
  authorized_by: UserIdSchema.optional(),
  authorized_at: z.string().datetime({ offset: true }).optional(),
  /** Electronic signature of the authorizing supervisor (21 CFR §11.50) */
  authorization_signature: ElectronicSignatureSchema.optional(),
  /**
   * QA review / approval.
   * REQUIRED for: pest_treatment, destruction.
   * See OPERATIONS_REQUIRING_QA_REVIEW.
   */
  qa_reviewed_by: UserIdSchema.optional(),
  qa_reviewed_at: z.string().datetime({ offset: true }).optional(),
  /** QA electronic signature (21 CFR §11.50) */
  qa_signature: ElectronicSignatureSchema.optional(),
  /** Cost fields (populated by financial service) */
  labour_cost: z.number().nonnegative().optional(),
  material_cost: z.number().nonnegative().optional(),
  equipment_cost: z.number().nonnegative().optional(),
  created_at: z.string().datetime({ offset: true }),
});
export type PlantOperationRecord = z.infer<typeof PlantOperationRecordSchema>;

/** DTO for recording a new operation */
export const CreatePlantOperationSchema = z.object({
  plant_id: PlantIdSchema,
  operation_type: PlantOperationTypeEnum,
  operation_data: z.record(z.unknown()).optional(),
  performed_by: UserIdSchema,
  performed_at: z.string().datetime({ offset: true }).optional(),
  authorized_by: UserIdSchema.optional(),
  authorized_at: z.string().datetime({ offset: true }).optional(),
  authorization_signature: ElectronicSignatureSchema.optional(),
  labour_cost: z.number().nonnegative().optional(),
  material_cost: z.number().nonnegative().optional(),
  equipment_cost: z.number().nonnegative().optional(),
});
export type CreatePlantOperation = z.infer<typeof CreatePlantOperationSchema>;

// ─── BULK CREATE PLANTS ───────────────────────────────────────────────────────
/**
 * DTO for the bulk plant intake operation.
 * Creates `count` plants in the specified batch/zone in a single transaction.
 * Plant codes are auto-generated as `{plant_code_prefix}-{YYYY}-{NNN}`.
 */
export const BulkCreatePlantsSchema = z.object({
  batch_id: BatchIdSchema,
  strain_id: StrainIdSchema,
  zone_id: ZoneIdSchema,
  source_type: PlantSourceTypeEnum.default('seed'),
  count: z.number().int().positive().max(10000),
  /**
   * Prefix for generated plant codes, e.g. "CLN-2026-A".
   * Codes will be: PREFIX-001, PREFIX-002, …
   */
  plant_code_prefix: z
    .string()
    .min(2)
    .max(12)
    .regex(/^[A-Z0-9-]+$/, {
      message: 'plant_code_prefix must be uppercase alphanumeric and hyphens',
    }),
  notes: z.string().max(2000).optional(),
});
export type BulkCreatePlants = z.infer<typeof BulkCreatePlantsSchema>;

export const BulkCreatePlantsResultSchema = z.object({
  created: z.number().int().nonnegative(),
  plant_ids: z.array(z.string().uuid()),
});
export type BulkCreatePlantsResult = z.infer<typeof BulkCreatePlantsResultSchema>;
