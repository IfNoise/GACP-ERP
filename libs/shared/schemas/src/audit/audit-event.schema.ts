import { z } from 'zod';

import { UserIdSchema } from '../common/branded-ids';
import { SystemRoleEnum } from '../auth/auth.schema';

// ─── ALCOA+ RETENTION CLASSES ─────────────────────────────────────────────────
/**
 * Data retention classification per 21 CFR Part 11 and EU GMP Annex 11.
 * PERMANENT: electronic signatures, batch records, audit trail
 * 30_YEAR: quality critical data, regulatory submissions
 * 7_YEAR: operational data, logs
 */
export const RetentionClassEnum = z.enum(['PERMANENT', '30_YEAR', '7_YEAR', '1_YEAR']);
export type RetentionClass = z.infer<typeof RetentionClassEnum>;

// ─── AUDIT EVENT TYPE ─────────────────────────────────────────────────────────
export const AuditActionEnum = z.enum([
  // Plant/Batch operations
  'PLANT_CREATED',
  'PLANT_STAGE_CHANGED',
  'PLANT_DESTROYED',
  'BATCH_CREATED',
  'BATCH_STATUS_CHANGED',
  'HARVEST_RECORDED',
  'HARVEST_QC_RELEASED',
  // Auth events
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_LOGIN_FAILED',
  'USER_ACCOUNT_LOCKED',
  // Configuration changes
  'SYSTEM_CONFIG_CHANGED',
  'USER_ROLE_CHANGED',
  'USER_CREATED',
  'USER_DEACTIVATED',
  // Quality events
  'ELECTRONIC_SIGNATURE_CREATED',
  'DEVIATION_OPENED',
  'DEVIATION_CLOSED',
  'CAPA_CREATED',
  'CAPA_CLOSED',
  // Data integrity
  'DATA_EXPORT',
  'REPORT_GENERATED',
  'AUDIT_TRAIL_VIEWED',
]);
export type AuditAction = z.infer<typeof AuditActionEnum>;

// ─── ALCOA+ AUDIT EVENT ───────────────────────────────────────────────────────
/**
 * Structured audit event implementing ALCOA+ principles:
 *
 * A — Attributable:  who performed the action (user_id, workstation_id, ip_address)
 * L — Legible:       human-readable action description, structured data
 * C — Contemporaneous: event_timestamp captured at time of action (δ ≤ 120s)
 * O — Original:      source_hash (SHA-256 of original entity state)
 * A — Accurate:      complete, true representation; e-sig for critical actions
 * + Complete:        all ALCOA fields populated
 * + Consistent:      sequence_number monotonically increasing per entity
 * + Enduring:        retention_class ensures appropriate storage lifetime
 * + Available:       stored in ImmuDB (tamper-proof) + PostgreSQL (queryable)
 */
export const AuditEventSchema = z.object({
  // ── Identity ──────────────────────────────────────────────────────────────
  id: z.string().uuid(),
  /** Immutable ImmuDB transaction ID (set after write) */
  immudb_tx_id: z.string().nullable(),
  /** ImmuDB cryptographic proof (JSON) */
  immudb_proof: z.string().nullable(),

  // ── ALCOA: Attributable ───────────────────────────────────────────────────
  /** Who performed the action */
  user_id: UserIdSchema,
  /** User's role at time of action */
  user_role: SystemRoleEnum,
  /** Operator's full name at time of action */
  user_name: z.string().min(1).max(200),
  /** Workstation/device identifier */
  workstation_id: z.string().min(1).max(200),
  /** IP address of the operator */
  ip_address: z.string().ip(),
  /** Application session ID */
  session_id: z.string().uuid(),

  // ── ALCOA: Legible ────────────────────────────────────────────────────────
  /** What happened */
  action: AuditActionEnum,
  /** Human-readable description of the action */
  description: z.string().min(1).max(1000),
  /** Domain/module this event belongs to */
  domain: z.string().min(1).max(100),
  /** Entity type affected (e.g. Plant, Batch, User) */
  entity_type: z.string().min(1).max(100),
  /** Entity ID affected */
  entity_id: z.string().uuid(),

  // ── ALCOA: Contemporaneous ────────────────────────────────────────────────
  /** When the action occurred (must be within 120s of server_received_at) */
  event_timestamp: z.string().datetime({ offset: true }),
  /** When the server received the event */
  server_received_at: z.string().datetime({ offset: true }),

  // ── ALCOA: Original ───────────────────────────────────────────────────────
  /** SHA-256 hash of the entity state BEFORE the action */
  before_state_hash: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .nullable(),
  /** SHA-256 hash of the entity state AFTER the action */
  after_state_hash: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .nullable(),
  /** Structured diff of changed fields */
  changed_fields: z
    .record(
      z.object({
        before: z.unknown(),
        after: z.unknown(),
      }),
    )
    .nullable(),

  // ── ALCOA: Accurate ───────────────────────────────────────────────────────
  /** Whether this action is considered critical (requires e-signature) */
  is_critical_action: z.boolean(),
  /** Electronic signature (required when is_critical_action = true) */
  electronic_signature_id: z.string().uuid().nullable(),

  // ── ALCOA+: Consistent ────────────────────────────────────────────────────
  /** Monotonically increasing sequence number per entity */
  sequence_number: z.number().int().nonnegative(),

  // ── ALCOA+: Enduring ─────────────────────────────────────────────────────
  retention_class: RetentionClassEnum,

  // ── ALCOA+: Available ─────────────────────────────────────────────────────
  /** Whether ImmuDB write was verified */
  storage_verified: z.boolean().default(false),

  // ── Additional Context ────────────────────────────────────────────────────
  /** HTTP request ID (correlation) */
  request_id: z.string().uuid().optional(),
  /** Kafka message ID (for event sourcing) */
  kafka_message_id: z.string().uuid().optional(),
  /** Additional structured metadata */
  metadata: z.record(z.unknown()).optional(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ─── CREATE AUDIT EVENT DTO ──────────────────────────────────────────────────
export const CreateAuditEventSchema = AuditEventSchema.omit({
  id: true,
  immudb_tx_id: true,
  immudb_proof: true,
  sequence_number: true,
  storage_verified: true,
  server_received_at: true,
}).extend({
  server_received_at: z.string().datetime({ offset: true }).optional(),
});
export type CreateAuditEvent = z.infer<typeof CreateAuditEventSchema>;

// ─── AUDIT QUERY ─────────────────────────────────────────────────────────────
export const AuditQuerySchema = z.object({
  entity_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  user_id: UserIdSchema.optional(),
  action: AuditActionEnum.optional(),
  domain: z.string().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  is_critical_action: z.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AuditQuery = z.infer<typeof AuditQuerySchema>;
