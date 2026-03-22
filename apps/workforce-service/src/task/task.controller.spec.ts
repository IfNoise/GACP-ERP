jest.mock('@ts-rest/nest', () => ({
  TsRest: () => (target: unknown) => target,
  TsRestHandler: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  tsRestHandler: (_: unknown, handler: unknown) => handler,
}));
jest.mock('@gacp-erp/shared-contracts', () => ({
  workforceContract: new Proxy({}, { get: () => ({}) }),
}));

import { type TaskController as TaskControllerType } from './task.controller';

const { TaskController } = require('./task.controller') as {
  TaskController: new (...args: unknown[]) => TaskControllerType;
};

const mockRepo = {
  findMany: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  findByIdOrThrow: jest.fn().mockResolvedValue({ id: 'task-1' }),
};

const mockCreateUseCase = { execute: jest.fn().mockResolvedValue({ id: 'task-1' }) };
const mockCompleteUseCase = {
  execute: jest.fn().mockResolvedValue({ id: 'task-1', status: 'COMPLETED' }),
};

describe('TaskController', () => {
  let ctrl: TaskControllerType;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new TaskController(
      mockRepo as never,
      mockCreateUseCase as never,
      mockCompleteUseCase as never,
    );
  });

  describe('createTask', () => {
    it('should call use case with userId', async () => {
      const handler = ctrl.createTask() as (...args: unknown[]) => unknown;
      const result = await handler({ body: { title: 'Test' }, headers: { 'x-user-id': 'user-1' } });
      expect(result).toEqual({ status: 201, body: { id: 'task-1' } });
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith({ title: 'Test' }, 'user-1');
    });

    it('should default userId to system', async () => {
      const handler = ctrl.createTask() as (...args: unknown[]) => unknown;
      await handler({ body: {}, headers: {} });
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith({}, 'system');
    });
  });

  describe('listTasks', () => {
    it('should pass filters', async () => {
      const handler = ctrl.listTasks() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10, status: 'PENDING', zone_id: 'z-1' } });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        { status: 'PENDING', zone_id: 'z-1' },
        { page: 1, limit: 10 },
      );
    });

    it('should pass empty filters', async () => {
      const handler = ctrl.listTasks() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10 } });
      expect(mockRepo.findMany).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
    });
  });

  describe('getTask', () => {
    it('should delegate to repo', async () => {
      const handler = ctrl.getTask() as (...args: unknown[]) => unknown;
      const result = await handler({ params: { id: 'task-1' } });
      expect(result).toEqual({ status: 200, body: { id: 'task-1' } });
    });
  });

  describe('getMobileTask', () => {
    it('should delegate to repo', async () => {
      const handler = ctrl.getMobileTask() as (...args: unknown[]) => unknown;
      const result = await handler({ params: { id: 'task-1' } });
      expect(result).toEqual({ status: 200, body: { id: 'task-1' } });
    });
  });

  describe('completeTask', () => {
    it('should call use case with userId', async () => {
      const handler = ctrl.completeTask() as (...args: unknown[]) => unknown;
      const result = (await handler({
        params: { id: 'task-1' },
        headers: { 'x-user-id': 'u-1' },
      })) as Record<string, unknown>;
      expect(result.status).toBe(200);
      expect(mockCompleteUseCase.execute).toHaveBeenCalledWith('task-1', 'u-1');
    });

    it('should default userId to system', async () => {
      const handler = ctrl.completeTask() as (...args: unknown[]) => unknown;
      await handler({ params: { id: 'task-1' }, headers: {} });
      expect(mockCompleteUseCase.execute).toHaveBeenCalledWith('task-1', 'system');
    });
  });
});
