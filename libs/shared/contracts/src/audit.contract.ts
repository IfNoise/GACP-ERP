import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  AuditEventSchema,
  AuditQuerySchema,
  PaginationQuerySchema,
} from '@gacp-erp/shared-schemas';

const c = initContract();

/**
 * Audit Trail contract — query and verify immutable audit records.
 * All endpoints require AUDITOR role or higher.
 * Route: /audit/*
 */
export const auditContract = c.router({
  /**
   * Query audit trail with filters.
   * Returns paginated list of audit events from PostgreSQL (queryable copy).
   */
  query: {
    method: 'GET',
    path: '/audit/trail',
    query: AuditQuerySchema,
    responses: {
      200: z.object({
        data: z.array(AuditEventSchema),
        total: z.number().int().nonnegative(),
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        totalPages: z.number().int().nonnegative(),
      }),
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Query audit trail (AUDITOR+)',
  },

  /**
   * Get a single audit event by ID.
   */
  getById: {
    method: 'GET',
    path: '/audit/trail/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: AuditEventSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get audit event by ID',
  },

  /**
   * Cryptographically verify an audit record in ImmuDB.
   * Returns the ImmuDB inclusion proof for the given transaction.
   * This is the core compliance verification endpoint.
   */
  verify: {
    method: 'GET',
    path: '/audit/verify/:txId',
    pathParams: z.object({ txId: z.string().min(1) }),
    responses: {
      200: z.object({
        txId: z.string(),
        verified: z.boolean(),
        auditEventId: z.string().uuid(),
        verifiedAt: z.string().datetime({ offset: true }),
        /** SHA-256 of the stored event payload */
        payloadHash: z.string(),
        /** ImmuDB inclusion proof */
        inclusionProof: z
          .object({
            path: z.array(z.string()),
            leaf: z.string(),
            root: z.string(),
          })
          .optional(),
        /** Error message if verification failed */
        errorMessage: z.string().optional(),
      }),
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
      404: ApiErrorSchema,
      503: ApiErrorSchema, // ImmuDB unavailable
    },
    summary: 'Cryptographically verify audit record in ImmuDB (AUDITOR+)',
  },

  /**
   * Get the full audit history for a specific entity.
   * Returns all audit events for a given entity_type + entity_id pair.
   */
  entityHistory: {
    method: 'GET',
    path: '/audit/entity/:entityType/:entityId',
    pathParams: z.object({
      entityType: z.string(),
      entityId: z.string().uuid(),
    }),
    query: PaginationQuerySchema,
    responses: {
      200: z.object({
        data: z.array(AuditEventSchema),
        total: z.number().int().nonnegative(),
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        totalPages: z.number().int().nonnegative(),
      }),
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Get full audit history for an entity',
  },

  /**
   * Export audit trail to CSV/PDF.
   * Returns a job ID; use /audit/export/:jobId/download when ready.
   */
  scheduleExport: {
    method: 'POST',
    path: '/audit/export',
    body: AuditQuerySchema.extend({
      format: z.enum(['csv', 'pdf']).default('csv'),
      includeSignatures: z.boolean().default(false),
    }),
    responses: {
      202: z.object({
        jobId: z.string().uuid(),
        estimatedReadyAt: z.string().datetime({ offset: true }),
        downloadUrl: z.string().url(),
      }),
      400: ApiErrorSchema,
      401: ApiErrorSchema,
      403: ApiErrorSchema,
    },
    summary: 'Schedule audit trail export (async)',
  },
});

export type AuditContract = typeof auditContract;
