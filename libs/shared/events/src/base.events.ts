import { z } from 'zod';
import { UserIdSchema } from '@gacp-erp/shared-schemas';

// ─── SOP REFERENCE ────────────────────────────────────────────────────────────
/**
 * Reference to the Standard Operating Procedure that governs the action
 * which produced this domain event.
 *
 * Required for GACP / EU GMP Annex 11 traceability:
 * every automated action must be traceable back to a documented procedure.
 *
 * Format: sopId = "SOP-PLM-001", sopVersion = "2.1", sopStepId = "3.2" (optional)
 */
export const SopReferenceSchema = z.object({
  /** SOP identifier, e.g. "SOP-PLM-001" */
  sopId: z.string().min(1).max(50),
  /** SOP version at the time of the action, e.g. "2.1" */
  sopVersion: z.string().regex(/^\d+\.\d+$/, { message: 'sopVersion must be in X.Y format' }),
  /** Optional: specific step within the SOP, e.g. "3.2.1" */
  sopStepId: z.string().max(20).optional(),
});
export type SopReference = z.infer<typeof SopReferenceSchema>;

// ─── EVENT HEADER ─────────────────────────────────────────────────────────────
/**
 * Common header for ALL Kafka domain events in GACP-ERP.
 *
 * "Domain events" are messages published to Kafka when something changes in
 * the system (plant created, batch status changed, signature recorded, etc.).
 *
 * NOT to be confused with:
 *   - plant_operations (physical actions performed on plants, stored in DB)
 *   - audit_trail (immutable PostgreSQL/immudb log of all DB changes)
 *
 * Based on CloudEvents spec for interoperability.
 */
export const EventHeaderSchema = z.object({
  /** Unique domain event identifier (UUID v4) */
  eventId: z.string().uuid(),
  /** ISO 8601 UTC timestamp — when the event occurred in the domain */
  occurredAt: z.string().datetime({ offset: true }),
  /** Semantic version of this event's schema, e.g. "1.0" */
  eventVersion: z.string().regex(/^\d+\.\d+$/),
  /** Service that produced the event, e.g. "cultivation-service" */
  producerService: z.string().min(1).max(100),
  /** Kafka topic this event was published to */
  topic: z.string().min(1),
  /** Distributed tracing correlation ID — spans the entire request chain */
  correlationId: z.string().uuid(),
  /** HTTP request ID that triggered this event (if applicable) */
  requestId: z.string().uuid().optional(),
  /** User who triggered the action that produced this event */
  triggeredBy: UserIdSchema,
  /**
   * SOP that governs the action which produced this event.
   * Required for regulated (isCritical=true) events.
   * Optional for informational events.
   */
  sop: SopReferenceSchema.optional(),
});
export type EventHeader = z.infer<typeof EventHeaderSchema>;
