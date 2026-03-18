import { z } from 'zod';

import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';
import { GxpValidationFieldsSchema } from '../common/gxp-validation.schema';

// ─── CAPA TYPE ────────────────────────────────────────────────────────────────
/**
 * Corrective and Preventive Action classification.
 *  - CORRECTIVE  : Eliminates the cause of a detected nonconformity (CA)
 *  - PREVENTIVE  : Eliminates the cause of a potential nonconformity (PA)
 */
export const CapaTypeEnum = z.enum(['CORRECTIVE', 'PREVENTIVE']);
export type CapaType = z.infer<typeof CapaTypeEnum>;

// ─── CAPA SOURCE ──────────────────────────────────────────────────────────────
/**
 * Origin of the CAPA — traceability to the triggering quality event.
 */
export const CapaSourceEnum = z.enum(['DEVIATION', 'AUDIT', 'COMPLAINT', 'TREND', 'INSPECTION']);
export type CapaSource = z.infer<typeof CapaSourceEnum>;

// ─── CAPA STATUS (State Machine) ─────────────────────────────────────────────
/**
 * CAPA lifecycle states per ICH Q10 §3.2 / FDA 21 CFR §820.100.
 *
 * Valid transitions (enforced by CAPAAggregate):
 *   OPEN → RCA_IN_PROGRESS → ACTION_PLAN → IMPLEMENTING → EFFECTIVENESS_CHECK → CLOSED
 *
 * Electronic signature required for: CLOSED transition.
 */
export const CapaStatusEnum = z.enum([
  'OPEN',
  'RCA_IN_PROGRESS',
  'ACTION_PLAN',
  'IMPLEMENTING',
  'EFFECTIVENESS_CHECK',
  'CLOSED',
]);
export type CapaStatus = z.infer<typeof CapaStatusEnum>;

export const CAPA_TRANSITIONS: Record<CapaStatus, CapaStatus[]> = {
  OPEN: ['RCA_IN_PROGRESS'],
  RCA_IN_PROGRESS: ['ACTION_PLAN'],
  ACTION_PLAN: ['IMPLEMENTING'],
  IMPLEMENTING: ['EFFECTIVENESS_CHECK'],
  EFFECTIVENESS_CHECK: ['CLOSED'],
  CLOSED: [],
};

// ─── ROOT CAUSE CATEGORY ─────────────────────────────────────────────────────
export const RootCauseCategoryEnum = z.enum([
  'HUMAN_ERROR',
  'PROCESS_FAILURE',
  'EQUIPMENT_FAILURE',
  'MATERIAL_DEFECT',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'TRAINING_GAP',
  'SYSTEM_FAILURE',
  'UNKNOWN',
]);
export type RootCauseCategory = z.infer<typeof RootCauseCategoryEnum>;

// ─── RCA FINDING ─────────────────────────────────────────────────────────────
export const RcaFindingSchema = z.object({
  id: z.string().uuid(),
  capa_id: z.string().uuid(),
  root_cause_category: RootCauseCategoryEnum,
  root_cause_description: z.string().min(10),
  contributing_factors: z.array(z.string()).default([]),
  immediate_actions_taken: z.string().optional(),
  investigated_by: UserIdSchema,
  investigated_at: z.string().datetime({ offset: true }),
});
export type RcaFinding = z.infer<typeof RcaFindingSchema>;

// ─── EFFECTIVENESS CHECK ──────────────────────────────────────────────────────
export const EffectivenessResultEnum = z.enum(['EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE']);

export const EffectivenessCheckSchema = z.object({
  id: z.string().uuid(),
  capa_id: z.string().uuid(),
  result: EffectivenessResultEnum,
  evidence_description: z.string().min(10),
  check_date: z.string().date(),
  checked_by: UserIdSchema,
  /** New CAPA initiated if result is INEFFECTIVE */
  follow_up_capa_id: z.string().uuid().nullable(),
  electronic_signature: ElectronicSignatureSchema.nullable(),
});
export type EffectivenessCheck = z.infer<typeof EffectivenessCheckSchema>;

// ─── CAPA AGGREGATE ──────────────────────────────────────────────────────────
/**
 * Corrective and Preventive Action (CAPA) record.
 *
 * CAPA numbering: CA-YYYY-NNNN (CA-2026-0001)
 * Complies with: ICH Q10, FDA 21 CFR §820.100, EU GMP Chapter 8
 */
export const CAPASchema = BaseEntitySchema.extend({
  /**
   * Unique CAPA Number.
   * Format: CA-YYYY-NNNN
   */
  capa_number: z.string().regex(/^CA-\d{4}-\d{4}$/, {
    message: 'capa_number must match format CA-YYYY-NNNN',
  }),
  type: CapaTypeEnum,
  source: CapaSourceEnum,
  status: CapaStatusEnum,
  title: z.string().min(3).max(500),
  description: z.string().min(10),
  root_cause_category: RootCauseCategoryEnum.nullable(),
  /** FK to deviation, audit finding, complaint, etc. that triggered this CAPA */
  source_record_type: z.string().max(50).nullable(),
  source_record_id: z.string().uuid().nullable(),
  /** Target completion date — regulatory commitment */
  due_date: z.string().date().nullable(),
  assigned_to: UserIdSchema.nullable(),
  /** Electronic signature at CLOSED transition */
  electronic_signature: ElectronicSignatureSchema.nullable(),
}).merge(GxpValidationFieldsSchema);

export type CAPA = z.infer<typeof CAPASchema>;

// ─── CREATE / UPDATE DTOs ─────────────────────────────────────────────────────
export const CreateCAPASchema = z.object({
  type: CapaTypeEnum,
  source: CapaSourceEnum,
  title: z.string().min(3).max(500),
  description: z.string().min(10),
  source_record_type: z.string().max(50).optional(),
  source_record_id: z.string().uuid().optional(),
  due_date: z.string().date().optional(),
  assigned_to: z.string().uuid().optional(),
});
export type CreateCAPA = z.infer<typeof CreateCAPASchema>;

export const InitiateRcaSchema = z.object({
  root_cause_category: RootCauseCategoryEnum,
  root_cause_description: z.string().min(10),
  contributing_factors: z.array(z.string()).optional(),
  immediate_actions_taken: z.string().optional(),
});
export type InitiateRca = z.infer<typeof InitiateRcaSchema>;

export const CreateActionPlanSchema = z.object({
  actions: z
    .array(
      z.object({
        description: z.string().min(5),
        responsible_person: z.string().uuid(),
        target_date: z.string().date(),
      }),
    )
    .min(1),
});
export type CreateActionPlan = z.infer<typeof CreateActionPlanSchema>;

export const RecordEffectivenessCheckSchema = z.object({
  result: EffectivenessResultEnum,
  evidence_description: z.string().min(10),
  check_date: z.string().date(),
  electronic_signature: ElectronicSignatureSchema,
});
export type RecordEffectivenessCheck = z.infer<typeof RecordEffectivenessCheckSchema>;

export const CloseCapaSchema = z.object({
  closure_summary: z.string().min(10).max(5000),
  electronic_signature: ElectronicSignatureSchema,
});
export type CloseCapaDto = z.infer<typeof CloseCapaSchema>;
