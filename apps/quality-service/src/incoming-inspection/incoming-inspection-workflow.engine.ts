import type { IncomingInspection, IncomingInspectionStatus } from '@gacp-erp/shared-schemas';
import { INSPECTION_TRANSITIONS } from '@gacp-erp/shared-schemas';

export class InvalidInspectionTransitionError extends Error {
  constructor(
    public readonly from: IncomingInspectionStatus,
    public readonly to: IncomingInspectionStatus,
  ) {
    super(`Invalid inspection transition: ${from} → ${to}`);
    this.name = 'InvalidInspectionTransitionError';
  }
}

export class IncomingInspectionWorkflowEngine {
  transition(entity: IncomingInspection, toStatus: IncomingInspectionStatus): IncomingInspection {
    const allowed = INSPECTION_TRANSITIONS[entity.status];
    if (!allowed.includes(toStatus)) {
      throw new InvalidInspectionTransitionError(entity.status, toStatus);
    }
    return { ...entity, status: toStatus, updated_at: new Date().toISOString() };
  }

  /**
   * Validates whether all release criteria are met before transitioning QUARANTINE → RELEASED.
   * Per WHO GACP §5 / EU GMP Chapter 7 incoming material release requirements.
   */
  canRelease(entity: IncomingInspection): { canRelease: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (entity.visual_check_passed !== true) {
      reasons.push('Visual check has not passed');
    }
    if (entity.quantity_verified !== true) {
      reasons.push('Quantity has not been verified');
    }
    if (entity.dna_fingerprint_passed !== true) {
      reasons.push('DNA fingerprint test has not passed');
    }
    if (entity.cannabinoid_profile_passed !== true) {
      reasons.push('Cannabinoid profile test has not passed');
    }
    if (entity.pathogen_screening_passed !== true) {
      reasons.push('Pathogen screening has not passed');
    }
    if (entity.germination_rate === null || entity.germination_rate < 85) {
      reasons.push(`Germination rate (${entity.germination_rate ?? 'N/A'}%) is below minimum 85%`);
    }
    if (entity.quarantine_end_date) {
      const now = new Date();
      const endDate = new Date(entity.quarantine_end_date);
      if (now < endDate) {
        reasons.push(`Quarantine period has not elapsed (ends ${entity.quarantine_end_date})`);
      }
    } else {
      reasons.push('Quarantine end date is not set');
    }

    return { canRelease: reasons.length === 0, reasons };
  }
}
