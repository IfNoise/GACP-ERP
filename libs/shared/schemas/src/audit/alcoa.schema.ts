import { z } from 'zod';
import { createHash } from 'crypto';

import { type AuditEvent, AuditEventSchema } from './audit-event.schema';

// ─── ALCOA+ VALIDATION RESULT ─────────────────────────────────────────────────
export const AlcoaViolationSchema = z.object({
  principle: z.enum([
    'Attributable',
    'Legible',
    'Contemporaneous',
    'Original',
    'Accurate',
    'Complete',
    'Consistent',
    'Enduring',
    'Available',
  ]),
  field: z.string().optional(),
  message: z.string(),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
});
export type AlcoaViolation = z.infer<typeof AlcoaViolationSchema>;

export const AlcoaValidationResultSchema = z.object({
  isValid: z.boolean(),
  violations: z.array(AlcoaViolationSchema),
  auditEventId: z.string().uuid(),
});
export type AlcoaValidationResult = z.infer<typeof AlcoaValidationResultSchema>;

// ─── MAX TIMESTAMP DELTA ─────────────────────────────────────────────────────
/** Maximum allowed delta between event_timestamp and server_received_at (seconds) */
const MAX_TIMESTAMP_DELTA_SECONDS = 120;

// ─── ALCOA+ VALIDATOR ─────────────────────────────────────────────────────────
/**
 * Validates an audit event against all ALCOA+ principles.
 * Returns all violations found (not fail-fast) so operators can see all issues.
 */
export function validateAlcoa(event: AuditEvent): AlcoaValidationResult {
  const violations: AlcoaViolation[] = [];

  // A — Attributable
  if (!event.user_id) {
    violations.push({
      principle: 'Attributable',
      field: 'user_id',
      message: 'user_id is required',
      severity: 'CRITICAL',
    });
  }
  if (!event.workstation_id) {
    violations.push({
      principle: 'Attributable',
      field: 'workstation_id',
      message: 'workstation_id is required',
      severity: 'MAJOR',
    });
  }
  if (!event.ip_address) {
    violations.push({
      principle: 'Attributable',
      field: 'ip_address',
      message: 'ip_address is required',
      severity: 'MAJOR',
    });
  }
  if (!event.session_id) {
    violations.push({
      principle: 'Attributable',
      field: 'session_id',
      message: 'session_id is required',
      severity: 'MAJOR',
    });
  }

  // L — Legible
  if (!event.description || event.description.trim().length === 0) {
    violations.push({
      principle: 'Legible',
      field: 'description',
      message: 'description must not be empty',
      severity: 'MAJOR',
    });
  }

  // C — Contemporaneous: timestamps must be within MAX_TIMESTAMP_DELTA_SECONDS
  const eventTs = new Date(event.event_timestamp).getTime();
  const serverTs = new Date(event.server_received_at).getTime();
  const deltaSec = Math.abs((serverTs - eventTs) / 1000);
  if (deltaSec > MAX_TIMESTAMP_DELTA_SECONDS) {
    violations.push({
      principle: 'Contemporaneous',
      field: 'event_timestamp',
      message: `event_timestamp is ${deltaSec.toFixed(0)}s from server_received_at (max ${MAX_TIMESTAMP_DELTA_SECONDS}s)`,
      severity: 'CRITICAL',
    });
  }

  // O — Original: must have state hashes for state-changing events
  const requiresStateHash = event.changed_fields !== null;
  if (requiresStateHash && event.after_state_hash === null) {
    violations.push({
      principle: 'Original',
      field: 'after_state_hash',
      message: 'after_state_hash required when changed_fields is present',
      severity: 'MAJOR',
    });
  }

  // A — Accurate: critical actions require electronic signature
  if (event.is_critical_action && event.electronic_signature_id === null) {
    violations.push({
      principle: 'Accurate',
      field: 'electronic_signature_id',
      message: 'Critical actions require an electronic signature',
      severity: 'CRITICAL',
    });
  }

  // + Complete
  const requiredFields: Array<keyof AuditEvent> = [
    'id',
    'user_id',
    'action',
    'entity_type',
    'entity_id',
    'event_timestamp',
    'domain',
    'retention_class',
  ];
  for (const field of requiredFields) {
    if (event[field] === null || event[field] === undefined) {
      violations.push({
        principle: 'Complete',
        field,
        message: `${field} is required (ALCOA+ Complete)`,
        severity: 'CRITICAL',
      });
    }
  }

  // + Enduring
  if (!event.retention_class) {
    violations.push({
      principle: 'Enduring',
      field: 'retention_class',
      message: 'retention_class is required',
      severity: 'MAJOR',
    });
  }

  return {
    isValid: violations.length === 0,
    violations,
    auditEventId: event.id,
  };
}

// ─── HASH HELPER ─────────────────────────────────────────────────────────────
/**
 * Compute SHA-256 hash of any object (deterministic JSON serialisation).
 * Used for before_state_hash / after_state_hash / signature content_hash.
 */
export function computeObjectHash(obj: unknown): string {
  const json = JSON.stringify(obj, Object.keys(obj as object).sort());
  return createHash('sha256').update(json, 'utf8').digest('hex');
}

// ─── VALIDATE RAW INPUT ──────────────────────────────────────────────────────
export function validateAuditEventInput(
  raw: unknown,
): { success: true; data: AuditEvent } | { success: false; error: z.ZodError } {
  return AuditEventSchema.safeParse(raw);
}
