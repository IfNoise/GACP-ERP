import { NotFoundException } from '@nestjs/common';
import { type QualityEventRepository as QualityEventRepositoryType } from './quality-event.repository';

const { QualityEventRepository } = require('./quality-event.repository') as {
  QualityEventRepository: new (...args: unknown[]) => QualityEventRepositoryType;
};

const now = new Date();

function makeDbChains(rows: unknown[] = [], linkRows: unknown[] = []) {
  const whereFn = jest.fn();
  const returningFn = jest.fn().mockResolvedValue(rows);
  const setFn = jest.fn();

  let selectCallCount = 0;
  const selectChain = { from: jest.fn() };

  // findById: first select returns rows, second select returns links
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
    // linked records query
    return {
      where: jest.fn().mockResolvedValue(linkRows),
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
    execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '3' }] }),
  };

  return { db, returningFn, setFn };
}

const fakeRow = {
  id: 'qe-1',
  event_number: 'QE-2026-0001',
  type: 'COMPLAINT',
  severity: 'HIGH',
  status: 'OPEN',
  title: 'Event',
  description: 'Desc',
  capa_id: null,
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

const fakeLinkRow = {
  id: 'link-1',
  quality_event_id: 'qe-1',
  record_type: 'DEVIATION',
  record_id: 'dev-1',
  linked_by: 'user-1',
  linked_at: now,
};

describe('QualityEventRepository', () => {
  describe('findById', () => {
    it('should return mapped event with links when found', async () => {
      const { db } = makeDbChains([fakeRow], [fakeLinkRow]);
      const repo = new QualityEventRepository(db as never);
      const result = await repo.findById('qe-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('qe-1');
      expect(result!.linked_records).toHaveLength(1);
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new QualityEventRepository(db as never);
      expect(await repo.findById('x')).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new QualityEventRepository(db as never);
      await expect(repo.findByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return paginated results with links', async () => {
      const { db } = makeDbChains([fakeRow], []);
      const repo = new QualityEventRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should apply filters', async () => {
      const { db } = makeDbChains([], []);
      const repo = new QualityEventRepository(db as never);
      await repo.findMany(
        { status: 'OPEN' as never, type: 'COMPLAINT', severity: 'HIGH' },
        { page: 1, limit: 10 },
      );
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert and return mapped event with empty links', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new QualityEventRepository(db as never);

      const result = await repo.create(
        tx as never,
        {
          event_number: 'QE-2026-0001',
          type: 'COMPLAINT',
          severity: 'HIGH',
          status: 'OPEN',
          title: 'T',
          description: 'D',
          created_by: 'user-1',
          updated_by: 'user-1',
        } as never,
      );

      expect(result.id).toBe('qe-1');
      expect(result.linked_records).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update event and return with links', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeRow]);
      const selectLinksWhere = jest.fn().mockResolvedValue([]);
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({ returning: returningFn }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: selectLinksWhere,
          }),
        }),
      };
      const { db } = makeDbChains();
      const repo = new QualityEventRepository(db as never);

      const result = await repo.update(tx as never, 'qe-1', {
        status: 'INVESTIGATING',
        updated_by: 'u',
      } as never);
      expect(result.id).toBe('qe-1');
    });
  });

  describe('addLinkedRecord', () => {
    it('should insert and return linked record', async () => {
      const returningFn = jest.fn().mockResolvedValue([fakeLinkRow]);
      const tx = {
        insert: jest
          .fn()
          .mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningFn }) }),
      };
      const { db } = makeDbChains();
      const repo = new QualityEventRepository(db as never);

      const result = await repo.addLinkedRecord(
        tx as never,
        'qe-1',
        'DEVIATION' as never,
        'dev-1',
        'user-1' as never,
      );
      expect(result.id).toBe('link-1');
      expect(result.linked_at).toBe(now.toISOString());
    });
  });

  describe('nextEventNumber', () => {
    it('should return formatted event number', async () => {
      const { db } = makeDbChains();
      const repo = new QualityEventRepository(db as never);
      const result = await repo.nextEventNumber();
      expect(result).toMatch(/^QE-\d{4}-0003$/);
    });
  });
});
