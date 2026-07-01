import { NotFoundException, ConflictException } from '@nestjs/common';
import { RequestIfcApprovalUseCase } from './request-ifc-approval.use-case';
import type { IfcRevisionRepository } from '../ifc-revision.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { IfcRevision, IfcRequestApprovalBody } from '@gacp-erp/shared-schemas';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeRevision = (status: IfcRevision['status']): IfcRevision => ({
  revision_id: 'aaaaaaaa-0000-4000-8000-000000000001',
  model_id: 'model-001',
  source_file_uri: 's3://ifc/model-001/rev1.ifc',
  source_file_hash: 'a'.repeat(64),
  status,
  uploaded_by: 'bbbbbbbb-0000-4000-8000-000000000001',
  uploaded_at: '2026-07-01T00:00:00.000Z',
  approved_at: null,
  approved_by: [],
  change_control_id: null,
});

const approvalBody: IfcRequestApprovalBody = {
  change_control_id: 'CC-2026-001',
  impacted_domains: ['spatial'],
  approval_packet_uri: 's3://ifc/model-001/rev1-approval.pdf',
};

const revisionId = 'aaaaaaaa-0000-4000-8000-000000000001';
const userId = 'bbbbbbbb-0000-4000-8000-000000000001';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RequestIfcApprovalUseCase', () => {
  let useCase: RequestIfcApprovalUseCase;
  let revisionRepo: jest.Mocked<IfcRevisionRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    revisionRepo = {
      findById: jest.fn(),
      updateStatusWithTx: jest.fn(),
    } as unknown as jest.Mocked<IfcRevisionRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<IfcRevision>) => cb(mockDb)),
    };

    useCase = new RequestIfcApprovalUseCase(mockDb as never, revisionRepo, outboxRepo);
  });

  describe('validation', () => {
    it('throws NotFoundException when revision does not exist', async () => {
      revisionRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(revisionId, approvalBody, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when revision is already approved', async () => {
      revisionRepo.findById.mockResolvedValue(makeRevision('approved'));

      await expect(useCase.execute(revisionId, approvalBody, userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when revision is already rejected', async () => {
      revisionRepo.findById.mockResolvedValue(makeRevision('rejected'));

      await expect(useCase.execute(revisionId, approvalBody, userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when revision is already pending_approval', async () => {
      revisionRepo.findById.mockResolvedValue(makeRevision('pending_approval'));

      await expect(useCase.execute(revisionId, approvalBody, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('successful approval request', () => {
    const updatedRevision = makeRevision('pending_approval');

    beforeEach(() => {
      revisionRepo.findById.mockResolvedValue(makeRevision('diff_ready'));
      revisionRepo.updateStatusWithTx.mockResolvedValue(updatedRevision);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the updated revision', async () => {
      const result = await useCase.execute(revisionId, approvalBody, userId);

      expect(result).toEqual(updatedRevision);
    });

    it('updates status to pending_approval with change_control_id', async () => {
      await useCase.execute(revisionId, approvalBody, userId);

      expect(revisionRepo.updateStatusWithTx).toHaveBeenCalledWith(
        mockDb,
        revisionId,
        expect.objectContaining({
          status: 'pending_approval',
          change_control_id: approvalBody.change_control_id,
        }),
      );
    });

    it('publishes ifc.ingestion.approval_requested event to outbox', async () => {
      await useCase.execute(revisionId, approvalBody, userId);

      expect(outboxRepo.createWithTx).toHaveBeenCalledWith(
        mockDb,
        expect.objectContaining({
          topic: 'ifc.ingestion.v1',
          key: revisionId,
          payload: expect.objectContaining({ eventType: 'ifc.ingestion.approval_requested' }),
        }),
      );
    });

    it('wraps all writes in a single transaction', async () => {
      await useCase.execute(revisionId, approvalBody, userId);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });
});
