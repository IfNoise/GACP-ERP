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

const mockUserRepo = {
  findByKeycloakId: jest.fn(),
};

const mockUseCase = {
  execute: jest.fn().mockResolvedValue({ id: 'emp-1' }),
};

describe('EmployeeController', () => {
  let ctrl: EmployeeControllerType;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new EmployeeController(mockRepo as never, mockUserRepo as never, mockUseCase as never);
  });

  describe('createEmployee', () => {
    it('should resolve keycloak sub to internal user id and call use case', async () => {
      mockUserRepo.findByKeycloakId.mockResolvedValueOnce({ id: 'internal-user-1' });
      const handler = ctrl.createEmployee() as (...args: unknown[]) => unknown;
      const result = await handler({
        body: { name: 'Test' },
        headers: { 'x-user-id': 'keycloak-sub-1' },
      });
      expect(result).toEqual({ status: 201, body: { id: 'emp-1' } });
      expect(mockUserRepo.findByKeycloakId).toHaveBeenCalledWith('keycloak-sub-1');
      expect(mockUseCase.execute).toHaveBeenCalledWith({ name: 'Test' }, 'internal-user-1');
    });

    it('should return 401 when x-user-id header is missing', async () => {
      const handler = ctrl.createEmployee() as (...args: unknown[]) => unknown;
      const result = (await handler({ body: {}, headers: {} })) as Record<string, unknown>;
      expect(result.status).toBe(401);
      expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 401 when keycloak sub cannot be resolved to internal user', async () => {
      mockUserRepo.findByKeycloakId.mockResolvedValueOnce(null);
      const handler = ctrl.createEmployee() as (...args: unknown[]) => unknown;
      const result = (await handler({
        body: {},
        headers: { 'x-user-id': 'unknown-sub' },
      })) as Record<string, unknown>;
      expect(result.status).toBe(401);
      expect(mockUseCase.execute).not.toHaveBeenCalled();
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
    it('should resolve userId and deactivate', async () => {
      mockUserRepo.findByKeycloakId.mockResolvedValueOnce({ id: 'internal-user-1' });
      const handler = ctrl.deactivateEmployee() as (...args: unknown[]) => unknown;
      const result = (await handler({
        params: { id: 'emp-1' },
        headers: { 'x-user-id': 'keycloak-sub-1' },
      })) as Record<string, unknown>;
      expect(result.status).toBe(200);
      expect(mockRepo.deactivate).toHaveBeenCalledWith('emp-1', 'internal-user-1');
    });

    it('should return 401 when x-user-id is missing', async () => {
      const handler = ctrl.deactivateEmployee() as (...args: unknown[]) => unknown;
      const result = (await handler({
        params: { id: 'emp-1' },
        headers: {},
      })) as Record<string, unknown>;
      expect(result.status).toBe(401);
      expect(mockRepo.deactivate).not.toHaveBeenCalled();
    });
  });
});
