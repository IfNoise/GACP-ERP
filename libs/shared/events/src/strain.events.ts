import { z } from 'zod';

import { EventHeaderSchema } from './base.events';

// ─── Topic ───────────────────────────────────────────────────────────────────
export const STRAIN_TOPIC = 'cultivation.strains.v1';

// ─── Events ──────────────────────────────────────────────────────────────────

export const StrainCreatedEvent = EventHeaderSchema.extend({
  eventType: z.literal('STRAIN_CREATED'),
  strainId: z.string().uuid(),
  cultivarCode: z.string(),
  name: z.string(),
  species: z.string(),
  supplierId: z.string().uuid().optional(),
});
export type StrainCreatedEvent = z.infer<typeof StrainCreatedEvent>;

export const StrainUpdatedEvent = EventHeaderSchema.extend({
  eventType: z.literal('STRAIN_UPDATED'),
  strainId: z.string().uuid(),
  changes: z.record(z.unknown()),
});
export type StrainUpdatedEvent = z.infer<typeof StrainUpdatedEvent>;

export const StrainDeactivatedEvent = EventHeaderSchema.extend({
  eventType: z.literal('STRAIN_DEACTIVATED'),
  strainId: z.string().uuid(),
  reason: z.string().optional(),
});
export type StrainDeactivatedEvent = z.infer<typeof StrainDeactivatedEvent>;

// ─── Discriminated union ─────────────────────────────────────────────────────
export const StrainEvent = z.discriminatedUnion('eventType', [
  StrainCreatedEvent,
  StrainUpdatedEvent,
  StrainDeactivatedEvent,
]);
export type StrainEvent = z.infer<typeof StrainEvent>;
