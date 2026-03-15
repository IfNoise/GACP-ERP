import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HarvestBatchUseCase, type HarvestBatchDto } from './harvest-batch.use-case';
import type { BatchesRepository } from '../batches.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Batch } from '@gacp-erp/shared-schemas';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'batch-uuid-1',
    batch_number: 'BATCH-2024-001',
    strain_id: 'strain-uuid-1',
    facility_id: 'facility-uuid-1',
    initial_quantity: 100,
    current_quantity: 80,
    status: 'ACTIVE',
    started_at: new Date().toISOString(),
    target_harvest_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'user-1',
    updated_by: 'user-1',
    deleted_at: null,
    ...overrides,
  } as unknown as Batch;
}

const harvestDto: HarvestBatchDto = {
  batchId: 'batch-uuid-1',
  freshWeightG: 5000,
  dryWeightG: 1200,
  qualityGrade: 'AA',
  harvestedBy: 'user-1',
  harvestSignature: { type: 'approval' },
  notes: 'Good harvest',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HarvestBatchUseCase', () => {
  let useCase: HarvestBatchUseCase;
  let batchesRepo: jest.Mocked<BatchesRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: {
    transaction: jest.Mock;
    insert: jest.Mock;
  };
  let insertValues: jest.Mock;

  beforeEach(() => {
    insertValues = jest.fn().mockResolvedValue(undefined);
    const insertChain = { values: insertValues };
    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<void>) => cb(mockDb)),
      insert: jest.fn().mockReturnValue(insertChain),
    };

    batchesRepo = {
      findById: jest.fn(),
      updateStatusWithTx: jest.fn(),
    } as unknown as jest.Mocked<BatchesRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    useCase = new HarvestBatchUseCase(mockDb as never, batchesRepo, outboxRepo);
  });

  describe('batch validation', () => {
    it('throws NotFoundException when batch does not exist', async () => {
      batchesRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute(harvestDto)).rejects.toThrow(NotFoundException);
    });

    it.each(['COMPLETED', 'DESTROYED', 'ON_HOLD'] as const)(
      'throws BadRequestException for batch in terminal status "%s"',
      async (status) => {
        batchesRepo.findById.mockResolvedValue(makeBatch({ status }));

        await expect(useCase.execute(harvestDto)).rejects.toThrow(BadRequestException);
      },
    );

    it('accepts ACTIVE batch', async () => {
      const batch = makeBatch({ status: 'ACTIVE' });
      batchesRepo.findById.mockResolvedValueOnce(batch).mockResolvedValueOnce(batch);
      batchesRepo.updateStatusWithTx.mockResolvedValue(undefined);
      outboxRepo.createWithTx.mockResolvedValue(undefined);

      await expect(useCase.execute(harvestDto)).resolves.toBeDefined();
    });

    it('accepts HARVESTING batch', async () => {
      const batch = makeBatch({ status: 'HARVESTING' });
      batchesRepo.findById.mockResolvedValueOnce(batch).mockResolvedValueOnce(batch);
      batchesRepo.updateStatusWithTx.mockResolvedValue(undefined);
      outboxRepo.createWithTx.mockResolvedValue(undefined);

      await expect(useCase.execute(harvestDto)).resolves.toBeDefined();
    });
  });

  describe('successful harvest', () => {
    const activeBatch = makeBatch({ status: 'ACTIVE' });
    const harvestingBatch = makeBatch({ status: 'HARVESTING' });

    beforeEach(() => {
      // findById called twice: once for validation, once after transaction
      batchesRepo.findById
        .mockResolvedValueOnce(activeBatch)
        .mockResolvedValueOnce(harvestingBatch);
      batchesRepo.updateStatusWithTx.mockResolvedValue(undefined);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('inserts a harvest_record inside the transaction', async () => {
      await useCase.execute(harvestDto);

      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          batch_id: harvestDto.batchId,
          fresh_weight_g: String(harvestDto.freshWeightG),
          harvested_by: harvestDto.harvestedBy,
        }),
      );
    });

    it('calls updateStatusWithTx with HARVESTING status', async () => {
      await useCase.execute(harvestDto);

      expect(batchesRepo.updateStatusWithTx).toHaveBeenCalledWith(
        mockDb,
        harvestDto.batchId,
        'HARVESTING',
        harvestDto.harvestedBy,
      );
    });

    it('writes BATCH_STATUS_CHANGED outbox event inside transaction', async () => {
      await useCase.execute(harvestDto);

      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [txArg, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(txArg).toBe(mockDb);
      const payload = eventArg.payload as Record<string, unknown>;
      expect(payload['eventType']).toBe('BATCH_STATUS_CHANGED');
      expect((payload['payload'] as Record<string, unknown>)['newStatus']).toBe('HARVESTING');
    });

    it('returns the updated batch after transaction', async () => {
      const result = await useCase.execute(harvestDto);

      expect(result.status).toBe('HARVESTING');
    });

    it('stores dry_weight_g as string when provided', async () => {
      await useCase.execute(harvestDto);

      expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ dry_weight_g: '1200' }));
    });

    it('omits dry_weight_g when not provided', async () => {
      const { dryWeightG: _removed, ...dtoNoDry } = harvestDto;
      await useCase.execute(dtoNoDry);

      const callArg = insertValues.mock.calls[0]![0] as Record<string, unknown>;
      expect(callArg['dry_weight_g']).toBeUndefined();
    });
  });

  describe('transaction failure', () => {
    it('propagates errors thrown inside transaction', async () => {
      batchesRepo.findById.mockResolvedValue(makeBatch({ status: 'ACTIVE' }));
      batchesRepo.updateStatusWithTx.mockRejectedValue(new Error('Lock timeout'));

      await expect(useCase.execute(harvestDto)).rejects.toThrow('Lock timeout');
    });
  });
});
