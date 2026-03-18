import { CapaWorkflowEngine, InvalidCapaTransitionError } from './capa-workflow.engine';
import type { CAPA } from '@gacp-erp/shared-schemas';

const makeCapa = (status: CAPA['status']): CAPA =>
  ({
    id: '00000000-0000-0000-0000-000000000001',
    capa_number: 'CA-2026-0001',
    type: 'CORRECTIVE',
    source: 'DEVIATION',
    status,
    title: 'Test CAPA',
    description: 'Test description',
    root_cause_category: null,
    source_record_type: null,
    source_record_id: null,
    due_date: null,
    assigned_to: null,
    electronic_signature: null,
    validation_status: 'unvalidated',
    validation_protocol_id: null,
    last_validated_at: null,
    next_review_date: null,
    retention_class: '7_YEAR',
    audit_tx_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    created_by: '00000000-0000-0000-0000-000000000099' as CAPA['created_by'],
    updated_by: '00000000-0000-0000-0000-000000000099' as CAPA['updated_by'],
  }) as CAPA;

describe('CapaWorkflowEngine', () => {
  let engine: CapaWorkflowEngine;

  beforeEach(() => {
    engine = new CapaWorkflowEngine();
  });

  describe('transition()', () => {
    it('should allow OPEN → RCA_IN_PROGRESS', () => {
      expect(engine.transition(makeCapa('OPEN'), 'RCA_IN_PROGRESS').status).toBe('RCA_IN_PROGRESS');
    });

    it('should allow RCA_IN_PROGRESS → ACTION_PLAN', () => {
      expect(engine.transition(makeCapa('RCA_IN_PROGRESS'), 'ACTION_PLAN').status).toBe(
        'ACTION_PLAN',
      );
    });

    it('should allow ACTION_PLAN → IMPLEMENTING', () => {
      expect(engine.transition(makeCapa('ACTION_PLAN'), 'IMPLEMENTING').status).toBe(
        'IMPLEMENTING',
      );
    });

    it('should allow IMPLEMENTING → EFFECTIVENESS_CHECK', () => {
      expect(engine.transition(makeCapa('IMPLEMENTING'), 'EFFECTIVENESS_CHECK').status).toBe(
        'EFFECTIVENESS_CHECK',
      );
    });

    it('should allow EFFECTIVENESS_CHECK → CLOSED', () => {
      expect(engine.transition(makeCapa('EFFECTIVENESS_CHECK'), 'CLOSED').status).toBe('CLOSED');
    });

    it('should return new immutable object', () => {
      const capa = makeCapa('OPEN');
      const result = engine.transition(capa, 'RCA_IN_PROGRESS');
      expect(result).not.toBe(capa);
      expect(capa.status).toBe('OPEN');
    });

    it('should throw InvalidCapaTransitionError for OPEN → CLOSED (skip steps)', () => {
      expect(() => engine.transition(makeCapa('OPEN'), 'CLOSED')).toThrow(
        InvalidCapaTransitionError,
      );
    });

    it('should throw for CLOSED → any (terminal state)', () => {
      expect(() => engine.transition(makeCapa('CLOSED'), 'OPEN')).toThrow(
        InvalidCapaTransitionError,
      );
    });

    it('should throw for backward transition ACTION_PLAN → OPEN', () => {
      expect(() => engine.transition(makeCapa('ACTION_PLAN'), 'OPEN')).toThrow(
        InvalidCapaTransitionError,
      );
    });

    it('should set error name correctly', () => {
      try {
        engine.transition(makeCapa('CLOSED'), 'OPEN');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidCapaTransitionError);
        expect((e as InvalidCapaTransitionError).name).toBe('InvalidCapaTransitionError');
        expect((e as InvalidCapaTransitionError).from).toBe('CLOSED');
        expect((e as InvalidCapaTransitionError).to).toBe('OPEN');
      }
    });
  });
});
