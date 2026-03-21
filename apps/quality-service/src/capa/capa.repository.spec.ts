import { NotFoundException } from '@nestjs/common';
import { type CapaRepository as CapaRepositoryType } from './capa.repository';

const { CapaRepository } = require('./capa.repository') as {
  CapaRepository: new (...args: unknown[]) => CapaRepositoryType;
};

function makeDbChains(rows: unknown[] = []) {
  const whereFn = jest.fn();
  const limitFn = jest.fn();
  const offsetFn = jest.fn();
  const returningFn = jest.fn();
  const setFn = jest.fn();

  const selectChain = { from: jest.fn() };
  selectChain.from.mockReturnValue({
    where: whereFn.mockReturnValue({
      limit: limitFn.mockResolvedValue(rows),
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          offset: offsetFn.mockResolvedValue(rows),
        }),
      }),
    }),
    orderBy: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        offset: offsetFn.mockResolvedValue(rows),
      }),
    }),
  });

  const insertChain = {
    values: jest.fn().mockReturnValue({
      returning: returningFn.mockResolvedValue(rows),
    }),
  };

  const updateChain = {
    set: setFn.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: returningFn.mockResolvedValue(rows),
      }),
    }),
  };

  const db = {
    select: jest.fn().mockReturnValue(selectChain),
    insert: jest.fn().mockReturnValue(insertChain),
    update: jest.fn().mockReturnValue(updateChain),
    execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '42' }] }),
  };

  return { db, returningFn, setFn };
}

const now = new Date();
const fakeRow = {
  id: 'capa-1',
  capa_number: 'CA-2026-0001',
  type: 'CORRECTIVE',
  source: 'DEVIATION',
  status: 'OPEN',
  title: 'Test CAPA',
  description: 'Description',
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
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

describe('CapaRepository', () => {
  describe('findById', () => {
    it('should return mapped CAPA when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new CapaRepository(db as never);

      const result = await repo.findById('capa-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('capa-1');
      expect(result!.created_at).toBe(now.toISOString());
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new CapaRepository(db as never);

      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should return CAPA when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new CapaRepository(db as never);

      const result = await repo.findByIdOrThrow('capa-1');
      expect(result.id).toBe('capa-1');
    });

    it('should throw NotFoundException when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new CapaRepository(db as never);

      await expect(repo.findByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new CapaRepository(db as never);

      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
    });

    it('should apply filters', async () => {
      const { db } = makeDbChains([]);
      const repo = new CapaRepository(db as never);

      await repo.findMany(
        { status: 'OPEN' as never, type: 'CORRECTIVE', assigned_to: 'user-1', search: 'test' },
        { page: 1, limit: 10 },
      );
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert and return mapped CAPA', async () => {
      const { db, returningFn } = makeDbChains([fakeRow]);
      const repo = new CapaRepository(db as never);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };

      const data = {
        capa_number: 'CA-2026-0001',
        type: 'CORRECTIVE',
        source: 'DEVIATION',
        status: 'OPEN',
        title: 'Test',
        description: 'Desc',
        created_by: 'user-1',
        updated_by: 'user-1',
      };

      const result = await repo.create(tx as never, data as never);
      expect(result.id).toBe('capa-1');
    });
  });

  describe('update', () => {
    it('should update and return mapped CAPA', async () => {
      const { db, returningFn } = makeDbChains([{ ...fakeRow, status: 'RCA_IN_PROGRESS' }]);
      const repo = new CapaRepository(db as never);
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ returning: returningFn }),
          }),
        }),
      };

      const result = await repo.update(tx as never, 'capa-1', {
        status: 'RCA_IN_PROGRESS',
        updated_by: 'user-1',
      } as never);
      expect(result.status).toBe('RCA_IN_PROGRESS');
    });
  });

  describe('createRcaFinding', () => {
    it('should insert and return RCA finding', async () => {
      const rcaRow = {
        id: 'rca-1',
        capa_id: 'capa-1',
        root_cause_category: 'HUMAN_ERROR',
        root_cause_description: 'desc',
        contributing_factors: ['factor'],
        immediate_actions_taken: 'action',
        investigated_by: 'user-1',
        investigated_at: now,
      };
      const returningFn = jest.fn().mockResolvedValue([rcaRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new CapaRepository(db as never);

      const result = await repo.createRcaFinding(tx as never, {
        capa_id: 'capa-1',
        root_cause_category: 'HUMAN_ERROR',
        root_cause_description: 'desc',
        contributing_factors: ['factor'],
        immediate_actions_taken: 'action',
        investigated_by: 'user-1' as never,
      });

      expect(result.id).toBe('rca-1');
      expect(result.investigated_at).toBe(now.toISOString());
    });

    it('should handle null immediate_actions_taken', async () => {
      const rcaRow = {
        id: 'rca-1',
        capa_id: 'capa-1',
        root_cause_category: 'HUMAN_ERROR',
        root_cause_description: 'desc',
        contributing_factors: [],
        immediate_actions_taken: null,
        investigated_by: 'user-1',
        investigated_at: now,
      };
      const returningFn = jest.fn().mockResolvedValue([rcaRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new CapaRepository(db as never);

      const result = await repo.createRcaFinding(tx as never, {
        capa_id: 'capa-1',
        root_cause_category: 'HUMAN_ERROR',
        root_cause_description: 'desc',
        contributing_factors: [],
        investigated_by: 'user-1' as never,
      });

      expect(result.immediate_actions_taken).toBeUndefined();
    });
  });

  describe('createActionPlans', () => {
    it('should insert action plans', async () => {
      const valuesFn = jest.fn().mockResolvedValue(undefined);
      const tx = { insert: jest.fn().mockReturnValue({ values: valuesFn }) };
      const { db } = makeDbChains();
      const repo = new CapaRepository(db as never);

      await repo.createActionPlans(tx as never, 'capa-1', [
        { description: 'do', responsible_person: 'user-1', target_date: '2026-01-01' },
      ]);

      expect(tx.insert).toHaveBeenCalled();
    });
  });

  describe('createEffectivenessCheck', () => {
    it('should insert and return effectiveness check', async () => {
      const checkRow = {
        id: 'ec-1',
        capa_id: 'capa-1',
        result: 'EFFECTIVE',
        evidence_description: 'evidence',
        check_date: '2026-01-01',
        checked_by: 'user-1',
        follow_up_capa_id: null,
        electronic_signature: null,
      };
      const returningFn = jest.fn().mockResolvedValue([checkRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new CapaRepository(db as never);

      const result = await repo.createEffectivenessCheck(tx as never, {
        capa_id: 'capa-1',
        result: 'EFFECTIVE',
        evidence_description: 'evidence',
        check_date: '2026-01-01',
        checked_by: 'user-1' as never,
        follow_up_capa_id: null,
        electronic_signature: null as never,
      });

      expect(result.id).toBe('ec-1');
    });
  });

  describe('nextCapaNumber', () => {
    it('should return formatted CAPA number', async () => {
      const { db } = makeDbChains();
      const repo = new CapaRepository(db as never);

      const result = await repo.nextCapaNumber();
      expect(result).toMatch(/^CA-\d{4}-0042$/);
    });
  });
});
