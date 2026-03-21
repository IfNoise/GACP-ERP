import { NotFoundException, ConflictException } from '@nestjs/common';
import { type JournalEntryRepository as JournalEntryRepositoryType } from './journal-entry.repository';

const { JournalEntryRepository } = require('./journal-entry.repository') as {
  JournalEntryRepository: new (...args: unknown[]) => JournalEntryRepositoryType;
};

const now = new Date();

const fakeEntryRow = {
  id: 'je-1',
  entry_number: 'JE-2026-000001',
  description: 'Test entry',
  entry_date: now,
  status: 'DRAFT',
  reversal_of_id: null,
  electronic_signature: null,
  created_at: now,
  updated_at: now,
  created_by: 'user-1',
  updated_by: 'user-1',
};

const fakeLineRow = {
  id: 'jl-1',
  entry_id: 'je-1',
  account_id: 'acc-1',
  account_code: '1000',
  description: 'Debit',
  debit_amount: '100.00',
  credit_amount: '0.00',
  batch_id: null,
};

describe('JournalEntryRepository', () => {
  describe('nextEntryNumber', () => {
    it('should return formatted entry number', async () => {
      const db = {
        execute: jest.fn().mockResolvedValue({ rows: [{ nextval: '42' }] }),
        select: jest.fn(),
      };
      const repo = new JournalEntryRepository(db as never);
      const result = await repo.nextEntryNumber();
      expect(result).toMatch(/^JE-\d{4}-000042$/);
    });
  });

  describe('findById', () => {
    it('should return entry with lines when found', async () => {
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([fakeEntryRow]),
            }),
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
          }),
        };
      });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new JournalEntryRepository(db as never);
      const result = await repo.findById('je-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('je-1');
      expect(result!.lines).toHaveLength(1);
      expect(result!.lines[0]!.debit_amount).toBe(100);
    });

    it('should return null when not found', async () => {
      const fromFn = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new JournalEntryRepository(db as never);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException when not found', async () => {
      const fromFn = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });
      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new JournalEntryRepository(db as never);
      await expect(repo.findByIdOrThrow('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should insert entry and lines, returning mapped result', async () => {
      const returningFn = jest.fn();
      returningFn.mockResolvedValueOnce([fakeEntryRow]).mockResolvedValueOnce([fakeLineRow]);

      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({ returning: returningFn }),
        }),
      };

      const db = { execute: jest.fn(), select: jest.fn() };
      const repo = new JournalEntryRepository(db as never);
      const result = await repo.create(tx as never, {
        entry_number: 'JE-2026-000001',
        description: 'Test',
        entry_date: now.toISOString(),
        status: 'DRAFT' as never,
        reversal_of_id: null,
        electronic_signature: null,
        created_by: 'user-1' as never,
        updated_by: 'user-1' as never,
        lines: [
          {
            account_id: 'acc-1',
            account_code: '1000',
            description: 'Debit',
            debit_amount: 100,
            credit_amount: 0,
          },
        ],
      });
      expect(result.id).toBe('je-1');
      expect(result.lines).toHaveLength(1);
    });
  });

  describe('post', () => {
    it('should post a DRAFT entry', async () => {
      // findById for the existing check
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount <= 2) {
          // First 2 calls: entries table (for initial findById, then for lines)
          if (selectCallCount === 1) {
            return {
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([fakeEntryRow]),
              }),
            };
          }
          return {
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
            }),
          };
        }
        // After update: findById again
        if (selectCallCount === 3) {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ ...fakeEntryRow, status: 'POSTED' }]),
            }),
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
          }),
        };
      });

      const setFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
        update: jest.fn().mockReturnValue({ set: setFn }),
      };

      // tx is used for the update
      const tx = db;
      const repo = new JournalEntryRepository(db as never);
      const result = await repo.post(tx as never, 'je-1', { signed: true }, 'user-1' as never);
      expect(result.status).toBe('POSTED');
    });

    it('should throw ConflictException for non-DRAFT entry', async () => {
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ ...fakeEntryRow, status: 'POSTED' }]),
            }),
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
          }),
        };
      });

      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new JournalEntryRepository(db as never);
      await expect(repo.post({} as never, 'je-1', {}, 'user-1' as never)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('reverse', () => {
    it('should throw ConflictException for non-POSTED entry', async () => {
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ ...fakeEntryRow, status: 'DRAFT' }]),
            }),
          };
        }
        return {
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
          }),
        };
      });

      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new JournalEntryRepository(db as never);
      await expect(
        repo.reverse({} as never, 'je-1', 'JE-2026-000002', {}, 'user-1' as never, 'Reversal'),
      ).rejects.toThrow(ConflictException);
    });

    it('should reverse a POSTED entry', async () => {
      let selectCallCount = 0;
      const fromFn = jest.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // original entry
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ ...fakeEntryRow, status: 'POSTED' }]),
            }),
          };
        }
        if (selectCallCount === 2) {
          // original lines
          return {
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([fakeLineRow]),
            }),
          };
        }
        // Not called further for this test (we return from create directly)
        return { where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) };
      });

      const returningFn = jest.fn();
      const reversalEntryRow = {
        ...fakeEntryRow,
        id: 'je-2',
        status: 'POSTED',
        reversal_of_id: 'je-1',
      };
      returningFn
        .mockResolvedValueOnce([reversalEntryRow]) // insert reversal entry
        .mockResolvedValueOnce([
          {
            ...fakeLineRow,
            id: 'jl-2',
            entry_id: 'je-2',
            debit_amount: '0.00',
            credit_amount: '100.00',
          },
        ]); // insert reversal lines

      const setFn = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({ returning: returningFn }),
        }),
        update: jest.fn().mockReturnValue({ set: setFn }),
      };

      const db = {
        select: jest.fn().mockReturnValue({ from: fromFn }),
        execute: jest.fn(),
      };
      const repo = new JournalEntryRepository(db as never);
      const result = await repo.reverse(
        tx as never,
        'je-1',
        'JE-2026-000002',
        { signed: true },
        'user-1' as never,
        'Reversal of JE-1',
      );
      expect(result.id).toBe('je-2');
      expect(result.reversal_of_id).toBe('je-1');
    });
  });
});
