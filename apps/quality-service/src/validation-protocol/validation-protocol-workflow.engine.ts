import { ConflictException } from '@nestjs/common';

import {
  type ValidationProtocolStatus,
  VALIDATION_PROTOCOL_TRANSITIONS,
} from '@gacp-erp/shared-schemas';

// ─── CUSTOM ERROR ─────────────────────────────────────────────────────────────

export class InvalidValidationProtocolTransitionError extends Error {
  constructor(
    public readonly from: ValidationProtocolStatus,
    public readonly to: ValidationProtocolStatus,
  ) {
    super(
      `Invalid validation protocol transition: ${from} → ${to}. ` +
        `Allowed: [${(VALIDATION_PROTOCOL_TRANSITIONS[from] ?? []).join(', ')}]`,
    );
    this.name = 'InvalidValidationProtocolTransitionError';
  }
}

// ─── WORKFLOW ENGINE ──────────────────────────────────────────────────────────

/**
 * Pure state machine for Validation Protocol lifecycle transitions.
 *
 * Enforces GAMP 5 §5.4 validation lifecycle:
 *   DRAFT → REVIEW → APPROVED → EXECUTING → COMPLETED → CLOSED
 *   REVIEW → DRAFT (returned for revision)
 *   COMPLETED | CLOSED → SUPERSEDED
 *
 * Throws a NestJS ConflictException (HTTP 409) for invalid transitions
 * so it integrates cleanly with NestJS exception filters.
 */
export class ValidationProtocolWorkflowEngine {
  /**
   * Check whether a transition is valid without throwing.
   */
  isTransitionAllowed(from: ValidationProtocolStatus, to: ValidationProtocolStatus): boolean {
    return (VALIDATION_PROTOCOL_TRANSITIONS[from] ?? []).includes(to);
  }

  /**
   * Assert that the transition from → to is valid.
   * Throws ConflictException (HTTP 409) if not.
   */
  assertTransition(from: ValidationProtocolStatus, to: ValidationProtocolStatus): void {
    if (!this.isTransitionAllowed(from, to)) {
      throw new ConflictException(new InvalidValidationProtocolTransitionError(from, to).message);
    }
  }
}
