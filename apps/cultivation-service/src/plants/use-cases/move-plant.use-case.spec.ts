import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MovePlantUseCase } from './move-plant.use-case';
import type { PlantsRepository } from '../plants.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { ZoneRepository } from '../../facilities/zone.repository';
import type { Plant, MovePlant } from '@gacp-erp/shared-schemas';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PLANT_ID = 'plant-uuid-1';
const ZONE_A = 'zone-a-uuid';
const ZONE_B = 'zone-b-uuid';
const USER_ID = 'user-uuid-1';

const fakePlant = {
  id: PLANT_ID,
  plant_code: 'PLT-001',
  batch_id: 'batch-uuid-1',
  strain_id: 'strain-uuid-1',
  zone_id: ZONE_A,
  current_stage: 'VEGETATIVE',
  source_type: 'seed',
  mother_plant_id: null,
  generation: 0,
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
  notes: null,
  created_at: '2026-01-15T08:00:00Z',
  updated_at: '2026-01-15T08:00:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
} as unknown as Plant;

const moveToB = { zone_id: ZONE_B } as unknown as MovePlant;
const moveToA = { zone_id: ZONE_A } as unknown as MovePlant;
const moveToBad = { zone_id: 'bad-zone' } as unknown as MovePlant;

const movedPlant = {
  ...fakePlant,
  zone_id: ZONE_B,
  updated_at: '2026-01-15T09:00:00Z',
  updated_by: USER_ID,
} as unknown as Plant;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MovePlantUseCase', () => {
  let useCase: MovePlantUseCase;
  let plantsRepo: jest.Mocked<PlantsRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let zoneRepo: jest.Mocked<ZoneRepository>;
  let mockDb: { transaction: jest.Mock };
  let mockInsertReturning: jest.Mock;
  let mockInsertValues: jest.Mock;

  beforeEach(() => {
    mockInsertReturning = jest.fn().mockResolvedValue([{ id: 'op-uuid-1' }]);
    mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning });

    plantsRepo = {
      findById: jest.fn().mockResolvedValue(fakePlant),
      updateZoneWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PlantsRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    zoneRepo = {
      findById: jest.fn().mockResolvedValue({ id: ZONE_B, is_active: true }),
    } as unknown as jest.Mocked<ZoneRepository>;

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
        const tx = {
          insert: jest.fn().mockReturnValue({ values: mockInsertValues }),
          update: jest.fn(),
        };
        return cb(tx);
      }),
    };

    useCase = new MovePlantUseCase(mockDb as never, plantsRepo, outboxRepo, zoneRepo);
  });

  it('moves plant to a new zone and returns updated plant', async () => {
    plantsRepo.findById
      .mockResolvedValueOnce(fakePlant) // initial lookup
      .mockResolvedValueOnce(movedPlant); // re-fetch after move

    const result = await useCase.execute(PLANT_ID, moveToB, USER_ID);

    expect(result).toEqual(movedPlant);
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(plantsRepo.updateZoneWithTx).toHaveBeenCalled();
    expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
    const [, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
    expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('PLANT_MOVED');
  });

  it('returns plant unchanged when target zone equals current zone (no-op)', async () => {
    const result = await useCase.execute(PLANT_ID, moveToA, USER_ID);

    expect(result).toEqual(fakePlant);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when plant not found', async () => {
    plantsRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', moveToB, USER_ID)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when target zone not found', async () => {
    zoneRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(PLANT_ID, moveToBad, USER_ID)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when target zone is inactive', async () => {
    zoneRepo.findById.mockResolvedValue({ id: ZONE_B, is_active: false } as never);

    await expect(useCase.execute(PLANT_ID, moveToB, USER_ID)).rejects.toThrow(BadRequestException);
  });

  it('propagates transaction errors', async () => {
    plantsRepo.findById.mockResolvedValueOnce(fakePlant);
    mockDb.transaction.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(PLANT_ID, moveToB, USER_ID)).rejects.toThrow('DB error');
  });
});
