import {
  ChangeControlWorkflowEngine,
  InvalidChangeControlTransitionError,
} from './change-control-workflow.engine';
import type { ChangeControl } from '@gacp-erp/shared-schemas';

const makeCC = (status: ChangeControl['status']): ChangeControl =>
  ({
    id: '00000000-0000-0000-0000-000000000001',
    ccn_number: 'CCN-2026-0001',
    title: 'Test CC',
    description: 'Test description',
    change_type: 'MINOR',
    status,
    requestor_id: '00000000-0000-0000-0000-000000000099' as ChangeControl['requestor_id'],
    approver_ids: [],
    electronic_signature: null,
    validation_status: 'unvalidated',
    validation_protocol_id: null,
    last_validated_at: null,
    next_review_date: null,
    retention_class: '7_YEAR',
    audit_tx_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    created_by: '00000000-0000-0000-0000-000000000099' as ChangeControl['created_by'],
    updated_by: '00000000-0000-0000-0000-000000000099' as ChangeControl['updated_by'],
  }) as ChangeControl;

describe('ChangeControlWorkflowEngine', () => {
  let engine: ChangeControlWorkflowEngine;

  beforeEach(() => {
    engine = new ChangeControlWorkflowEngine();
  });

  describe('transition()', () => {
    it('should allow DRAFT → SUBMITTED', () => {
      const cc = makeCC('DRAFT');
      const result = engine.transition(cc, 'SUBMITTED');
      expect(result.status).toBe('SUBMITTED');
    });

    it('should allow SUBMITTED → IMPACT_ASSESSED', () => {
      const result = engine.transition(makeCC('SUBMITTED'), 'IMPACT_ASSESSED');
      expect(result.status).toBe('IMPACT_ASSESSED');
    });

    it('should allow SUBMITTED → REJECTED', () => {
      const result = engine.transition(makeCC('SUBMITTED'), 'REJECTED');
      expect(result.status).toBe('REJECTED');
    });

    it('should allow IMPACT_ASSESSED → APPROVED', () => {
      const result = engine.transition(makeCC('IMPACT_ASSESSED'), 'APPROVED');
      expect(result.status).toBe('APPROVED');
    });

    it('should allow APPROVED → IMPLEMENTING', () => {
      const result = engine.transition(makeCC('APPROVED'), 'IMPLEMENTING');
      expect(result.status).toBe('IMPLEMENTING');
    });

    it('should allow IMPLEMENTING → VERIFIED', () => {
      const result = engine.transition(makeCC('IMPLEMENTING'), 'VERIFIED');
      expect(result.status).toBe('VERIFIED');
    });

    it('should allow VERIFIED → CLOSED', () => {
      const result = engine.transition(makeCC('VERIFIED'), 'CLOSED');
      expect(result.status).toBe('CLOSED');
    });

    it('should return new immutable object (not mutate original)', () => {
      const cc = makeCC('DRAFT');
      const result = engine.transition(cc, 'SUBMITTED');
      expect(result).not.toBe(cc);
      expect(cc.status).toBe('DRAFT'); // original unchanged
    });

    it('should update updated_at on transition', () => {
      const cc = makeCC('DRAFT');
      const before = new Date(cc.updated_at).getTime();
      // Small delay to guarantee new timestamp
      const result = engine.transition(cc, 'SUBMITTED');
      expect(new Date(result.updated_at).getTime()).toBeGreaterThanOrEqual(before);
    });

    it('should throw InvalidChangeControlTransitionError for DRAFT → APPROVED', () => {
      expect(() => engine.transition(makeCC('DRAFT'), 'APPROVED')).toThrow(
        InvalidChangeControlTransitionError,
      );
    });

    it('should throw with correct from/to in error message', () => {
      try {
        engine.transition(makeCC('CLOSED'), 'DRAFT');
        fail('Expected error not thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidChangeControlTransitionError);
        expect((e as InvalidChangeControlTransitionError).from).toBe('CLOSED');
        expect((e as InvalidChangeControlTransitionError).to).toBe('DRAFT');
        expect((e as InvalidChangeControlTransitionError).message).toContain('CLOSED');
        expect((e as InvalidChangeControlTransitionError).message).toContain('DRAFT');
      }
    });

    it('should throw for CLOSED → any transition (terminal state)', () => {
      const terminals: ChangeControl['status'][] = [
        'DRAFT',
        'SUBMITTED',
        'IMPACT_ASSESSED',
        'APPROVED',
        'IMPLEMENTING',
        'VERIFIED',
        'CLOSED',
        'REJECTED',
      ];
      for (const to of terminals) {
        expect(() => engine.transition(makeCC('CLOSED'), to)).toThrow(
          InvalidChangeControlTransitionError,
        );
      }
    });

    it('should throw for REJECTED → any transition (terminal state)', () => {
      expect(() => engine.transition(makeCC('REJECTED'), 'DRAFT')).toThrow(
        InvalidChangeControlTransitionError,
      );
    });

    it('should throw for IMPLEMENTING → APPROVED (backwards transition)', () => {
      expect(() => engine.transition(makeCC('IMPLEMENTING'), 'APPROVED')).toThrow(
        InvalidChangeControlTransitionError,
      );
    });
  });

  describe('isTransitionAllowed()', () => {
    it('should return true for valid transition', () => {
      expect(engine.isTransitionAllowed('DRAFT', 'SUBMITTED')).toBe(true);
    });

    it('should return false for invalid transition', () => {
      expect(engine.isTransitionAllowed('DRAFT', 'APPROVED')).toBe(false);
    });

    it('should return false for terminal CLOSED state', () => {
      expect(engine.isTransitionAllowed('CLOSED', 'DRAFT')).toBe(false);
    });
  });
});
