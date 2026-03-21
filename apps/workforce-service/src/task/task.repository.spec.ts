import { NotFoundException } from '@nestjs/common';
import { type TaskRepository as TaskRepositoryType } from './task.repository';

const { TaskRepository } = require('./task.repository') as {
  TaskRepository: new (...args: unknown[]) => TaskRepositoryType;
};

const now = new Date();

const fakeRow = {
  id: 'task-1',
  task_number: 'TASK-202600001',
  title: 'Harvest Zone A',
  description: 'Harvest all plants in Zone A',
  task_type: 'HARVEST',
  priority: 'HIGH',
  status: 'PENDING',
  zone_id: 'zone-1',
  batch_id: 'batch-1',
  scheduled_date: '2026-03-20',
  scheduled_start: '08:00',
  scheduled_end: '12:00',
  actual_start: null,
  actual_end: null,
  sop_reference: 'SOP-001',
  completion_notes: null,
  created_at: now,
  updated_at: now,
  created_by: 'admin',
  updated_by: 'admin',
  assigned_to_employee: 'emp-1',
};

function makeSelectChain(rows: unknown[]) {
  const limitFn = jest.fn().mockResolvedValue(rows);
  const offsetFn = jest.fn().mockResolvedValue(rows);
  const orderByFn = jest
    .fn()
    .mockReturnValue({ limit: jest.fn().mockReturnValue({ offset: offsetFn }) });
  const whereFn = jest.fn().mockReturnValue({ limit: limitFn, orderBy: orderByFn });
  const leftJoinFn = jest.fn().mockReturnValue({ where: whereFn, orderBy: orderByFn });
  const fromFn = jest
    .fn()
    .mockReturnValue({ where: whereFn, leftJoin: leftJoinFn, orderBy: orderByFn });
  return { from: fromFn, whereFn, limitFn, leftJoinFn };
}

function makeInsertChain(rows: unknown[]) {
  const returningFn = jest.fn().mockResolvedValue(rows);
  const valuesFn = jest.fn().mockReturnValue({ returning: returningFn });
  return { values: valuesFn, returningFn };
}

function makeUpdateChain(rows: unknown[]) {
  const returningFn = jest.fn().mockResolvedValue(rows);
  const updateWhereFn = jest.fn().mockReturnValue({ returning: returningFn });
  const setFn = jest.fn().mockReturnValue({ where: updateWhereFn });
  return { set: setFn, returningFn };
}

describe('TaskRepository', () => {
  describe('findById', () => {
    it('should return mapped task when found', async () => {
      const sel = makeSelectChain([fakeRow]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TaskRepository(db as never);
      const result = await repo.findById('task-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('task-1');
      expect(result!.priority).toBe('HIGH');
    });

    it('should return null when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TaskRepository(db as never);
      expect(await repo.findById('x')).toBeNull();
    });

    it('should map CRITICAL priority to URGENT', async () => {
      const row = { ...fakeRow, priority: 'CRITICAL' };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TaskRepository(db as never);
      const result = await repo.findById('task-1');
      expect(result!.priority).toBe('URGENT');
    });

    it('should handle null optional fields', async () => {
      const row = {
        ...fakeRow,
        description: null,
        assigned_to_employee: null,
        zone_id: null,
        batch_id: null,
        scheduled_start: null,
        scheduled_end: null,
        actual_end: null,
        sop_reference: null,
      };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TaskRepository(db as never);
      const result = await repo.findById('task-1');
      expect(result!.description).toBeNull();
      expect(result!.zone_id).toBeNull();
      expect(result!.sop_reference).toBeNull();
    });

    it('should format scheduled_start and scheduled_end with date', async () => {
      const row = {
        ...fakeRow,
        scheduled_date: '2026-03-20',
        scheduled_start: '08:00',
        scheduled_end: '12:00',
      };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TaskRepository(db as never);
      const result = await repo.findById('task-1');
      expect(result!.scheduled_start).toBe('2026-03-20T08:00:00Z');
      expect(result!.scheduled_end).toBe('2026-03-20T12:00:00Z');
    });

    it('should handle actual_end date mapping', async () => {
      const row = { ...fakeRow, actual_end: now };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TaskRepository(db as never);
      const result = await repo.findById('task-1');
      expect(result!.completed_at).toBe(now.toISOString());
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TaskRepository(db as never);
      await expect(repo.findByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMany', () => {
    function makeCountChain(total: number) {
      const whereFn = jest.fn().mockResolvedValue([{ count: total }]);
      const fromFn = jest.fn().mockReturnValue({ where: whereFn });
      return { from: fromFn };
    }

    it('should return paginated result', async () => {
      const sel1 = makeSelectChain([fakeRow]);
      const sel2 = makeCountChain(1);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TaskRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply status and zone_id filters', async () => {
      const sel1 = makeSelectChain([]);
      const sel2 = makeCountChain(0);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TaskRepository(db as never);
      const result = await repo.findMany(
        { status: 'PENDING', zone_id: 'zone-1' },
        { page: 1, limit: 10 },
      );
      expect(result.data).toHaveLength(0);
    });

    it('should handle empty count result', async () => {
      const sel1 = makeSelectChain([]);
      const sel2 = makeCountChain(0);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TaskRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should insert task and assignment, return mapped task', async () => {
      const ins1 = makeInsertChain([{ ...fakeRow, id: 'task-new' }]);
      const ins2 = makeInsertChain([]);
      const db = {
        insert: jest.fn().mockReturnValueOnce(ins1).mockReturnValueOnce(ins2),
      };
      const repo = new TaskRepository(db as never);
      const result = await repo.create(
        {
          task_number: 'TASK-202600001',
          title: 'Test',
          task_type: 'HARVEST',
          assigned_to: 'emp-1' as never,
          priority: 'HIGH' as never,
          scheduled_date: '2026-03-20',
        },
        'admin',
      );
      expect(result).toBeDefined();
      expect(db.insert).toHaveBeenCalledTimes(2);
    });

    it('should use tx when provided', async () => {
      const ins1 = makeInsertChain([fakeRow]);
      const ins2 = makeInsertChain([]);
      const tx = {
        insert: jest.fn().mockReturnValueOnce(ins1).mockReturnValueOnce(ins2),
      };
      const db = { insert: jest.fn() };
      const repo = new TaskRepository(db as never);
      await repo.create(
        {
          task_number: 'TASK-202600001',
          title: 'Test',
          description: 'Desc',
          task_type: 'HARVEST',
          assigned_to: 'emp-1' as never,
          zone_id: 'zone-1',
          batch_id: 'batch-1',
          priority: 'URGENT' as never,
          scheduled_date: '2026-03-20',
          scheduled_start: '08:00',
          scheduled_end: '12:00',
          sop_reference: 'SOP-001',
        },
        'admin',
        tx as never,
      );
      expect(tx.insert).toHaveBeenCalledTimes(2);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should handle null optional fields', async () => {
      const ins1 = makeInsertChain([fakeRow]);
      const ins2 = makeInsertChain([]);
      const db = {
        insert: jest.fn().mockReturnValueOnce(ins1).mockReturnValueOnce(ins2),
      };
      const repo = new TaskRepository(db as never);
      const result = await repo.create(
        {
          task_number: 'TASK-202600002',
          title: 'Minimal',
          task_type: 'INSPECTION',
          assigned_to: 'emp-1' as never,
          priority: 'LOW' as never,
          scheduled_date: '2026-03-21',
        },
        'admin',
      );
      expect(result).toBeDefined();
    });
  });

  describe('complete', () => {
    it('should update status to COMPLETED', async () => {
      const upd = makeUpdateChain([{ ...fakeRow, status: 'COMPLETED', actual_end: now }]);
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new TaskRepository(db as never);
      const result = await repo.complete('task-1', 'admin');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      const upd = makeUpdateChain([]);
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new TaskRepository(db as never);
      await expect(repo.complete('x', 'admin')).rejects.toThrow(NotFoundException);
    });

    it('should use tx when provided', async () => {
      const upd = makeUpdateChain([{ ...fakeRow, status: 'COMPLETED', actual_end: now }]);
      const tx = { update: jest.fn().mockReturnValue(upd) };
      const db = { update: jest.fn() };
      const repo = new TaskRepository(db as never);
      await repo.complete('task-1', 'admin', tx as never);
      expect(tx.update).toHaveBeenCalled();
      expect(db.update).not.toHaveBeenCalled();
    });
  });
});
