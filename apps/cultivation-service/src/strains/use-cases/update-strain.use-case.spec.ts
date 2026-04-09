import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateStrainUseCase } from './update-strain.use-case';
import type { StrainsRepository } from '../strains.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Strain, UpdateStrain } from '@gacp-erp/shared-schemas';

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

const updatedStrain = {
  ...fakeStrain,
  name: 'Northern Lights #5',
  updated_at: '2026-01-15T09:00:00Z',
} as unknown as Strain;

describe('UpdateStrainUseCase', () => {
  let useCase: UpdateStrainUseCase;
  let strainsRepo: jest.Mocked<StrainsRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    strainsRepo = {
      findById: jest.fn().mockResolvedValue(fakeStrain),
      findByCode: jest.fn().mockResolvedValue(null),
      updateWithTx: jest.fn().mockResolvedValue(updatedStrain),
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

    useCase = new UpdateStrainUseCase(mockDb as never, strainsRepo, outboxRepo);
  });

  it('updates strain and returns it', async () => {
    const dto = { name: 'Northern Lights #5' } as unknown as UpdateStrain;
    const result = await useCase.execute(STRAIN_ID, dto, USER_ID);

    expect(result).toEqual(updatedStrain);
    expect(strainsRepo.updateWithTx).toHaveBeenCalled();
    expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
  });

  it('publishes STRAIN_UPDATED event', async () => {
    const dto = { name: 'Northern Lights #5' } as unknown as UpdateStrain;
    await useCase.execute(STRAIN_ID, dto, USER_ID);

    const [, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
    expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('STRAIN_UPDATED');
  });

  it('throws NotFoundException when strain not found', async () => {
    strainsRepo.findById.mockResolvedValue(null);
    const dto = { name: 'New Name' } as unknown as UpdateStrain;

    await expect(useCase.execute(STRAIN_ID, dto, USER_ID)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException on duplicate cultivar_code', async () => {
    const otherStrain = {
      ...fakeStrain,
      id: 'other-id',
      cultivar_code: 'OG-001',
    } as unknown as Strain;
    strainsRepo.findByCode.mockResolvedValue(otherStrain);
    const dto = { cultivar_code: 'OG-001' } as unknown as UpdateStrain;

    await expect(useCase.execute(STRAIN_ID, dto, USER_ID)).rejects.toThrow(BadRequestException);
  });

  it('allows updating to same cultivar_code', async () => {
    const dto = { cultivar_code: 'NL-001' } as unknown as UpdateStrain;
    const result = await useCase.execute(STRAIN_ID, dto, USER_ID);

    expect(result).toEqual(updatedStrain);
  });
});
