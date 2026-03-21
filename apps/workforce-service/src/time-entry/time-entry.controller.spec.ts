jest.mock('@ts-rest/nest', () => ({
  TsRest: () => (target: unknown) => target,
  TsRestHandler: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  tsRestHandler: (_: unknown, handler: unknown) => handler,
}));
jest.mock('@gacp-erp/shared-contracts', () => ({
  workforceContract: new Proxy({}, { get: () => ({}) }),
}));

import { type TimeEntryController as TimeEntryControllerType } from './time-entry.controller';

const { TimeEntryController } = require('./time-entry.controller') as {
  TimeEntryController: new (...args: unknown[]) => TimeEntryControllerType;
};

const mockRepo = {
  findMany: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  clockOut: jest.fn().mockResolvedValue({ id: 'te-1' }),
};

const mockUseCase = { execute: jest.fn().mockResolvedValue({ id: 'te-1' }) };

describe('TimeEntryController', () => {
  let ctrl: TimeEntryControllerType;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new TimeEntryController(mockRepo as never, mockUseCase as never);
  });

  describe('createTimeEntry', () => {
    it('should call use case with userId', async () => {
      const handler = ctrl.createTimeEntry() as (...args: unknown[]) => unknown;
      const result = await handler({
        body: { employee_id: 'e-1' },
        headers: { 'x-user-id': 'u-1' },
      });
      expect(result).toEqual({ status: 201, body: { id: 'te-1' } });
      expect(mockUseCase.execute).toHaveBeenCalledWith({ employee_id: 'e-1' }, 'u-1');
    });

    it('should default userId to system', async () => {
      const handler = ctrl.createTimeEntry() as (...args: unknown[]) => unknown;
      await handler({ body: {}, headers: {} });
      expect(mockUseCase.execute).toHaveBeenCalledWith({}, 'system');
    });
  });

  describe('listTimeEntries', () => {
    it('should pass filters', async () => {
      const handler = ctrl.listTimeEntries() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10, employee_id: 'e-1', task_id: 't-1' } });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        { employee_id: 'e-1', task_id: 't-1' },
        { page: 1, limit: 10 },
      );
    });

    it('should pass empty filters', async () => {
      const handler = ctrl.listTimeEntries() as (...args: unknown[]) => unknown;
      await handler({ query: { page: 1, limit: 10 } });
      expect(mockRepo.findMany).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
    });
  });

  describe('clockOut', () => {
    it('should delegate to repo with userId', async () => {
      const handler = ctrl.clockOut() as (...args: unknown[]) => unknown;
      const result = await handler({ params: { id: 'te-1' }, headers: { 'x-user-id': 'u-1' } });
      expect(result).toEqual({ status: 200, body: { id: 'te-1' } });
      expect(mockRepo.clockOut).toHaveBeenCalledWith('te-1', 'u-1');
    });

    it('should default userId to system', async () => {
      const handler = ctrl.clockOut() as (...args: unknown[]) => unknown;
      await handler({ params: { id: 'te-1' }, headers: {} });
      expect(mockRepo.clockOut).toHaveBeenCalledWith('te-1', 'system');
    });
  });
});
