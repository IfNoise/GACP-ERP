import { NotFoundException } from '@nestjs/common';
import { type AccountRepository as AccountRepositoryType } from './account.repository';

const { AccountRepository } = require('./account.repository') as {
  AccountRepository: new (...args: unknown[]) => AccountRepositoryType;
};

const now = new Date();

const fakeRow = {
  id: 'acc-1',
  account_code: '1000',
  account_type: 'ASSET',
  parent_id: null,
  name: 'Cash',
  description: null,
  is_active: true,
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
  const whereFn = jest.fn().mockReturnValue({
    limit: limitFn,
    orderBy: orderByFn,
  });
  const fromFn = jest.fn().mockReturnValue({ where: whereFn });
  const selectChain = { from: fromFn };

  const returningFn = jest.fn().mockResolvedValue(rows);
  const insertChain = {
    values: jest.fn().mockReturnValue({ returning: returningFn }),
  };

  const db = {
    select: jest.fn().mockReturnValue(selectChain),
    insert: jest.fn().mockReturnValue(insertChain),
    execute: jest.fn(),
  };

  return { db, limitFn, returningFn, offsetFn };
}

describe('AccountRepository', () => {
  describe('findById', () => {
    it('should return mapped account when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new AccountRepository(db as never);
      const result = await repo.findById('acc-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('acc-1');
      expect(result!.account_code).toBe('1000');
    });

    it('should return null when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new AccountRepository(db as never);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should return account when found', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new AccountRepository(db as never);
      const result = await repo.findByIdOrThrow('acc-1');
      expect(result.id).toBe('acc-1');
    });

    it('should throw NotFoundException when not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new AccountRepository(db as never);
      await expect(repo.findByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return account by code', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new AccountRepository(db as never);
      const result = await repo.findByCode('1000');
      expect(result).not.toBeNull();
      expect(result!.account_code).toBe('1000');
    });

    it('should return null when code not found', async () => {
      const { db } = makeDbChains([]);
      const repo = new AccountRepository(db as never);
      const result = await repo.findByCode('9999');
      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return paginated results without filters', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new AccountRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
    });

    it('should apply filters', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new AccountRepository(db as never);
      const result = await repo.findMany(
        { account_type: 'ASSET' as never, is_active: true, search: 'Cash' },
        { page: 1, limit: 10 },
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should insert and return mapped account', async () => {
      const { db } = makeDbChains([fakeRow]);
      const repo = new AccountRepository(db as never);
      const tx = db as never;
      const result = await repo.create(tx, {
        account_code: '1000',
        account_type: 'ASSET' as never,
        parent_id: null,
        name: 'Cash',
        description: null,
        is_active: true,
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
      });
      expect(result.account_code).toBe('1000');
    });
  });
});
