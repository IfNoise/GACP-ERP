import { ConflictException } from '@nestjs/common';
import { ValidationProtocolWorkflowUseCase } from './validation-protocol-workflow.use-case';
import type { ValidationProtocol, ElectronicSignature, UserId } from '@gacp-erp/shared-schemas';

const OPERATOR_ID = '00000000-0000-0000-0000-000000000099';
const PROTOCOL_ID = '00000000-0000-0000-0000-000000000001';

const makeSignature = (): ElectronicSignature => ({
  signed_by: OPERATOR_ID as UserId,
  signer_name: 'Quality Manager',
  signer_role: 'QA',
  signature_type: 'approval',
  authentication_method: 'password',
  digital_signature: 'a'.repeat(256),
  content_hash: 'a'.repeat(64),
  ip_address: '127.0.0.1',
  workstation_id: 'WS-001',
  signature_meaning: 'I approve this validation protocol',
  signed_at: '2026-01-01T00:00:00.000Z',
});

const makeProtocol = (
  status: ValidationProtocol['status'],
  steps: ValidationProtocol['test_steps'] = [],
): ValidationProtocol => ({
  id: PROTOCOL_ID,
  protocol_number: 'VAL-2026-0001',
  type: 'OQ',
  status,
  system_under_test: 'Reactor Pump P-101',
  change_control_id: null,
  test_steps: steps,
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

const makeStep = (
  status: 'PENDING' | 'PASS' | 'FAIL' | 'NOT_APPLICABLE',
): ValidationProtocol['test_steps'][0] => ({
  id: '00000000-0000-0000-0000-000000000011',
  protocol_id: PROTOCOL_ID,
  step_number: 1,
  description: 'Start the pump',
  expected_result: 'Pump starts within 5 seconds',
  actual_result: null,
  status,
  exception_note: null,
  executed_by: null,
  executed_at: null,
  electronic_signature: null,
});

const mockRepo = {
  findByIdOrThrow: jest.fn(),
  update: jest.fn(),
  upsertTestStep: jest.fn(),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

describe('ValidationProtocolWorkflowUseCase', () => {
  let useCase: ValidationProtocolWorkflowUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));
    mockOutboxRepo.createWithTx.mockResolvedValue(undefined);
    useCase = new ValidationProtocolWorkflowUseCase(
      mockDb as never,
      mockRepo as never,
      mockOutboxRepo as never,
    );
  });

  // ─── submitForReview ────────────────────────────────────────────────────────

  describe('submitForReview()', () => {
    it('should transition DRAFT → REVIEW', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('DRAFT'));
      mockRepo.update.mockResolvedValue(makeProtocol('REVIEW'));

      const result = await useCase.submitForReview(PROTOCOL_ID, OPERATOR_ID);

      expect(result.status).toBe('REVIEW');
      expect(mockRepo.update).toHaveBeenCalledWith(expect.anything(), PROTOCOL_ID, {
        status: 'REVIEW',
        updated_by: OPERATOR_ID,
      });
    });

    it('should throw ConflictException for EXECUTING → REVIEW', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('EXECUTING'));

      await expect(useCase.submitForReview(PROTOCOL_ID, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── approve ───────────────────────────────────────────────────────────────

  describe('approve()', () => {
    it('should transition REVIEW → APPROVED and store signature', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('REVIEW'));
      mockRepo.update.mockResolvedValue(makeProtocol('APPROVED'));

      const result = await useCase.approve(
        PROTOCOL_ID,
        { electronic_signature: makeSignature() },
        OPERATOR_ID,
      );

      expect(result.status).toBe('APPROVED');
      const updateArgs = mockRepo.update.mock.calls[0][2];
      expect(updateArgs.electronic_signature).toBeDefined();
    });

    it('should throw ConflictException when protocol is not in REVIEW', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('DRAFT'));

      await expect(
        useCase.approve(PROTOCOL_ID, { electronic_signature: makeSignature() }, OPERATOR_ID),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── startExecution ────────────────────────────────────────────────────────

  describe('startExecution()', () => {
    it('should transition APPROVED → EXECUTING and publish ValidationStartedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('APPROVED'));
      mockRepo.update.mockResolvedValue(makeProtocol('EXECUTING'));

      const result = await useCase.startExecution(PROTOCOL_ID, OPERATOR_ID);

      expect(result.status).toBe('EXECUTING');
      const [, outboxEntry] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(outboxEntry.payload.eventType).toBe('quality.validation.started');
    });
  });

  // ─── executeTest ───────────────────────────────────────────────────────────

  describe('executeTest()', () => {
    const executeDto = {
      step_number: 1,
      actual_result: 'Pump started in 3 seconds',
      status: 'PASS' as const,
      electronic_signature: makeSignature(),
    };

    it('should publish TestExecutedEvent on PASS', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('EXECUTING', [makeStep('PENDING')]));
      mockRepo.upsertTestStep.mockResolvedValue(makeProtocol('EXECUTING', [makeStep('PASS')]));

      await useCase.executeTest(PROTOCOL_ID, executeDto, OPERATOR_ID);

      const eventTypes = mockOutboxRepo.createWithTx.mock.calls.map(
        ([, e]: [unknown, { payload: { eventType: string } }]) => e.payload.eventType,
      );
      expect(eventTypes).toContain('quality.validation.test_executed');
    });

    it('should publish both TestExecutedEvent and ExceptionRaisedEvent on FAIL', async () => {
      const failDto = {
        ...executeDto,
        status: 'FAIL' as const,
        exception_note: 'Pump did not start',
      };
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('EXECUTING', [makeStep('PENDING')]));
      mockRepo.upsertTestStep.mockResolvedValue(makeProtocol('EXECUTING', [makeStep('FAIL')]));

      await useCase.executeTest(PROTOCOL_ID, failDto, OPERATOR_ID);

      const eventTypes = mockOutboxRepo.createWithTx.mock.calls.map(
        ([, e]: [unknown, { payload: { eventType: string } }]) => e.payload.eventType,
      );
      expect(eventTypes).toContain('quality.validation.test_executed');
      expect(eventTypes).toContain('quality.validation.exception_raised');
    });

    it('should throw Error when protocol is not EXECUTING', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('APPROVED'));

      await expect(useCase.executeTest(PROTOCOL_ID, executeDto, OPERATOR_ID)).rejects.toThrow();
    });
  });

  // ─── complete ──────────────────────────────────────────────────────────────

  describe('complete()', () => {
    it('should transition EXECUTING → COMPLETED and publish ValidationCompletedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('EXECUTING', [makeStep('PASS')]));
      mockRepo.update.mockResolvedValue(makeProtocol('COMPLETED'));

      const result = await useCase.complete(PROTOCOL_ID, OPERATOR_ID);

      expect(result.status).toBe('COMPLETED');
      const [, outboxEntry] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(outboxEntry.payload.eventType).toBe('quality.validation.completed');
      expect(outboxEntry.payload.payload.passRatePct).toBe(100);
    });

    it('should calculate pass rate of 0 with no steps', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('EXECUTING', []));
      mockRepo.update.mockResolvedValue(makeProtocol('COMPLETED'));

      await useCase.complete(PROTOCOL_ID, OPERATOR_ID);

      const [, outboxEntry] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(outboxEntry.payload.payload.passRatePct).toBe(0);
    });
  });

  // ─── close ─────────────────────────────────────────────────────────────────

  describe('close()', () => {
    const closeDto = {
      closure_summary: 'All tests passed. System validated successfully.',
      electronic_signature: makeSignature(),
    };

    it('should transition COMPLETED → CLOSED and publish ValidationClosedEvent', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('COMPLETED'));
      mockRepo.update.mockResolvedValue(makeProtocol('CLOSED'));

      const result = await useCase.close(PROTOCOL_ID, closeDto, OPERATOR_ID);

      expect(result.status).toBe('CLOSED');
      const [, outboxEntry] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(outboxEntry.payload.eventType).toBe('quality.validation.closed');
      expect(outboxEntry.payload.payload.closureSummary).toBe(closeDto.closure_summary);
    });

    it('should throw ConflictException when protocol is not COMPLETED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeProtocol('EXECUTING'));

      await expect(useCase.close(PROTOCOL_ID, closeDto, OPERATOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
