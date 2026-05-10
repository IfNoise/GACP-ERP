import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const SPATIAL_ZONE_TOPIC = 'spatial.zone.v1' as const;

// ─── PAYLOAD FRAGMENTS ───────────────────────────────────────────────────────

const ZoneRefSchema = z.object({
  zoneId: z.string().uuid(),
  zoneCode: z.string(),
  zoneType: z.enum(['CULTIVATION', 'PROCESSING', 'STORAGE', 'UTILITY', 'OFFICE', 'QUARANTINE']),
});

// ════════════════════════════════════════════════════════════════════════════════
// SPATIAL ZONE EVENTS — topic: spatial.zone.v1
// ════════════════════════════════════════════════════════════════════════════════

export const SpatialZoneCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('spatial.zone.created'),
  topic: z.literal(SPATIAL_ZONE_TOPIC),
  payload: ZoneRefSchema.extend({
    zoneName: z.string(),
    areaSqm: z.number().positive(),
    capacity: z.number().int().positive(),
    createdBy: z.string().uuid(),
  }),
});
export type SpatialZoneCreatedEvent = z.infer<typeof SpatialZoneCreatedEventSchema>;

export const SpatialBatchAssignedToZoneEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('spatial.zone.batch_assigned'),
  topic: z.literal(SPATIAL_ZONE_TOPIC),
  payload: ZoneRefSchema.extend({
    assignmentId: z.string().uuid(),
    batchId: z.string().uuid(),
    assignedBy: z.string().uuid(),
    assignedAt: z.string().datetime({ offset: true }),
    /** Occupancy % after this assignment */
    occupancyAfterPct: z.number().min(0).max(100),
  }),
});
export type BatchAssignedToZoneEvent = z.infer<typeof SpatialBatchAssignedToZoneEventSchema>;

export const SpatialBatchReleasedFromZoneEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('spatial.zone.batch_released'),
  topic: z.literal(SPATIAL_ZONE_TOPIC),
  payload: ZoneRefSchema.extend({
    assignmentId: z.string().uuid(),
    batchId: z.string().uuid(),
    releasedBy: z.string().uuid(),
    releasedAt: z.string().datetime({ offset: true }),
    /** Occupancy % after this release */
    occupancyAfterPct: z.number().min(0).max(100),
  }),
});
export type BatchReleasedFromZoneEvent = z.infer<typeof SpatialBatchReleasedFromZoneEventSchema>;

export const SpatialZoneBoundsUpdatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('spatial.zone.bounds_updated'),
  topic: z.literal(SPATIAL_ZONE_TOPIC),
  payload: ZoneRefSchema.extend({
    bounds3d: z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()]),
    updatedBy: z.string().uuid(),
  }),
});
export type ZoneBoundsUpdatedEvent = z.infer<typeof SpatialZoneBoundsUpdatedEventSchema>;

/** Discriminated union of all Spatial Zone events */
export const SpatialZoneEventSchema = z.discriminatedUnion('eventType', [
  SpatialZoneCreatedEventSchema,
  SpatialBatchAssignedToZoneEventSchema,
  SpatialBatchReleasedFromZoneEventSchema,
  SpatialZoneBoundsUpdatedEventSchema,
]);
export type SpatialZoneEvent = z.infer<typeof SpatialZoneEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// SPATIAL RACK/TRAY EVENTS — topic: spatial.racks.v1
// ════════════════════════════════════════════════════════════════════════════════

export const SPATIAL_RACKS_TOPIC = 'spatial.racks.v1' as const;

export const RackCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('RACK_CREATED'),
  topic: z.literal(SPATIAL_RACKS_TOPIC),
  payload: z.object({
    rackId: z.string().uuid(),
    zoneId: z.string().uuid(),
    rackCode: z.string(),
    rackType: z.enum(['1-shelf', '2-shelf', '3-shelf', 'custom']),
    shelfCount: z.number().int().positive(),
    createdBy: z.string().uuid(),
  }),
});
export type RackCreatedEvent = z.infer<typeof RackCreatedEventSchema>;

export const RackDeletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('RACK_DELETED'),
  topic: z.literal(SPATIAL_RACKS_TOPIC),
  payload: z.object({
    rackId: z.string().uuid(),
    zoneId: z.string().uuid(),
    rackCode: z.string(),
    deletedBy: z.string().uuid(),
  }),
});
export type RackDeletedEvent = z.infer<typeof RackDeletedEventSchema>;

export const TrayCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('TRAY_CREATED'),
  topic: z.literal(SPATIAL_RACKS_TOPIC),
  payload: z.object({
    trayId: z.string().uuid(),
    rackId: z.string().uuid(),
    trayCode: z.string(),
    shelfIndex: z.number().int().nonnegative(),
    positionIndex: z.number().int().nonnegative(),
    traySize: z.enum(['small', 'medium', 'large', 'custom']),
    plantCapacity: z.number().int().positive().nullable(),
    createdBy: z.string().uuid(),
  }),
});
export type TrayCreatedEvent = z.infer<typeof TrayCreatedEventSchema>;

export const TrayDeletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('TRAY_DELETED'),
  topic: z.literal(SPATIAL_RACKS_TOPIC),
  payload: z.object({
    trayId: z.string().uuid(),
    rackId: z.string().uuid(),
    trayCode: z.string(),
    deletedBy: z.string().uuid(),
  }),
});
export type TrayDeletedEvent = z.infer<typeof TrayDeletedEventSchema>;

/** Discriminated union of all Spatial Rack/Tray events */
export const SpatialRacksEventSchema = z.discriminatedUnion('eventType', [
  RackCreatedEventSchema,
  RackDeletedEventSchema,
  TrayCreatedEventSchema,
  TrayDeletedEventSchema,
]);
export type SpatialRacksEvent = z.infer<typeof SpatialRacksEventSchema>;
