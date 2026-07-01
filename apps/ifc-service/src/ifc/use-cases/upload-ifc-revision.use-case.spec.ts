import { ConflictException } from '@nestjs/common';
import { UploadIfcRevisionUseCase } from './upload-ifc-revision.use-case';
import type { IfcRevisionRepository } from '../ifc-revision.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { IfcRevision, IfcUploadRevisionBody } from '@gacp-erp/shared-schemas';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeRevision: IfcRevision = {
  revision_id: 'aaaaaaaa-0000-4000-8000-000000000001',
  model_id: 'model-001',
  source_file_uri: 's3://ifc/model-001/rev1.ifc',
  source_file_hash: 'a'.repeat(64),
  status: 'uploaded',
  uploaded_by: 'bbbbbbbb-0000-4000-8000-000000000001',
  uploaded_at: '2026-07-01T00:00:00.000Z',
  approved_at: null,
  approved_by: [],
  change_control_id: null,
};

const uploadBody: IfcUploadRevisionBody = {
  model_id: 'model-001',
  source_file_uri: 's3://ifc/model-001/rev1.ifc',
  source_file_hash: 'a'.repeat(64),
};

const userId = 'bbbbbbbb-0000-4000-8000-000000000001';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UploadIfcRevisionUseCase', () => {
  let useCase: UploadIfcRevisionUseCase;
  let revisionRepo: jest.Mocked<IfcRevisionRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    revisionRepo = {
      findByHash: jest.fn(),
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<IfcRevisionRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<IfcRevision>) => cb(mockDb)),
    };

    useCase = new UploadIfcRevisionUseCase(mockDb as never, revisionRepo, outboxRepo);
  });

  describe('duplicate hash check', () => {
    it('throws ConflictException when revision with same hash already exists', async () => {
      revisionRepo.findByHash.mockResolvedValue(fakeRevision);

      await expect(useCase.execute(uploadBody, userId)).rejects.toThrow(ConflictException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('successful upload', () => {
    beforeEach(() => {
      revisionRepo.findByHash.mockResolvedValue(null);
      revisionRepo.createWithTx.mockResolvedValue(fakeRevision);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the created revision', async () => {
      const result = await useCase.execute(uploadBody, userId);

      expect(result).toEqual(fakeRevision);
    });

    it('calls revisionRepo.createWithTx inside transaction', async () => {
      await useCase.execute(uploadBody, userId);

      expect(revisionRepo.createWithTx).toHaveBeenCalledWith(
        mockDb,
        expect.objectContaining({
          model_id: uploadBody.model_id,
          source_file_uri: uploadBody.source_file_uri,
          source_file_hash: uploadBody.source_file_hash,
        }),
      );
    });

    it('calls outboxRepo.createWithTx with ifc.ingestion.started event inside same transaction', async () => {
      await useCase.execute(uploadBody, userId);

      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      expect(outboxRepo.createWithTx).toHaveBeenCalledWith(
        mockDb,
        expect.objectContaining({
          topic: 'ifc.ingestion.v1',
          key: fakeRevision.revision_id,
          payload: expect.objectContaining({ eventType: 'ifc.ingestion.started' }),
        }),
      );
    });

    it('wraps repo and outbox writes in a single transaction', async () => {
      await useCase.execute(uploadBody, userId);

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('transaction failure', () => {
    it('propagates error if transaction throws', async () => {
      revisionRepo.findByHash.mockResolvedValue(null);
      mockDb.transaction.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(uploadBody, userId)).rejects.toThrow('DB error');
    });
  });
});
