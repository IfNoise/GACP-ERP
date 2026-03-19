import { z } from 'zod';

// ─── OUTBOX EVENT ─────────────────────────────────────────────────────────────
/**
 * Transactional outbox pattern — events persisted in DB before Kafka publish.
 * Guarantees at-least-once delivery with idempotent consumer.
 * Per ALCOA+: recorded contemporaneously, immutable after creation.
 */

export const OutboxEventCreateSchema = z.object({
  topic: z.string().min(1),
  key: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});
export type OutboxEventCreate = z.infer<typeof OutboxEventCreateSchema>;

export const OutboxEventSchema = z.object({
  id: z.string().uuid(),
  topic: z.string().min(1),
  key: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  retryCount: z.number().int().nonnegative(),
});
export type OutboxEvent = z.infer<typeof OutboxEventSchema>;
