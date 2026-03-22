import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  PaginationQuerySchema,
  DocumentSchema,
  DocumentVersionSchema,
  CreateDocumentSchema,
  UploadDocumentVersionSchema,
  ApproveDocumentSchema,
  SubmitForReviewSchema,
  DocumentTypeEnum,
  DocumentStatusEnum,
} from '@gacp-erp/shared-schemas';

const c = initContract();

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
 * Document Management API contract (EPIC 14.7).
 *
 * Covers:
 *   - Document CRUD (linked to PostgreSQL + Mayan-EDMS)
 *   - Version management (upload, version history)
 *   - Approval workflow with electronic signature
 *   - Document search / filtering
 */
export const documentContract = c.router({
  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Create a new document (DRAFT status) */
  createDocument: {
    method: 'POST',
    path: '/documents',
    body: CreateDocumentSchema,
    responses: {
      201: DocumentSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Create a new document',
  },

  /** Paginated list with optional filters */
  listDocuments: {
    method: 'GET',
    path: '/documents',
    query: PaginationQuerySchema.extend({
      status: DocumentStatusEnum.optional(),
      document_type: DocumentTypeEnum.optional(),
      search: z.string().optional(),
      owner_id: z.string().uuid().optional(),
    }),
    responses: {
      200: paginatedList(DocumentSchema),
      401: ApiErrorSchema,
    },
    summary: 'List documents with pagination and filters',
  },

  /** Get single document by ID */
  getDocument: {
    method: 'GET',
    path: '/documents/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: DocumentSchema,
      401: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get document by ID',
  },

  /** Submit document for review */
  submitForReview: {
    method: 'POST',
    path: '/documents/:id/submit-review',
    pathParams: z.object({ id: z.string().uuid() }),
    body: SubmitForReviewSchema,
    responses: {
      200: DocumentSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Submit document for review',
  },

  /** Approve document with electronic signature */
  approveDocument: {
    method: 'POST',
    path: '/documents/:id/approve',
    pathParams: z.object({ id: z.string().uuid() }),
    body: ApproveDocumentSchema,
    responses: {
      200: DocumentSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Approve document (electronic signature)',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENT VERSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /** List all versions for a document */
  listVersions: {
    method: 'GET',
    path: '/documents/:id/versions',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: z.array(DocumentVersionSchema),
      401: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'List document versions',
  },

  /** Upload a new version */
  uploadVersion: {
    method: 'POST',
    path: '/documents/:id/versions',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UploadDocumentVersionSchema,
    responses: {
      201: DocumentVersionSchema,
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Upload a new document version',
  },
});
