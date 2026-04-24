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
  zone_code: z
    .string()
    .regex(/^ZONE-[A-Z0-9]{2,10}$/)
    .optional(),
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

// ─── RACK (Multi-shelf structures in zones) ───────────────────────────────────

export const RackTypeEnum = z.enum(['1-shelf', '2-shelf', '3-shelf', 'custom']);
export type RackType = z.infer<typeof RackTypeEnum>;

/**
 * Physical rack with multiple shelves.
 * Racks are positioned in zones using row/column grid coordinates.
 */
export const RackSchema = BaseEntitySchema.extend({
  zone_id: z.string().uuid(),
  rack_code: z.string().max(20),
  rack_type: RackTypeEnum,
  shelf_count: z.number().int().positive(),
  row_position: z.number().int().nonnegative().nullable(),
  column_position: z.number().int().nonnegative().nullable(),
  coordinates: z.object({ x: z.number(), y: z.number(), z: z.number() }).nullable(),
  max_tray_capacity: z.number().int().positive().nullable(),
  supported_tray_sizes: z.array(z.string()).nullable(),
  qr_code: z.string().max(255).nullable(),
});
export type Rack = z.infer<typeof RackSchema>;

export const CreateRackSchema = z.object({
  zone_id: z.string().uuid(),
  rack_code: z.string().max(20).optional(),
  rack_type: RackTypeEnum,
  shelf_count: z.number().int().positive(),
  row_position: z.number().int().nonnegative().optional(),
  column_position: z.number().int().nonnegative().optional(),
  max_tray_capacity: z.number().int().positive().optional(),
  supported_tray_sizes: z.array(z.string()).optional(),
});
export type CreateRack = z.infer<typeof CreateRackSchema>;

// ─── SHELF (Levels in a rack) ────────────────────────────────────────────────

/**
 * Individual shelf within a rack.
 * Indexed from 0 (bottom) upward.
 */
export const ShelfSchema = BaseEntitySchema.extend({
  rack_id: z.string().uuid(),
  shelf_index: z.number().int().nonnegative(),
  height_from_floor: z.number().nullable(),
  max_trays: z.number().int().positive().nullable(),
  occupied_positions: z.number().int().nonnegative().default(0),
});
export type Shelf = z.infer<typeof ShelfSchema>;

export const CreateShelfSchema = z.object({
  rack_id: z.string().uuid(),
  shelf_index: z.number().int().nonnegative(),
  height_from_floor: z.number().optional(),
  max_trays: z.number().int().positive().optional(),
});
export type CreateShelf = z.infer<typeof CreateShelfSchema>;

// ─── TRAY (Container on shelf) ────────────────────────────────────────────────

export const TraySizeEnum = z.enum(['small', 'medium', 'large', 'custom']);
export type TraySize = z.infer<typeof TraySizeEnum>;

/**
 * Individual tray on a shelf.
 * Holds plants in a grid layout defined by plant_layout JSONB.
 */
export const TraySchema = BaseEntitySchema.extend({
  rack_id: z.string().uuid(),
  shelf_index: z.number().int().nonnegative(),
  position_index: z.number().int().nonnegative(),
  tray_code: z.string().max(30),
  tray_size: TraySizeEnum,
  plant_capacity: z.number().int().positive().nullable(),
  plant_layout: z
    .object({
      rows: z.number().int().positive().optional(),
      cols: z.number().int().positive().optional(),
      spacing: z.number().optional(),
      pattern: z.string().optional(),
    })
    .nullable(),
  occupied_slots: z.number().int().nonnegative().default(0),
  qr_code: z.string().max(255).nullable(),
});
export type Tray = z.infer<typeof TraySchema>;

export const CreateTraySchema = z.object({
  rack_id: z.string().uuid().optional(),
  shelf_index: z.number().int().nonnegative(),
  position_index: z.number().int().nonnegative(),
  tray_code: z.string().max(30),
  tray_size: TraySizeEnum,
  plant_capacity: z.number().int().positive().optional(),
  plant_layout: z
    .object({
      rows: z.number().int().positive().optional(),
      cols: z.number().int().positive().optional(),
      spacing: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
});
export type CreateTray = z.infer<typeof CreateTraySchema>;

// ─── SPATIAL ADDRESS (Hierarchical location reference) ────────────────────────

export const SpatialEntityTypeEnum = z.enum(['facility', 'zone', 'rack', 'shelf', 'tray', 'plant']);
export type SpatialEntityType = z.infer<typeof SpatialEntityTypeEnum>;

/**
 * Spatial address record — generates hierarchical dotted notation.
 * Format: FARM01.BUILDING.VEG.R001.S001.T001
 * Enables full traceability of plant position within facility.
 */
export const SpatialAddressSchema = z.object({
  id: z.string().uuid(),
  entity_id: z.string().uuid(),
  entity_type: SpatialEntityTypeEnum,
  spatial_address: z.string().max(200).nullable(),
  facility_code: z.string().max(10).nullable(),
  zone_code: z.string().max(20).nullable(),
  subzone_code: z.string().max(20).nullable(),
  rack_code: z.string().max(20).nullable(),
  shelf_index: z.number().int().nonnegative().nullable(),
  tray_position: z.number().int().nonnegative().nullable(),
  plant_slot: z.number().int().nonnegative().nullable(),
  coordinates: z.object({ x: z.number(), y: z.number(), z: z.number() }).nullable(),
  created_at: z.string().datetime({ offset: true }),
});
export type SpatialAddress = z.infer<typeof SpatialAddressSchema>;
