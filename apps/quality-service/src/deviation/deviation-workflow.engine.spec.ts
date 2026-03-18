import {
  DeviationWorkflowEngine,
  InvalidDeviationTransitionError,
} from './deviation-workflow.engine';
import type { Deviation } from '@gacp-erp/shared-schemas';

const makeDeviation = (status: Deviation['status']): Deviation =>
  ({
    id: '00000000-0000-0000-0000-000000000001',
    deviation_number: 'DEV-2026-0001',
    classification: 'MINOR',
    category: 'PROCESS',
    status,
    title: 'Test Deviation',
    description: 'Test description',
    location: null,
    batch_ids: [],
    occurred_at: null,
    reported_by: '00000000-0000-0000-0000-000000000099' as Deviation['reported_by'],
    linked_capa_id: null,
    product_impact: null,
    electronic_signature: null,
    validation_status: 'unvalidated',
    validation_protocol_id: null,
    last_validated_at: null,
    next_review_date: null,
    retention_class: '7_YEAR',
    audit_tx_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    created_by: '00000000-0000-0000-0000-000000000099' as Deviation['created_by'],
    updated_by: '00000000-0000-0000-0000-000000000099' as Deviation['updated_by'],
  }) as Deviation;

describe('DeviationWorkflowEngine', () => {
  let engine: DeviationWorkflowEngine;

  beforeEach(() => {
    engine = new DeviationWorkflowEngine();
  });

  describe('transition()', () => {
    it('should allow REPORTED → UNDER_INVESTIGATION', () => {
      expect(engine.transition(makeDeviation('REPORTED'), 'UNDER_INVESTIGATION').status).toBe(
        'UNDER_INVESTIGATION',
      );
    });

    it('should allow UNDER_INVESTIGATION → IMPACT_ASSESSED', () => {
      expect(
        engine.transition(makeDeviation('UNDER_INVESTIGATION'), 'IMPACT_ASSESSED').status,
      ).toBe('IMPACT_ASSESSED');
    });

    it('should allow IMPACT_ASSESSED → CAPA_INITIATED', () => {
      expect(engine.transition(makeDeviation('IMPACT_ASSESSED'), 'CAPA_INITIATED').status).toBe(
        'CAPA_INITIATED',
      );
    });

    it('should allow IMPACT_ASSESSED → CLOSED (minor with no CAPA required)', () => {
      expect(engine.transition(makeDeviation('IMPACT_ASSESSED'), 'CLOSED').status).toBe('CLOSED');
    });

    it('should allow CAPA_INITIATED → CLOSED', () => {
      expect(engine.transition(makeDeviation('CAPA_INITIATED'), 'CLOSED').status).toBe('CLOSED');
    });

    it('should return new immutable object', () => {
      const dev = makeDeviation('REPORTED');
      const result = engine.transition(dev, 'UNDER_INVESTIGATION');
      expect(result).not.toBe(dev);
      expect(dev.status).toBe('REPORTED');
    });

    it('should throw for REPORTED → CLOSED (skip steps)', () => {
      expect(() => engine.transition(makeDeviation('REPORTED'), 'CLOSED')).toThrow(
        InvalidDeviationTransitionError,
      );
    });

    it('should throw for CLOSED → any (terminal state)', () => {
      expect(() => engine.transition(makeDeviation('CLOSED'), 'REPORTED')).toThrow(
        InvalidDeviationTransitionError,
      );
    });

    it('should set error name and properties correctly', () => {
      try {
        engine.transition(makeDeviation('CLOSED'), 'REPORTED');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidDeviationTransitionError);
        expect((e as InvalidDeviationTransitionError).name).toBe('InvalidDeviationTransitionError');
        expect((e as InvalidDeviationTransitionError).from).toBe('CLOSED');
        expect((e as InvalidDeviationTransitionError).to).toBe('REPORTED');
      }
    });
  });
});
