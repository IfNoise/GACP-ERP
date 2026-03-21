import { NotFoundException, BadRequestException } from '@nestjs/common';
import { type TrainingRepository as TrainingRepositoryType } from './training.repository';

const { TrainingRepository } = require('./training.repository') as {
  TrainingRepository: new (...args: unknown[]) => TrainingRepositoryType;
};

const now = new Date();

const fakeCourseRow = {
  id: 'course-1',
  course_id: 'GMP-001',
  title: 'GMP Training',
  training_type: 'GMP',
  duration_minutes: 120,
  passing_score: 80,
  applicable_roles: ['Grower', 'QA'],
  sop_references: ['SOP-001'],
  is_active: true,
  created_at: now,
  updated_at: now,
  created_by: 'admin',
  updated_by: 'admin',
};

const fakeExecutionRow = {
  id: 'exec-1',
  course_id: 'course-1',
  employee_id: 'emp-1',
  trainer_id: 'trainer-1',
  status: 'SCHEDULED',
  score: null as number | null,
  passed: null as boolean | null,
  completed_date: null as string | null,
  scheduled_date: '2026-03-20',
  signature: null as Record<string, unknown> | null,
  created_at: now,
  updated_at: now,
  created_by: 'admin',
  updated_by: 'admin',
};

const fakeCertRow = {
  id: 'cert-1',
  employee_id: 'emp-1',
  course_id: 'course-1',
  execution_id: 'exec-1',
  issued_date: '2026-03-20',
  expiry_date: '2027-03-20',
  certificate_number: 'CERT-001',
  is_active: true,
  issued_by: 'admin',
  created_at: now,
  updated_at: now,
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

describe('TrainingRepository', () => {
  // ─── COURSES ────────────────────────

  describe('findCourseById', () => {
    it('should return mapped course', async () => {
      const sel = makeSelectChain([fakeCourseRow]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findCourseById('course-1');
      expect(result!.id).toBe('course-1');
      expect(result!.duration_hours).toBe(2);
    });

    it('should return null when not found', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TrainingRepository(db as never);
      expect(await repo.findCourseById('x')).toBeNull();
    });

    it('should handle null applicable_roles and sop_references', async () => {
      const row = { ...fakeCourseRow, applicable_roles: null, sop_references: null };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findCourseById('course-1');
      expect(result).toBeDefined();
    });
  });

  describe('findCourseByIdOrThrow', () => {
    it('should throw NotFoundException', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TrainingRepository(db as never);
      await expect(repo.findCourseByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findManyCourses', () => {
    function makeCountChain(total: number) {
      const fromFn = jest.fn().mockResolvedValue([{ count: total }]);
      return { from: fromFn };
    }

    it('should return paginated courses', async () => {
      const sel1 = makeSelectChain([fakeCourseRow]);
      const sel2 = makeCountChain(1);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findManyCourses({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle empty count', async () => {
      const sel1 = makeSelectChain([]);
      const sel2 = makeCountChain(0);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findManyCourses({ page: 1, limit: 10 });
      expect(result.total).toBe(0);
    });
  });

  describe('createCourse', () => {
    it('should create with INITIAL type mapping', async () => {
      const ins = makeInsertChain([fakeCourseRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TrainingRepository(db as never);
      const result = await repo.createCourse(
        {
          course_id: 'GMP-001',
          title: 'Test',
          type: 'INITIAL' as never,
          duration_hours: 2,
          passing_score: 80,
          applicable_roles: [],
          sop_references: [],
        },
        'admin',
      );
      expect(result.id).toBe('course-1');
    });

    it('should map ANNUAL_RECERTIFICATION to COMPLIANCE', async () => {
      const ins = makeInsertChain([fakeCourseRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TrainingRepository(db as never);
      await repo.createCourse(
        {
          course_id: 'C-002',
          title: 'Recert',
          type: 'ANNUAL_RECERTIFICATION' as never,
          duration_hours: 1,
          passing_score: 70,
          applicable_roles: [],
          sop_references: [],
        },
        'admin',
      );
      expect(db.insert).toHaveBeenCalled();
    });

    it('should fallback unknown type to INITIAL', async () => {
      const ins = makeInsertChain([fakeCourseRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TrainingRepository(db as never);
      await repo.createCourse(
        {
          course_id: 'C-003',
          title: 'Unknown',
          type: 'CUSTOM' as never,
          duration_hours: 1,
          passing_score: 70,
          applicable_roles: [],
          sop_references: [],
        },
        'admin',
      );
      expect(db.insert).toHaveBeenCalled();
    });

    it('should use tx when provided', async () => {
      const ins = makeInsertChain([fakeCourseRow]);
      const tx = { insert: jest.fn().mockReturnValue(ins) };
      const db = { insert: jest.fn() };
      const repo = new TrainingRepository(db as never);
      await repo.createCourse(
        {
          course_id: 'C-004',
          title: 'TX',
          type: 'REFRESHER' as never,
          duration_hours: 1,
          passing_score: 70,
          applicable_roles: [],
          sop_references: [],
        },
        'admin',
        tx as never,
      );
      expect(tx.insert).toHaveBeenCalled();
    });
  });

  // ─── EXECUTIONS ────────────────────

  describe('findExecutionById', () => {
    it('should return mapped execution', async () => {
      const sel = makeSelectChain([fakeExecutionRow]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findExecutionById('exec-1');
      expect(result!.id).toBe('exec-1');
      expect(result!.trainee_id).toBe('emp-1');
    });

    it('should return null', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TrainingRepository(db as never);
      expect(await repo.findExecutionById('x')).toBeNull();
    });

    it('should handle null optional fields', async () => {
      const row = {
        ...fakeExecutionRow,
        trainer_id: null,
        score: null,
        completed_date: null,
        signature: null,
      };
      const sel = makeSelectChain([row]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findExecutionById('exec-1');
      expect(result!.trainer_id).toBeNull();
      expect(result!.score).toBeNull();
    });
  });

  describe('findExecutionByIdOrThrow', () => {
    it('should throw NotFoundException', async () => {
      const sel = makeSelectChain([]);
      const db = { select: jest.fn().mockReturnValue(sel) };
      const repo = new TrainingRepository(db as never);
      await expect(repo.findExecutionByIdOrThrow('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findManyExecutions', () => {
    function makeCountChain(total: number) {
      const fromFn = jest.fn().mockResolvedValue([{ count: total }]);
      return { from: fromFn };
    }

    it('should return paginated executions', async () => {
      const sel1 = makeSelectChain([fakeExecutionRow]);
      const sel2 = makeCountChain(1);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findManyExecutions({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createExecution', () => {
    it('should insert execution', async () => {
      const ins = makeInsertChain([fakeExecutionRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TrainingRepository(db as never);
      const result = await repo.createExecution(
        { course_id: 'course-1', trainee_id: 'emp-1' },
        'admin',
      );
      expect(result.id).toBe('exec-1');
    });

    it('should handle trainer_id', async () => {
      const ins = makeInsertChain([fakeExecutionRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TrainingRepository(db as never);
      await repo.createExecution(
        { course_id: 'course-1', trainee_id: 'emp-1', trainer_id: 'trainer-1' },
        'admin',
      );
      expect(db.insert).toHaveBeenCalled();
    });

    it('should use tx', async () => {
      const ins = makeInsertChain([fakeExecutionRow]);
      const tx = { insert: jest.fn().mockReturnValue(ins) };
      const db = { insert: jest.fn() };
      const repo = new TrainingRepository(db as never);
      await repo.createExecution({ course_id: 'c-1', trainee_id: 'e-1' }, 'admin', tx as never);
      expect(tx.insert).toHaveBeenCalled();
    });
  });

  describe('completeExecution', () => {
    it('should complete with pass', async () => {
      // findExecutionByIdOrThrow → findExecutionById → select
      const selExec = makeSelectChain([fakeExecutionRow]);
      // findCourseByIdOrThrow → findCourseById → select
      const selCourse = makeSelectChain([fakeCourseRow]);
      // update
      const upd = makeUpdateChain([
        { ...fakeExecutionRow, status: 'COMPLETED', score: 90, passed: true },
      ]);
      const db = {
        select: jest.fn().mockReturnValueOnce(selExec).mockReturnValueOnce(selCourse),
        update: jest.fn().mockReturnValue(upd),
      };
      const repo = new TrainingRepository(db as never);
      const result = await repo.completeExecution('exec-1', 90, { signed: true }, 'admin');
      expect(result.status).toBe('COMPLETED');
    });

    it('should fail below passing score', async () => {
      const selExec = makeSelectChain([fakeExecutionRow]);
      const selCourse = makeSelectChain([fakeCourseRow]);
      const upd = makeUpdateChain([
        { ...fakeExecutionRow, status: 'FAILED', score: 50, passed: false },
      ]);
      const db = {
        select: jest.fn().mockReturnValueOnce(selExec).mockReturnValueOnce(selCourse),
        update: jest.fn().mockReturnValue(upd),
      };
      const repo = new TrainingRepository(db as never);
      const result = await repo.completeExecution('exec-1', 50, {}, 'admin');
      expect(result.status).toBe('FAILED');
    });

    it('should throw if already COMPLETED', async () => {
      const selExec = makeSelectChain([{ ...fakeExecutionRow, status: 'COMPLETED' }]);
      const db = { select: jest.fn().mockReturnValue(selExec) };
      const repo = new TrainingRepository(db as never);
      await expect(repo.completeExecution('exec-1', 90, {}, 'admin')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if already FAILED', async () => {
      const selExec = makeSelectChain([{ ...fakeExecutionRow, status: 'FAILED' }]);
      const db = { select: jest.fn().mockReturnValue(selExec) };
      const repo = new TrainingRepository(db as never);
      await expect(repo.completeExecution('exec-1', 90, {}, 'admin')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use tx', async () => {
      const selExec = makeSelectChain([fakeExecutionRow]);
      const selCourse = makeSelectChain([fakeCourseRow]);
      const upd = makeUpdateChain([{ ...fakeExecutionRow, status: 'COMPLETED', score: 90 }]);
      const tx = { update: jest.fn().mockReturnValue(upd) };
      const db = {
        select: jest.fn().mockReturnValueOnce(selExec).mockReturnValueOnce(selCourse),
        update: jest.fn(),
      };
      const repo = new TrainingRepository(db as never);
      await repo.completeExecution('exec-1', 90, {}, 'admin', tx as never);
      expect(tx.update).toHaveBeenCalled();
    });
  });

  // ─── CERTIFICATIONS ────────────────

  describe('findManyCertifications', () => {
    function makeCountChain(total: number) {
      const fromFn = jest.fn().mockResolvedValue([{ count: total }]);
      return { from: fromFn };
    }

    it('should return paginated certifications', async () => {
      const sel1 = makeSelectChain([fakeCertRow]);
      const sel2 = makeCountChain(1);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findManyCertifications({}, { page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('should handle null expiry_date', async () => {
      const row = { ...fakeCertRow, expiry_date: null };
      const sel1 = makeSelectChain([row]);
      const sel2 = makeCountChain(1);
      const db = {
        select: jest.fn().mockReturnValueOnce(sel1).mockReturnValueOnce(sel2),
      };
      const repo = new TrainingRepository(db as never);
      const result = await repo.findManyCertifications({}, { page: 1, limit: 10 });
      expect(result.data[0]!.valid_until).toBe('');
    });
  });

  describe('createCertification', () => {
    it('should insert certification', async () => {
      const ins = makeInsertChain([fakeCertRow]);
      const db = { insert: jest.fn().mockReturnValue(ins) };
      const repo = new TrainingRepository(db as never);
      const result = await repo.createCertification(
        {
          employee_id: 'emp-1',
          course_id: 'course-1',
          execution_id: 'exec-1',
          issued_at: '2026-03-20T00:00:00.000Z',
          valid_until: '2027-03-20T00:00:00.000Z',
          certificate_number: 'CERT-001',
        },
        'admin',
      );
      expect(result.id).toBe('cert-1');
    });

    it('should use tx', async () => {
      const ins = makeInsertChain([fakeCertRow]);
      const tx = { insert: jest.fn().mockReturnValue(ins) };
      const db = { insert: jest.fn() };
      const repo = new TrainingRepository(db as never);
      await repo.createCertification(
        {
          employee_id: 'emp-1',
          course_id: 'course-1',
          execution_id: 'exec-1',
          issued_at: '2026-03-20',
          valid_until: '2027-03-20',
          certificate_number: 'CERT-002',
        },
        'admin',
        tx as never,
      );
      expect(tx.insert).toHaveBeenCalled();
    });
  });
});
