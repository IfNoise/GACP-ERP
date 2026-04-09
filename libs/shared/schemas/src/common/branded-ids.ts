import { z } from 'zod';

// ─── BRANDED TYPES ──────────────────────────────────────────────────────────
// Branded types prevent accidental mixing of IDs across entity types.
// Usage: const id: PlantId = z.string().uuid().brand<'PlantId'>().parse(rawId)

/** UUID v4 branded as PlantId — prevents mixing with other entity IDs */
export const PlantIdSchema = z.string().uuid().brand<'PlantId'>();
export type PlantId = z.infer<typeof PlantIdSchema>;

/** UUID v4 branded as BatchId */
export const BatchIdSchema = z.string().uuid().brand<'BatchId'>();
export type BatchId = z.infer<typeof BatchIdSchema>;

/** UUID v4 branded as UserId */
export const UserIdSchema = z.string().uuid().brand<'UserId'>();
export type UserId = z.infer<typeof UserIdSchema>;

/** UUID v4 branded as FacilityId */
export const FacilityIdSchema = z.string().uuid().brand<'FacilityId'>();
export type FacilityId = z.infer<typeof FacilityIdSchema>;

/** UUID v4 branded as BuildingId */
export const BuildingIdSchema = z.string().uuid().brand<'BuildingId'>();
export type BuildingId = z.infer<typeof BuildingIdSchema>;

/** UUID v4 branded as ZoneId */
export const ZoneIdSchema = z.string().uuid().brand<'ZoneId'>();
export type ZoneId = z.infer<typeof ZoneIdSchema>;

/** UUID v4 branded as RoomId */
export const RoomIdSchema = z.string().uuid().brand<'RoomId'>();
export type RoomId = z.infer<typeof RoomIdSchema>;

/** UUID v4 branded as StrainId */
export const StrainIdSchema = z.string().uuid().brand<'StrainId'>();
export type StrainId = z.infer<typeof StrainIdSchema>;

/** UUID v4 branded as AuditEventId */
export const AuditEventIdSchema = z.string().uuid().brand<'AuditEventId'>();
export type AuditEventId = z.infer<typeof AuditEventIdSchema>;

/** UUID v4 branded as SignatureId */
export const SignatureIdSchema = z.string().uuid().brand<'SignatureId'>();
export type SignatureId = z.infer<typeof SignatureIdSchema>;

/** UUID v4 branded as SupplierId */
export const SupplierIdSchema = z.string().uuid().brand<'SupplierId'>();
export type SupplierId = z.infer<typeof SupplierIdSchema>;

/** UUID v4 branded as EmployeeId */
export const EmployeeIdSchema = z.string().uuid().brand<'EmployeeId'>();
export type EmployeeId = z.infer<typeof EmployeeIdSchema>;

/**
 * Helper to create a branded UUID schema for a given entity type.
 * @internal Use the specific branded schemas above instead.
 */
export function brandedUuid<T extends string>(): z.ZodBranded<z.ZodString, T> {
  return z.string().uuid().brand<T>();
}
