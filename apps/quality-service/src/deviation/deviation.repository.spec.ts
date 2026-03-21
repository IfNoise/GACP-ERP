import { NotFoundException } from '@nestjs/common';
import { type DeviationRepository as DeviationRepositoryType } from './deviation.repository';

const { DeviationRepository } = require('./deviation.repository') as {
  DeviationRepository: new (...args: unknown[]) => DeviationRepositoryType;
};

function makeDbChains(rows: unknown[] = []) {
  const whereFn = jest.fn();
  const returningFn = jest.fn().mockResolvedValue(rows);
  const setFn = jest.fn();

  const selectChain = { from: jest.fn() };
  selectChain.from.mockReturnValue({
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
    execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '5' }] }),
  };

  return { db, returningFn, setFn };
}

const now = new Date();
const fakeRow = {
  id: 'dev-1',
  deviation_number: 'DEV-2026-0001',
  classification: 'MINOR',
  category: 'DOCUMENTATION',
  status: 'REPORTED',
  title: 'Deviation',
  description: 'Desc',
  location: null,
  batch_ids: [],
  occurred_at: null,
  reported_by: 'user-1',
  linked_capa_id: null,
  product_impact: null,
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

describe('DeviationRepository', () => {
  describe('findById', () => {
    it('should return mapped deviation when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new DeviationRepository(db as never);
      const result = await repo.findById('dev-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('dev-1');
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new DeviationRepository(db as never);
      expect(await repo.findById('x')).toBeNull();
    });

    it('should map optional fields when populated', async () => {
      const row = { ...fakeRow, location: 'Lab A', occurred_at: now, last_validated_at: now };
      const { db } = makeDbChains([row]);
      const repo = new DeviationRepository(db as never);

      const result = await repo.findById('dev-1');
      expect(result!.location).toBe('Lab A');
      expect(result!.occurred_at).toBe(now.toISOString());
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new DeviationRepository(db as never);
      await expect(repo.findByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new DeviationRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should apply all filters', async () => {
      const { db } = makeDbChains([]);
      const repo = new DeviationRepository(db as never);
      await repo.findMany(
        {
          status: 'REPORTED' as never,
          classification: 'CRITICAL' as never,
          reported_by: 'u',
          search: 'q',
        },
        { page: 1, limit: 10 },
      );
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert and return mapped deviation', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new DeviationRepository(db as never);

      const result = await repo.create(
        tx as never,
        {
          deviation_number: 'DEV-2026-0001',
          classification: 'MINOR',
          category: 'DOCUMENTATION',
          status: 'REPORTED',
          title: 'T',
          description: 'D',
          reported_by: 'user-1',
          created_by: 'user-1',
          updated_by: 'user-1',
        } as never,
      );

      expect(result.id).toBe('dev-1');
    });
  });

  describe('update', () => {
    it('should update and return mapped deviation', async () => {
      const returningFn = jest
        .fn()
        .mockResolvedValue([{ ...fakeRow, status: 'UNDER_INVESTIGATION' }]);
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ returning: returningFn }),
          }),
        }),
      };
      const { db } = makeDbChains();
      const repo = new DeviationRepository(db as never);

      const result = await repo.update(tx as never, 'dev-1', {
        status: 'UNDER_INVESTIGATION',
        updated_by: 'u',
      } as never);
      expect(result.status).toBe('UNDER_INVESTIGATION');
    });
  });

  describe('createInvestigation', () => {
    it('should insert and return investigation', async () => {
      const invRow = {
        id: 'inv-1',
        deviation_id: 'dev-1',
        investigator_id: 'user-1',
        investigation_summary: 'Summary',
        immediate_containment_actions: 'Actions',
        product_impact_assessment: 'None',
        batches_affected: ['batch-1'],
        investigated_at: now,
        electronic_signature: null,
      };
      const returningFn = jest.fn().mockResolvedValue([invRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new DeviationRepository(db as never);

      const result = await repo.createInvestigation(tx as never, {
        deviation_id: 'dev-1',
        investigator_id: 'user-1' as never,
        investigation_summary: 'Summary',
        immediate_containment_actions: 'Actions',
        product_impact_assessment: 'None',
        batches_affected: ['batch-1'],
        electronic_signature: null as never,
      });

      expect(result.id).toBe('inv-1');
      expect(result.investigated_at).toBe(now.toISOString());
    });
  });

  describe('nextDeviationNumber', () => {
    it('should return formatted deviation number', async () => {
      const { db } = makeDbChains();
      const repo = new DeviationRepository(db as never);
      const result = await repo.nextDeviationNumber();
      expect(result).toMatch(/^DEV-\d{4}-0005$/);
    });
  });
});
