import { QualityEventController } from './quality-event.controller';

const mockRepo = {
  findMany: jest.fn(),
  findByIdOrThrow: jest.fn(),
};

const mockWorkflowUseCase = {
  create: jest.fn(),
  investigate: jest.fn(),
  linkRecord: jest.fn(),
  close: jest.fn(),
};

describe('QualityEventController', () => {
  let ctrl: QualityEventController;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new QualityEventController(mockRepo as never, mockWorkflowUseCase as never);
  });

  describe('list', () => {
    it('should parse query and call repo.findMany', () => {
      mockRepo.findMany.mockResolvedValue({ data: [], total: 0 });
      ctrl.list({ page: '1', limit: '10' });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('should pass filters', () => {
      mockRepo.findMany.mockResolvedValue({ data: [], total: 0 });
      ctrl.list({ page: '1', limit: '10', status: 'OPEN', type: 'COMPLAINT', severity: 'HIGH' });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'OPEN', type: 'COMPLAINT', severity: 'HIGH' }),
        expect.anything(),
      );
    });
  });

  describe('get', () => {
    it('should call repo.findByIdOrThrow', () => {
      ctrl.get('qe-1');
      expect(mockRepo.findByIdOrThrow).toHaveBeenCalledWith('qe-1');
    });
  });

  describe('create', () => {
    it('should delegate to workflowUseCase with userId', () => {
      const dto = { type: 'COMPLAINT', severity: 'HIGH', title: 'T', description: 'D' };
      ctrl.create(dto as never, 'user-1');
      expect(mockWorkflowUseCase.create).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('should default to system when userId is undefined', () => {
      const dto = { type: 'COMPLAINT', severity: 'HIGH', title: 'T', description: 'D' };
      ctrl.create(dto as never, undefined as unknown as string);
      expect(mockWorkflowUseCase.create).toHaveBeenCalledWith(dto, 'system');
    });
  });

  describe('investigate', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = { investigation_summary: 'S' };
      ctrl.investigate('qe-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.investigate).toHaveBeenCalledWith('qe-1', dto, 'user-1');
    });
  });

  describe('linkRecord', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = { record_type: 'DEVIATION', record_id: 'dev-1' };
      ctrl.linkRecord('qe-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.linkRecord).toHaveBeenCalledWith('qe-1', dto, 'user-1');
    });
  });

  describe('close', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = { closure_summary: 'Done', electronic_signature: {} };
      ctrl.close('qe-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.close).toHaveBeenCalledWith('qe-1', dto, 'user-1');
    });
  });
});
