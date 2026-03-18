import { ConflictException, NotFoundException } from '@nestjs/common';
import { ChangeControlWorkflowUseCase } from './change-control-workflow.use-case';
import type { ChangeControl, ElectronicSignature } from '@gacp-erp/shared-schemas';
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
  signature_meaning: 'I approve this change control',
  signed_at: '2026-01-01T00:00:00.000Z',
});

// ─── STUBS ────────────────────────────────────────────────────────────────────

const OPERATOR_ID = '00000000-0000-0000-0000-000000000099';
const CC_ID = '00000000-0000-0000-0000-000000000001';

const makeCC = (status: ChangeControl['status']): ChangeControl => ({
  id: CC_ID,
  ccn_number: 'CCN-2026-0001',
  title: 'Update SOP',
  description: 'text',
  change_type: 'MINOR',
  status,
  requestor_id: OPERATOR_ID as UserId,
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
  created_by: OPERATOR_ID as UserId,
  updated_by: OPERATOR_ID as UserId,
});

const mockRepo = {
  findByIdOrThrow: jest.fn(),
  update: jest.fn(),
  createApproval: jest.fn(),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('ChangeControlWorkflowUseCase', () => {
  let useCase: ChangeControlWorkflowUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));
    mockOutboxRepo.createWithTx.mockResolvedValue(undefined);

    useCase = new ChangeControlWorkflowUseCase(
      mockDb as never,
      mockRepo as never,
      mockOutboxRepo as never,
    );
  });

  // ─── submit ────────────────────────────────────────────────────────────────

  describe('submit()', () => {
    it('should update status to SUBMITTED', async () => {
      const submitted = makeCC('SUBMITTED');
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('DRAFT'));
      mockRepo.update.mockResolvedValue(submitted);

      const result = await useCase.submit(CC_ID, OPERATOR_ID);

      expect(mockRepo.update).toHaveBeenCalledWith(
        expect.anything(),
        CC_ID,
        expect.objectContaining({ status: 'SUBMITTED', updated_by: OPERATOR_ID }),
      );
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw ConflictException if transition is not allowed', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('CLOSED'));

      await expect(useCase.submit(CC_ID, OPERATOR_ID)).rejects.toThrow(ConflictException);
    });

    it('should publish ChangeSubmittedEvent to outbox', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('DRAFT'));
      mockRepo.update.mockResolvedValue(makeCC('SUBMITTED'));

      await useCase.submit(CC_ID, OPERATOR_ID);

      expect(mockOutboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.change.submitted');
      expect(event.payload.payload.submittedBy).toBe(OPERATOR_ID);
    });

    it('should throw NotFoundException (from repo) if CC not found', async () => {
      mockRepo.findByIdOrThrow.mockRejectedValue(
        new NotFoundException(`Change Control ${CC_ID} not found`),
      );

      await expect(useCase.submit(CC_ID, OPERATOR_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve()', () => {
    it('should update status to APPROVED and record approval', async () => {
      const signature = makeSignature(OPERATOR_ID);
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('IMPACT_ASSESSED'));
      mockRepo.createApproval.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeCC('APPROVED'));

      const result = await useCase.approve(CC_ID, OPERATOR_ID, 1, signature);

      expect(mockRepo.createApproval).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          change_control_id: CC_ID,
          approver_id: OPERATOR_ID,
          approval_level: 1,
          status: 'APPROVED',
        }),
      );
      expect(result.status).toBe('APPROVED');
    });

    it('should throw ConflictException if not in IMPACT_ASSESSED state', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('DRAFT'));

      const signature = makeSignature(OPERATOR_ID);
      await expect(useCase.approve(CC_ID, OPERATOR_ID, 1, signature)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should publish ChangeApprovedEvent', async () => {
      const signature = makeSignature(OPERATOR_ID);
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('IMPACT_ASSESSED'));
      mockRepo.createApproval.mockResolvedValue({});
      mockRepo.update.mockResolvedValue(makeCC('APPROVED'));

      await useCase.approve(CC_ID, OPERATOR_ID, 1, signature);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.change.approved');
    });
  });

  // ─── reject ────────────────────────────────────────────────────────────────

  describe('reject()', () => {
    it('should update status to REJECTED', async () => {
      const signature = makeSignature(OPERATOR_ID);
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('SUBMITTED'));
      mockRepo.update.mockResolvedValue(makeCC('REJECTED'));

      await useCase.reject(CC_ID, OPERATOR_ID, 'Not compliant', signature);

      expect(mockRepo.update).toHaveBeenCalledWith(
        expect.anything(),
        CC_ID,
        expect.objectContaining({ status: 'REJECTED' }),
      );
    });

    it('should throw ConflictException if transition is not allowed', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('CLOSED'));

      const signature = makeSignature(OPERATOR_ID);
      await expect(useCase.reject(CC_ID, OPERATOR_ID, 'reason', signature)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should publish ChangeRejectedEvent with reason', async () => {
      const signature = makeSignature(OPERATOR_ID);
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('SUBMITTED'));
      mockRepo.update.mockResolvedValue(makeCC('REJECTED'));

      await useCase.reject(CC_ID, OPERATOR_ID, 'Not compliant with GMP', signature);

      const [, event] = mockOutboxRepo.createWithTx.mock.calls[0];
      expect(event.payload.eventType).toBe('quality.change.rejected');
      expect(event.payload.payload.rejectionReason).toBe('Not compliant with GMP');
    });
  });

  // ─── close ─────────────────────────────────────────────────────────────────

  describe('close()', () => {
    it('should update status to CLOSED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('VERIFIED'));
      mockRepo.update.mockResolvedValue(makeCC('CLOSED'));

      await useCase.close(CC_ID, OPERATOR_ID, 'All verifications passed');

      expect(mockRepo.update).toHaveBeenCalledWith(
        expect.anything(),
        CC_ID,
        expect.objectContaining({ status: 'CLOSED' }),
      );
    });

    it('should throw ConflictException if not VERIFIED', async () => {
      mockRepo.findByIdOrThrow.mockResolvedValue(makeCC('DRAFT'));

      await expect(useCase.close(CC_ID, OPERATOR_ID, 'summary')).rejects.toThrow(ConflictException);
    });
  });
});
