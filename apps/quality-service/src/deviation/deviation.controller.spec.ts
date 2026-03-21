import { NotFoundException } from '@nestjs/common';
import { DeviationController } from './deviation.controller';

const mockRepo = {
  findMany: jest.fn(),
  findByIdOrThrow: jest.fn(),
};

const mockCapaRepo = {
  findById: jest.fn(),
};

const mockWorkflowUseCase = {
  report: jest.fn(),
  investigate: jest.fn(),
  assessImpact: jest.fn(),
  linkCapa: jest.fn(),
  close: jest.fn(),
};

describe('DeviationController', () => {
  let ctrl: DeviationController;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new DeviationController(
      mockRepo as never,
      mockCapaRepo as never,
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
        status: 'REPORTED',
        classification: 'CRITICAL',
        search: 'q',
      });
      expect(mockRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'REPORTED', classification: 'CRITICAL', search: 'q' }),
        expect.anything(),
      );
    });
  });

  describe('get', () => {
    it('should call repo.findByIdOrThrow', () => {
      ctrl.get('dev-1');
      expect(mockRepo.findByIdOrThrow).toHaveBeenCalledWith('dev-1');
    });
  });

  describe('report', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = {
        title: 'T',
        description: 'D',
        classification: 'MINOR',
        category: 'DOCUMENTATION',
      };
      ctrl.report(dto as never, 'user-1');
      expect(mockWorkflowUseCase.report).toHaveBeenCalledWith(dto, 'user-1');
    });

    it('should default to system when userId is undefined', () => {
      const dto = {
        title: 'T',
        description: 'D',
        classification: 'MINOR',
        category: 'DOCUMENTATION',
      };
      ctrl.report(dto as never, undefined as unknown as string);
      expect(mockWorkflowUseCase.report).toHaveBeenCalledWith(dto, 'system');
    });
  });

  describe('investigate', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = {
        investigation_summary: 'S',
        immediate_containment_actions: 'A',
        product_impact_assessment: 'N',
      };
      ctrl.investigate('dev-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.investigate).toHaveBeenCalledWith('dev-1', dto, 'user-1');
    });
  });

  describe('assessImpact', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = { product_impact: 'NONE', capa_required: false };
      ctrl.assessImpact('dev-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.assessImpact).toHaveBeenCalledWith('dev-1', dto, 'user-1');
    });
  });

  describe('linkCapa', () => {
    it('should verify capa exists and delegate to workflowUseCase', async () => {
      mockCapaRepo.findById.mockResolvedValue({ capa_number: 'CA-2026-0001' });
      mockWorkflowUseCase.linkCapa.mockResolvedValue({ id: 'dev-1' });

      await ctrl.linkCapa('dev-1', { capa_id: 'capa-1' }, 'user-1');

      expect(mockCapaRepo.findById).toHaveBeenCalledWith('capa-1');
      expect(mockWorkflowUseCase.linkCapa).toHaveBeenCalledWith(
        'dev-1',
        'capa-1',
        'CA-2026-0001',
        'user-1',
      );
    });

    it('should throw NotFoundException when capa not found', async () => {
      mockCapaRepo.findById.mockResolvedValue(null);

      await expect(ctrl.linkCapa('dev-1', { capa_id: 'missing' }, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('close', () => {
    it('should delegate to workflowUseCase', () => {
      const dto = { electronic_signature: {} };
      ctrl.close('dev-1', dto as never, 'user-1');
      expect(mockWorkflowUseCase.close).toHaveBeenCalledWith('dev-1', dto, 'user-1');
    });
  });
});
