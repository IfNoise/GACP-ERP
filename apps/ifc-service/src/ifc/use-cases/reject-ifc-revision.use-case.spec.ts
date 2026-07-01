import { NotFoundException, ConflictException } from '@nestjs/common';
import { RejectIfcRevisionUseCase } from './reject-ifc-revision.use-case';
import type { IfcRevisionRepository } from '../ifc-revision.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { IfcRevision, IfcRejectRevisionBody } from '@gacp-erp/shared-schemas';

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

const rejectBody: IfcRejectRevisionBody = {
  rejection_reason: 'Spatial topology errors detected in zone A3',
  remediation_notes: 'Re-export with correct IfcSpace boundaries',
};

const revisionId = 'aaaaaaaa-0000-4000-8000-000000000001';
const userId = 'bbbbbbbb-0000-4000-8000-000000000001';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RejectIfcRevisionUseCase', () => {
  let useCase: RejectIfcRevisionUseCase;
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

    useCase = new RejectIfcRevisionUseCase(mockDb as never, revisionRepo, outboxRepo);
  });

  describe('validation', () => {
    it('throws NotFoundException when revision does not exist', async () => {
      revisionRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(revisionId, rejectBody, userId)).rejects.toThrow(
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

      await expect(useCase.execute(revisionId, rejectBody, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('successful rejection', () => {
    const rejectedRevision = makeRevision('rejected');

    beforeEach(() => {
      revisionRepo.findById.mockResolvedValue(makeRevision('pending_approval'));
      revisionRepo.updateStatusWithTx.mockResolvedValue(rejectedRevision);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the rejected revision', async () => {
      const result = await useCase.execute(revisionId, rejectBody, userId);

      expect(result).toEqual(rejectedRevision);
    });

    it('updates status to rejected', async () => {
      await useCase.execute(revisionId, rejectBody, userId);

      expect(revisionRepo.updateStatusWithTx).toHaveBeenCalledWith(
        mockDb,
        revisionId,
        expect.objectContaining({ status: 'rejected' }),
      );
    });

    it('publishes ifc.ingestion.rejected event with rejection_reason to outbox', async () => {
      await useCase.execute(revisionId, rejectBody, userId);

      expect(outboxRepo.createWithTx).toHaveBeenCalledWith(
        mockDb,
        expect.objectContaining({
          topic: 'ifc.ingestion.v1',
          key: revisionId,
          payload: expect.objectContaining({
            eventType: 'ifc.ingestion.rejected',
            payload: expect.objectContaining({
              rejectionReason: rejectBody.rejection_reason,
            }),
          }),
        }),
      );
    });

    it('wraps all writes in a single transaction', async () => {
      await useCase.execute(revisionId, rejectBody, userId);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });
});
