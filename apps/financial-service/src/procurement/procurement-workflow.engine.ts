import { BadRequestException } from '@nestjs/common';
import type { PurchaseOrderStatus } from '@gacp-erp/shared-schemas';
import { PO_TRANSITIONS } from '@gacp-erp/shared-schemas';

/**
 * State machine engine for Purchase Order lifecycle.
 *
 * Uses the PO_TRANSITIONS map defined in shared-schemas to enforce
 * valid status transitions.
 */
export class ProcurementWorkflowEngine {
  /**
   * Validates that a status transition is allowed.
   * Throws BadRequestException if the transition is invalid.
   */
  validateTransition(current: PurchaseOrderStatus, next: PurchaseOrderStatus): void {
    const allowed = PO_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid PO transition: ${current} → ${next}. Allowed: [${allowed.join(', ') || 'none'}]`,
      );
    }
  }

  /**
   * Returns all valid next statuses from the current status.
   */
  nextStatuses(current: PurchaseOrderStatus): PurchaseOrderStatus[] {
    return PO_TRANSITIONS[current] ?? [];
  }

  /**
   * Returns true if the given transition is allowed.
   */
  canTransition(current: PurchaseOrderStatus, next: PurchaseOrderStatus): boolean {
    return (PO_TRANSITIONS[current] ?? []).includes(next);
  }
}
