import type { Database } from '@gacp-erp/shared-database';
import type { BatchesRepository as BatchesRepositoryType } from './batches.repository';

const { BatchesRepository } = require('./batches.repository') as {
  BatchesRepository: new (...args: unknown[]) => BatchesRepositoryType;
};

function makeDbChains(rows: Record<string, unknown>[] = []) {
  const limitFn = jest.fn().mockResolvedValue(rows);
  const orderByFn = jest.fn().mockResolvedValue(rows);
  const returningFn = jest.fn().mockResolvedValue(rows);
  const whereFn = jest.fn().mockReturnValue({
    limit: limitFn,
    orderBy: orderByFn,
    returning: returningFn,
  });

  const selectChain = {
    from: jest.fn().mockReturnValue({
      where: whereFn,
      orderBy: orderByFn,
    }),
  };

  const insertChain = {
    values: jest.fn().mockReturnValue({ returning: returningFn }),
  };

  const setFn = jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) });
  const updateChain = { set: setFn };

  const db = {
    select: jest.fn().mockReturnValue(selectChain),
    insert: jest.fn().mockReturnValue(insertChain),
    update: jest.fn().mockReturnValue(updateChain),
    transaction: jest.fn(),
  };

  return { db, whereFn, returningFn, setFn };
}

const fakeRow = {
  id: 'batch-1',
  batch_number: 'BATCH-001',
  parent_batch_id: null,
  strain_id: 'strain-1',
  status: 'ACTIVE',
  compliance_status: 'pending',
  facility_id: 'facility-1',
  planned_plant_count: 100,
  actual_plant_count: 0,
  notes: null,
  planned_start_date: new Date('2026-01-01'),
  actual_start_date: null,
  planned_harvest_date: new Date('2026-06-01'),
  actual_harvest_date: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  created_by: 'user-1',
  updated_by: 'user-1',
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
};

describe('BatchesRepository', () => {
  describe('findById', () => {
    it('should return batch when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BatchesRepository(db as unknown as Database);
      const result = await repo.findById('batch-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('batch-1');
      expect(result!.batch_number).toBe('BATCH-001');
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new BatchesRepository(db as unknown as Database);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });

    it('should map row with all optional fields populated', async () => {
      const fullRow = {
        ...fakeRow,
        notes: 'some notes',
        actual_start_date: new Date('2026-01-02'),
        actual_harvest_date: new Date('2026-06-02'),
      };
      const { db } = makeDbChains([fullRow]);
      const repo = new BatchesRepository(db as unknown as Database);
      const result = await repo.findById('batch-1');
      expect(result).toBeDefined();
      expect(result!.notes).toBe('some notes');
    });
  });

  describe('findByBatchNumber', () => {
    it('should return batch by number', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BatchesRepository(db as unknown as Database);
      const result = await repo.findByBatchNumber('BATCH-001');
      expect(result).toBeDefined();
    });

    it('should return null when number not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new BatchesRepository(db as unknown as Database);
      const result = await repo.findByBatchNumber('NONE');
      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return all batches when no facilityId', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BatchesRepository(db as unknown as Database);
      const result = await repo.findMany();
      expect(result).toHaveLength(1);
    });

    it('should filter by facilityId when provided', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BatchesRepository(db as unknown as Database);
      const result = await repo.findMany('facility-1');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no results', async () => {
      const { db } = makeDbChains([]);
      const repo = new BatchesRepository(db as unknown as Database);
      const result = await repo.findMany();
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should insert and return mapped batch', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BatchesRepository(db as unknown as Database);
      const dto = {
        batch_number: 'BATCH-002',
        strain_id: 'strain-1',
        facility_id: 'facility-1',
        planned_plant_count: 50,
      } as never;
      const result = await repo.create(dto, 'user-1');
      expect(result).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
    });

    it('should throw if insert returns no rows', async () => {
      const { db } = makeDbChains([]);
      const repo = new BatchesRepository(db as unknown as Database);
      const dto = {
        batch_number: 'B',
        strain_id: 's',
        facility_id: 'f',
        planned_plant_count: 1,
      } as never;
      await expect(repo.create(dto, 'user-1')).rejects.toThrow('Batch insert returned no rows');
    });

    it('should handle optional date fields and parent_batch_id', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BatchesRepository(db as unknown as Database);
      const dto = {
        batch_number: 'BATCH-003',
        strain_id: 'strain-1',
        facility_id: 'facility-1',
        planned_plant_count: 10,
        compliance_status: 'approved',
        parent_batch_id: 'parent-1',
        planned_start_date: '2026-01-01',
        planned_harvest_date: '2026-06-01',
      } as never;
      const result = await repo.create(dto, 'user-1');
      expect(result).toBeDefined();
    });
  });

  describe('updateFields', () => {
    it('should update batch fields', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new BatchesRepository(db as unknown as Database);
      await repo.updateFields('batch-1', { notes: 'updated' } as never, 'user-2');
      expect(db.update).toHaveBeenCalled();
      expect(setFn).toHaveBeenCalled();
    });

    it('should handle all optional update fields', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new BatchesRepository(db as unknown as Database);
      await repo.updateFields(
        'batch-1',
        {
          notes: 'updated',
          planned_harvest_date: '2026-07-01',
          status: 'HARVESTING',
        } as never,
        'user-2',
      );
      expect(setFn).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'updated',
          updated_by: 'user-2',
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status field', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new BatchesRepository(db as unknown as Database);
      await repo.updateStatus('batch-1', 'HARVESTING' as never, 'user-2');
      expect(db.update).toHaveBeenCalled();
      expect(setFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'HARVESTING', updated_by: 'user-2' }),
      );
    });
  });

  describe('updateStatusWithTx', () => {
    it('should update status using transaction context', async () => {
      const txSetFn = jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) });
      const tx = {
        update: jest.fn().mockReturnValue({ set: txSetFn }),
      };

      const { db } = makeDbChains();
      const repo = new BatchesRepository(db as unknown as Database);
      await repo.updateStatusWithTx(tx as never, 'batch-1', 'HARVESTING' as never, 'user-2');
      expect(tx.update).toHaveBeenCalled();
      expect(txSetFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'HARVESTING', updated_by: 'user-2' }),
      );
    });
  });
});
