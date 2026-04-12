import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const SUPPLIER_TOPIC = 'procurement.supplier.v1' as const;

// ─── PAYLOAD FRAGMENTS ───────────────────────────────────────────────────────

const SupplierRefSchema = z.object({
  supplierId: z.string().uuid(),
  supplierCode: z.string().regex(/^SUP-\d{4}$/),
});

// ════════════════════════════════════════════════════════════════════════════════
// SUPPLIER EVENTS — topic: procurement.supplier.v1
// ════════════════════════════════════════════════════════════════════════════════

export const SupplierCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('procurement.supplier.created'),
  topic: z.literal(SUPPLIER_TOPIC),
  payload: SupplierRefSchema.extend({
    name: z.string(),
    qualificationStatus: z.enum(['QUALIFIED', 'PROVISIONAL', 'DISQUALIFIED']),
    createdBy: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
  }),
});
export type SupplierCreatedEvent = z.infer<typeof SupplierCreatedEventSchema>;

export const SupplierQualifiedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('procurement.supplier.qualified'),
  topic: z.literal(SUPPLIER_TOPIC),
  payload: SupplierRefSchema.extend({
    qualificationStatus: z.enum(['QUALIFIED', 'PROVISIONAL', 'DISQUALIFIED']),
    qualifiedBy: z.string().uuid(),
    qualifiedAt: z.string().datetime({ offset: true }),
  }),
});
export type SupplierQualifiedEvent = z.infer<typeof SupplierQualifiedEventSchema>;

/** Discriminated union of all Supplier events */
export const SupplierEventSchema = z.discriminatedUnion('eventType', [
  SupplierCreatedEventSchema,
  SupplierQualifiedEventSchema,
]);
export type SupplierEvent = z.infer<typeof SupplierEventSchema>;
