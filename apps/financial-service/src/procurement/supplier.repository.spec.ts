import { NotFoundException } from '@nestjs/common';
import { type SupplierRepository as SupplierRepositoryType } from './supplier.repository';

const { SupplierRepository } = require('./supplier.repository') as {
  SupplierRepository: new (...args: unknown[]) => SupplierRepositoryType;
};

const now = new Date();

const fakeRow = {
  id: 'sup-1',
  supplier_code: 'SUP-0001',
  name: 'Test Supplier',
  qualification_status: 'PROVISIONAL',
  qualification_expiry: null,
  contact_details: { email: 'test@example.com' },
  is_active: true,
  notes: null,
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

function makeDbChains(rows: unknown[] = []) {
  const limitFn = jest.fn().mockResolvedValue(rows);
  const offsetFn = jest.fn().mockResolvedValue(rows);
  const orderByFn = jest
    .fn()
    .mockReturnValue({ limit: jest.fn().mockReturnValue({ offset: offsetFn }) });
  const whereFn = jest.fn().mockReturnValue({ limit: limitFn, orderBy: orderByFn });
  const fromFn = jest.fn().mockReturnValue({ where: whereFn });

  const returningFn = jest.fn().mockResolvedValue(rows);
  const insertChain = {
    values: jest.fn().mockReturnValue({ returning: returningFn }),
  };

  const updateReturningFn = jest.fn().mockResolvedValue(rows);
  const updateChain = {
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: updateReturningFn }),
    }),
  };

  const db = {
    select: jest.fn().mockReturnValue({ from: fromFn }),
    insert: jest.fn().mockReturnValue(insertChain),
    update: jest.fn().mockReturnValue(updateChain),
    execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '42' }] }),
  };

  return { db };
}

describe('SupplierRepository', () => {
  describe('nextSupplierCode', () => {
    it('should return formatted code', async () => {
      const { db } = makeDbChains();
      const repo = new SupplierRepository(db as never);
      const result = await repo.nextSupplierCode();
      expect(result).toBe('SUP-0042');
    });
  });

  describe('findById', () => {
    it('should return mapped supplier', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new SupplierRepository(db as never);
      const result = await repo.findById('sup-1');
      expect(result).not.toBeNull();
      expect(result!.supplier_code).toBe('SUP-0001');
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new SupplierRepository(db as never);
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException', async () => {
      const { db } = makeDbChains([]);
      const repo = new SupplierRepository(db as never);
      await expect(repo.findByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new SupplierRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should apply filters', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new SupplierRepository(db as never);
      const result = await repo.findMany(
        { qualification_status: 'PROVISIONAL' as never, is_active: true, search: 'Test' },
        { page: 1, limit: 10 },
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should insert and return supplier', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new SupplierRepository(db as never);
      const result = await repo.create(db as never, {
        supplier_code: 'SUP-0001',
        name: 'Test Supplier',
        qualification_status: 'PROVISIONAL' as never,
        qualification_expiry: null,
        contact_details: { email: 'test@example.com' } as never,
        is_active: true,
        notes: null,
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
      });
      expect(result.supplier_code).toBe('SUP-0001');
    });
  });

  describe('update', () => {
    it('should update and return supplier', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new SupplierRepository(db as never);
      const result = await repo.update(db as never, 'sup-1', {
        qualification_status: 'QUALIFIED' as never,
        qualification_expiry: '2027-01-01T00:00:00.000Z',
        is_active: true,
        notes: 'Approved',
        updated_by: 'user-1' as never,
      });
      expect(result.supplier_code).toBe('SUP-0001');
    });

    it('should throw NotFoundException when update returns no rows', async () => {
      const { db } = makeDbChains([]);
      const repo = new SupplierRepository(db as never);
      await expect(
        repo.update(db as never, 'missing', { qualification_status: 'QUALIFIED' as never }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
