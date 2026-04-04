import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  BuildingSchema,
  BuildingTypeEnum,
  CreateBuildingSchema,
  CreateFacilitySchema,
  CreateRoomSchema,
  CreateZoneSchema,
  FacilitySchema,
  PaginationQuerySchema,
  PlantZoneTypeEnum,
  RoomSchema,
  UpdateBuildingSchema,
  UpdateFacilitySchema,
  UpdateRoomSchema,
  UpdateZoneSchema,
  ZoneSchema,
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

// ─── FACILITY ROUTES ────────────────────────────────────────────────────────

const facilitiesContract = c.router({
  create: {
    method: 'POST',
    path: '/facilities',
    body: CreateFacilitySchema,
    responses: {
      201: FacilitySchema,
      400: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a new facility',
  },

  list: {
    method: 'GET',
    path: '/facilities',
    query: PaginationQuerySchema.extend({
      is_active: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: paginatedList(FacilitySchema),
    },
    summary: 'List facilities',
  },

  getById: {
    method: 'GET',
    path: '/facilities/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: FacilitySchema,
      404: ApiErrorSchema,
    },
    summary: 'Get facility by ID',
  },

  update: {
    method: 'PATCH',
    path: '/facilities/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UpdateFacilitySchema,
    responses: {
      200: FacilitySchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Update facility',
  },

  listBuildings: {
    method: 'GET',
    path: '/facilities/:facilityId/buildings',
    pathParams: z.object({ facilityId: z.string().uuid() }),
    query: PaginationQuerySchema.extend({
      building_type: BuildingTypeEnum.optional(),
    }),
    responses: {
      200: paginatedList(BuildingSchema),
      404: ApiErrorSchema,
    },
    summary: 'List buildings for a facility',
  },

  createBuilding: {
    method: 'POST',
    path: '/facilities/:facilityId/buildings',
    pathParams: z.object({ facilityId: z.string().uuid() }),
    body: CreateBuildingSchema.omit({ facility_id: true }),
    responses: {
      201: BuildingSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a building in a facility',
  },

  listZonesByFacility: {
    method: 'GET',
    path: '/facilities/:facilityId/zones',
    pathParams: z.object({ facilityId: z.string().uuid() }),
    query: PaginationQuerySchema.extend({
      zone_type: PlantZoneTypeEnum.optional(),
    }),
    responses: {
      200: paginatedList(ZoneSchema),
      404: ApiErrorSchema,
    },
    summary: 'List all zones across all buildings/rooms in a facility',
  },
});

// ─── BUILDING ROUTES ───────────────────────────────────────────────────────

const buildingsContract = c.router({
  getById: {
    method: 'GET',
    path: '/buildings/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: BuildingSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get building by ID',
  },

  update: {
    method: 'PATCH',
    path: '/buildings/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UpdateBuildingSchema,
    responses: {
      200: BuildingSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Update building',
  },

  listRooms: {
    method: 'GET',
    path: '/buildings/:buildingId/rooms',
    pathParams: z.object({ buildingId: z.string().uuid() }),
    query: PaginationQuerySchema,
    responses: {
      200: paginatedList(RoomSchema),
      404: ApiErrorSchema,
    },
    summary: 'List rooms for a building',
  },

  createRoom: {
    method: 'POST',
    path: '/buildings/:buildingId/rooms',
    pathParams: z.object({ buildingId: z.string().uuid() }),
    body: CreateRoomSchema.omit({ building_id: true }),
    responses: {
      201: RoomSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a room in a building',
  },
});

// ─── ROOM ROUTES ────────────────────────────────────────────────────────────

const roomsContract = c.router({
  getById: {
    method: 'GET',
    path: '/rooms/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: RoomSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get room by ID',
  },

  update: {
    method: 'PATCH',
    path: '/rooms/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UpdateRoomSchema,
    responses: {
      200: RoomSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Update room',
  },

  listZones: {
    method: 'GET',
    path: '/rooms/:roomId/zones',
    pathParams: z.object({ roomId: z.string().uuid() }),
    query: PaginationQuerySchema.extend({
      zone_type: PlantZoneTypeEnum.optional(),
    }),
    responses: {
      200: paginatedList(ZoneSchema),
      404: ApiErrorSchema,
    },
    summary: 'List zones in a room',
  },

  createZone: {
    method: 'POST',
    path: '/rooms/:roomId/zones',
    pathParams: z.object({ roomId: z.string().uuid() }),
    body: CreateZoneSchema.omit({ room_id: true }),
    responses: {
      201: ZoneSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a zone in a room',
  },
});

// ─── ZONE ROUTES ────────────────────────────────────────────────────────────

const zonesContract = c.router({
  getById: {
    method: 'GET',
    path: '/zones/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: ZoneSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get zone by ID',
  },

  update: {
    method: 'PATCH',
    path: '/zones/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    body: UpdateZoneSchema,
    responses: {
      200: ZoneSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Update zone',
  },
});

// ─── COMBINED FACILITY CONTRACT ─────────────────────────────────────────────

export const facilityContract = c.router({
  facilities: facilitiesContract,
  buildings: buildingsContract,
  rooms: roomsContract,
  zones: zonesContract,
});

export type FacilityContract = typeof facilityContract;
