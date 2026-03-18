import { ConflictException } from '@nestjs/common';
import {
  ValidationProtocolWorkflowEngine,
  InvalidValidationProtocolTransitionError,
} from './validation-protocol-workflow.engine';
import type { ValidationProtocolStatus } from '@gacp-erp/shared-schemas';

const assertAllowedTransitions = (
  engine: ValidationProtocolWorkflowEngine,
  from: ValidationProtocolStatus,
  allowed: ValidationProtocolStatus[],
  allStatuses: ValidationProtocolStatus[],
) => {
  for (const to of allowed) {
    expect(engine.isTransitionAllowed(from, to)).toBe(true);
  }
  for (const to of allStatuses) {
    if (!allowed.includes(to)) {
      expect(engine.isTransitionAllowed(from, to)).toBe(false);
    }
  }
};

const ALL_STATUSES: ValidationProtocolStatus[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'EXECUTING',
  'COMPLETED',
  'CLOSED',
  'SUPERSEDED',
];

describe('ValidationProtocolWorkflowEngine', () => {
  let engine: ValidationProtocolWorkflowEngine;

  beforeEach(() => {
    engine = new ValidationProtocolWorkflowEngine();
  });

  describe('isTransitionAllowed()', () => {
    it('DRAFT → REVIEW is allowed', () => {
      expect(engine.isTransitionAllowed('DRAFT', 'REVIEW')).toBe(true);
    });

    it('DRAFT → APPROVED is forbidden', () => {
      expect(engine.isTransitionAllowed('DRAFT', 'APPROVED')).toBe(false);
    });

    it('REVIEW → APPROVED is allowed', () => {
      expect(engine.isTransitionAllowed('REVIEW', 'APPROVED')).toBe(true);
    });

    it('REVIEW → DRAFT (return) is allowed', () => {
      expect(engine.isTransitionAllowed('REVIEW', 'DRAFT')).toBe(true);
    });

    it('APPROVED → EXECUTING is allowed', () => {
      expect(engine.isTransitionAllowed('APPROVED', 'EXECUTING')).toBe(true);
    });

    it('EXECUTING → COMPLETED is allowed', () => {
      expect(engine.isTransitionAllowed('EXECUTING', 'COMPLETED')).toBe(true);
    });

    it('COMPLETED → CLOSED is allowed', () => {
      expect(engine.isTransitionAllowed('COMPLETED', 'CLOSED')).toBe(true);
    });

    it('COMPLETED → SUPERSEDED is allowed', () => {
      expect(engine.isTransitionAllowed('COMPLETED', 'SUPERSEDED')).toBe(true);
    });

    it('CLOSED → SUPERSEDED is allowed', () => {
      expect(engine.isTransitionAllowed('CLOSED', 'SUPERSEDED')).toBe(true);
    });

    it('SUPERSEDED has no allowed outgoing transitions', () => {
      for (const to of ALL_STATUSES) {
        expect(engine.isTransitionAllowed('SUPERSEDED', to)).toBe(false);
      }
    });

    it('enforces complete transition map', () => {
      assertAllowedTransitions(engine, 'DRAFT', ['REVIEW'], ALL_STATUSES);
      assertAllowedTransitions(engine, 'REVIEW', ['APPROVED', 'DRAFT'], ALL_STATUSES);
      assertAllowedTransitions(engine, 'APPROVED', ['EXECUTING'], ALL_STATUSES);
      assertAllowedTransitions(engine, 'EXECUTING', ['COMPLETED'], ALL_STATUSES);
      assertAllowedTransitions(engine, 'COMPLETED', ['CLOSED', 'SUPERSEDED'], ALL_STATUSES);
      assertAllowedTransitions(engine, 'CLOSED', ['SUPERSEDED'], ALL_STATUSES);
    });
  });

  describe('assertTransition()', () => {
    it('should not throw when transition is valid', () => {
      expect(() => engine.assertTransition('DRAFT', 'REVIEW')).not.toThrow();
    });

    it('should throw ConflictException for invalid transition', () => {
      expect(() => engine.assertTransition('DRAFT', 'APPROVED')).toThrow(ConflictException);
    });

    it('should throw ConflictException for SUPERSEDED (terminal) → any', () => {
      expect(() => engine.assertTransition('SUPERSEDED', 'DRAFT')).toThrow(ConflictException);
    });

    it('InvalidValidationProtocolTransitionError message includes from/to', () => {
      const err = new InvalidValidationProtocolTransitionError('DRAFT', 'EXECUTING');
      expect(err.message).toContain('DRAFT');
      expect(err.message).toContain('EXECUTING');
      expect(err.name).toBe('InvalidValidationProtocolTransitionError');
    });
  });
});
