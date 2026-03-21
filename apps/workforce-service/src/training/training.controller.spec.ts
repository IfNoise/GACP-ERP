jest.mock('@ts-rest/nest', () => ({
  TsRest: () => (target: unknown) => target,
  TsRestHandler: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  tsRestHandler: (_: unknown, handler: unknown) => handler,
}));
jest.mock('@gacp-erp/shared-contracts', () => ({
  workforceContract: new Proxy({}, { get: () => ({}) }),
}));

import { type TrainingController as TrainingControllerType } from './training.controller';

const { TrainingController } = require('./training.controller') as {
  TrainingController: new (...args: unknown[]) => TrainingControllerType;
};

const mockRepo = {
  createCourse: jest.fn().mockResolvedValue({ id: 'c-1' }),
  findManyCourses: jest
    .fn()
    .mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  findCourseByIdOrThrow: jest.fn().mockResolvedValue({ id: 'c-1' }),
  findManyExecutions: jest
    .fn()
    .mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  findManyCertifications: jest
    .fn()
    .mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
};

const mockScheduleUseCase = { execute: jest.fn().mockResolvedValue({ id: 'exec-1' }) };
const mockCompleteUseCase = { execute: jest.fn().mockResolvedValue({ id: 'exec-1' }) };

describe('TrainingController', () => {
  let ctrl: TrainingControllerType;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new TrainingController(
      mockRepo as never,
      mockScheduleUseCase as never,
      mockCompleteUseCase as never,
    );
  });

  // ─── COURSES ────────────────────────

  describe('createCourse', () => {
    it('should create with userId', async () => {
      const handler = ctrl.createCourse() as (...args: unknown[]) => unknown;
      const result = await handler({ body: { title: 'GMP' }, headers: { 'x-user-id': 'u-1' } });
      expect(result).toEqual({ status: 201, body: { id: 'c-1' } });
      expect(mockRepo.createCourse).toHaveBeenCalledWith({ title: 'GMP' }, 'u-1');
    });

    it('should default userId to system', async () => {
      const handler = ctrl.createCourse() as (...args: unknown[]) => unknown;
      await handler({ body: {}, headers: {} });
      expect(mockRepo.createCourse).toHaveBeenCalledWith({}, 'system');
    });
  });

  describe('listCourses', () => {
    it('should pass pagination', async () => {
      const handler = ctrl.listCourses() as (...args: unknown[]) => unknown;
      const result = await handler({ query: { page: 1, limit: 10 } });
      expect(result.status).toBe(200);
      expect(mockRepo.findManyCourses).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('getCourse', () => {
    it('should get by id', async () => {
      const handler = ctrl.getCourse() as (...args: unknown[]) => unknown;
      const result = await handler({ params: { id: 'c-1' } });
      expect(result).toEqual({ status: 200, body: { id: 'c-1' } });
    });
  });

  // ─── TRAINING EXECUTIONS ────────────

  describe('scheduleTraining', () => {
    it('should call use case with userId', async () => {
      const handler = ctrl.scheduleTraining() as (...args: unknown[]) => unknown;
      const result = await handler({ body: { course_id: 'c-1' }, headers: { 'x-user-id': 'u-1' } });
      expect(result).toEqual({ status: 201, body: { id: 'exec-1' } });
    });

    it('should default userId to system', async () => {
      const handler = ctrl.scheduleTraining() as (...args: unknown[]) => unknown;
      await handler({ body: {}, headers: {} });
      expect(mockScheduleUseCase.execute).toHaveBeenCalledWith({}, 'system');
    });
  });

  describe('listTrainingExecutions', () => {
    it('should pass filters', async () => {
      const handler = ctrl.listTrainingExecutions() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10, employee_id: 'e-1', course_id: 'c-1' } });
      expect(mockRepo.findManyExecutions).toHaveBeenCalledWith(
        { trainee_id: 'e-1', course_id: 'c-1' },
        { page: 1, limit: 10 },
      );
    });

    it('should pass empty filters', async () => {
      const handler = ctrl.listTrainingExecutions() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10 } });
      expect(mockRepo.findManyExecutions).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
    });
  });

  describe('completeTraining', () => {
    it('should call use case with params', async () => {
      const handler = ctrl.completeTraining() as (...args: unknown[]) => unknown;
      await handler({
        params: { id: 'exec-1' },
        body: { score: 90 },
        headers: { 'x-user-id': 'u-1' },
      });
      expect(mockCompleteUseCase.execute).toHaveBeenCalledWith('exec-1', { score: 90 }, 'u-1');
    });

    it('should default userId to system', async () => {
      const handler = ctrl.completeTraining() as (...args: unknown[]) => unknown;
      await handler({ params: { id: 'exec-1' }, body: {}, headers: {} });
      expect(mockCompleteUseCase.execute).toHaveBeenCalledWith('exec-1', {}, 'system');
    });
  });

  // ─── CERTIFICATIONS ────────────────

  describe('listCertifications', () => {
    it('should pass employee_id filter', async () => {
      const handler = ctrl.listCertifications() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10, employee_id: 'e-1' } });
      expect(mockRepo.findManyCertifications).toHaveBeenCalledWith(
        { employee_id: 'e-1' },
        { page: 1, limit: 10 },
      );
    });

    it('should pass empty filters', async () => {
      const handler = ctrl.listCertifications() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10 } });
      expect(mockRepo.findManyCertifications).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
    });
  });
});
