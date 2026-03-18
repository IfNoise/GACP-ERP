import { BadRequestException } from '@nestjs/common';
import { ProcurementWorkflowEngine } from './procurement-workflow.engine';
import type { PurchaseOrderStatus } from '@gacp-erp/shared-schemas';

describe('ProcurementWorkflowEngine', () => {
  let engine: ProcurementWorkflowEngine;

  beforeEach(() => {
    engine = new ProcurementWorkflowEngine();
  });

  describe('validateTransition()', () => {
    it('should allow DRAFT → SUBMITTED', () => {
      expect(() => engine.validateTransition('DRAFT', 'SUBMITTED')).not.toThrow();
    });

    it('should allow DRAFT → CANCELLED', () => {
      expect(() => engine.validateTransition('DRAFT', 'CANCELLED')).not.toThrow();
    });

    it('should allow SUBMITTED → ACKNOWLEDGED', () => {
      expect(() => engine.validateTransition('SUBMITTED', 'ACKNOWLEDGED')).not.toThrow();
    });

    it('should allow ACKNOWLEDGED → RECEIVING', () => {
      expect(() => engine.validateTransition('ACKNOWLEDGED', 'RECEIVING')).not.toThrow();
    });

    it('should allow RECEIVING → CLOSED', () => {
      expect(() => engine.validateTransition('RECEIVING', 'CLOSED')).not.toThrow();
    });

    it('should throw BadRequestException for DRAFT → CLOSED (skip steps)', () => {
      expect(() => engine.validateTransition('DRAFT', 'CLOSED')).toThrow(BadRequestException);
    });

    it('should throw for CLOSED → any (terminal state)', () => {
      expect(() => engine.validateTransition('CLOSED', 'DRAFT')).toThrow(BadRequestException);
      expect(() => engine.validateTransition('CLOSED', 'SUBMITTED')).toThrow(BadRequestException);
    });

    it('should throw for SUBMITTED → DRAFT (backward transition)', () => {
      expect(() => engine.validateTransition('SUBMITTED', 'DRAFT')).toThrow(BadRequestException);
    });

    it('should throw for CANCELLED → any (terminal state)', () => {
      expect(() => engine.validateTransition('CANCELLED', 'DRAFT')).toThrow(BadRequestException);
    });

    it('should include helpful error message', () => {
      try {
        engine.validateTransition('DRAFT', 'CLOSED');
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        expect((e as BadRequestException).message).toMatch(/DRAFT.*CLOSED/);
      }
    });
  });

  describe('canTransition()', () => {
    it('should return true for valid transition', () => {
      expect(engine.canTransition('DRAFT', 'SUBMITTED')).toBe(true);
    });

    it('should return false for invalid transition', () => {
      expect(engine.canTransition('DRAFT', 'CLOSED')).toBe(false);
    });

    it('should return false for self-transition', () => {
      expect(engine.canTransition('DRAFT', 'DRAFT')).toBe(false);
    });
  });

  describe('nextStatuses()', () => {
    it('should return [SUBMITTED, CANCELLED] for DRAFT', () => {
      expect(engine.nextStatuses('DRAFT')).toEqual(
        expect.arrayContaining(['SUBMITTED', 'CANCELLED'] as PurchaseOrderStatus[]),
      );
    });

    it('should return [] for terminal states', () => {
      expect(engine.nextStatuses('CLOSED')).toEqual([]);
      expect(engine.nextStatuses('CANCELLED')).toEqual([]);
    });
  });
});
