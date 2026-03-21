import { NotFoundException } from '@nestjs/common';
import { type BiologicalAssetRepository as BiologicalAssetRepositoryType } from './biological-asset.repository';

const { BiologicalAssetRepository } = require('./biological-asset.repository') as {
  BiologicalAssetRepository: new (...args: unknown[]) => BiologicalAssetRepositoryType;
};

const now = new Date();

const fakeRow = {
  id: 'ba-1',
  batch_id: 'batch-1',
  valuation_method: 'FAIR_VALUE',
  fair_value: '100.00',
  cost_to_sell: '10.00',
  net_realizable_value: '90.00',
  cost_value: null,
  quantity_grams: '500.00',
  valued_at: now,
  valued_by: 'user-1',
  electronic_signature: { signed_by: 'user-1' },
  journal_entry_id: 'je-1',
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

function makeDbChains(rows: unknown[] = []) {
  const limitFn = jest.fn().mockResolvedValue(rows);
  const orderByFn = jest.fn().mockReturnValue({ limit: limitFn });
  const whereFn = jest.fn().mockReturnValue({ limit: limitFn, orderBy: orderByFn });
  const fromFn = jest.fn().mockReturnValue({ where: whereFn });

  const returningFn = jest.fn().mockResolvedValue(rows);
  const insertChain = {
    values: jest.fn().mockReturnValue({ returning: returningFn }),
  };

  const db = {
    select: jest.fn().mockReturnValue({ from: fromFn }),
    insert: jest.fn().mockReturnValue(insertChain),
  };

  return { db };
}

describe('BiologicalAssetRepository', () => {
  describe('findById', () => {
    it('should return mapped asset when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BiologicalAssetRepository(db as never);
      const result = await repo.findById('ba-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('ba-1');
    });

    it('should map null numeric fields correctly', async () => {
      const nullRow = {
        ...fakeRow,
        fair_value: null,
        cost_to_sell: null,
        net_realizable_value: null,
        cost_value: null,
        journal_entry_id: null,
      };
      const { db } = makeDbChains([nullRow]);
      const repo = new BiologicalAssetRepository(db as never);
      const result = await repo.findById('ba-1');
      expect(result!.fair_value).toBeNull();
      expect(result!.cost_to_sell).toBeNull();
      expect(result!.net_realizable_value).toBeNull();
      expect(result!.cost_value).toBeNull();
      expect(result!.journal_entry_id).toBeNull();
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new BiologicalAssetRepository(db as never);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new BiologicalAssetRepository(db as never);
      await expect(repo.findByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLatestByBatchId', () => {
    it('should return latest valuation by batch id', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BiologicalAssetRepository(db as never);
      const result = await repo.findLatestByBatchId('batch-1');
      expect(result).not.toBeNull();
      expect(result!.batch_id).toBe('batch-1');
    });

    it('should return null when no valuation for batch', async () => {
      const { db } = makeDbChains([]);
      const repo = new BiologicalAssetRepository(db as never);
      const result = await repo.findLatestByBatchId('missing');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should insert and return mapped asset', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BiologicalAssetRepository(db as never);
      const tx = db as never;
      const result = await repo.create(tx, {
        batch_id: 'batch-1',
        valuation_method: 'FAIR_VALUE' as never,
        fair_value: 100,
        cost_to_sell: 10,
        net_realizable_value: 90,
        cost_value: undefined as never,
        quantity_grams: 500,
        valued_at: now.toISOString(),
        valued_by: 'user-1' as never,
        electronic_signature: { signed_by: 'user-1' } as never,
        journal_entry_id: 'je-1',
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
      });
      expect(result.id).toBe('ba-1');
    });

    it('should handle all undefined optional fields', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new BiologicalAssetRepository(db as never);
      const tx = db as never;
      const result = await repo.create(tx, {
        batch_id: 'batch-1',
        valuation_method: 'COST' as never,
        fair_value: undefined as never,
        cost_to_sell: undefined as never,
        net_realizable_value: undefined as never,
        cost_value: 80,
        quantity_grams: 500,
        valued_at: now.toISOString(),
        valued_by: 'user-1' as never,
        electronic_signature: { signed_by: 'user-1' } as never,
        journal_entry_id: undefined as never,
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
      });
      expect(result.id).toBe('ba-1');
    });
  });
});
