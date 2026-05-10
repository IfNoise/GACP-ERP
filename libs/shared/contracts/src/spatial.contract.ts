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
  TraySchema,
  RackSchema,
  CreateRackSchema,
  CreateTraySchema,
} from '@gacp-erp/shared-schemas';

const BoundsSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

const BuildingSchema = z.object({
  id: z.string().uuid(),
  facility_id: z.string().uuid(),
  building_name: z.string(),
  building_code: z.string(),
  is_active: z.boolean(),
  model_url: z.string().url().nullable(),
  model_format: z.enum(['ifc', 'gltf', 'xkt']).nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

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
      top_level_only: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: paginatedList(FacilityZoneSchema),
    },
    summary: 'List facility zones (optionally top-level only)',
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

  // ── Hierarchical Zones ────────────────────────────────────────────────────

  /** Get zone hierarchy with all sub-zones and racks */
  getZoneHierarchy: {
    method: 'GET',
    path: '/spatial/zones/:id/hierarchy',
    pathParams: z.object({ id: z.string().uuid() }),
    query: z.object({
      depth: z.enum(['direct', 'full']).default('full').optional(),
    }),
    responses: {
      200: z.object({
        id: z.string().uuid(),
        zone_code: z.string(),
        zone_name: z.string(),
        zone_type: z.string(),
        sub_zones: z.array(FacilityZoneSchema).default([]),
        racks: z
          .array(
            z.object({
              id: z.string().uuid(),
              zone_id: z.string().uuid(),
              rack_code: z.string(),
              rack_type: z.string(),
              shelf_count: z.number(),
              shelves: z
                .array(
                  z.object({
                    id: z.string().uuid(),
                    shelf_index: z.number(),
                    trays: z.array(TraySchema).default([]),
                  }),
                )
                .default([]),
            }),
          )
          .default([]),
      }),
      404: ApiErrorSchema,
    },
    summary: 'Get full zone hierarchy with sub-zones, racks, shelves, and trays',
  },

  // ── Racks ─────────────────────────────────────────────────────────────────────

  createRack: {
    method: 'POST',
    path: '/spatial/racks',
    body: CreateRackSchema,
    responses: {
      201: RackSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a rack in a zone (auto-creates shelves)',
  },

  listZoneRacks: {
    method: 'GET',
    path: '/spatial/zones/:zoneId/racks',
    pathParams: z.object({ zoneId: z.string().uuid() }),
    query: PaginationQuerySchema,
    responses: {
      200: paginatedList(RackSchema),
      404: ApiErrorSchema,
    },
    summary: 'List racks in a zone',
  },

  getRack: {
    method: 'GET',
    path: '/spatial/racks/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: RackSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get a rack by ID',
  },

  deleteRack: {
    method: 'DELETE',
    path: '/spatial/racks/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}),
    responses: {
      200: z.object({ message: z.string() }),
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Delete a rack (must have no occupied trays)',
  },

  // ── Trays ─────────────────────────────────────────────────────────────────────

  createTray: {
    method: 'POST',
    path: '/spatial/racks/:rackId/trays',
    pathParams: z.object({ rackId: z.string().uuid() }),
    body: CreateTraySchema,
    responses: {
      201: TraySchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a tray on a shelf',
  },

  listRackTrays: {
    method: 'GET',
    path: '/spatial/racks/:rackId/trays',
    pathParams: z.object({ rackId: z.string().uuid() }),
    query: PaginationQuerySchema,
    responses: {
      200: paginatedList(TraySchema),
      404: ApiErrorSchema,
    },
    summary: 'List trays in a rack',
  },

  deleteTray: {
    method: 'DELETE',
    path: '/spatial/trays/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}),
    responses: {
      200: z.object({ message: z.string() }),
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Delete a tray (must be empty)',
  },

  // ── Zone 3D Bounds ────────────────────────────────────────────────────────────

  updateZoneBounds: {
    method: 'PATCH',
    path: '/spatial/zones/:id/bounds',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({ bounds_3d: BoundsSchema }),
    responses: {
      200: FacilityZoneSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Update 3D bounding box of a zone [x,y,z,w,h,d] in metres',
  },

  // ── Buildings ─────────────────────────────────────────────────────────────────

  listBuildings: {
    method: 'GET',
    path: '/buildings',
    responses: {
      200: z.array(BuildingSchema),
    },
    summary: 'List all active buildings',
  },

  getBuilding: {
    method: 'GET',
    path: '/buildings/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: BuildingSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get a building by ID',
  },

  updateBuildingModel: {
    method: 'PUT',
    path: '/buildings/:id/model',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({
      model_url: z.string().url(),
      model_format: z.enum(['ifc', 'gltf', 'xkt']),
    }),
    responses: {
      200: BuildingSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Register 3D model URL and format for a building',
  },
});
