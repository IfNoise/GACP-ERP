import type { Database } from '@gacp-erp/shared-database';
import type { PlantsRepository as PlantsRepositoryType } from './plants.repository';

const { PlantsRepository } = require('./plants.repository') as {
  PlantsRepository: new (...args: unknown[]) => PlantsRepositoryType;
};

function makeDbChains(rows: Record<string, unknown>[] = []) {
  const returningFn = jest.fn().mockResolvedValue(rows);

  // limit returns a thenable that also has .offset()
  const limitFn = jest.fn().mockImplementation(() => {
    const promise = Promise.resolve(rows);
    return Object.assign(promise, {
      offset: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(rows),
      }),
    });
  });

  const orderByFn = jest.fn().mockResolvedValue(rows);
  const whereFn = jest.fn().mockImplementation(() => ({
    limit: limitFn,
    orderBy: orderByFn,
    returning: returningFn,
  }));

  const selectChain = {
    from: jest.fn().mockReturnValue({
      where: whereFn,
    }),
  };

  const insertChain = {
    values: jest.fn().mockReturnValue({ returning: returningFn }),
  };

  const setFn = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({ returning: returningFn }),
  });
  const updateChain = { set: setFn };

  const transactionFn = jest.fn(async (cb: (tx: unknown) => Promise<void>) => {
    await cb({
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
      }),
      insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) }),
    });
  });

  const db = {
    select: jest.fn().mockReturnValue(selectChain),
    insert: jest.fn().mockReturnValue(insertChain),
    update: jest.fn().mockReturnValue(updateChain),
    transaction: transactionFn,
  };

  return { db, whereFn, limitFn, returningFn, setFn, transactionFn };
}

const fakeRow = {
  id: 'plant-1',
  plant_code: 'PLT-001',
  batch_id: 'batch-1',
  strain_id: 'strain-1',
  current_stage: 'SEED',
  facility_id: 'facility-1',
  room_id: null,
  zone_id: null,
  current_health_score: null,
  last_stage_change_at: null,
  last_operation_at: null,
  notes: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  created_by: 'user-1',
  updated_by: 'user-1',
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
};

describe('PlantsRepository', () => {
  describe('findById', () => {
    it('should return plant when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.findById('plant-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('plant-1');
      expect(result!.plant_code).toBe('PLT-001');
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should return plant by code', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.findByCode('PLT-001');
      expect(result).toBeDefined();
      expect(result!.plant_code).toBe('PLT-001');
    });

    it('should return null when code not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.findByCode('NONE');
      expect(result).toBeNull();
    });
  });

  describe('findManyByBatch', () => {
    it('should return paginated results', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.findManyByBatch('batch-1', {
        page: 1,
        limit: 10,
        sortOrder: 'desc',
      });
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('create', () => {
    it('should insert and return mapped plant', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new PlantsRepository(db as unknown as Database);

      const dto = {
        plant_code: 'PLT-002',
        batch_id: 'batch-1',
        strain_id: 'strain-1',
        facility_id: 'facility-1',
      } as never;
      const result = await repo.create(dto, 'user-1');
      expect(result).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
    });

    it('should throw if insert returns no rows', async () => {
      const { db } = makeDbChains([]);
      const repo = new PlantsRepository(db as unknown as Database);
      const dto = {
        plant_code: 'PLT-002',
        batch_id: 'b',
        strain_id: 's',
        facility_id: 'f',
      } as never;
      await expect(repo.create(dto, 'user-1')).rejects.toThrow('Plant insert returned no rows');
    });
  });

  describe('createWithTx', () => {
    it('should use transaction context for insert', async () => {
      const valuesFn = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([fakeRow]),
      });
      const tx = {
        insert: jest.fn().mockReturnValue({ values: valuesFn }),
      };

      const { db } = makeDbChains();
      const repo = new PlantsRepository(db as unknown as Database);

      const dto = {
        plant_code: 'PLT-003',
        batch_id: 'b',
        strain_id: 's',
        facility_id: 'f',
      } as never;
      const result = await repo.createWithTx(tx as never, dto, 'user-1');
      expect(tx.insert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw if tx insert returns no rows', async () => {
      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const { db } = makeDbChains();
      const repo = new PlantsRepository(db as unknown as Database);
      const dto = { plant_code: 'P', batch_id: 'b', strain_id: 's', facility_id: 'f' } as never;
      await expect(repo.createWithTx(tx as never, dto, 'user-1')).rejects.toThrow(
        'Plant insert returned no rows',
      );
    });
  });

  describe('updateStageWithTx', () => {
    it('should update stage and insert record in transaction', async () => {
      const updateSetWhereFn = jest.fn().mockResolvedValue(undefined);
      const valuesFn = jest.fn().mockResolvedValue(undefined);
      const tx = {
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({ where: updateSetWhereFn }),
        }),
        insert: jest.fn().mockReturnValue({ values: valuesFn }),
      };

      const { db } = makeDbChains();
      const repo = new PlantsRepository(db as unknown as Database);
      const stageRecord = {
        from_stage: 'SEED',
        to_stage: 'GERMINATION',
        transitioned_by: 'user-1',
        transitioned_at: new Date(),
      };

      await repo.updateStageWithTx(
        tx as never,
        'plant-1',
        'GERMINATION',
        'user-1',
        stageRecord as never,
      );
      expect(tx.update).toHaveBeenCalled();
      expect(tx.insert).toHaveBeenCalled();
    });
  });

  describe('updateStage', () => {
    it('should wrap updateStageWithTx in a transaction', async () => {
      const { db, transactionFn } = makeDbChains();
      const repo = new PlantsRepository(db as unknown as Database);
      const stageRecord = {
        from_stage: 'SEED',
        to_stage: 'GERMINATION',
        transitioned_by: 'user-1',
        transitioned_at: new Date(),
      };

      await repo.updateStage('plant-1', 'GERMINATION', 'user-1', stageRecord as never);
      expect(transactionFn).toHaveBeenCalled();
    });
  });

  describe('getStageHistory', () => {
    it('should return mapped stage records', async () => {
      const stageRows = [
        {
          id: 'rec-1',
          plant_id: 'plant-1',
          from_stage: 'SEED',
          to_stage: 'GERMINATION',
          transitioned_by: 'user-1',
          transitioned_at: new Date('2026-01-02'),
          created_at: new Date('2026-01-02'),
          notes: 'growth observed',
          electronic_signature: null,
        },
      ];

      const orderByFn = jest.fn().mockResolvedValue(stageRows);
      const whereFn = jest.fn().mockReturnValue({ orderBy: orderByFn });
      const fromFn = jest.fn().mockReturnValue({ where: whereFn });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        insert: jest.fn(),
        update: jest.fn(),
        transaction: jest.fn(),
      };

      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.getStageHistory('plant-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.from_stage).toBe('SEED');
      expect(result[0]!.to_stage).toBe('GERMINATION');
    });
  });

  describe('findMany', () => {
    it('should return paginated filtered results', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.findMany(
        { batch_id: 'batch-1' },
        { page: 1, limit: 10, sortOrder: 'desc' },
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update and return mapped plant', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.update('plant-1', { notes: 'updated' } as never, 'user-2');
      expect(result).toBeDefined();
    });

    it('should return null if update returns no rows', async () => {
      const { db } = makeDbChains([]);
      const repo = new PlantsRepository(db as unknown as Database);
      const result = await repo.update('missing', {} as never, 'user-2');
      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should set is_deleted and deleted_at', async () => {
      const { db, setFn } = makeDbChains();
      const repo = new PlantsRepository(db as unknown as Database);
      await repo.softDelete('plant-1', 'user-2');
      expect(db.update).toHaveBeenCalled();
      expect(setFn).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deleted: true,
          deleted_by: 'user-2',
        }),
      );
    });
  });
});
