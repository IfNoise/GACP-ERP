import { ConflictException } from '@nestjs/common';
import { AssessImpactUseCase } from './assess-impact.use-case';
import type { ChangeControl, UserId } from '@gacp-erp/shared-schemas';

const CC_ID = '00000000-0000-0000-0000-000000000001';
const ASSESSOR_ID = '00000000-0000-0000-0000-000000000099';

const makeCc = (status: ChangeControl['status']): ChangeControl => ({
  id: CC_ID,
  ccn_number: 'CCN-2026-0001',
  title: 'Change',
  description: 'Description',
  change_type: 'MAJOR',
  status,
  requestor_id: 'user-1' as UserId,
  approver_ids: [],
  electronic_signature: null,
  validation_status: 'unvalidated',
  validation_protocol_id: null,
  last_validated_at: null,
  next_review_date: null,
  retention_class: '7_YEAR',
  audit_tx_id: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1' as UserId,
  updated_by: 'user-1' as UserId,
});

const mockRepo = {
  findByIdOrThrow: jest.fn(),
  createImpact: jest.fn(),
  update: jest.fn(),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

describe('AssessImpactUseCase', () => {
  let useCase: AssessImpactUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));
    mockOutboxRepo.createWithTx.mockResolvedValue(undefined);

    useCase = new AssessImpactUseCase(mockDb as never, mockRepo as never, mockOutboxRepo as never);
  });

  describe('execute', () => {
    const dto = {
      impacts: [
        { area: 'Process', impact_description: 'Desc1', risk_level: 'LOW' },
        { area: 'Quality', impact_description: 'Desc2', risk_level: 'HIGH' },
      ],
    };

    it('should create impacts and transition to IMPACT_ASSESSED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCc('SUBMITTED'));
      mockRepo.createImpact.mockResolvedValue({ id: 'imp-1' });
      mockRepo.update.mockResolvedValue(makeCc('IMPACT_ASSESSED'));

      const result = await useCase.execute(CC_ID, dto as never, ASSESSOR_ID);

      expect(result.status).toBe('IMPACT_ASSESSED');
      expect(mockRepo.createImpact).toHaveBeenCalledTimes(2);
    });

    it('should calculate maximum risk level', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCc('SUBMITTED'));
      mockRepo.createImpact.mockResolvedValue({ id: 'imp-1' });
      mockRepo.update.mockResolvedValue(makeCc('IMPACT_ASSESSED'));

      await useCase.execute(CC_ID, dto as never, ASSESSOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.change.impact_assessed');
      expect(event.payload.payload.maxRiskLevel).toBe('HIGH');
    });

    it('should handle single LOW risk impact', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCc('SUBMITTED'));
      mockRepo.createImpact.mockResolvedValue({ id: 'imp-1' });
      mockRepo.update.mockResolvedValue(makeCc('IMPACT_ASSESSED'));

      const singleDto = {
        impacts: [{ area: 'A', impact_description: 'D', risk_level: 'LOW' }],
      };

      await useCase.execute(CC_ID, singleDto as never, ASSESSOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.payload.maxRiskLevel).toBe('LOW');
    });

    it('should handle CRITICAL risk level', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCc('SUBMITTED'));
      mockRepo.createImpact.mockResolvedValue({ id: 'imp-1' });
      mockRepo.update.mockResolvedValue(makeCc('IMPACT_ASSESSED'));

      const criticalDto = {
        impacts: [
          { area: 'A', impact_description: 'D', risk_level: 'MEDIUM' },
          { area: 'B', impact_description: 'D', risk_level: 'CRITICAL' },
        ],
      };

      await useCase.execute(CC_ID, criticalDto as never, ASSESSOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.payload.maxRiskLevel).toBe('CRITICAL');
    });

    it('should reject invalid transition', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCc('DRAFT'));

      await expect(useCase.execute(CC_ID, dto as never, ASSESSOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rethrow non-workflow errors', async () => {
      mockRepo.findByIdOrThrow.mockRejectedValue(new Error('DB down'));

      await expect(useCase.execute(CC_ID, dto as never, ASSESSOR_ID)).rejects.toThrow('DB down');
    });
  });
});
