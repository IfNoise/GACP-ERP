import { z } from 'zod';
import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import { GxpValidationFieldsSchema } from '../common/gxp-validation.schema';

// ─── INCOMING INSPECTION STATUS ─────────────────────────────────────────────

export const IncomingInspectionStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'QUARANTINE',
  'RELEASED',
  'REJECTED',
]);
export type IncomingInspectionStatus = z.infer<typeof IncomingInspectionStatusEnum>;

/** State machine transitions for incoming inspection workflow */
export const INSPECTION_TRANSITIONS: Record<IncomingInspectionStatus, IncomingInspectionStatus[]> =
  {
    PENDING: ['IN_PROGRESS'],
    IN_PROGRESS: ['QUARANTINE', 'REJECTED'],
    QUARANTINE: ['RELEASED', 'REJECTED'],
    RELEASED: [],
    REJECTED: [],
  };

// ─── INCOMING INSPECTION SCHEMA ─────────────────────────────────────────────

export const IncomingInspectionSchema = BaseEntitySchema.extend({
  inspection_number: z.string().regex(/^INS-\d{4}-\d{4}$/),
  grn_id: z.string().uuid(),
  po_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  strain_id: z.string().uuid().nullable(),
  status: IncomingInspectionStatusEnum,
  // Visual & quantitative inspection
  visual_check_passed: z.boolean().nullable(),
  quantity_verified: z.boolean().nullable(),
  quality_assessment_notes: z.string().nullable(),
  // Lab test results
  dna_fingerprint_passed: z.boolean().nullable(),
  cannabinoid_profile_passed: z.boolean().nullable(),
  pathogen_screening_passed: z.boolean().nullable(),
  germination_rate: z.number().min(0).max(100).nullable(),
  // Quarantine tracking
  quarantine_days_required: z.number().int().min(1),
  quarantine_start_date: z.string().datetime({ offset: true }).nullable(),
  quarantine_end_date: z.string().datetime({ offset: true }).nullable(),
  // Disposition
  disposition_decision: z.enum(['RELEASE', 'REJECT']).nullable(),
  disposition_reason: z.string().nullable(),
  electronic_signature: ElectronicSignatureSchema.nullable(),
}).merge(GxpValidationFieldsSchema);
export type IncomingInspection = z.infer<typeof IncomingInspectionSchema>;

// ─── DTOs ───────────────────────────────────────────────────────────────────

export const CreateIncomingInspectionSchema = z.object({
  grn_id: z.string().uuid(),
  po_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  strain_id: z.string().uuid().optional(),
  quarantine_days_required: z.number().int().min(1).default(7),
});
export type CreateIncomingInspection = z.infer<typeof CreateIncomingInspectionSchema>;

export const PerformInspectionSchema = z.object({
  visual_check_passed: z.boolean(),
  quantity_verified: z.boolean(),
  quality_assessment_notes: z.string().max(2000).optional(),
  electronic_signature: ElectronicSignatureSchema,
});
export type PerformInspection = z.infer<typeof PerformInspectionSchema>;

export const RecordTestResultsSchema = z.object({
  dna_fingerprint_passed: z.boolean(),
  cannabinoid_profile_passed: z.boolean(),
  pathogen_screening_passed: z.boolean(),
  germination_rate: z.number().min(0).max(100),
});
export type RecordTestResults = z.infer<typeof RecordTestResultsSchema>;

export const ReleaseInspectionSchema = z.object({
  disposition_reason: z.string().min(5).max(2000).optional(),
  electronic_signature: ElectronicSignatureSchema,
});
export type ReleaseInspection = z.infer<typeof ReleaseInspectionSchema>;

export const RejectInspectionSchema = z.object({
  disposition_reason: z.string().min(5).max(2000),
  electronic_signature: ElectronicSignatureSchema,
});
export type RejectInspection = z.infer<typeof RejectInspectionSchema>;
