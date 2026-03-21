import { CapaController } from './capa.controller';

const mockRepo = {
  findMany: jest.fn(),
  findByIdOrThrow: jest.fn(),
};

const mockWorkflowUseCase = {
  create: jest.fn(),
  initiateRca: jest.fn(),
  createActionPlan: jest.fn(),
  implement: jest.fn(),
  checkEffectiveness: jest.fn(),
  close: jest.fn(),
};

describe('CapaController', () => {
  let ctrl: CapaController;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new CapaController(mockRepo as never, mockWorkflowUseCase as never);
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

    it('should pass status filter', () => {
      mockRepo.findMany.mockResolvedValue({ data: [], total: 0 });
      ctrl.list({ page: '1', limit: '10', status: 'OPEN' });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'OPEN' }),
        expect.anything(),
      );
    });

    it('should pass type and search filters', () => {
      mockRepo.findMany.mockResolvedValue({ data: [], total: 0 });
      ctrl.list({ page: '1', limit: '10', type: 'CORRECTIVE', search: 'test' });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CORRECTIVE', search: 'test' }),
        expect.anything(),
      );
    });
  });

  describe('get', () => {
    it('should call repo.findByIdOrThrow', () => {
      mockRepo.findByIdOrThrow.mockResolvedValue({ id: '1' });
      ctrl.get('1');
      expect(mockRepo.findByIdOrThrow).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    const dto = { type: 'CORRECTIVE', source: 'DEVIATION', title: 'T', description: 'D' };

    it('should call workflowUseCase.create with userId', () => {
      ctrl.create(dto as never, 'user-1');
      expect(mockWorkflowUseCase.create).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('should default to system when userId is undefined', () => {
      ctrl.create(dto as never, undefined as unknown as string);
      expect(mockWorkflowUseCase.create).toHaveBeenCalledWith(dto, 'system');
    });
  });

  describe('initiateRca', () => {
    const dto = { root_cause_category: 'HUMAN_ERROR', root_cause_description: 'desc' };

    it('should delegate to workflowUseCase', () => {
      ctrl.initiateRca('id-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.initiateRca).toHaveBeenCalledWith('id-1', dto, 'user-1');
    });
  });

  describe('createActionPlan', () => {
    const dto = {
      actions: [
        { description: 'do something', responsible_person: 'p', target_date: '2026-01-01' },
      ],
    };

    it('should delegate to workflowUseCase', () => {
      ctrl.createActionPlan('id-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.createActionPlan).toHaveBeenCalledWith('id-1', dto, 'user-1');
    });
  });

  describe('implement', () => {
    it('should delegate to workflowUseCase', () => {
      ctrl.implement('id-1', 'user-1');
      expect(mockWorkflowUseCase.implement).toHaveBeenCalledWith('id-1', 'user-1');
    });
  });

  describe('checkEffectiveness', () => {
    const dto = {
      result: 'EFFECTIVE',
      evidence_description: 'ev',
      check_date: '2026-01-01',
      electronic_signature: {},
    };

    it('should delegate to workflowUseCase', () => {
      ctrl.checkEffectiveness('id-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.checkEffectiveness).toHaveBeenCalledWith('id-1', dto, 'user-1');
    });
  });

  describe('close', () => {
    const dto = { closure_summary: 'Done', electronic_signature: {} };

    it('should delegate to workflowUseCase', () => {
      ctrl.close('id-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.close).toHaveBeenCalledWith('id-1', dto, 'user-1');
    });
  });
});
