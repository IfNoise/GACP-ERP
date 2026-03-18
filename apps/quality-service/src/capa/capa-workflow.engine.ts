import { type CAPA, type CapaStatus, CAPA_TRANSITIONS } from '@gacp-erp/shared-schemas';

export class InvalidCapaTransitionError extends Error {
  constructor(
    public readonly from: CapaStatus,
    public readonly to: CapaStatus,
  ) {
    super(`Invalid CAPA transition: ${from} → ${to}`);
    this.name = 'InvalidCapaTransitionError';
  }
}

export class CapaWorkflowEngine {
  transition(capa: CAPA, to: CapaStatus): CAPA {
    const allowed = CAPA_TRANSITIONS[capa.status] ?? [];
    if (!allowed.includes(to)) {
      throw new InvalidCapaTransitionError(capa.status, to);
    }
    return { ...capa, status: to, updated_at: new Date().toISOString() };
  }
}
