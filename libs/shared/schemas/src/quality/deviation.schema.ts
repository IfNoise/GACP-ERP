import { z } from 'zod';

import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';
import { GxpValidationFieldsSchema } from '../common/gxp-validation.schema';

// ─── DEVIATION CLASSIFICATION ─────────────────────────────────────────────────
/**
 * Severity classification per EU GMP and ICH Q7.
 *  - MINOR    : No significant impact on product quality or patient safety
 *  - MAJOR    : Potential impact, requires root cause investigation + CAPA
 *  - CRITICAL : Significant risk, immediate escalation required
 */
export const DeviationClassificationEnum = z.enum(['MINOR', 'MAJOR', 'CRITICAL']);
export type DeviationClassification = z.infer<typeof DeviationClassificationEnum>;

// ─── DEVIATION CATEGORY ───────────────────────────────────────────────────────
/**
 * Root category of the deviation for trending and CAPA source tracking.
 */
export const DeviationCategoryEnum = z.enum([
  'PROCESS',
  'EQUIPMENT',
  'MATERIAL',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'PERSONNEL',
  'UTILITY',
]);
export type DeviationCategory = z.infer<typeof DeviationCategoryEnum>;

// ─── DEVIATION STATUS (State Machine) ────────────────────────────────────────
/**
 * Deviation lifecycle states per ICH Q10 §3.1 / EU GMP Chapter 8.
 *
 * Valid transitions (enforced by DeviationAggregate):
 *   REPORTED → UNDER_INVESTIGATION → IMPACT_ASSESSED → CAPA_INITIATED → CLOSED
 *
 * Electronic signature required for: CLOSED transition.
 * CAPA_INITIATED requires a linked CAPA (change_control_id or capa_id).
 */
export const DeviationStatusEnum = z.enum([
  'REPORTED',
  'UNDER_INVESTIGATION',
  'IMPACT_ASSESSED',
  'CAPA_INITIATED',
  'CLOSED',
]);
export type DeviationStatus = z.infer<typeof DeviationStatusEnum>;

export const DEVIATION_TRANSITIONS: Record<DeviationStatus, DeviationStatus[]> = {
  REPORTED: ['UNDER_INVESTIGATION'],
  UNDER_INVESTIGATION: ['IMPACT_ASSESSED'],
  IMPACT_ASSESSED: ['CAPA_INITIATED', 'CLOSED'], // CLOSED only for MINOR with no CAPA required
  CAPA_INITIATED: ['CLOSED'],
  CLOSED: [],
};

// ─── DEVIATION INVESTIGATION ─────────────────────────────────────────────────
export const DeviationInvestigationSchema = z.object({
  id: z.string().uuid(),
  deviation_id: z.string().uuid(),
  investigator_id: UserIdSchema,
  investigation_summary: z.string().min(10),
  immediate_containment_actions: z.string(),
  product_impact_assessment: z.string(),
  batches_affected: z.array(z.string().uuid()).default([]),
  investigated_at: z.string().datetime({ offset: true }),
  electronic_signature: ElectronicSignatureSchema.nullable(),
});
export type DeviationInvestigation = z.infer<typeof DeviationInvestigationSchema>;

// ─── DEVIATION AGGREGATE ─────────────────────────────────────────────────────
/**
 * Deviation record — regulatory non-conformance document.
 *
 * Deviation numbering: DEV-YYYY-NNNN (DEV-2026-0001)
 * Complies with: EU GMP Chapter 8, ICH Q10 §3.1, ALCOA+
 */
export const DeviationSchema = BaseEntitySchema.extend({
  /**
   * Unique Deviation Number.
   * Format: DEV-YYYY-NNNN
   */
  deviation_number: z.string().regex(/^DEV-\d{4}-\d{4}$/, {
    message: 'deviation_number must match format DEV-YYYY-NNNN',
  }),
  classification: DeviationClassificationEnum,
  category: DeviationCategoryEnum,
  status: DeviationStatusEnum,
  title: z.string().min(3).max(500),
  description: z.string().min(10),
  /** Where the deviation occurred */
  location: z.string().max(300).nullable(),
  /** Batch(es) affected — may be empty for equipment/environmental deviations */
  batch_ids: z.array(z.string().uuid()).default([]),
  /** Date/time when the deviation occurred (may differ from reported date) */
  occurred_at: z.string().datetime({ offset: true }).nullable(),
  reported_by: UserIdSchema,
  /** Linked CAPA ID — set when status transitions to CAPA_INITIATED */
  linked_capa_id: z.string().uuid().nullable(),
  /** Electronic signature at CLOSED transition */
  electronic_signature: ElectronicSignatureSchema.nullable(),
  /** Product impact summary — populated during investigation */
  product_impact: z.string().nullable(),
}).merge(GxpValidationFieldsSchema);

export type Deviation = z.infer<typeof DeviationSchema>;

// ─── CREATE / UPDATE DTOs ─────────────────────────────────────────────────────
export const CreateDeviationSchema = z.object({
  classification: DeviationClassificationEnum,
  category: DeviationCategoryEnum,
  title: z.string().min(3).max(500),
  description: z.string().min(10),
  location: z.string().max(300).optional(),
  batch_ids: z.array(z.string().uuid()).optional(),
  occurred_at: z.string().datetime({ offset: true }).optional(),
});
export type CreateDeviation = z.infer<typeof CreateDeviationSchema>;

export const InvestigateDeviationSchema = z.object({
  investigation_summary: z.string().min(10),
  immediate_containment_actions: z.string().min(5),
  product_impact_assessment: z.string().min(5),
  batches_affected: z.array(z.string().uuid()).optional(),
  electronic_signature: ElectronicSignatureSchema,
});
export type InvestigateDeviation = z.infer<typeof InvestigateDeviationSchema>;

export const AssessDeviationImpactSchema = z.object({
  product_impact: z.string().min(5),
  /** Whether a CAPA is required for this deviation */
  capa_required: z.boolean(),
  impact_notes: z.string().max(2000).optional(),
});
export type AssessDeviationImpact = z.infer<typeof AssessDeviationImpactSchema>;

export const LinkCapaToDeviationSchema = z.object({
  capa_id: z.string().uuid(),
});

export const CloseDeviationSchema = z.object({
  closure_summary: z.string().min(10).max(5000),
  electronic_signature: ElectronicSignatureSchema,
});
export type CloseDeviation = z.infer<typeof CloseDeviationSchema>;
