import { ConflictException } from '@nestjs/common';
import { CapaWorkflowUseCase } from './capa-workflow.use-case';
import type { CAPA, ElectronicSignature } from '@gacp-erp/shared-schemas';
import type { UserId } from '@gacp-erp/shared-schemas';

// Test signature fixture satisfying 21 CFR Part 11 structure
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
  signature_meaning: 'I approve this CAPA closure',
  signed_at: '2026-01-01T00:00:00.000Z',
});

const OPERATOR_ID = '00000000-0000-0000-0000-000000000099';
const CAPA_ID = '00000000-0000-0000-0000-000000000001';

const makeCapa = (status: CAPA['status']): CAPA => ({
  id: CAPA_ID,
  capa_number: 'CA-2026-0001',
  type: 'CORRECTIVE',
  source: 'DEVIATION',
  status,
  title: 'Test CAPA',
  description: 'Root cause analysis required',
  root_cause_category: null,
  source_record_type: null,
  source_record_id: null,
  due_date: null,
  assigned_to: null,
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
  nextCapaNumber: jest.fn().mockResolvedValue('CA-2026-0001'),
  create: jest.fn(),
  update: jest.fn(),
  findByIdOrThrow: jest.fn(),
  createRcaFinding: jest.fn(),
  createActionPlans: jest.fn(),
  createEffectivenessCheck: jest.fn(),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

describe('CapaWorkflowUseCase', () => {
  let useCase: CapaWorkflowUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));
    mockOutboxRepo.createWithTx.mockResolvedValue(undefined);

    useCase = new CapaWorkflowUseCase(mockDb as never, mockRepo as never, mockOutboxRepo as never);
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = {
      type: 'CORRECTIVE' as const,
      source: 'DEVIATION' as const,
      title: 'Test CAPA',
      description: 'Root cause analysis required',
    };

    it('should create a CAPA in OPEN status', async () => {
      mockRepo.create.mockResolvedValue(makeCapa('OPEN'));

      const result = await useCase.create(dto, OPERATOR_ID);

      expect(result.status).toBe('OPEN');
      expect(mockRepo.nextCapaNumber).toHaveBeenCalledTimes(1);
    });

    it('should publish CapaInitiatedEvent', async () => {
      mockRepo.create.mockResolvedValue(makeCapa('OPEN'));

      await useCase.create(dto, OPERATOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.capa.initiated');
      expect(event.topic).toBe('quality.capa.v1');
    });
  });

  // ─── initiateRca ───────────────────────────────────────────────────────────

  describe('initiateRca()', () => {
    const dto = {
      root_cause_category: 'HUMAN_ERROR' as const,
      root_cause_description: 'Operator did not follow SOP',
      contributing_factors: ['Lack of training'],
      immediate_actions_taken: 'Retraining scheduled',
    };

    it('should transition to RCA_IN_PROGRESS', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCapa('OPEN'));
      mockRepo.createRcaFinding.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeCapa('RCA_IN_PROGRESS'));

      const result = await useCase.initiateRca(CAPA_ID, dto, OPERATOR_ID);

      expect(result.status).toBe('RCA_IN_PROGRESS');
      expect(mockRepo.createRcaFinding).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if already past OPEN', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCapa('CLOSED'));

      await expect(useCase.initiateRca(CAPA_ID, dto, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should publish RcaCompletedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCapa('OPEN'));
      mockRepo.createRcaFinding.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeCapa('RCA_IN_PROGRESS'));

      await useCase.initiateRca(CAPA_ID, dto, OPERATOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.capa.rca_completed');
    });
  });

  // ─── createActionPlan ──────────────────────────────────────────────────────

  describe('createActionPlan()', () => {
    const dto = {
      actions: [
        {
          description: 'Retrain operators',
          responsible_person: 'QA Manager',
          target_date: '2026-04-01',
        },
      ],
    };

    it('should transition to ACTION_PLAN and create actions', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCapa('RCA_IN_PROGRESS'));
      mockRepo.createActionPlans.mockResolvedValue(undefined);
      mockRepo.update.mockResolvedValue(makeCapa('ACTION_PLAN'));

      const result = await useCase.createActionPlan(CAPA_ID, dto, OPERATOR_ID);

      expect(result.status).toBe('ACTION_PLAN');
      expect(mockRepo.createActionPlans).toHaveBeenCalledWith(
        expect.anything(),
        CAPA_ID,
        dto.actions,
      );
    });

    it('should publish ActionPlanCreatedEvent with correct action count', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCapa('RCA_IN_PROGRESS'));
      mockRepo.createActionPlans.mockResolvedValue(undefined);
      mockRepo.update.mockResolvedValue(makeCapa('ACTION_PLAN'));

      await useCase.createActionPlan(CAPA_ID, dto, OPERATOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.capa.action_plan_created');
      expect(event.payload.payload.actionCount).toBe(1);
    });
  });

  // ─── close ─────────────────────────────────────────────────────────────────

  describe('close()', () => {
    const closureDto = {
      closure_summary: 'All corrective actions implemented and verified successfully.',
      electronic_signature: makeSignature(OPERATOR_ID),
    };

    it('should transition to CLOSED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCapa('EFFECTIVENESS_CHECK'));
      mockRepo.update.mockResolvedValue(makeCapa('CLOSED'));

      const result = await useCase.close(CAPA_ID, closureDto, OPERATOR_ID);

      expect(result.status).toBe('CLOSED');
    });

    it('should throw ConflictException if not in EFFECTIVENESS_CHECK', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCapa('OPEN'));

      await expect(useCase.close(CAPA_ID, closureDto, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should publish CapaClosedEvent with auditTxId', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCapa('EFFECTIVENESS_CHECK'));
      mockRepo.update.mockResolvedValue(makeCapa('CLOSED'));

      await useCase.close(CAPA_ID, closureDto, OPERATOR_ID);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.capa.closed');
      expect(event.payload.payload).toMatchObject({
        closedBy: OPERATOR_ID,
        auditTxId: null,
      });
    });
  });
});
