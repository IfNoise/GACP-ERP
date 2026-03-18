import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  PaginationQuerySchema,
  ChangeControlSchema,
  ChangeImpactSchema,
  ChangeApprovalSchema,
  CreateChangeControlSchema,
  AssessImpactSchema,
  ApproveChangeControlSchema,
  RejectChangeControlSchema,
  VerifyChangeControlSchema,
  CloseChangeControlSchema,
  CAPASchema,
  CreateCAPASchema,
  InitiateRcaSchema,
  CreateActionPlanSchema,
  RecordEffectivenessCheckSchema,
  CloseCapaSchema,
  DeviationSchema,
  CreateDeviationSchema,
  InvestigateDeviationSchema,
  AssessDeviationImpactSchema,
  LinkCapaToDeviationSchema,
  CloseDeviationSchema,
  // EPIC 7
  ValidationProtocolSchema,
  ValidationProtocolSummarySchema,
  CreateValidationProtocolSchema,
  ApproveValidationProtocolSchema,
  ExecuteValidationTestSchema,
  CloseValidationProtocolSchema,
  QualityEventSchema,
  CreateQualityEventSchema,
  InvestigateQualityEventSchema,
  LinkRecordToEventSchema,
  CloseQualityEventSchema,
} from '@gacp-erp/shared-schemas';

const c = initContract();

/**
 * Pagination response factory.
 */
function paginatedList<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
}

/**
 * Quality Management API contract (EPIC 6).
 *
 * Covers:
 *   - Change Control (CCN lifecycle)
 *   - CAPA (Corrective & Preventive Actions)
 *   - Deviations
 *
 * Role access:
 *   - QUALITY_MANAGER+  : create, submit, approve, close
 *   - OPERATOR          : report deviations
 *   - AUDITOR+          : read-only access to all records
 *   - SUPER_ADMIN       : full access
 */
export const qualityContract = c.router({
  // ════════════════════════════════════════════════════════════════════════════
  // CHANGE CONTROLS
  // ════════════════════════════════════════════════════════════════════════════

  /** Create a new Change Control (DRAFT status) — QUALITY_MANAGER+ */
  createChangeControl: {
    method: 'POST',
    path: '/quality/change-controls',
    body: CreateChangeControlSchema,
    responses: {
      201: ChangeControlSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Create Change Control (CCN)',
  },

  /** Paginated list with optional filters */
  listChangeControls: {
    method: 'GET',
    path: '/quality/change-controls',
    query: PaginationQuerySchema.extend({
      status: z
        .enum([
          'DRAFT',
          'SUBMITTED',
          'IMPACT_ASSESSED',
          'APPROVED',
          'REJECTED',
          'IMPLEMENTING',
          'VERIFIED',
          'CLOSED',
        ])
        .optional(),
      change_type: z.enum(['MINOR', 'MAJOR', 'EMERGENCY']).optional(),
      requestor_id: z.string().uuid().optional(),
    }),
    responses: {
      200: paginatedList(ChangeControlSchema),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'List Change Controls (paginated)',
  },

  /** Get a single Change Control by ID */
  getChangeControl: {
    method: 'GET',
    path: '/quality/change-controls/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: ChangeControlSchema.extend({
        impacts: z.array(ChangeImpactSchema),
        approvals: z.array(ChangeApprovalSchema),
      }),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get Change Control with impacts and approvals',
  },

  /** DRAFT → SUBMITTED */
  submitChangeControl: {
    method: 'POST',
    path: '/quality/change-controls/:id/submit',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({ submission_notes: z.string().max(1000).optional() }),
    responses: {
      200: ChangeControlSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema, // Invalid transition
    },
    summary: 'Submit Change Control for review',
  },

  /** SUBMITTED → IMPACT_ASSESSED */
  assessImpact: {
    method: 'POST',
    path: '/quality/change-controls/:id/assess-impact',
    pathParams: z.object({ id: z.string().uuid() }),
    body: AssessImpactSchema,
    responses: {
      200: ChangeControlSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Record impact assessment — IMPACT_ASSESSED transition',
  },

  /**
   * IMPACT_ASSESSED → APPROVED
   * Requires electronic signature re-challenge (21 CFR Part 11 §11.200).
   */
  approveChangeControl: {
    method: 'POST',
    path: '/quality/change-controls/:id/approve',
    pathParams: z.object({ id: z.string().uuid() }),
    body: ApproveChangeControlSchema,
    responses: {
      200: ChangeControlSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Approve Change Control (requires e-signature)',
  },

  /**
   * SUBMITTED | IMPACT_ASSESSED | APPROVED → REJECTED
   * Requires electronic signature.
   */
  rejectChangeControl: {
    method: 'POST',
    path: '/quality/change-controls/:id/reject',
    pathParams: z.object({ id: z.string().uuid() }),
    body: RejectChangeControlSchema,
    responses: {
      200: ChangeControlSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Reject Change Control (requires e-signature)',
  },

  /** APPROVED → IMPLEMENTING */
  implementChangeControl: {
    method: 'POST',
    path: '/quality/change-controls/:id/implement',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({ implementation_notes: z.string().max(2000).optional() }),
    responses: {
      200: ChangeControlSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Mark Change Control as Implementing',
  },

  /**
   * IMPLEMENTING → VERIFIED
   * Requires electronic signature.
   */
  verifyChangeControl: {
    method: 'POST',
    path: '/quality/change-controls/:id/verify',
    pathParams: z.object({ id: z.string().uuid() }),
    body: VerifyChangeControlSchema,
    responses: {
      200: ChangeControlSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Verify Change Control implementation (requires e-signature)',
  },

  /** VERIFIED → CLOSED */
  closeChangeControl: {
    method: 'POST',
    path: '/quality/change-controls/:id/close',
    pathParams: z.object({ id: z.string().uuid() }),
    body: CloseChangeControlSchema,
    responses: {
      200: ChangeControlSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Close Change Control',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // CAPAS
  // ════════════════════════════════════════════════════════════════════════════

  /** Create CAPA (OPEN status) */
  createCapa: {
    method: 'POST',
    path: '/quality/capas',
    body: CreateCAPASchema,
    responses: {
      201: CAPASchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Initiate CAPA',
  },

  /** Paginated list with filters */
  listCapas: {
    method: 'GET',
    path: '/quality/capas',
    query: PaginationQuerySchema.extend({
      status: z
        .enum([
          'OPEN',
          'RCA_IN_PROGRESS',
          'ACTION_PLAN',
          'IMPLEMENTING',
          'EFFECTIVENESS_CHECK',
          'CLOSED',
        ])
        .optional(),
      type: z.enum(['CORRECTIVE', 'PREVENTIVE']).optional(),
      source: z.enum(['DEVIATION', 'AUDIT', 'COMPLAINT', 'TREND', 'INSPECTION']).optional(),
      assigned_to: z.string().uuid().optional(),
      overdue: z.coerce.boolean().optional(),
    }),
    responses: {
      200: paginatedList(CAPASchema),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'List CAPAs (paginated)',
  },

  getCapa: {
    method: 'GET',
    path: '/quality/capas/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: CAPASchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get CAPA by ID',
  },

  /** OPEN → RCA_IN_PROGRESS */
  initiateRca: {
    method: 'POST',
    path: '/quality/capas/:id/initiate-rca',
    pathParams: z.object({ id: z.string().uuid() }),
    body: InitiateRcaSchema,
    responses: {
      200: CAPASchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Start Root Cause Analysis for CAPA',
  },

  /** RCA_IN_PROGRESS → ACTION_PLAN */
  createActionPlan: {
    method: 'POST',
    path: '/quality/capas/:id/action-plan',
    pathParams: z.object({ id: z.string().uuid() }),
    body: CreateActionPlanSchema,
    responses: {
      200: CAPASchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create action plan for CAPA',
  },

  /** ACTION_PLAN → IMPLEMENTING */
  implementCapa: {
    method: 'POST',
    path: '/quality/capas/:id/implement',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({ implementation_notes: z.string().max(2000).optional() }),
    responses: {
      200: CAPASchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Mark CAPA as Implementing',
  },

  /** IMPLEMENTING → EFFECTIVENESS_CHECK */
  checkEffectiveness: {
    method: 'POST',
    path: '/quality/capas/:id/effectiveness-check',
    pathParams: z.object({ id: z.string().uuid() }),
    body: RecordEffectivenessCheckSchema,
    responses: {
      200: CAPASchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Record effectiveness check for CAPA (requires e-signature)',
  },

  /**
   * EFFECTIVENESS_CHECK → CLOSED
   * Requires electronic signature.
   */
  closeCapa: {
    method: 'POST',
    path: '/quality/capas/:id/close',
    pathParams: z.object({ id: z.string().uuid() }),
    body: CloseCapaSchema,
    responses: {
      200: CAPASchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Close CAPA (requires e-signature)',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // DEVIATIONS
  // ════════════════════════════════════════════════════════════════════════════

  /** Report a new deviation (REPORTED status) — OPERATOR+ */
  reportDeviation: {
    method: 'POST',
    path: '/quality/deviations',
    body: CreateDeviationSchema,
    responses: {
      201: DeviationSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Report deviation',
  },

  listDeviations: {
    method: 'GET',
    path: '/quality/deviations',
    query: PaginationQuerySchema.extend({
      status: z
        .enum(['REPORTED', 'UNDER_INVESTIGATION', 'IMPACT_ASSESSED', 'CAPA_INITIATED', 'CLOSED'])
        .optional(),
      classification: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).optional(),
      category: z
        .enum([
          'PROCESS',
          'EQUIPMENT',
          'MATERIAL',
          'ENVIRONMENTAL',
          'DOCUMENTATION',
          'PERSONNEL',
          'UTILITY',
        ])
        .optional(),
      reported_by: z.string().uuid().optional(),
    }),
    responses: {
      200: paginatedList(DeviationSchema),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'List deviations (paginated)',
  },

  getDeviation: {
    method: 'GET',
    path: '/quality/deviations/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: DeviationSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get deviation by ID',
  },

  /** REPORTED → UNDER_INVESTIGATION */
  investigateDeviation: {
    method: 'POST',
    path: '/quality/deviations/:id/investigate',
    pathParams: z.object({ id: z.string().uuid() }),
    body: InvestigateDeviationSchema,
    responses: {
      200: DeviationSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Start investigation (requires e-signature)',
  },

  /** UNDER_INVESTIGATION → IMPACT_ASSESSED */
  assessDeviationImpact: {
    method: 'POST',
    path: '/quality/deviations/:id/assess-impact',
    pathParams: z.object({ id: z.string().uuid() }),
    body: AssessDeviationImpactSchema,
    responses: {
      200: DeviationSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Assess deviation impact',
  },

  /** IMPACT_ASSESSED → CAPA_INITIATED */
  linkCapaToDeviation: {
    method: 'POST',
    path: '/quality/deviations/:id/link-capa',
    pathParams: z.object({ id: z.string().uuid() }),
    body: LinkCapaToDeviationSchema,
    responses: {
      200: DeviationSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Link CAPA to deviation',
  },

  /**
   * CAPA_INITIATED | IMPACT_ASSESSED → CLOSED
   * Requires electronic signature.
   */
  closeDeviation: {
    method: 'POST',
    path: '/quality/deviations/:id/close',
    pathParams: z.object({ id: z.string().uuid() }),
    body: CloseDeviationSchema,
    responses: {
      200: DeviationSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Close deviation (requires e-signature)',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // VALIDATION PROTOCOLS (EPIC 7)
  // ════════════════════════════════════════════════════════════════════════════

  /** Create a new Validation Protocol (DRAFT status) — QUALITY_MANAGER+ */
  createValidationProtocol: {
    method: 'POST',
    path: '/quality/validation-protocols',
    body: CreateValidationProtocolSchema,
    responses: {
      201: ValidationProtocolSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Create Validation Protocol (VAL-YYYY-NNNN)',
  },

  /** Get validation protocol by ID */
  getValidationProtocol: {
    method: 'GET',
    path: '/quality/validation-protocols/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: ValidationProtocolSchema,
      401: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get Validation Protocol by ID',
  },

  /** Get validation protocol summary with test statistics */
  getValidationProtocolSummary: {
    method: 'GET',
    path: '/quality/validation-protocols/:id/summary',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: ValidationProtocolSummarySchema,
      401: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get Validation Protocol summary with test statistics',
  },

  /** REVIEW → APPROVED — requires electronic signature per 21 CFR Part 11 */
  approveValidationProtocol: {
    method: 'POST',
    path: '/quality/validation-protocols/:id/approve',
    pathParams: z.object({ id: z.string().uuid() }),
    body: ApproveValidationProtocolSchema,
    responses: {
      200: ValidationProtocolSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Approve Validation Protocol (e-signature required)',
  },

  /** Execute an individual test step during EXECUTING phase */
  executeValidationTest: {
    method: 'POST',
    path: '/quality/validation-protocols/:id/execute-test',
    pathParams: z.object({ id: z.string().uuid() }),
    body: ExecuteValidationTestSchema,
    responses: {
      200: ValidationProtocolSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Execute individual test step (requires e-signature)',
  },

  /** COMPLETED → CLOSED — requires electronic signature */
  closeValidationProtocol: {
    method: 'POST',
    path: '/quality/validation-protocols/:id/close',
    pathParams: z.object({ id: z.string().uuid() }),
    body: CloseValidationProtocolSchema,
    responses: {
      200: ValidationProtocolSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Close Validation Protocol (e-signature required)',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // QUALITY EVENTS (EPIC 7)
  // ════════════════════════════════════════════════════════════════════════════

  /** Report a new Quality Event (OPEN status) */
  createQualityEvent: {
    method: 'POST',
    path: '/quality/quality-events',
    body: CreateQualityEventSchema,
    responses: {
      201: QualityEventSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Report Quality Event (QE-YYYY-NNNN)',
  },

  /** Get Quality Event by ID */
  getQualityEvent: {
    method: 'GET',
    path: '/quality/quality-events/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: QualityEventSchema,
      401: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get Quality Event by ID',
  },

  /** OPEN → INVESTIGATING */
  investigateQualityEvent: {
    method: 'POST',
    path: '/quality/quality-events/:id/investigate',
    pathParams: z.object({ id: z.string().uuid() }),
    body: InvestigateQualityEventSchema,
    responses: {
      200: QualityEventSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Begin investigation of Quality Event',
  },

  /** Link an existing quality record (CAPA / change_control / deviation) */
  linkRecordToQualityEvent: {
    method: 'POST',
    path: '/quality/quality-events/:id/link-record',
    pathParams: z.object({ id: z.string().uuid() }),
    body: LinkRecordToEventSchema,
    responses: {
      200: QualityEventSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Link quality record to Quality Event',
  },

  /** INVESTIGATING | CAPA_INITIATED → CLOSED — requires electronic signature */
  closeQualityEvent: {
    method: 'POST',
    path: '/quality/quality-events/:id/close',
    pathParams: z.object({ id: z.string().uuid() }),
    body: CloseQualityEventSchema,
    responses: {
      200: QualityEventSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Close Quality Event (e-signature required)',
  },
});

export type QualityContract = typeof qualityContract;
