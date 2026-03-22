jest.mock('@ts-rest/nest', () => ({
  TsRest: () => (target: unknown) => target,
  TsRestHandler: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  tsRestHandler: (_: unknown, handler: unknown) => handler,
}));
jest.mock('@gacp-erp/shared-contracts', () => ({
  workforceContract: new Proxy({}, { get: () => ({}) }),
}));

import { type EmployeeController as EmployeeControllerType } from './employee.controller';

const { EmployeeController } = require('./employee.controller') as {
  EmployeeController: new (...args: unknown[]) => EmployeeControllerType;
};

const mockRepo = {
  findMany: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  findByIdOrThrow: jest.fn().mockResolvedValue({ id: 'emp-1' }),
  deactivate: jest.fn().mockResolvedValue({ id: 'emp-1', is_active: false }),
};

const mockUseCase = {
  execute: jest.fn().mockResolvedValue({ id: 'emp-1' }),
};

describe('EmployeeController', () => {
  let ctrl: EmployeeControllerType;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new EmployeeController(mockRepo as never, mockUseCase as never);
  });

  describe('createEmployee', () => {
    it('should call use case with userId from headers', async () => {
      const handler = ctrl.createEmployee() as (...args: unknown[]) => unknown;
      const result = await handler({ body: { name: 'Test' }, headers: { 'x-user-id': 'user-1' } });
      expect(result).toEqual({ status: 201, body: { id: 'emp-1' } });
      expect(mockUseCase.execute).toHaveBeenCalledWith({ name: 'Test' }, 'user-1');
    });

    it('should default userId to system', async () => {
      const handler = ctrl.createEmployee() as (...args: unknown[]) => unknown;
      await handler({ body: {}, headers: {} });
      expect(mockUseCase.execute).toHaveBeenCalledWith({}, 'system');
    });
  });

  describe('listEmployees', () => {
    it('should pass filters and pagination', async () => {
      const handler = ctrl.listEmployees() as (...args: unknown[]) => unknown;
      const result = (await handler({
        query: { page: 1, limit: 10, department: 'QA', is_active: true },
      })) as Record<string, unknown>;
      expect(result.status).toBe(200);
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        { department: 'QA', is_active: true },
        { page: 1, limit: 10 },
      );
    });

    it('should pass empty filters when none provided', async () => {
      const handler = ctrl.listEmployees() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10 } });
      expect(mockRepo.findMany).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
    });
  });

  describe('getEmployee', () => {
    it('should delegate to repo', async () => {
      const handler = ctrl.getEmployee() as (...args: unknown[]) => unknown;
      const result = await handler({ params: { id: 'emp-1' } });
      expect(result).toEqual({ status: 200, body: { id: 'emp-1' } });
    });
  });

  describe('deactivateEmployee', () => {
    it('should deactivate with userId', async () => {
      const handler = ctrl.deactivateEmployee() as (...args: unknown[]) => unknown;
      const result = (await handler({
        params: { id: 'emp-1' },
        headers: { 'x-user-id': 'user-1' },
      })) as Record<string, unknown>;
      expect(result.status).toBe(200);
      expect(mockRepo.deactivate).toHaveBeenCalledWith('emp-1', 'user-1');
    });

    it('should default userId to system', async () => {
      const handler = ctrl.deactivateEmployee() as (...args: unknown[]) => unknown;
      await handler({ params: { id: 'emp-1' }, headers: {} });
      expect(mockRepo.deactivate).toHaveBeenCalledWith('emp-1', 'system');
    });
  });
});
