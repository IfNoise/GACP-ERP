import { z } from 'zod';

import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';
import { GxpValidationFieldsSchema } from '../common/gxp-validation.schema';

// ─── QUALITY EVENT TYPE ───────────────────────────────────────────────────────
/**
 * Quality Event classification per ICH Q10 § 3.1 Management Review.
 *  - COMPLAINT             : Customer or regulatory complaint
 *  - AUDIT_FINDING         : Finding from internal or external audit
 *  - INSPECTION_OBSERVATION: Regulatory inspection observation (483, EIR, etc.)
 *  - QUALITY_ISSUE         : Internal quality issue not covered by deviation/CAPA
 */
export const QualityEventTypeEnum = z.enum([
  'COMPLAINT',
  'AUDIT_FINDING',
  'INSPECTION_OBSERVATION',
  'QUALITY_ISSUE',
]);
export type QualityEventType = z.infer<typeof QualityEventTypeEnum>;

// ─── QUALITY EVENT SEVERITY ───────────────────────────────────────────────────
export const QualityEventSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type QualityEventSeverity = z.infer<typeof QualityEventSeverityEnum>;

// ─── QUALITY EVENT STATUS (State Machine) ────────────────────────────────────
/**
 * Quality Event lifecycle states.
 *
 * Valid transitions (enforced by QualityEventWorkflowEngine):
 *   OPEN → INVESTIGATING → CAPA_INITIATED → CLOSED
 *   INVESTIGATING → CLOSED (when no CAPA needed)
 *
 * Electronic signature required for: CLOSED transition.
 */
export const QualityEventStatusEnum = z.enum(['OPEN', 'INVESTIGATING', 'CAPA_INITIATED', 'CLOSED']);
export type QualityEventStatus = z.infer<typeof QualityEventStatusEnum>;

export const QUALITY_EVENT_TRANSITIONS: Record<QualityEventStatus, QualityEventStatus[]> = {
  OPEN: ['INVESTIGATING'],
  INVESTIGATING: ['CAPA_INITIATED', 'CLOSED'],
  CAPA_INITIATED: ['CLOSED'],
  CLOSED: [],
};

// ─── LINKED RECORD ────────────────────────────────────────────────────────────
/**
 * Polymorphic link from a quality_event to any other quality record.
 * Enables cross-module traceability required by ICH Q10 § 3.2.
 */
export const LinkedRecordTypeEnum = z.enum(['change_control', 'capa', 'deviation']);
export type LinkedRecordType = z.infer<typeof LinkedRecordTypeEnum>;

export const LinkedRecordSchema = z.object({
  id: z.string().uuid(),
  quality_event_id: z.string().uuid(),
  record_type: LinkedRecordTypeEnum,
  record_id: z.string().uuid(),
  linked_by: UserIdSchema,
  linked_at: z.string().datetime({ offset: true }),
});
export type LinkedRecord = z.infer<typeof LinkedRecordSchema>;

// ─── QUALITY EVENT AGGREGATE ──────────────────────────────────────────────────
/**
 * Quality Event record.
 *
 * Event numbering: QE-YYYY-NNNN (QE-2026-0001)
 * Complies with: ICH Q10 § 3.1, FDA 21 CFR Part 820.100,
 *                EU GMP Chapter 1 (Quality Management)
 */
export const QualityEventSchema = BaseEntitySchema.extend({
  /**
   * Unique Quality Event number.
   * Format: QE-YYYY-NNNN (QE-2026-0001)
   */
  event_number: z.string().regex(/^QE-\d{4}-\d{4}$/, {
    message: 'event_number must match format QE-YYYY-NNNN',
  }),
  type: QualityEventTypeEnum,
  severity: QualityEventSeverityEnum,
  status: QualityEventStatusEnum,
  title: z.string().min(3).max(500),
  description: z.string().min(10),
  /** FK to CAPA if one was initiated for this event */
  capa_id: z.string().uuid().nullable(),
  /** Cross-module linked records (change controls, CAPAs, deviations) */
  linked_records: z.array(LinkedRecordSchema).default([]),
  /** E-signature applied at the CLOSED transition */
  electronic_signature: ElectronicSignatureSchema.nullable(),
}).merge(GxpValidationFieldsSchema);

export type QualityEvent = z.infer<typeof QualityEventSchema>;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/**
 * Report a new Quality Event (status = OPEN).
 */
export const CreateQualityEventSchema = z.object({
  type: QualityEventTypeEnum,
  severity: QualityEventSeverityEnum,
  title: z.string().min(3).max(500),
  description: z.string().min(10).max(10000),
});
export type CreateQualityEvent = z.infer<typeof CreateQualityEventSchema>;

/**
 * Begin investigation (OPEN → INVESTIGATING).
 */
export const InvestigateQualityEventSchema = z.object({
  investigation_summary: z.string().min(10).max(5000),
});
export type InvestigateQualityEvent = z.infer<typeof InvestigateQualityEventSchema>;

/**
 * Link an existing quality record (CAPA / change_control / deviation) to this event.
 * Used at any point before CLOSED.
 */
export const LinkRecordToEventSchema = z.object({
  record_type: LinkedRecordTypeEnum,
  record_id: z.string().uuid(),
});
export type LinkRecordToEvent = z.infer<typeof LinkRecordToEventSchema>;

/**
 * Close a Quality Event (INVESTIGATING | CAPA_INITIATED → CLOSED).
 * Requires electronic signature.
 */
export const CloseQualityEventSchema = z.object({
  closure_summary: z.string().min(10).max(5000),
  electronic_signature: ElectronicSignatureSchema,
});
export type CloseQualityEvent = z.infer<typeof CloseQualityEventSchema>;
