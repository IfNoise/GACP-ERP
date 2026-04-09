import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeactivateStrainUseCase } from './deactivate-strain.use-case';
import type { StrainsRepository } from '../strains.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Strain, DeactivateStrain } from '@gacp-erp/shared-schemas';

const STRAIN_ID = 'strain-uuid-1';
const USER_ID = 'user-uuid-1';

const fakeStrain = {
  id: STRAIN_ID,
  name: 'Northern Lights',
  cultivar_code: 'NL-001',
  species: 'Cannabis indica',
  source_type: 'seed',
  currency: 'EUR',
  stability_verified: false,
  is_active: true,
  is_deleted: false,
  created_at: '2026-01-15T08:00:00Z',
  updated_at: '2026-01-15T08:00:00Z',
  created_by: USER_ID,
  updated_by: USER_ID,
  deleted_at: null,
  deleted_by: null,
} as unknown as Strain;

const deactivatedStrain = {
  ...fakeStrain,
  is_active: false,
  is_deleted: true,
  deleted_at: '2026-01-15T10:00:00Z',
  deleted_by: USER_ID,
  updated_at: '2026-01-15T10:00:00Z',
} as unknown as Strain;

const dto = { reason: 'No longer in production' } as unknown as DeactivateStrain;

describe('DeactivateStrainUseCase', () => {
  let useCase: DeactivateStrainUseCase;
  let strainsRepo: jest.Mocked<StrainsRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    strainsRepo = {
      findById: jest.fn().mockResolvedValue(fakeStrain),
      countActiveBatchesByStrain: jest.fn().mockResolvedValue(0),
      deactivateWithTx: jest.fn().mockResolvedValue(deactivatedStrain),
    } as unknown as jest.Mocked<StrainsRepository>;

    outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {};
        return cb(tx);
      }),
    };

    useCase = new DeactivateStrainUseCase(mockDb as never, strainsRepo, outboxRepo);
  });

  it('deactivates strain and returns it', async () => {
    const result = await useCase.execute(STRAIN_ID, dto, USER_ID);

    expect(result).toEqual(deactivatedStrain);
    expect(strainsRepo.deactivateWithTx).toHaveBeenCalled();
    expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
  });

  it('publishes STRAIN_DEACTIVATED event', async () => {
    await useCase.execute(STRAIN_ID, dto, USER_ID);

    const [, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
    expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('STRAIN_DEACTIVATED');
  });

  it('throws NotFoundException when strain not found', async () => {
    strainsRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(STRAIN_ID, dto, USER_ID)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when strain already deactivated', async () => {
    strainsRepo.findById.mockResolvedValue(deactivatedStrain);

    await expect(useCase.execute(STRAIN_ID, dto, USER_ID)).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when active batches reference strain', async () => {
    strainsRepo.countActiveBatchesByStrain.mockResolvedValue(3);

    await expect(useCase.execute(STRAIN_ID, dto, USER_ID)).rejects.toThrow(BadRequestException);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('propagates transaction errors', async () => {
    mockDb.transaction.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(STRAIN_ID, dto, USER_ID)).rejects.toThrow('DB error');
  });
});
