import { z } from 'zod';

import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';
import { GxpValidationFieldsSchema } from '../common/gxp-validation.schema';

// ─── VALIDATION PROTOCOL TYPE ─────────────────────────────────────────────────
/**
 * IQ/OQ/PQ validation protocol types per GAMP 5 / EU GMP Annex 11 §4.
 *  - IQ : Installation Qualification — verifies correct installation
 *  - OQ : Operational Qualification — verifies operation within spec
 *  - PQ : Performance Qualification — verifies performance under production conditions
 */
export const ValidationProtocolTypeEnum = z.enum(['IQ', 'OQ', 'PQ']);
export type ValidationProtocolType = z.infer<typeof ValidationProtocolTypeEnum>;

// ─── VALIDATION PROTOCOL STATUS (State Machine) ───────────────────────────────
/**
 * Validation protocol lifecycle states.
 *
 * Valid transitions (enforced by ValidationProtocolWorkflowEngine):
 *   DRAFT → REVIEW → APPROVED → EXECUTING → COMPLETED → CLOSED
 *   REVIEW → DRAFT (returned for revision)
 *   COMPLETED → SUPERSEDED (replaced by newer protocol)
 *   CLOSED → SUPERSEDED
 *
 * Electronic signature required for: APPROVED, CLOSED transitions.
 */
export const ValidationProtocolStatusEnum = z.enum([
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'EXECUTING',
  'COMPLETED',
  'CLOSED',
  'SUPERSEDED',
]);
export type ValidationProtocolStatus = z.infer<typeof ValidationProtocolStatusEnum>;

export const VALIDATION_PROTOCOL_TRANSITIONS: Record<
  ValidationProtocolStatus,
  ValidationProtocolStatus[]
> = {
  DRAFT: ['REVIEW'],
  REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['EXECUTING'],
  EXECUTING: ['COMPLETED'],
  COMPLETED: ['CLOSED', 'SUPERSEDED'],
  CLOSED: ['SUPERSEDED'],
  SUPERSEDED: [],
};

// ─── VALIDATION TEST STATUS ───────────────────────────────────────────────────
/**
 * Individual test step execution status.
 *  - PENDING        : Not yet executed
 *  - PASS           : Expected result achieved
 *  - FAIL           : Expected result not achieved — exception note required
 *  - NOT_APPLICABLE : Step skipped with documented justification
 */
export const ValidationTestStatusEnum = z.enum(['PENDING', 'PASS', 'FAIL', 'NOT_APPLICABLE']);
export type ValidationTestStatus = z.infer<typeof ValidationTestStatusEnum>;

// ─── VALIDATION TEST ──────────────────────────────────────────────────────────
/**
 * Individual test step within a validation protocol.
 *
 * Each step records the expected vs actual result with full traceability:
 * - who executed it, when, and with what e-signature.
 * - FAIL requires exception_note documenting the deviation.
 */
export const ValidationTestSchema = z.object({
  id: z.string().uuid(),
  protocol_id: z.string().uuid(),
  step_number: z.number().int().positive(),
  description: z.string().min(3).max(2000),
  expected_result: z.string().min(3).max(2000),
  /** Actual observed result — set during EXECUTING phase */
  actual_result: z.string().max(2000).nullable(),
  status: ValidationTestStatusEnum,
  /** Required when status = FAIL or NOT_APPLICABLE — deviation justification */
  exception_note: z.string().max(2000).nullable(),
  executed_by: UserIdSchema.nullable(),
  executed_at: z.string().datetime({ offset: true }).nullable(),
  /** 21 CFR Part 11 §11.50 signature of the person who executed the test step */
  electronic_signature: ElectronicSignatureSchema.nullable(),
});
export type ValidationTest = z.infer<typeof ValidationTestSchema>;

// ─── VALIDATION PROTOCOL AGGREGATE ───────────────────────────────────────────
/**
 * Validation Protocol record.
 *
 * Protocol numbering: VAL-YYYY-NNNN (VAL-2026-0001)
 * Complies with: GAMP 5 §5.4, EU GMP Annex 11 §4.7, FDA 21 CFR Part 211.68,
 *                WHO TRS No. 957 Annex 2
 *
 * retention_class is always PERMANENT for validation protocols per
 * EU GMP Annex 11 §17 — must be retained for the lifetime of the system.
 */
export const ValidationProtocolSchema = BaseEntitySchema.extend({
  /**
   * Unique protocol number.
   * Format: VAL-YYYY-NNNN (VAL-2026-0001)
   */
  protocol_number: z.string().regex(/^VAL-\d{4}-\d{4}$/, {
    message: 'protocol_number must match format VAL-YYYY-NNNN',
  }),
  type: ValidationProtocolTypeEnum,
  status: ValidationProtocolStatusEnum,
  /** Name of the system, equipment or process under validation */
  system_under_test: z.string().min(2).max(500),
  /** Optional link to the Change Control that triggered this validation */
  change_control_id: z.string().uuid().nullable(),
  /** Test steps — ordered by step_number */
  test_steps: z.array(ValidationTestSchema).default([]),
  /** E-signature applied at the APPROVED transition */
  electronic_signature: ElectronicSignatureSchema.nullable(),
}).merge(GxpValidationFieldsSchema);

export type ValidationProtocol = z.infer<typeof ValidationProtocolSchema>;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/**
 * Create a new Validation Protocol (status = DRAFT).
 */
export const CreateValidationProtocolSchema = z.object({
  type: ValidationProtocolTypeEnum,
  system_under_test: z.string().min(2).max(500),
  /** Link to the change control that initiated this validation (optional) */
  change_control_id: z.string().uuid().optional(),
  /** Initial test steps (can also be added later) */
  test_steps: z
    .array(
      z.object({
        step_number: z.number().int().positive(),
        description: z.string().min(3).max(2000),
        expected_result: z.string().min(3).max(2000),
      }),
    )
    .optional()
    .default([]),
});
export type CreateValidationProtocol = z.infer<typeof CreateValidationProtocolSchema>;

/**
 * Approve a Validation Protocol (REVIEW → APPROVED).
 * Requires electronic signature per 21 CFR Part 11.
 */
export const ApproveValidationProtocolSchema = z.object({
  electronic_signature: ElectronicSignatureSchema,
});
export type ApproveValidationProtocol = z.infer<typeof ApproveValidationProtocolSchema>;

/**
 * Execute an individual test step (EXECUTING phase).
 * Captures the actual result and executors e-signature.
 */
export const ExecuteValidationTestSchema = z.object({
  step_number: z.number().int().positive(),
  actual_result: z.string().min(1).max(2000),
  status: z.enum(['PASS', 'FAIL', 'NOT_APPLICABLE']),
  /** Required when status = FAIL or NOT_APPLICABLE */
  exception_note: z.string().max(2000).optional(),
  electronic_signature: ElectronicSignatureSchema,
});
export type ExecuteValidationTest = z.infer<typeof ExecuteValidationTestSchema>;

/**
 * Close a Validation Protocol (COMPLETED → CLOSED).
 * Requires electronic signature.
 */
export const CloseValidationProtocolSchema = z.object({
  closure_summary: z.string().min(10).max(5000),
  electronic_signature: ElectronicSignatureSchema,
});
export type CloseValidationProtocol = z.infer<typeof CloseValidationProtocolSchema>;

/**
 * Summary DTO for the GET /:id/summary endpoint.
 * Returns aggregated test execution statistics.
 */
export const ValidationProtocolSummarySchema = z.object({
  protocol: ValidationProtocolSchema,
  test_summary: z.object({
    total: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    not_applicable: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    pass_rate_pct: z.number().min(0).max(100),
  }),
});
export type ValidationProtocolSummary = z.infer<typeof ValidationProtocolSummarySchema>;
