import { ChangeControlController } from './change-control.controller';

const mockRepo = {
  findMany: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findImpacts: jest.fn(),
  findApprovals: jest.fn(),
};

const mockCreateUseCase = { execute: jest.fn() };

const mockWorkflowUseCase = {
  submit: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
  implement: jest.fn(),
  verify: jest.fn(),
  close: jest.fn(),
};

const mockAssessImpactUseCase = { execute: jest.fn() };

describe('ChangeControlController', () => {
  let ctrl: ChangeControlController;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new ChangeControlController(
      mockRepo as never,
      mockCreateUseCase as never,
      mockWorkflowUseCase as never,
      mockAssessImpactUseCase as never,
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

    it('should pass status, change_type and search filters', () => {
      mockRepo.findMany.mockResolvedValue({ data: [], total: 0 });
      ctrl.list({ page: '1', limit: '10', status: 'DRAFT', change_type: 'MAJOR', search: 'q' });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DRAFT', change_type: 'MAJOR', search: 'q' }),
        expect.anything(),
      );
    });
  });

  describe('get', () => {
    it('should call repo.findByIdOrThrow', () => {
      ctrl.get('cc-1');
      expect(mockRepo.findByIdOrThrow).toHaveBeenCalledWith('cc-1');
    });
  });

  describe('getImpacts', () => {
    it('should call repo.findImpacts', () => {
      ctrl.getImpacts('cc-1');
      expect(mockRepo.findImpacts).toHaveBeenCalledWith('cc-1');
    });
  });

  describe('getApprovals', () => {
    it('should call repo.findApprovals', () => {
      ctrl.getApprovals('cc-1');
      expect(mockRepo.findApprovals).toHaveBeenCalledWith('cc-1');
    });
  });

  describe('create', () => {
    it('should delegate to createUseCase with userId', () => {
      const dto = { title: 'T', description: 'D', change_type: 'MINOR' };
      ctrl.create(dto as never, 'user-1');
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('should default to system when userId is undefined', () => {
      const dto = { title: 'T', description: 'D', change_type: 'MINOR' };
      ctrl.create(dto as never, undefined as unknown as string);
      expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto, 'system');
    });
  });

  describe('submit', () => {
    it('should delegate to workflowUseCase', () => {
      ctrl.submit('cc-1', 'user-1');
      expect(mockWorkflowUseCase.submit).toHaveBeenCalledWith('cc-1', 'user-1');
    });
  });

  describe('assessImpact', () => {
    it('should delegate to assessImpactUseCase', () => {
      const dto = { impacts: [{ area: 'A', impact_description: 'D', risk_level: 'LOW' }] };
      ctrl.assessImpact('cc-1', dto as never, 'user-1');
      expect(mockAssessImpactUseCase.execute).toHaveBeenCalledWith('cc-1', dto, 'user-1');
    });
  });

  describe('approve', () => {
    it('should delegate to workflowUseCase with signature', () => {
      const dto = { electronic_signature: { signed_by: 'u' } };
      ctrl.approve('cc-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.approve).toHaveBeenCalledWith(
        'cc-1',
        'user-1',
        1,
        dto.electronic_signature,
      );
    });
  });

  describe('reject', () => {
    it('should delegate to workflowUseCase with reason and signature', () => {
      const dto = { rejection_reason: 'Bad', electronic_signature: { signed_by: 'u' } };
      ctrl.reject('cc-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.reject).toHaveBeenCalledWith(
        'cc-1',
        'user-1',
        'Bad',
        dto.electronic_signature,
      );
    });
  });

  describe('implement', () => {
    it('should delegate to workflowUseCase', () => {
      ctrl.implement('cc-1', 'user-1');
      expect(mockWorkflowUseCase.implement).toHaveBeenCalledWith('cc-1', 'user-1');
    });
  });

  describe('verify', () => {
    it('should delegate to workflowUseCase with notes and signature', () => {
      const dto = { verification_notes: 'Ok', electronic_signature: { signed_by: 'u' } };
      ctrl.verify('cc-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.verify).toHaveBeenCalledWith(
        'cc-1',
        'user-1',
        'Ok',
        dto.electronic_signature,
      );
    });
  });

  describe('close', () => {
    it('should delegate to workflowUseCase with summary', () => {
      const dto = { closure_summary: 'Completed' };
      ctrl.close('cc-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.close).toHaveBeenCalledWith('cc-1', 'user-1', 'Completed');
    });
  });
});
