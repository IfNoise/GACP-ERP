import { z } from 'zod';

import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';
import { GxpValidationFieldsSchema } from '../common/gxp-validation.schema';

// ─── CHANGE TYPE ─────────────────────────────────────────────────────────────
/**
 * Change control classification per GAMP 5 / ICH Q10.
 *  - MINOR     : Low risk, no validation impact, single approver
 *  - MAJOR     : Medium/high risk, requires impact assessment + multi-approver
 *  - EMERGENCY : Immediate safety/compliance risk — expedited review track
 */
export const ChangeTypeEnum = z.enum(['MINOR', 'MAJOR', 'EMERGENCY']);
export type ChangeType = z.infer<typeof ChangeTypeEnum>;

// ─── CHANGE CONTROL STATUS (State Machine) ───────────────────────────────────
/**
 * Change Control lifecycle states.
 *
 * Valid transitions (enforced by ChangeControlWorkflowEngine):
 *   DRAFT → SUBMITTED → IMPACT_ASSESSED → APPROVED → IMPLEMENTING → VERIFIED → CLOSED
 *   Any state → (REJECTED — terminal, no further transitions)
 *
 * Electronic signature required for: APPROVED, VERIFIED transitions.
 */
export const ChangeControlStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'IMPACT_ASSESSED',
  'APPROVED',
  'REJECTED',
  'IMPLEMENTING',
  'VERIFIED',
  'CLOSED',
]);
export type ChangeControlStatus = z.infer<typeof ChangeControlStatusEnum>;

/**
 * Allowed workflow transitions (source of truth — mirrors DB constraints).
 * ChangeControlWorkflowEngine enforces these at runtime.
 */
export const CHANGE_CONTROL_TRANSITIONS: Record<ChangeControlStatus, ChangeControlStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['IMPACT_ASSESSED', 'REJECTED'],
  IMPACT_ASSESSED: ['APPROVED', 'REJECTED'],
  APPROVED: ['IMPLEMENTING', 'REJECTED'],
  REJECTED: [],
  IMPLEMENTING: ['VERIFIED'],
  VERIFIED: ['CLOSED'],
  CLOSED: [],
};

// ─── CHANGE IMPACT ────────────────────────────────────────────────────────────
export const ImpactRiskLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type ImpactRiskLevel = z.infer<typeof ImpactRiskLevelEnum>;

export const ChangeImpactSchema = z.object({
  id: z.string().uuid(),
  change_control_id: z.string().uuid(),
  area: z.string().min(1).max(100),
  impact_description: z.string().min(1),
  risk_level: ImpactRiskLevelEnum,
  assessed_by: UserIdSchema,
  assessed_at: z.string().datetime({ offset: true }),
});
export type ChangeImpact = z.infer<typeof ChangeImpactSchema>;

// ─── CHANGE APPROVAL ─────────────────────────────────────────────────────────
export const ApprovalStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;

export const ChangeApprovalSchema = z.object({
  id: z.string().uuid(),
  change_control_id: z.string().uuid(),
  approver_id: UserIdSchema,
  approval_level: z.number().int().min(1),
  status: ApprovalStatusEnum,
  /** Electronic signature per 21 CFR Part 11 §11.50 — required for APPROVED */
  electronic_signature: ElectronicSignatureSchema.nullable(),
  decided_at: z.string().datetime({ offset: true }).nullable(),
});
export type ChangeApproval = z.infer<typeof ChangeApprovalSchema>;

// ─── CHANGE CONTROL AGGREGATE ────────────────────────────────────────────────
/**
 * Change Control record — full regulatory compliance document.
 *
 * CCN numbering: CCN-YYYY-NNNN (CCN-2026-0001)
 * Complies with: ICH Q10, EU GMP Annex 11, ALCOA+
 */
export const ChangeControlSchema = BaseEntitySchema.extend({
  /**
   * Unique Change Control Number.
   * Format: CCN-YYYY-NNNN (system-generated, never user-editable)
   */
  ccn_number: z.string().regex(/^CCN-\d{4}-\d{4}$/, {
    message: 'ccn_number must match format CCN-YYYY-NNNN',
  }),
  title: z.string().min(3).max(500),
  description: z.string().min(10),
  change_type: ChangeTypeEnum,
  status: ChangeControlStatusEnum,
  requestor_id: UserIdSchema,
  /** Denormalised list of approver IDs for quick access (source of truth: change_approvals) */
  approver_ids: z.array(z.string().uuid()),
  /** Electronic signature captured at APPROVED transition — required before IMPLEMENTING */
  electronic_signature: ElectronicSignatureSchema.nullable(),
}).merge(GxpValidationFieldsSchema);

export type ChangeControl = z.infer<typeof ChangeControlSchema>;

// ─── CREATE / UPDATE DTOs ─────────────────────────────────────────────────────
export const CreateChangeControlSchema = z.object({
  title: z.string().min(3).max(500),
  description: z.string().min(10),
  change_type: ChangeTypeEnum,
  /** Initial approver IDs (optional — can be assigned post-creation) */
  approver_ids: z.array(z.string().uuid()).optional(),
});
export type CreateChangeControl = z.infer<typeof CreateChangeControlSchema>;

export const SubmitChangeControlSchema = z.object({
  /** Additional notes from the requestor at submission time */
  submission_notes: z.string().max(1000).optional(),
});

export const AssessImpactSchema = z.object({
  impacts: z
    .array(
      z.object({
        area: z.string().min(1).max(100),
        impact_description: z.string().min(1),
        risk_level: ImpactRiskLevelEnum,
      }),
    )
    .min(1, 'At least one impact assessment entry is required'),
});
export type AssessImpact = z.infer<typeof AssessImpactSchema>;

export const ApproveChangeControlSchema = z.object({
  electronic_signature: ElectronicSignatureSchema,
  /** Optional justification by approver */
  justification: z.string().max(2000).optional(),
});
export type ApproveChangeControl = z.infer<typeof ApproveChangeControlSchema>;

export const RejectChangeControlSchema = z.object({
  rejection_reason: z.string().min(10).max(2000),
  electronic_signature: ElectronicSignatureSchema,
});
export type RejectChangeControl = z.infer<typeof RejectChangeControlSchema>;

export const VerifyChangeControlSchema = z.object({
  verification_notes: z.string().min(10),
  electronic_signature: ElectronicSignatureSchema,
});
export type VerifyChangeControl = z.infer<typeof VerifyChangeControlSchema>;

export const CloseChangeControlSchema = z.object({
  closure_summary: z.string().min(10).max(5000),
});
export type CloseChangeControl = z.infer<typeof CloseChangeControlSchema>;
