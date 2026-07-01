import { z } from 'zod';
import { PaginationQuerySchema } from '../common/base-entity.schema';

export const IfcImpactedDomainEnum = z.enum(['spatial', 'financial', 'iot']);
export type IfcImpactedDomain = z.infer<typeof IfcImpactedDomainEnum>;

export const IfcRevisionStatusEnum = z.enum([
  'uploaded',
  'parsed',
  'diff_ready',
  'pending_approval',
  'approved',
  'rejected',
  'projected',
  'failed',
]);
export type IfcRevisionStatus = z.infer<typeof IfcRevisionStatusEnum>;

export const IfcProjectionStatusEnum = z.enum(['pending', 'success', 'partial', 'failed']);
export type IfcProjectionStatus = z.infer<typeof IfcProjectionStatusEnum>;

export const IfcDiffSummarySchema = z.object({
  added_count: z.number().int().nonnegative(),
  updated_count: z.number().int().nonnegative(),
  removed_count: z.number().int().nonnegative(),
  by_severity: z.object({
    low: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative(),
  }),
});
export type IfcDiffSummary = z.infer<typeof IfcDiffSummarySchema>;

export const IfcRevisionSchema = z.object({
  revision_id: z.string().uuid(),
  model_id: z.string().min(1),
  source_file_uri: z.string().min(1),
  source_file_hash: z.string().regex(/^[0-9a-f]{64}$/),
  status: IfcRevisionStatusEnum,
  uploaded_by: z.string().uuid(),
  uploaded_at: z.string().datetime({ offset: true }),
  approved_at: z.string().datetime({ offset: true }).nullable(),
  approved_by: z.array(z.string().uuid()).default([]),
  change_control_id: z.string().nullable(),
});
export type IfcRevision = z.infer<typeof IfcRevisionSchema>;

export const IfcDiffRecordSchema = z.object({
  global_id: z.string().min(1),
  change_type: z.enum(['added', 'updated', 'removed']),
  field_path: z.string().min(1),
  old_value: z.unknown().nullable(),
  new_value: z.unknown().nullable(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});
export type IfcDiffRecord = z.infer<typeof IfcDiffRecordSchema>;

export const IfcRevisionDiffSchema = z.object({
  revision_id: z.string().uuid(),
  baseline_revision_id: z.string().uuid(),
  model_id: z.string().min(1),
  summary: IfcDiffSummarySchema,
  impacted_domains: z.array(IfcImpactedDomainEnum).min(1),
  critical_objects: z.array(z.string().min(1)),
  diff_artifact_uri: z.string().min(1),
  records: z.array(IfcDiffRecordSchema),
});
export type IfcRevisionDiff = z.infer<typeof IfcRevisionDiffSchema>;

export const IfcProjectionDomainStateSchema = z.object({
  status: IfcProjectionStatusEnum,
  projection_run_id: z.string().uuid().nullable(),
  upserted: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
});
export type IfcProjectionDomainState = z.infer<typeof IfcProjectionDomainStateSchema>;

export const IfcProjectionStateSchema = z.object({
  revision_id: z.string().uuid(),
  spatial: IfcProjectionDomainStateSchema,
  financial: IfcProjectionDomainStateSchema,
  iot: IfcProjectionDomainStateSchema,
});
export type IfcProjectionState = z.infer<typeof IfcProjectionStateSchema>;

export const IfcUploadRevisionBodySchema = z.object({
  model_id: z.string().min(1),
  source_file_uri: z.string().min(1),
  source_file_hash: z.string().regex(/^[0-9a-f]{64}$/),
  manifest_uri: z.string().min(1).optional(),
  change_summary: z.string().optional(),
});
export type IfcUploadRevisionBody = z.infer<typeof IfcUploadRevisionBodySchema>;

export const IfcListRevisionsQuerySchema = PaginationQuerySchema.extend({
  model_id: z.string().optional(),
  status: IfcRevisionStatusEnum.optional(),
});
export type IfcListRevisionsQuery = z.infer<typeof IfcListRevisionsQuerySchema>;

export const IfcRequestApprovalBodySchema = z.object({
  change_control_id: z.string().min(1),
  impacted_domains: z.array(IfcImpactedDomainEnum).min(1),
  approval_packet_uri: z.string().min(1),
});
export type IfcRequestApprovalBody = z.infer<typeof IfcRequestApprovalBodySchema>;

export const IfcApproveRevisionBodySchema = z.object({
  approval_reason: z.string().min(1),
  change_control_id: z.string().min(1),
  approved_domains: z.array(IfcImpactedDomainEnum).min(1),
});
export type IfcApproveRevisionBody = z.infer<typeof IfcApproveRevisionBodySchema>;

export const IfcRejectRevisionBodySchema = z.object({
  rejection_reason: z.string().min(1),
  remediation_notes: z.string().optional(),
});
export type IfcRejectRevisionBody = z.infer<typeof IfcRejectRevisionBodySchema>;

export const IfcRevisionsListResponseSchema = z.object({
  data: z.array(IfcRevisionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export type IfcRevisionsListResponse = z.infer<typeof IfcRevisionsListResponseSchema>;
