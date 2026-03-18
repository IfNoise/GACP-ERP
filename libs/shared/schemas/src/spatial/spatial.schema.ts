import { z } from 'zod';

import { BaseEntitySchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';

// ─── FACILITY ZONE ────────────────────────────────────────────────────────────

export const ZoneTypeEnum = z.enum([
  'CULTIVATION',
  'PROCESSING',
  'STORAGE',
  'UTILITY',
  'OFFICE',
  'QUARANTINE',
]);
export type ZoneType = z.infer<typeof ZoneTypeEnum>;

/**
 * Facility zone master record.
 * Supports hierarchical zones (parent_zone_id) for multi-room facilities.
 * Capacity enforcement prevents over-assignment of batches.
 */
export const FacilityZoneSchema = BaseEntitySchema.extend({
  zone_code: z.string().regex(/^ZONE-[A-Z0-9]{2,10}$/, {
    message: 'zone_code must match ZONE-XXXXXXXX',
  }),
  zone_name: z.string().min(2).max(200),
  zone_type: ZoneTypeEnum,
  /** Usable area in square meters */
  area_sqm: z.number().positive().nullable(),
  /** Maximum number of concurrent batch assignments allowed */
  capacity: z.number().int().positive().nullable(),
  parent_zone_id: z.string().uuid().nullable(),
  is_active: z.boolean().default(true),
  /** Current number of active batch assignments */
  current_occupancy: z.number().int().nonnegative().default(0),
  notes: z.string().max(1000).nullable(),
});
export type FacilityZone = z.infer<typeof FacilityZoneSchema>;

// ─── ZONE ASSIGNMENT ──────────────────────────────────────────────────────────

/**
 * Records assignment of a plant batch to a facility zone.
 * Enforces single-assignment rule (a batch occupies one zone at a time).
 * ALCOA+ traceable: who assigned, when, and when released.
 */
export const ZoneAssignmentSchema = BaseEntitySchema.extend({
  zone_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  assigned_at: z.string().datetime({ offset: true }),
  assigned_by: UserIdSchema,
  /** NULL if still assigned; ISO datetime when batch was released */
  released_at: z.string().datetime({ offset: true }).nullable(),
  released_by: UserIdSchema.nullable(),
  notes: z.string().max(500).nullable(),
});
export type ZoneAssignment = z.infer<typeof ZoneAssignmentSchema>;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export const CreateFacilityZoneSchema = z.object({
  zone_code: z.string().regex(/^ZONE-[A-Z0-9]{2,10}$/),
  zone_name: z.string().min(2).max(200),
  zone_type: ZoneTypeEnum,
  area_sqm: z.number().positive(),
  capacity: z.number().int().positive(),
  parent_zone_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateFacilityZone = z.infer<typeof CreateFacilityZoneSchema>;

export const AssignBatchToZoneSchema = z.object({
  zone_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});
export type AssignBatchToZone = z.infer<typeof AssignBatchToZoneSchema>;

export const ReleaseBatchFromZoneSchema = z.object({
  assignment_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});
export type ReleaseBatchFromZone = z.infer<typeof ReleaseBatchFromZoneSchema>;
