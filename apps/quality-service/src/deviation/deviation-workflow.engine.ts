import {
  type Deviation,
  type DeviationStatus,
  DEVIATION_TRANSITIONS,
} from '@gacp-erp/shared-schemas';

export class InvalidDeviationTransitionError extends Error {
  constructor(
    public readonly from: DeviationStatus,
    public readonly to: DeviationStatus,
  ) {
    super(`Invalid Deviation transition: ${from} → ${to}`);
    this.name = 'InvalidDeviationTransitionError';
  }
}

export class DeviationWorkflowEngine {
  transition(deviation: Deviation, to: DeviationStatus): Deviation {
    const allowed = DEVIATION_TRANSITIONS[deviation.status] ?? [];
    if (!allowed.includes(to)) {
      throw new InvalidDeviationTransitionError(deviation.status, to);
    }
    return { ...deviation, status: to, updated_at: new Date().toISOString() };
  }
}
