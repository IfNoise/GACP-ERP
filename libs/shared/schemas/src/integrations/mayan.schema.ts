import { z } from 'zod';

// ─── MAYAN-EDMS API RESPONSE SCHEMAS ─────────────────────────────────────────
// All shapes validated at the external boundary via .parse() — never trust raw
// API responses (ALCOA+ Attributable: data provenance must be verified).

export const MayanDocumentTypeSchema = z.object({
  id: z.number().int(),
  label: z.string(),
});

export const MayanVersionPageSchema = z.object({
  id: z.number().int(),
});

export const MayanLatestVersionSchema = z.object({
  id: z.number().int(),
  timestamp: z.string(),
  comment: z.string(),
  mimetype: z.string(),
  size: z.number().int(),
  pages: z.array(MayanVersionPageSchema),
});

export const MayanDocumentSchema = z.object({
  id: z.number().int(),
  uuid: z.string().uuid(),
  label: z.string(),
  description: z.string(),
  language: z.string(),
  document_type: MayanDocumentTypeSchema,
  date_added: z.string(),
  latest_version: MayanLatestVersionSchema.nullable(),
});
export type MayanDocument = z.infer<typeof MayanDocumentSchema>;

export const MayanDocumentVersionSchema = z.object({
  id: z.number().int(),
  document: z.object({
    id: z.number().int(),
    uuid: z.string().uuid(),
  }),
  timestamp: z.string(),
  comment: z.string(),
  mimetype: z.string(),
  size: z.number().int(),
});
export type MayanDocumentVersion = z.infer<typeof MayanDocumentVersionSchema>;

export const MayanVersionListResponseSchema = z.object({
  results: z.array(MayanDocumentVersionSchema),
});

export const MayanUploadResultSchema = z.object({
  document: MayanDocumentSchema,
  version: MayanDocumentVersionSchema,
});
export type MayanUploadResult = z.infer<typeof MayanUploadResultSchema>;

// ─── REQUEST INPUT SCHEMAS ────────────────────────────────────────────────────

export const MayanDocumentMetadataSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  language: z.string().optional(),
  document_type_id: z.number().int().positive().optional(),
  cabinet_ids: z.array(z.number().int()).optional(),
  tag_ids: z.array(z.number().int()).optional(),
});
export type MayanDocumentMetadata = z.infer<typeof MayanDocumentMetadataSchema>;

export const DocumentUploadOptionsSchema = z.object({
  filename: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  documentTypeId: z.number().int().positive().optional(),
  language: z.string().optional(),
});
export type DocumentUploadOptions = z.infer<typeof DocumentUploadOptionsSchema>;
