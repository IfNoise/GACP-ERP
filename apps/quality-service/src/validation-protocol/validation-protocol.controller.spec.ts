import { ValidationProtocolController } from './validation-protocol.controller';

const mockRepo = {
  findMany: jest.fn(),
  findByIdOrThrow: jest.fn(),
};

const mockCreateUseCase = { execute: jest.fn() };

const mockWorkflowUseCase = {
  submitForReview: jest.fn(),
  returnToDraft: jest.fn(),
  approve: jest.fn(),
  startExecution: jest.fn(),
  executeTest: jest.fn(),
  complete: jest.fn(),
  close: jest.fn(),
};

describe('ValidationProtocolController', () => {
  let ctrl: ValidationProtocolController;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new ValidationProtocolController(
      mockRepo as never,
      mockCreateUseCase as never,
      mockWorkflowUseCase as never,
    );
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
      ctrl.list({
        page: '1',
        limit: '10',
        status: 'DRAFT',
        type: 'IQ',
        change_control_id: '00000000-0000-0000-0000-000000000001',
      });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DRAFT',
          type: 'IQ',
          change_control_id: '00000000-0000-0000-0000-000000000001',
        }),
        expect.anything(),
      );
    });
  });

  describe('get', () => {
    it('should call repo.findByIdOrThrow', () => {
      ctrl.get('vp-1');
      expect(mockRepo.findByIdOrThrow).toHaveBeenCalledWith('vp-1');
    });
  });

  describe('getSummary', () => {
    it('should return test summary with pass rate', async () => {
      const protocol = {
        id: 'vp-1',
        test_steps: [
          { status: 'PASS' },
          { status: 'PASS' },
          { status: 'FAIL' },
          { status: 'PENDING' },
          { status: 'NOT_APPLICABLE' },
        ],
      };
      mockRepo.findByIdOrThrow.mockResolvedValue(protocol);

      const result = await ctrl.getSummary('vp-1');

      expect(result.test_summary).toEqual({
        total: 5,
        passed: 2,
        failed: 1,
        not_applicable: 1,
        pending: 1,
        pass_rate_pct: 40,
      });
    });

    it('should handle protocol with no test steps', async () => {
      const protocol = { id: 'vp-1', test_steps: [] };
      mockRepo.findByIdOrThrow.mockResolvedValue(protocol);

      const result = await ctrl.getSummary('vp-1');

      expect(result.test_summary.pass_rate_pct).toBe(0);
    });
  });

  describe('create', () => {
    it('should delegate to createUseCase with userId', () => {
      const dto = { type: 'IQ', system_under_test: 'S', test_steps: [] };
      ctrl.create(dto as never, 'user-1');
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('should default to system when userId is undefined', () => {
      const dto = { type: 'IQ', system_under_test: 'S', test_steps: [] };
      ctrl.create(dto as never, undefined as unknown as string);
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, 'system');
    });
  });

  describe('submitForReview', () => {
    it('should delegate to workflowUseCase', () => {
      ctrl.submitForReview('vp-1', 'user-1');
      expect(mockWorkflowUseCase.submitForReview).toHaveBeenCalledWith('vp-1', 'user-1');
    });
  });

  describe('returnToDraft', () => {
    it('should delegate to workflowUseCase', () => {
      ctrl.returnToDraft('vp-1', 'user-1');
      expect(mockWorkflowUseCase.returnToDraft).toHaveBeenCalledWith('vp-1', 'user-1');
    });
  });

  describe('approve', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = { electronic_signature: {} };
      ctrl.approve('vp-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.approve).toHaveBeenCalledWith('vp-1', dto, 'user-1');
    });
  });

  describe('startExecution', () => {
    it('should delegate to workflowUseCase', () => {
      ctrl.startExecution('vp-1', 'user-1');
      expect(mockWorkflowUseCase.startExecution).toHaveBeenCalledWith('vp-1', 'user-1');
    });
  });

  describe('executeTest', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = { step_number: 1, actual_result: 'ok', status: 'PASS', electronic_signature: {} };
      ctrl.executeTest('vp-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.executeTest).toHaveBeenCalledWith('vp-1', dto, 'user-1');
    });
  });

  describe('complete', () => {
    it('should delegate to workflowUseCase', () => {
      ctrl.complete('vp-1', 'user-1');
      expect(mockWorkflowUseCase.complete).toHaveBeenCalledWith('vp-1', 'user-1');
    });
  });

  describe('close', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = { closure_summary: 'Done', electronic_signature: {} };
      ctrl.close('vp-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.close).toHaveBeenCalledWith('vp-1', dto, 'user-1');
    });
  });
});
