import { z } from 'zod';

import {
  BuildingIdSchema,
  BuildingTypeEnum,
  FacilityIdSchema,
  PlantZoneTypeEnum,
  RoomIdSchema,
  UserIdSchema,
  ZoneIdSchema,
} from '@gacp-erp/shared-schemas';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPIC ──────────────────────────────────────────────────────────────
export const FACILITY_TOPIC = 'facility.spatial.v1' as const;

// ─── FACILITY CREATED ─────────────────────────────────────────────────────────
export const FacilityCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('FACILITY_CREATED'),
  topic: z.literal(FACILITY_TOPIC),
  payload: z.object({
    facilityId: FacilityIdSchema,
    facilityCode: z.string(),
    name: z.string(),
    licenseNumber: z.string().optional(),
    createdBy: UserIdSchema,
  }),
});
export type FacilityCreatedEvent = z.infer<typeof FacilityCreatedEventSchema>;

// ─── BUILDING CREATED ────────────────────────────────────────────────────────
export const BuildingCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('BUILDING_CREATED'),
  topic: z.literal(FACILITY_TOPIC),
  payload: z.object({
    buildingId: BuildingIdSchema,
    buildingCode: z.string(),
    facilityId: FacilityIdSchema,
    buildingType: BuildingTypeEnum,
    name: z.string(),
    createdBy: UserIdSchema,
  }),
});
export type BuildingCreatedEvent = z.infer<typeof BuildingCreatedEventSchema>;

// ─── ROOM CREATED ─────────────────────────────────────────────────────────────
export const RoomCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ROOM_CREATED'),
  topic: z.literal(FACILITY_TOPIC),
  payload: z.object({
    roomId: RoomIdSchema,
    roomCode: z.string(),
    buildingId: BuildingIdSchema,
    facilityId: FacilityIdSchema,
    name: z.string(),
    createdBy: UserIdSchema,
  }),
});
export type RoomCreatedEvent = z.infer<typeof RoomCreatedEventSchema>;

// ─── ZONE CREATED ─────────────────────────────────────────────────────────────
export const ZoneCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ZONE_CREATED'),
  topic: z.literal(FACILITY_TOPIC),
  payload: z.object({
    zoneId: ZoneIdSchema,
    zoneCode: z.string(),
    roomId: RoomIdSchema,
    buildingId: BuildingIdSchema,
    facilityId: FacilityIdSchema,
    zoneType: PlantZoneTypeEnum,
    name: z.string(),
    maxPlants: z.number().int().positive().optional(),
    createdBy: UserIdSchema,
  }),
});
export type ZoneCreatedEvent = z.infer<typeof ZoneCreatedEventSchema>;

// ─── ZONE CAPACITY CHANGED ────────────────────────────────────────────────────
/** Published when max_plants or environment_config changes. */
export const ZoneCapacityChangedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ZONE_CAPACITY_CHANGED'),
  topic: z.literal(FACILITY_TOPIC),
  payload: z.object({
    zoneId: ZoneIdSchema,
    zoneCode: z.string(),
    roomId: RoomIdSchema,
    previousMaxPlants: z.number().int().nullable(),
    newMaxPlants: z.number().int().nullable(),
    changedBy: UserIdSchema,
    changedAt: z.string().datetime({ offset: true }),
  }),
});
export type ZoneCapacityChangedEvent = z.infer<typeof ZoneCapacityChangedEventSchema>;

// ─── DISCRIMINATED UNION ──────────────────────────────────────────────────────
export const FacilityEventSchema = z.discriminatedUnion('eventType', [
  FacilityCreatedEventSchema,
  BuildingCreatedEventSchema,
  RoomCreatedEventSchema,
  ZoneCreatedEventSchema,
  ZoneCapacityChangedEventSchema,
]);
export type FacilityEvent = z.infer<typeof FacilityEventSchema>;
