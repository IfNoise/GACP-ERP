import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const PROCUREMENT_PO_TOPIC = 'procurement.po.v1' as const;

// ─── PAYLOAD FRAGMENTS ───────────────────────────────────────────────────────

const PORefSchema = z.object({
  poId: z.string().uuid(),
  poNumber: z.string().regex(/^PO-\d{4}-\d{4}$/),
  supplierId: z.string().uuid(),
});

// ════════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDER EVENTS — topic: procurement.po.v1
// ════════════════════════════════════════════════════════════════════════════════

export const POCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('procurement.po.created'),
  topic: z.literal(PROCUREMENT_PO_TOPIC),
  payload: PORefSchema.extend({
    totalValue: z.number().nonnegative(),
    currency: z.string().length(3),
    lineCount: z.number().int().positive(),
    createdBy: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
  }),
});
export type POCreatedEvent = z.infer<typeof POCreatedEventSchema>;

export const POSubmittedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('procurement.po.submitted'),
  topic: z.literal(PROCUREMENT_PO_TOPIC),
  payload: PORefSchema.extend({
    totalValue: z.number().nonnegative(),
    submittedBy: z.string().uuid(),
    submittedAt: z.string().datetime({ offset: true }),
  }),
});
export type POSubmittedEvent = z.infer<typeof POSubmittedEventSchema>;

export const POAcknowledgedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('procurement.po.acknowledged'),
  topic: z.literal(PROCUREMENT_PO_TOPIC),
  payload: PORefSchema.extend({
    acknowledgedBy: z.string().uuid(),
    acknowledgedAt: z.string().datetime({ offset: true }),
    expectedDeliveryDate: z.string().date().nullable(),
  }),
});
export type POAcknowledgedEvent = z.infer<typeof POAcknowledgedEventSchema>;

export const GoodsReceivedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('procurement.po.goods_received'),
  topic: z.literal(PROCUREMENT_PO_TOPIC),
  payload: PORefSchema.extend({
    grnId: z.string().uuid(),
    grnNumber: z.string().regex(/^GRN-\d{4}-\d{4}$/),
    qualityCheckPassed: z.boolean(),
    receivedBy: z.string().uuid(),
    receivedAt: z.string().datetime({ offset: true }),
    /** PO line details with strain references (optional for backward compat) */
    lines: z
      .array(
        z.object({
          poLineId: z.string().uuid(),
          strainId: z.string().uuid().nullable(),
          quantityReceived: z.number(),
        }),
      )
      .optional(),
  }),
});
export type GoodsReceivedEvent = z.infer<typeof GoodsReceivedEventSchema>;

export const ThreeWayMatchCompletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('procurement.po.three_way_match_completed'),
  topic: z.literal(PROCUREMENT_PO_TOPIC),
  payload: PORefSchema.extend({
    matchPassed: z.boolean(),
    /** Whether PO quantity matches GRN quantity */
    quantityMatch: z.boolean(),
    /** Whether PO price matches Invoice price */
    priceMatch: z.boolean(),
    verifiedBy: z.string().uuid(),
    verifiedAt: z.string().datetime({ offset: true }),
  }),
});
export type ThreeWayMatchCompletedEvent = z.infer<typeof ThreeWayMatchCompletedEventSchema>;

/** Discriminated union of all Procurement PO events */
export const ProcurementPOEventSchema = z.discriminatedUnion('eventType', [
  POCreatedEventSchema,
  POSubmittedEventSchema,
  POAcknowledgedEventSchema,
  GoodsReceivedEventSchema,
  ThreeWayMatchCompletedEventSchema,
]);
export type ProcurementPOEvent = z.infer<typeof ProcurementPOEventSchema>;
