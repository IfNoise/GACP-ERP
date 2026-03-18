import {
  type ChangeControl,
  type ChangeControlStatus,
  CHANGE_CONTROL_TRANSITIONS,
} from '@gacp-erp/shared-schemas';

export class InvalidChangeControlTransitionError extends Error {
  constructor(
    public readonly from: ChangeControlStatus,
    public readonly to: ChangeControlStatus,
  ) {
    super(`Invalid transition: ${from} → ${to}`);
    this.name = 'InvalidChangeControlTransitionError';
  }
}

/**
 * ChangeControlWorkflowEngine — enforces the Change Control state machine.
 *
 * Compliance: ICH Q10, EU GMP Annex 11
 * All transitions are logged via the transactional outbox → Kafka events.
 */
export class ChangeControlWorkflowEngine {
  /**
   * Validate and apply a status transition.
   * Returns a new ChangeControl with the updated status (immutable).
   * Throws InvalidChangeControlTransitionError if the transition is not allowed.
   */
  transition(cc: ChangeControl, to: ChangeControlStatus): ChangeControl {
    const allowed = CHANGE_CONTROL_TRANSITIONS[cc.status] ?? [];
    if (!allowed.includes(to)) {
      throw new InvalidChangeControlTransitionError(cc.status, to);
    }
    return { ...cc, status: to, updated_at: new Date().toISOString() };
  }

  isTransitionAllowed(from: ChangeControlStatus, to: ChangeControlStatus): boolean {
    return (CHANGE_CONTROL_TRANSITIONS[from] ?? []).includes(to);
  }
}
