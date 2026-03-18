import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  PaginationQuerySchema,
  FacilityZoneSchema,
  CreateFacilityZoneSchema,
  ZoneAssignmentSchema,
  AssignBatchToZoneSchema,
  ReleaseBatchFromZoneSchema,
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
 * Spatial Planning API contract (EPIC 8).
 *
 * Covers Facility Zone management and Batch-to-Zone assignments
 * with occupancy tracking and capacity checks.
 */
export const spatialContract = c.router({
  // ── Facility Zones ────────────────────────────────────────────────────────

  createZone: {
    method: 'POST',
    path: '/spatial/zones',
    body: CreateFacilityZoneSchema,
    responses: {
      201: FacilityZoneSchema,
      400: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a facility zone',
  },

  listZones: {
    method: 'GET',
    path: '/spatial/zones',
    query: PaginationQuerySchema.extend({
      zone_type: z
        .enum(['CULTIVATION', 'PROCESSING', 'STORAGE', 'UTILITY', 'OFFICE', 'QUARANTINE'])
        .optional(),
      is_active: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: paginatedList(FacilityZoneSchema),
    },
    summary: 'List facility zones',
  },

  getZone: {
    method: 'GET',
    path: '/spatial/zones/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: FacilityZoneSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get a facility zone by ID',
  },

  // ── Zone Assignments ──────────────────────────────────────────────────────

  assignBatchToZone: {
    method: 'POST',
    path: '/spatial/zones/assignments',
    body: AssignBatchToZoneSchema,
    responses: {
      201: ZoneAssignmentSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Assign a batch to a zone (checks capacity)',
  },

  getBatchAssignment: {
    method: 'GET',
    path: '/spatial/zones/assignments/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: ZoneAssignmentSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get a zone assignment by ID',
  },

  releaseBatchFromZone: {
    method: 'DELETE',
    path: '/spatial/zones/assignments/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: ReleaseBatchFromZoneSchema,
    responses: {
      200: ZoneAssignmentSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Release a batch from its current zone',
  },

  listActiveAssignments: {
    method: 'GET',
    path: '/spatial/zones/:zoneId/assignments',
    pathParams: z.object({ zoneId: z.string().uuid() }),
    query: PaginationQuerySchema,
    responses: {
      200: paginatedList(ZoneAssignmentSchema),
      404: ApiErrorSchema,
    },
    summary: 'List active batch assignments for a zone',
  },
});
