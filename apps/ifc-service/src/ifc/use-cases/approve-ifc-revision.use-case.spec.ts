import { NotFoundException, ConflictException } from '@nestjs/common';
import { ApproveIfcRevisionUseCase } from './approve-ifc-revision.use-case';
import type { IfcRevisionRepository } from '../ifc-revision.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { IfcRevision, IfcApproveRevisionBody } from '@gacp-erp/shared-schemas';

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
  change_control_id: 'CC-2026-001',
});

const approveBody: IfcApproveRevisionBody = {
  approval_reason: 'All spatial changes reviewed and confirmed',
  change_control_id: 'CC-2026-001',
  approved_domains: ['spatial', 'financial'],
};

const revisionId = 'aaaaaaaa-0000-4000-8000-000000000001';
const userId = 'bbbbbbbb-0000-4000-8000-000000000001';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ApproveIfcRevisionUseCase', () => {
  let useCase: ApproveIfcRevisionUseCase;
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

    useCase = new ApproveIfcRevisionUseCase(mockDb as never, revisionRepo, outboxRepo);
  });

  describe('validation', () => {
    it('throws NotFoundException when revision does not exist', async () => {
      revisionRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(revisionId, approveBody, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it.each<IfcRevision['status']>([
      'uploaded',
      'parsed',
      'diff_ready',
      'approved',
      'rejected',
      'projected',
      'failed',
    ])('throws ConflictException when status is %s (not pending_approval)', async (status) => {
      revisionRepo.findById.mockResolvedValue(makeRevision(status));

      await expect(useCase.execute(revisionId, approveBody, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('successful approval', () => {
    const approvedRevision = {
      ...makeRevision('approved'),
      approved_at: '2026-07-01T00:00:00.000Z',
      approved_by: [userId],
    };

    beforeEach(() => {
      revisionRepo.findById.mockResolvedValue(makeRevision('pending_approval'));
      revisionRepo.updateStatusWithTx.mockResolvedValue(approvedRevision);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the approved revision', async () => {
      const result = await useCase.execute(revisionId, approveBody, userId);

      expect(result).toEqual(approvedRevision);
    });

    it('updates status to approved with approved_by and approved_at', async () => {
      await useCase.execute(revisionId, approveBody, userId);

      expect(revisionRepo.updateStatusWithTx).toHaveBeenCalledWith(
        mockDb,
        revisionId,
        expect.objectContaining({
          status: 'approved',
          approved_by: [userId],
          approved_at: expect.any(Date),
        }),
      );
    });

    it('publishes ifc.ingestion.approved event to outbox', async () => {
      await useCase.execute(revisionId, approveBody, userId);

      expect(outboxRepo.createWithTx).toHaveBeenCalledWith(
        mockDb,
        expect.objectContaining({
          topic: 'ifc.ingestion.v1',
          key: revisionId,
          payload: expect.objectContaining({
            eventType: 'ifc.ingestion.approved',
            payload: expect.objectContaining({
              baselineSwitched: true,
            }),
          }),
        }),
      );
    });

    it('wraps all writes in a single transaction', async () => {
      await useCase.execute(revisionId, approveBody, userId);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });
});
