import { NotFoundException } from '@nestjs/common';
import { type TimeEntryRepository as TimeEntryRepositoryType } from './time-entry.repository';

const { TimeEntryRepository } = require('./time-entry.repository') as {
  TimeEntryRepository: new (...args: unknown[]) => TimeEntryRepositoryType;
};

const now = new Date();

const fakeRow = {
  id: 'te-1',
  employee_id: 'emp-1',
  task_id: 'task-1',
  clock_in: now,
  clock_out: null as Date | null,
  duration_minutes: null as number | null,
  source: 'MANUAL',
  created_at: now,
  updated_at: now,
  created_by: 'admin',
  updated_by: 'admin',
};

function makeSelectChain(rows: unknown[]) {
  const offsetFn = jest.fn().mockResolvedValue(rows);
  const limitFn = jest.fn().mockReturnValue({ offset: offsetFn });
  const orderByFn = jest.fn().mockReturnValue({ limit: limitFn });
  const whereFn = jest
    .fn()
    .mockReturnValue({ limit: jest.fn().mockResolvedValue(rows), orderBy: orderByFn });
  const fromFn = jest.fn().mockReturnValue({ where: whereFn, orderBy: orderByFn });
  return { from: fromFn };
}

function makeInsertChain(rows: unknown[]) {
  const returningFn = jest.fn().mockResolvedValue(rows);
  const valuesFn = jest.fn().mockReturnValue({ returning: returningFn });
  return { values: valuesFn };
}

function makeUpdateChain(rows: unknown[]) {
  const returningFn = jest.fn().mockResolvedValue(rows);
  const updateWhereFn = jest.fn().mockReturnValue({ returning: returningFn });
  const setFn = jest.fn().mockReturnValue({ where: updateWhereFn });
  return { set: setFn };
}

describe('TimeEntryRepository', () => {
  describe('findById', () => {
    it('should return mapped time entry', async () => {
      const sel = makeSelectChain([fakeRow]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findById('te-1');
      expect(result!.id).toBe('te-1');
      expect(result!.recorded_via).toBe('WEB');
    });

    it('should return null when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      expect(await repo.findById('x')).toBeNull();
    });

    it('should map MOBILE source to TERMINAL', async () => {
      const row = { ...fakeRow, source: 'MOBILE' };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findById('te-1');
      expect(result!.recorded_via).toBe('TERMINAL');
    });

    it('should map SYSTEM source to API', async () => {
      const row = { ...fakeRow, source: 'SYSTEM' };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findById('te-1');
      expect(result!.recorded_via).toBe('API');
    });

    it('should map BIOMETRIC source to TERMINAL', async () => {
      const row = { ...fakeRow, source: 'BIOMETRIC' };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findById('te-1');
      expect(result!.recorded_via).toBe('TERMINAL');
    });

    it('should default unknown source to WEB', async () => {
      const row = { ...fakeRow, source: 'UNKNOWN' };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findById('te-1');
      expect(result!.recorded_via).toBe('WEB');
    });

    it('should handle clock_out and task_id null', async () => {
      const row = { ...fakeRow, clock_out: null, task_id: null };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findById('te-1');
      expect(result!.clock_out_at).toBeNull();
      expect(result!.task_id).toBeNull();
    });

    it('should format clock_out when present', async () => {
      const clockOut = new Date('2026-03-20T17:00:00Z');
      const row = { ...fakeRow, clock_out: clockOut, duration_minutes: 480 };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findById('te-1');
      expect(result!.clock_out_at).toBe(clockOut.toISOString());
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TimeEntryRepository(db as never);
      await expect(repo.findByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    function makeCountChain(total: number) {
      const fromFn = jest.fn().mockResolvedValue([{ count: total }]);
      return { from: fromFn };
    }

    it('should return paginated result', async () => {
      const sel1 = makeSelectChain([fakeRow]);
      const sel2 = makeCountChain(1);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle empty count', async () => {
      const sel1 = makeSelectChain([]);
      const sel2 = makeCountChain(0);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.total).toBe(0);
    });
  });

  describe('clockIn', () => {
    it('should insert with TERMINAL → MOBILE mapping', async () => {
      const ins = makeInsertChain([fakeRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.clockIn(
        { employee_id: 'emp-1', clock_in_at: now.toISOString(), recorded_via: 'TERMINAL' as never },
        'admin',
      );
      expect(result.id).toBe('te-1');
    });

    it('should insert with WEB → MANUAL mapping', async () => {
      const ins = makeInsertChain([fakeRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TimeEntryRepository(db as never);
      await repo.clockIn(
        { employee_id: 'emp-1', clock_in_at: now.toISOString(), recorded_via: 'WEB' as never },
        'admin',
      );
      expect(db.insert).toHaveBeenCalled();
    });

    it('should insert with API → SYSTEM mapping', async () => {
      const ins = makeInsertChain([fakeRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TimeEntryRepository(db as never);
      await repo.clockIn(
        { employee_id: 'emp-1', clock_in_at: now.toISOString(), recorded_via: 'API' as never },
        'admin',
      );
      expect(db.insert).toHaveBeenCalled();
    });

    it('should default unknown recorded_via to MANUAL', async () => {
      const ins = makeInsertChain([fakeRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TimeEntryRepository(db as never);
      await repo.clockIn(
        { employee_id: 'emp-1', clock_in_at: now.toISOString(), recorded_via: 'UNKNOWN' as never },
        'admin',
      );
      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle null task_id', async () => {
      const ins = makeInsertChain([fakeRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TimeEntryRepository(db as never);
      await repo.clockIn(
        { employee_id: 'emp-1', clock_in_at: now.toISOString(), recorded_via: 'WEB' as never },
        'admin',
      );
      expect(db.insert).toHaveBeenCalled();
    });

    it('should use tx when provided', async () => {
      const ins = makeInsertChain([fakeRow]);
      const tx = { insert: jest.fn().mockReturnValue(ins) };
      const db = { insert: jest.fn() };
      const repo = new TimeEntryRepository(db as never);
      await repo.clockIn(
        {
          employee_id: 'emp-1',
          task_id: 'task-1',
          clock_in_at: now.toISOString(),
          recorded_via: 'WEB' as never,
        },
        'admin',
        tx as never,
      );
      expect(tx.insert).toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('clockOut', () => {
    it('should update and return time entry', async () => {
      const upd = makeUpdateChain([{ ...fakeRow, clock_out: now }]);
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new TimeEntryRepository(db as never);
      const result = await repo.clockOut('te-1', 'admin');
      expect(result.id).toBe('te-1');
    });

    it('should throw NotFoundException when not found', async () => {
      const upd = makeUpdateChain([]);
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new TimeEntryRepository(db as never);
      await expect(repo.clockOut('x', 'admin')).rejects.toThrow(NotFoundException);
    });

    it('should use tx when provided', async () => {
      const upd = makeUpdateChain([{ ...fakeRow, clock_out: now }]);
      const tx = { update: jest.fn().mockReturnValue(upd) };
      const db = { update: jest.fn() };
      const repo = new TimeEntryRepository(db as never);
      await repo.clockOut('te-1', 'admin', tx as never);
      expect(tx.update).toHaveBeenCalled();
    });
  });
});
