import { ConflictException } from '@nestjs/common';
import { DeviationWorkflowUseCase } from './deviation-workflow.use-case';
import type { Deviation, ElectronicSignature, UserId } from '@gacp-erp/shared-schemas';

const OPERATOR_ID = '00000000-0000-0000-0000-000000000099';

const makeSignature = (userId: string): ElectronicSignature => ({
  signed_by: userId as UserId,
  signer_name: 'Test User',
  signer_role: 'Quality Manager',
  signature_type: 'approval',
  authentication_method: 'password',
  digital_signature: 'a'.repeat(256),
  content_hash: 'a'.repeat(64),
  ip_address: '127.0.0.1',
  workstation_id: 'WORKSTATION-001',
  signature_meaning: 'I approve this deviation action',
  signed_at: '2026-01-01T00:00:00.000Z',
});
const DEV_ID = '00000000-0000-0000-0000-000000000001';

const makeDeviation = (status: Deviation['status']): Deviation => ({
  id: DEV_ID,
  deviation_number: 'DEV-2026-0001',
  classification: 'MINOR',
  category: 'DOCUMENTATION',
  status,
  title: 'Test deviation',
  description: 'Description',
  location: null,
  batch_ids: [],
  occurred_at: null,
  reported_by: OPERATOR_ID as UserId,
  linked_capa_id: null,
  product_impact: null,
  electronic_signature: null,
  validation_status: 'unvalidated',
  validation_protocol_id: null,
  last_validated_at: null,
  next_review_date: null,
  retention_class: '7_YEAR',
  audit_tx_id: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: OPERATOR_ID as UserId,
  updated_by: OPERATOR_ID as UserId,
});

const mockRepo = {
  nextDeviationNumber: jest.fn().mockResolvedValue('DEV-2026-0001'),
  create: jest.fn(),
  update: jest.fn(),
  findByIdOrThrow: jest.fn(),
  createInvestigation: jest.fn(),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

describe('DeviationWorkflowUseCase', () => {
  let useCase: DeviationWorkflowUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));
    mockOutboxRepo.createWithTx.mockResolvedValue(undefined);

    useCase = new DeviationWorkflowUseCase(
      mockDb as never,
      mockRepo as never,
      mockOutboxRepo as never,
    );
  });

  describe('report', () => {
    const dto = {
      classification: 'MINOR' as const,
      category: 'DOCUMENTATION' as const,
      title: 'Test',
      description: 'Desc',
    };

    it('should create a deviation in REPORTED status', async () => {
      mockRepo.create.mockResolvedValue(makeDeviation('REPORTED'));

      const result = await useCase.report(dto, OPERATOR_ID);

      expect(result.status).toBe('REPORTED');
      expect(mockRepo.nextDeviationNumber).toHaveBeenCalled();
    });

    it('should publish DeviationReportedEvent', async () => {
      mockRepo.create.mockResolvedValue(makeDeviation('REPORTED'));

      await useCase.report(dto, OPERATOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.deviation.reported');
    });

    it('should handle optional fields', async () => {
      mockRepo.create.mockResolvedValue(makeDeviation('REPORTED'));

      await useCase.report(
        { ...dto, location: 'Lab A', batch_ids: ['b1'], occurred_at: '2026-01-01' },
        OPERATOR_ID,
      );

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          location: 'Lab A',
          batch_ids: ['b1'],
          occurred_at: '2026-01-01',
        }),
      );
    });
  });

  describe('investigate', () => {
    const dto = {
      investigation_summary: 'Summary',
      immediate_containment_actions: 'Actions',
      product_impact_assessment: 'None',
      electronic_signature: makeSignature(OPERATOR_ID),
    };

    it('should transition to UNDER_INVESTIGATION', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('REPORTED'));
      mockRepo.createInvestigation.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeDeviation('UNDER_INVESTIGATION'));

      const result = await useCase.investigate(DEV_ID, dto, OPERATOR_ID);

      expect(result.status).toBe('UNDER_INVESTIGATION');
    });

    it('should reject invalid transition', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('CLOSED'));

      await expect(useCase.investigate(DEV_ID, dto, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should publish DeviationInvestigatedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('REPORTED'));
      mockRepo.createInvestigation.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeDeviation('UNDER_INVESTIGATION'));

      await useCase.investigate(DEV_ID, dto, OPERATOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.deviation.investigated');
    });
  });

  describe('assessImpact', () => {
    const dto = { product_impact: 'NONE' as const, capa_required: false };

    it('should transition to IMPACT_ASSESSED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('UNDER_INVESTIGATION'));
      mockRepo.update.mockResolvedValue(makeDeviation('IMPACT_ASSESSED'));

      const result = await useCase.assessImpact(DEV_ID, dto, OPERATOR_ID);

      expect(result.status).toBe('IMPACT_ASSESSED');
    });

    it('should reject invalid transition', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('REPORTED'));

      await expect(useCase.assessImpact(DEV_ID, dto, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('linkCapa', () => {
    it('should transition to CAPA_INITIATED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('IMPACT_ASSESSED'));
      mockRepo.update.mockResolvedValue(makeDeviation('CAPA_INITIATED'));

      const result = await useCase.linkCapa(DEV_ID, 'capa-1', 'CA-2026-0001', OPERATOR_ID);

      expect(result.status).toBe('CAPA_INITIATED');
    });

    it('should publish DeviationCapaLinkedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('IMPACT_ASSESSED'));
      mockRepo.update.mockResolvedValue(makeDeviation('CAPA_INITIATED'));

      await useCase.linkCapa(DEV_ID, 'capa-1', 'CA-2026-0001', OPERATOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.deviation.capa_linked');
    });
  });

  describe('close', () => {
    const dto = {
      closure_summary: 'All actions completed',
      electronic_signature: makeSignature(OPERATOR_ID),
    };

    it('should transition to CLOSED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('CAPA_INITIATED'));
      mockRepo.update.mockResolvedValue(makeDeviation('CLOSED'));

      const result = await useCase.close(DEV_ID, dto, OPERATOR_ID);

      expect(result.status).toBe('CLOSED');
    });

    it('should publish DeviationClosedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('CAPA_INITIATED'));
      mockRepo.update.mockResolvedValue(makeDeviation('CLOSED'));

      await useCase.close(DEV_ID, dto as never, OPERATOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.deviation.closed');
    });

    it('should reject invalid transition', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeDeviation('REPORTED'));

      await expect(useCase.close(DEV_ID, dto as never, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
