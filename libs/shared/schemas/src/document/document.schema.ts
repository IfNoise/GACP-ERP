import { z } from 'zod';

import { BaseEntitySchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export const DocumentTypeEnum = z.enum([
  'SOP',
  'FORM',
  'REPORT',
  'PROTOCOL',
  'POLICY',
  'WORK_INSTRUCTION',
  'SPECIFICATION',
]);
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const DocumentStatusEnum = z.enum([
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'EFFECTIVE',
  'SUPERSEDED',
  'OBSOLETE',
]);
export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;

// ─── DOCUMENT ─────────────────────────────────────────────────────────────────

export const DocumentSchema = BaseEntitySchema.extend({
  document_number: z.string().min(1).max(30),
  title: z.string().min(1).max(255),
  document_type: DocumentTypeEnum,
  status: DocumentStatusEnum,
  description: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  mayan_document_id: z.number().int().nullable(),
  current_version_id: z.string().uuid().nullable(),
  owner_id: UserIdSchema,
  reviewer_id: UserIdSchema.nullable(),
  approver_id: UserIdSchema.nullable(),
  approved_at: z.string().datetime({ offset: true }).nullable(),
  next_review_date: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}),
});
export type Document = z.infer<typeof DocumentSchema>;

// ─── DOCUMENT VERSION ─────────────────────────────────────────────────────────

export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  version_number: z.string().min(1).max(20),
  change_summary: z.string().min(1),
  file_path: z.string().nullable(),
  file_hash: z.string().nullable(),
  mayan_version_id: z.number().int().nullable(),
  authored_by: UserIdSchema,
  approved_by: UserIdSchema.nullable(),
  approved_at: z.string().datetime({ offset: true }).nullable(),
  signature: z.record(z.unknown()).nullable(),
  created_at: z.string().datetime({ offset: true }),
});
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export const CreateDocumentSchema = z.object({
  document_number: z.string().min(1).max(30),
  title: z.string().min(1).max(255),
  document_type: DocumentTypeEnum,
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  next_review_date: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;

export const UploadDocumentVersionSchema = z.object({
  version_number: z.string().min(1).max(20),
  change_summary: z.string().min(1),
  file_path: z.string().optional(),
});
export type UploadDocumentVersion = z.infer<typeof UploadDocumentVersionSchema>;

export const ApproveDocumentSchema = z.object({
  password: z.string().min(1),
  reason: z.string().min(1),
});
export type ApproveDocument = z.infer<typeof ApproveDocumentSchema>;

export const SubmitForReviewSchema = z.object({
  reviewer_id: z.string().uuid(),
});
export type SubmitForReview = z.infer<typeof SubmitForReviewSchema>;
