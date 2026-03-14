import { z } from 'zod';

import {
  BaseEntitySchema,
  ElectronicSignatureSchema,
  SoftDeletableSchema,
} from '../common/base-entity.schema';
import {
  BatchIdSchema,
  FacilityIdSchema,
  PlantIdSchema,
  RoomIdSchema,
  StrainIdSchema,
  UserIdSchema,
  ZoneIdSchema,
} from '../common/branded-ids';

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
  'MOTHER_PLANT', // Not a separate stage in the lifecycle, but useful to track for reporting
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
  VEGETATIVE: ['FLOWERING', 'DESTROYED'],
  MOTHER_PLANT: ['VEGETATIVE', 'DESTROYED'],
  FLOWERING: ['HARVESTING', 'DESTROYED'],
  HARVESTING: ['HARVESTED', 'DESTROYED'],
  HARVESTED: [],
  DESTROYED: [],
} as const;

// ─── STRAIN ──────────────────────────────────────────────────────────────────
export const StrainSchema = SoftDeletableSchema.extend({
  id: StrainIdSchema,
  name: z.string().min(1).max(200),
  cultivar_code: z.string().min(1).max(50).toUpperCase(),
  species: z.enum(['Cannabis sativa', 'Cannabis indica', 'Cannabis ruderalis', 'hybrid']),
  thc_percentage_min: z.number().min(0).max(100).optional(),
  thc_percentage_max: z.number().min(0).max(100).optional(),
  cbd_percentage_min: z.number().min(0).max(100).optional(),
  cbd_percentage_max: z.number().min(0).max(100).optional(),
  expected_flowering_days: z.number().int().positive().optional(),
  expected_yield_grams_min: z.number().positive().optional(),
  expected_yield_grams_max: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  certificate_url: z.string().url().optional(),
});
export type Strain = z.infer<typeof StrainSchema>;

// ─── PLANT ───────────────────────────────────────────────────────────────────
export const PlantSchema = SoftDeletableSchema.extend({
  id: PlantIdSchema,
  /** Batch this plant belongs to */
  batch_id: BatchIdSchema,
  /** Genetic strain */
  strain_id: StrainIdSchema,
  /** Current lifecycle stage */
  current_stage: GrowthStageEnum,
  /** Physical location */
  facility_id: FacilityIdSchema,
  room_id: RoomIdSchema.optional(),
  zone_id: ZoneIdSchema.optional(),
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
  facility_id: FacilityIdSchema,
  room_id: RoomIdSchema.optional(),
  zone_id: ZoneIdSchema.optional(),
  plant_code: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9-]+$/),
  notes: z.string().max(2000).optional(),
});
export type CreatePlant = z.infer<typeof CreatePlantSchema>;

export const UpdatePlantSchema = z.object({
  room_id: RoomIdSchema.optional(),
  zone_id: ZoneIdSchema.optional(),
  health_score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});
export type UpdatePlant = z.infer<typeof UpdatePlantSchema>;

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
