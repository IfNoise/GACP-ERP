import { ConflictException } from '@nestjs/common';
import {
  QualityEventWorkflowEngine,
  InvalidQualityEventTransitionError,
} from './quality-event-workflow.engine';
import type { QualityEventStatus } from '@gacp-erp/shared-schemas';

const ALL_STATUSES: QualityEventStatus[] = ['OPEN', 'INVESTIGATING', 'CAPA_INITIATED', 'CLOSED'];

describe('QualityEventWorkflowEngine', () => {
  let engine: QualityEventWorkflowEngine;

  beforeEach(() => {
    engine = new QualityEventWorkflowEngine();
  });

  describe('isTransitionAllowed()', () => {
    it('OPEN → INVESTIGATING is allowed', () => {
      expect(engine.isTransitionAllowed('OPEN', 'INVESTIGATING')).toBe(true);
    });

    it('OPEN → CLOSED is forbidden', () => {
      expect(engine.isTransitionAllowed('OPEN', 'CLOSED')).toBe(false);
    });

    it('INVESTIGATING → CAPA_INITIATED is allowed', () => {
      expect(engine.isTransitionAllowed('INVESTIGATING', 'CAPA_INITIATED')).toBe(true);
    });

    it('INVESTIGATING → CLOSED is allowed (no CAPA path)', () => {
      expect(engine.isTransitionAllowed('INVESTIGATING', 'CLOSED')).toBe(true);
    });

    it('INVESTIGATING → OPEN is forbidden', () => {
      expect(engine.isTransitionAllowed('INVESTIGATING', 'OPEN')).toBe(false);
    });

    it('CAPA_INITIATED → CLOSED is allowed', () => {
      expect(engine.isTransitionAllowed('CAPA_INITIATED', 'CLOSED')).toBe(true);
    });

    it('CAPA_INITIATED → OPEN is forbidden', () => {
      expect(engine.isTransitionAllowed('CAPA_INITIATED', 'OPEN')).toBe(false);
    });

    it('CLOSED is terminal — no outgoing transitions', () => {
      for (const to of ALL_STATUSES) {
        expect(engine.isTransitionAllowed('CLOSED', to)).toBe(false);
      }
    });
  });

  describe('assertTransition()', () => {
    it('should not throw for valid OPEN → INVESTIGATING', () => {
      expect(() => engine.assertTransition('OPEN', 'INVESTIGATING')).not.toThrow();
    });

    it('should throw ConflictException for forbidden OPEN → CLOSED', () => {
      expect(() => engine.assertTransition('OPEN', 'CLOSED')).toThrow(ConflictException);
    });

    it('should throw ConflictException for terminal CLOSED → any', () => {
      expect(() => engine.assertTransition('CLOSED', 'OPEN')).toThrow(ConflictException);
    });

    it('InvalidQualityEventTransitionError carries from/to and correct name', () => {
      const err = new InvalidQualityEventTransitionError('OPEN', 'CLOSED');
      expect(err.from).toBe('OPEN');
      expect(err.to).toBe('CLOSED');
      expect(err.name).toBe('InvalidQualityEventTransitionError');
      expect(err.message).toContain('OPEN');
      expect(err.message).toContain('CLOSED');
    });
  });
});
