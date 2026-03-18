import { ConflictException } from '@nestjs/common';

import { type QualityEventStatus, QUALITY_EVENT_TRANSITIONS } from '@gacp-erp/shared-schemas';

// ─── CUSTOM ERROR ─────────────────────────────────────────────────────────────

export class InvalidQualityEventTransitionError extends Error {
  constructor(
    public readonly from: QualityEventStatus,
    public readonly to: QualityEventStatus,
  ) {
    super(
      `Invalid quality event transition: ${from} → ${to}. ` +
        `Allowed: [${(QUALITY_EVENT_TRANSITIONS[from] ?? []).join(', ')}]`,
    );
    this.name = 'InvalidQualityEventTransitionError';
  }
}

// ─── WORKFLOW ENGINE ──────────────────────────────────────────────────────────

/**
 * Pure state machine for Quality Event lifecycle transitions.
 *
 * Enforces ICH Q10 §3.1 quality event lifecycle:
 *   OPEN → INVESTIGATING → CAPA_INITIATED → CLOSED
 *   INVESTIGATING → CLOSED (no CAPA needed)
 *
 * Throws NestJS ConflictException (HTTP 409) for invalid transitions.
 */
export class QualityEventWorkflowEngine {
  /**
   * Check whether a transition is valid without throwing.
   */
  isTransitionAllowed(from: QualityEventStatus, to: QualityEventStatus): boolean {
    return (QUALITY_EVENT_TRANSITIONS[from] ?? []).includes(to);
  }

  /**
   * Assert that the transition from → to is valid.
   * Throws ConflictException (HTTP 409) if not.
   */
  assertTransition(from: QualityEventStatus, to: QualityEventStatus): void {
    if (!this.isTransitionAllowed(from, to)) {
      throw new ConflictException(new InvalidQualityEventTransitionError(from, to).message);
    }
  }
}
