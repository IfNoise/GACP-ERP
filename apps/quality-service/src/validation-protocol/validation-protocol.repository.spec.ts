import { NotFoundException } from '@nestjs/common';
import { type ValidationProtocolRepository as ValidationProtocolRepositoryType } from './validation-protocol.repository';

const { ValidationProtocolRepository } = require('./validation-protocol.repository') as {
  ValidationProtocolRepository: new (...args: unknown[]) => ValidationProtocolRepositoryType;
};

const now = new Date();

function makeDbChains(rows: unknown[] = [], testRows: unknown[] = []) {
  const whereFn = jest.fn();
  const returningFn = jest.fn().mockResolvedValue(rows);
  const setFn = jest.fn();

  let selectCallCount = 0;
  const selectChain = { from: jest.fn() };

  selectChain.from.mockImplementation(() => {
    selectCallCount++;
    if (selectCallCount <= 1) {
      return {
        where: whereFn.mockReturnValue({
          limit: jest.fn().mockResolvedValue(rows),
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue(rows),
            }),
          }),
        }),
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue(rows),
          }),
        }),
      };
    }
    // test steps query
    return {
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(testRows),
      }),
    };
  });

  const insertChain = {
    values: jest.fn().mockReturnValue({ returning: returningFn }),
  };

  const updateChain = {
    set: setFn.mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: returningFn }),
    }),
  };

  const db = {
    select: jest.fn().mockReturnValue(selectChain),
    insert: jest.fn().mockReturnValue(insertChain),
    update: jest.fn().mockReturnValue(updateChain),
    execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '2' }] }),
  };

  return { db, returningFn, setFn };
}

const fakeRow = {
  id: 'vp-1',
  protocol_number: 'VAL-2026-0001',
  type: 'IQ',
  status: 'DRAFT',
  system_under_test: 'GACP-ERP',
  change_control_id: null,
  electronic_signature: null,
  validation_status: 'unvalidated',
  validation_protocol_id: null,
  last_validated_at: null,
  next_review_date: null,
  retention_class: 'PERMANENT',
  audit_tx_id: null,
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

const fakeTestRow = {
  id: 'test-1',
  protocol_id: 'vp-1',
  step_number: 1,
  description: 'Step 1',
  expected_result: 'Pass',
  actual_result: null,
  status: 'PENDING',
  exception_note: null,
  executed_by: null,
  executed_at: null,
  electronic_signature: null,
};

describe('ValidationProtocolRepository', () => {
  describe('findById', () => {
    it('should return mapped protocol with tests when found', async () => {
      const { db } = makeDbChains([fakeRow], [fakeTestRow]);
      const repo = new ValidationProtocolRepository(db as never);
      const result = await repo.findById('vp-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('vp-1');
      expect(result!.test_steps).toHaveLength(1);
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new ValidationProtocolRepository(db as never);
      expect(await repo.findById('x')).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new ValidationProtocolRepository(db as never);
      await expect(repo.findByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return paginated results with tests', async () => {
      const { db } = makeDbChains([fakeRow], [fakeTestRow]);
      const repo = new ValidationProtocolRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should apply all filters', async () => {
      const { db } = makeDbChains([], []);
      const repo = new ValidationProtocolRepository(db as never);
      await repo.findMany(
        { status: 'DRAFT' as never, type: 'IQ', change_control_id: 'cc-1' },
        { page: 1, limit: 10 },
      );
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert protocol and test steps', async () => {
      const returningFn = jest
        .fn()
        .mockResolvedValueOnce([fakeRow])
        .mockResolvedValueOnce([fakeTestRow]);
      const valuesFn = jest.fn().mockReturnValue({ returning: returningFn });
      const tx = {
        insert: jest.fn().mockReturnValue({ values: valuesFn }),
      };
      const { db } = makeDbChains();
      const repo = new ValidationProtocolRepository(db as never);

      const result = await repo.create(
        tx as never,
        {
          protocol_number: 'VAL-2026-0001',
          type: 'IQ',
          status: 'DRAFT',
          system_under_test: 'GACP-ERP',
          created_by: 'user-1',
          updated_by: 'user-1',
          test_steps: [{ step_number: 1, description: 'Step 1', expected_result: 'Pass' }],
        } as never,
      );

      expect(result.id).toBe('vp-1');
      expect(tx.insert).toHaveBeenCalledTimes(2);
    });

    it('should handle creation without test steps', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new ValidationProtocolRepository(db as never);

      const result = await repo.create(
        tx as never,
        {
          protocol_number: 'VAL-2026-0001',
          type: 'IQ',
          status: 'DRAFT',
          system_under_test: 'GACP-ERP',
          created_by: 'user-1',
          updated_by: 'user-1',
          test_steps: [],
        } as never,
      );

      expect(result.id).toBe('vp-1');
      expect(tx.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update protocol and return with tests', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeRow]);
      const selectFrom = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([fakeTestRow]),
        }),
      });
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ returning: returningFn }),
          }),
        }),
        select: jest.fn().mockReturnValue({ from: selectFrom }),
      };
      const { db } = makeDbChains();
      const repo = new ValidationProtocolRepository(db as never);

      const result = await repo.update(tx as never, 'vp-1', {
        status: 'IN_REVIEW',
        updated_by: 'u',
      } as never);
      expect(result.id).toBe('vp-1');
    });
  });

  describe('upsertTestStep', () => {
    it('should update test step', async () => {
      const setFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      const tx = {
        update: jest.fn().mockReturnValue({ set: setFn }),
      };
      const { db } = makeDbChains();
      const repo = new ValidationProtocolRepository(db as never);

      await repo.upsertTestStep(tx as never, 'vp-1', {
        step_number: 1,
        actual_result: 'Passed',
        status: 'PASS',
        executed_by: 'user-1' as never,
        executed_at: '2026-01-01T00:00:00.000Z',
        electronic_signature: null as never,
      });

      expect(tx.update).toHaveBeenCalled();
    });

    it('should handle exception_note', async () => {
      const setFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      const tx = {
        update: jest.fn().mockReturnValue({ set: setFn }),
      };
      const { db } = makeDbChains();
      const repo = new ValidationProtocolRepository(db as never);

      await repo.upsertTestStep(tx as never, 'vp-1', {
        step_number: 1,
        actual_result: 'Failed',
        status: 'FAIL',
        exception_note: 'Reason',
        executed_by: 'user-1' as never,
        executed_at: '2026-01-01T00:00:00.000Z',
        electronic_signature: null as never,
      });

      expect(setFn).toHaveBeenCalledWith(expect.objectContaining({ exception_note: 'Reason' }));
    });
  });

  describe('nextProtocolNumber', () => {
    it('should return formatted protocol number', async () => {
      const { db } = makeDbChains();
      const repo = new ValidationProtocolRepository(db as never);
      const result = await repo.nextProtocolNumber();
      expect(result).toMatch(/^VAL-\d{4}-0002$/);
    });
  });
});
