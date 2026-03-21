import { NotFoundException } from '@nestjs/common';
import { type EmployeeRepository as EmployeeRepositoryType } from './employee.repository';

const { EmployeeRepository } = require('./employee.repository') as {
  EmployeeRepository: new (...args: unknown[]) => EmployeeRepositoryType;
};

const now = new Date();

const fakeRow = {
  id: 'emp-1',
  employee_number: 'EMP-001',
  user_id: 'user-1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@test.com',
  role: 'Grower',
  job_title: 'Lead Grower',
  department: 'Cultivation',
  hire_date: '2024-01-15',
  competency_profile_id: 'cp-1',
  is_active: true,
  created_at: now,
  updated_at: now,
  created_by: 'admin',
  updated_by: 'admin',
};

function makeSelectChain(rows: unknown[]) {
  const limitFn = jest.fn().mockResolvedValue(rows);
  const offsetFn = jest.fn().mockResolvedValue(rows);
  const orderByFn = jest
    .fn()
    .mockReturnValue({ limit: jest.fn().mockReturnValue({ offset: offsetFn }) });
  const whereFn = jest.fn().mockReturnValue({ limit: limitFn, orderBy: orderByFn });
  const fromFn = jest.fn().mockReturnValue({ where: whereFn, orderBy: orderByFn });
  return { from: fromFn, whereFn, limitFn, offsetFn, orderByFn };
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

describe('EmployeeRepository', () => {
  describe('findById', () => {
    it('should return mapped employee when found', async () => {
      const sel = makeSelectChain([fakeRow]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.findById('emp-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('emp-1');
      expect(result!.department).toBe('Cultivation');
    });

    it('should return null when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new EmployeeRepository(db as never);
      expect(await repo.findById('x')).toBeNull();
    });

    it('should handle null user_id and competency_profile_id', async () => {
      const row = { ...fakeRow, user_id: null, competency_profile_id: null };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.findById('emp-1');
      expect(result!.user_id).toBe('');
      expect(result!.competency_profile_id).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('should throw NotFoundException when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new EmployeeRepository(db as never);
      await expect(repo.findByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmployeeNumber', () => {
    it('should find by employee number', async () => {
      const sel = makeSelectChain([fakeRow]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.findByEmployeeNumber('EMP-001');
      expect(result!.employee_number).toBe('EMP-001');
    });

    it('should return null when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new EmployeeRepository(db as never);
      expect(await repo.findByEmployeeNumber('NONE')).toBeNull();
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
      const repo = new EmployeeRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should apply department filter', async () => {
      const sel1 = makeSelectChain([]);
      const sel2 = makeCountChain(0);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.findMany({ department: 'Quality' }, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(0);
    });

    it('should apply is_active filter', async () => {
      const sel1 = makeSelectChain([fakeRow]);
      const sel2 = makeCountChain(1);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.findMany({ is_active: true }, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should handle empty count result', async () => {
      const sel1 = makeSelectChain([]);
      const sel2 = makeCountChain(0);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.findMany({}, { page: 1, limit: 10 });
      expect(result.total).toBe(0);
    });
  });

  describe('create', () => {
    it('should insert and return mapped employee', async () => {
      const ins = makeInsertChain([fakeRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.create(
        {
          employee_number: 'EMP-001',
          user_id: 'user-1' as never,
          position: 'Lead Grower',
          department: 'Cultivation',
          hire_date: '2024-01-15',
        },
        'admin',
      );
      expect(result.id).toBe('emp-1');
    });

    it('should use tx when provided', async () => {
      const ins = makeInsertChain([fakeRow]);
      const tx = { insert: jest.fn().mockReturnValue(ins) };
      const db = { insert: jest.fn() };
      const repo = new EmployeeRepository(db as never);
      await repo.create(
        {
          employee_number: 'EMP-001',
          user_id: 'user-1' as never,
          position: 'Lead Grower',
          department: 'Cultivation',
          hire_date: '2024-01-15',
          competency_profile_id: null,
        },
        'admin',
        tx as never,
      );
      expect(tx.insert).toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('should handle single-word position', async () => {
      const ins = makeInsertChain([fakeRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.create(
        {
          employee_number: 'EMP-002',
          user_id: 'user-2' as never,
          position: 'Manager',
          department: 'QA',
          hire_date: '2024-06-01',
        },
        'admin',
      );
      expect(result).toBeDefined();
    });
  });

  describe('deactivate', () => {
    it('should deactivate and return employee', async () => {
      const upd = makeUpdateChain([{ ...fakeRow, is_active: false }]);
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new EmployeeRepository(db as never);
      const result = await repo.deactivate('emp-1', 'admin');
      expect(result.id).toBe('emp-1');
    });

    it('should throw NotFoundException when employee not found', async () => {
      const upd = makeUpdateChain([]);
      const db = { update: jest.fn().mockReturnValue(upd) };
      const repo = new EmployeeRepository(db as never);
      await expect(repo.deactivate('x', 'admin')).rejects.toThrow(NotFoundException);
    });
  });
});
