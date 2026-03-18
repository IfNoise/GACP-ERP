import { z } from 'zod';

import { FacilityIdSchema, RoomIdSchema, UserIdSchema, ZoneIdSchema } from '../common/branded-ids';

// ─── ZONE TYPE ───────────────────────────────────────────────────────────────

export const PlantZoneTypeEnum = z.enum([
  'seedling',
  'germination',
  'vegetation',
  'flowering',
  'mother_room',
  'clone_room',
  'drying',
  'curing',
  'storage',
  'processing',
  'quarantine',
]);
export type PlantZoneType = z.infer<typeof PlantZoneTypeEnum>;

// ─── FACILITY ────────────────────────────────────────────────────────────────

export const FacilitySchema = z.object({
  id: FacilityIdSchema,
  facility_code: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9-]+$/),
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  /** GPS coordinates */
  coordinates: z.record(z.unknown()).nullable().optional(),
  /** Dimensions in metres */
  dimensions: z.record(z.unknown()).nullable().optional(),
  license_number: z.string().max(100).optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  created_by: UserIdSchema,
  updated_by: UserIdSchema,
});
export type Facility = z.infer<typeof FacilitySchema>;

export const CreateFacilitySchema = z.object({
  facility_code: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9-]+$/),
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  coordinates: z.record(z.unknown()).optional(),
  dimensions: z.record(z.unknown()).optional(),
  license_number: z.string().max(100).optional(),
});
export type CreateFacility = z.infer<typeof CreateFacilitySchema>;

// ─── ROOM ────────────────────────────────────────────────────────────────────

export const RoomSchema = z.object({
  id: RoomIdSchema,
  facility_id: FacilityIdSchema,
  room_code: z.string().min(1).max(30),
  name: z.string().min(1).max(100),
  dimensions: z.record(z.unknown()).nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  created_by: UserIdSchema,
  updated_by: UserIdSchema,
});
export type Room = z.infer<typeof RoomSchema>;

export const CreateRoomSchema = z.object({
  facility_id: FacilityIdSchema,
  room_code: z.string().min(1).max(30),
  name: z.string().min(1).max(100),
  dimensions: z.record(z.unknown()).optional(),
});
export type CreateRoom = z.infer<typeof CreateRoomSchema>;

// ─── ZONE ────────────────────────────────────────────────────────────────────

export const ZoneSchema = z.object({
  id: ZoneIdSchema,
  room_id: RoomIdSchema,
  zone_code: z.string().min(1).max(20),
  zone_type: PlantZoneTypeEnum,
  name: z.string().min(1).max(100),
  area_m2: z.number().positive().optional(),
  environment_config: z.record(z.unknown()).nullable().optional(),
  coordinates: z.record(z.unknown()).nullable().optional(),
  max_plants: z.number().int().positive().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  created_by: UserIdSchema,
  updated_by: UserIdSchema,
});
export type Zone = z.infer<typeof ZoneSchema>;

export const CreateZoneSchema = z.object({
  room_id: RoomIdSchema,
  zone_code: z.string().min(1).max(20),
  zone_type: PlantZoneTypeEnum,
  name: z.string().min(1).max(100),
  area_m2: z.number().positive().optional(),
  max_plants: z.number().int().positive().optional(),
  environment_config: z.record(z.unknown()).optional(),
});
export type CreateZone = z.infer<typeof CreateZoneSchema>;
