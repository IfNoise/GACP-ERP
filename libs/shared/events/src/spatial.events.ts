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

/** Discriminated union of all Spatial Zone events */
export const SpatialZoneEventSchema = z.discriminatedUnion('eventType', [
  SpatialZoneCreatedEventSchema,
  SpatialBatchAssignedToZoneEventSchema,
  SpatialBatchReleasedFromZoneEventSchema,
]);
export type SpatialZoneEvent = z.infer<typeof SpatialZoneEventSchema>;
