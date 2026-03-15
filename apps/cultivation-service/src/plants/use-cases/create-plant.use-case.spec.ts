import { BadRequestException } from '@nestjs/common';
import { CreatePlantUseCase } from './create-plant.use-case';
import type { PlantsRepository } from '../plants.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Plant, CreatePlant } from '@gacp-erp/shared-schemas';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakePlant = {
  id: 'plant-uuid-1',
  plant_code: 'PLT-001',
  batch_id: 'batch-uuid-1',
  strain_id: 'strain-uuid-1',
  facility_id: 'facility-uuid-1',
  zone_id: null,
  qr_code: 'QR-001',
  current_stage: 'SEED',
  is_active: true,
  notes: null,
  planted_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
  deleted_at: null,
} as unknown as Plant;

const createDto = {
  plant_code: 'PLT-001',
  batch_id: 'batch-uuid-1',
  strain_id: 'strain-uuid-1',
  facility_id: 'facility-uuid-1',
} as unknown as CreatePlant;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreatePlantUseCase', () => {
  let useCase: CreatePlantUseCase;
  let plantsRepo: jest.Mocked<PlantsRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    plantsRepo = {
      findByCode: jest.fn(),
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<PlantsRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    // The transaction mock immediately calls the callback with itself as `tx`
    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<Plant>) => {
        return cb(mockDb);
      }),
    };

    useCase = new CreatePlantUseCase(mockDb as never, plantsRepo, outboxRepo);
  });

  describe('duplicate plant_code check', () => {
    it('throws BadRequestException when plant_code already exists', async () => {
      plantsRepo.findByCode.mockResolvedValue(fakePlant);

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(
        new BadRequestException(`Plant code "PLT-001" already exists`),
      );

      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('successful plant creation', () => {
    beforeEach(() => {
      plantsRepo.findByCode.mockResolvedValue(null);
      plantsRepo.createWithTx.mockResolvedValue(fakePlant);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the created plant', async () => {
      const result = await useCase.execute(createDto, 'user-1');

      expect(result).toEqual(fakePlant);
    });

    it('calls plantsRepo.createWithTx with dto and createdBy inside transaction', async () => {
      await useCase.execute(createDto, 'user-1');

      expect(plantsRepo.createWithTx).toHaveBeenCalledWith(mockDb, createDto, 'user-1');
    });

    it('calls outboxRepo.createWithTx with PLANT_CREATED event inside same transaction', async () => {
      await useCase.execute(createDto, 'user-1');

      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [txArg, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(txArg).toBe(mockDb); // same tx object
      expect(eventArg.key).toBe(fakePlant.id);
      expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('PLANT_CREATED');
    });

    it('wraps repository calls in a single transaction', async () => {
      await useCase.execute(createDto, 'user-1');

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });

    it('checks for duplicates BEFORE starting the transaction', async () => {
      const callOrder: string[] = [];
      plantsRepo.findByCode.mockImplementation(async () => {
        callOrder.push('findByCode');
        return null;
      });
      mockDb.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<Plant>) => {
        callOrder.push('transaction');
        return cb(mockDb);
      });
      plantsRepo.createWithTx.mockResolvedValue(fakePlant);

      await useCase.execute(createDto, 'user-1');

      expect(callOrder[0]).toBe('findByCode');
      expect(callOrder[1]).toBe('transaction');
    });
  });

  describe('transaction failure', () => {
    it('propagates errors thrown inside transaction', async () => {
      plantsRepo.findByCode.mockResolvedValue(null);
      plantsRepo.createWithTx.mockRejectedValue(new Error('DB constraint violation'));

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow('DB constraint violation');
    });
  });
});
