import { z } from 'zod';

import {
  UserIdSchema,
  SystemRoleEnum,
  AuditActionEnum,
  RetentionClassEnum,
  SignatureTypeSchema,
  AuthenticationMethodSchema,
} from '@gacp-erp/shared-schemas';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPIC ──────────────────────────────────────────────────────────────
export const AUDIT_TOPIC = 'audit.trail.v1' as const;

// ─── AUDIT TRAIL ENTRY ────────────────────────────────────────────────────────
/**
 * Kafka event published on every auditable action.
 * The Go audit-consumer picks this up and writes to ImmuDB.
 * After ImmuDB write, the consumer updates the PostgreSQL audit_events table
 * with the immudb_tx_id for queryable audit trail access.
 */
export const AuditTrailEntryEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('AUDIT_TRAIL_ENTRY'),
  topic: z.literal(AUDIT_TOPIC),
  payload: z.object({
    /** Audit event record ID (PostgreSQL UUID) */
    auditEventId: z.string().uuid(),

    // ── ALCOA: Attributable ──────────────────────────────────────────────────
    userId: UserIdSchema,
    userRole: SystemRoleEnum,
    userName: z.string(),
    workstationId: z.string(),
    ipAddress: z.string().ip(),
    sessionId: z.string().uuid(),

    // ── Action ───────────────────────────────────────────────────────────────
    action: AuditActionEnum,
    description: z.string(),
    domain: z.string(),
    entityType: z.string(),
    entityId: z.string().uuid(),

    // ── Timestamps ───────────────────────────────────────────────────────────
    eventTimestamp: z.string().datetime({ offset: true }),
    serverReceivedAt: z.string().datetime({ offset: true }),

    // ── State ────────────────────────────────────────────────────────────────
    beforeStateHash: z.string().nullable(),
    afterStateHash: z.string().nullable(),
    changedFields: z
      .record(
        z.object({
          before: z.unknown(),
          after: z.unknown(),
        }),
      )
      .nullable(),

    // ── Compliance ───────────────────────────────────────────────────────────
    isCriticalAction: z.boolean(),
    electronicSignatureId: z.string().uuid().nullable(),
    retentionClass: RetentionClassEnum,

    // ── Sequence ─────────────────────────────────────────────────────────────
    sequenceNumber: z.number().int().nonnegative(),
  }),
});
export type AuditTrailEntryEvent = z.infer<typeof AuditTrailEntryEventSchema>;

// ─── SIGNATURE RECORDED ───────────────────────────────────────────────────────
/**
 * Published when an electronic signature is captured.
 * Critical for 21 CFR Part 11 §11.50 compliance.
 */
export const SignatureRecordedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('SIGNATURE_RECORDED'),
  topic: z.literal(AUDIT_TOPIC),
  payload: z.object({
    signatureId: z.string().uuid(),
    signedBy: UserIdSchema,
    signerName: z.string(),
    signerRole: SystemRoleEnum,
    signatureType: SignatureTypeSchema,
    authenticationMethod: AuthenticationMethodSchema,
    /** SHA-256 of the signed content */
    contentHash: z.string().regex(/^[0-9a-f]{64}$/),
    /** RSA-SHA256 digital signature (hex) */
    digitalSignature: z.string(),
    ipAddress: z.string().ip(),
    workstationId: z.string(),
    signedAt: z.string().datetime({ offset: true }),
    /** What entity this signature is attached to */
    entityType: z.string(),
    entityId: z.string().uuid(),
    signatureMeaning: z.string(),
  }),
});
export type SignatureRecordedEvent = z.infer<typeof SignatureRecordedEventSchema>;

// ─── AUDIT DISCRIMINATED UNION ────────────────────────────────────────────────
export const AuditEventKafkaSchema = z.discriminatedUnion('eventType', [
  AuditTrailEntryEventSchema,
  SignatureRecordedEventSchema,
]);
export type AuditEventKafka = z.infer<typeof AuditEventKafkaSchema>;
