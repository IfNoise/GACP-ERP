import { BadRequestException } from '@nestjs/common';
import { CreateStrainUseCase } from './create-strain.use-case';
import type { StrainsRepository } from '../strains.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Strain, CreateStrain } from '@gacp-erp/shared-schemas';

const STRAIN_ID = 'strain-uuid-1';
const USER_ID = 'user-uuid-1';

const fakeStrain = {
  id: STRAIN_ID,
  name: 'Northern Lights',
  cultivar_code: 'NL-001',
  species: 'Cannabis indica',
  genetics: 'Afghan x Thai',
  thc_percentage_min: 15,
  thc_percentage_max: 22,
  cbd_percentage_min: undefined,
  cbd_percentage_max: undefined,
  flowering_time_days_min: undefined,
  flowering_time_days_max: undefined,
  expected_yield_grams_min: undefined,
  expected_yield_grams_max: undefined,
  notes: undefined,
  certificate_url: undefined,
  supplier_id: undefined,
  breeder: undefined,
  seed_bank: undefined,
  source_type: 'seed',
  terpene_profile: undefined,
  dna_profile_url: undefined,
  lineage: undefined,
  acquisition_cost: undefined,
  currency: 'EUR',
  cost_per_unit: undefined,
  unit_type: undefined,
  quarantine_days: undefined,
  stability_verified: false,
  registration_number: undefined,
  is_active: true,
  created_at: '2026-01-15T08:00:00Z',
  updated_at: '2026-01-15T08:00:00Z',
  created_by: USER_ID,
  updated_by: USER_ID,
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
} as unknown as Strain;

const createDto = {
  name: 'Northern Lights',
  cultivar_code: 'NL-001',
  species: 'Cannabis indica',
  genetics: 'Afghan x Thai',
} as unknown as CreateStrain;

describe('CreateStrainUseCase', () => {
  let useCase: CreateStrainUseCase;
  let strainsRepo: jest.Mocked<StrainsRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    strainsRepo = {
      findByCode: jest.fn().mockResolvedValue(null),
      createWithTx: jest.fn().mockResolvedValue(fakeStrain),
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

    useCase = new CreateStrainUseCase(mockDb as never, strainsRepo, outboxRepo);
  });

  it('creates strain and returns it', async () => {
    const result = await useCase.execute(createDto, USER_ID);

    expect(result).toEqual(fakeStrain);
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(strainsRepo.createWithTx).toHaveBeenCalled();
    expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
  });

  it('publishes STRAIN_CREATED event via outbox', async () => {
    await useCase.execute(createDto, USER_ID);

    const [, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
    expect(eventArg.topic).toBe('cultivation.strains.v1');
    expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('STRAIN_CREATED');
  });

  it('throws BadRequestException on duplicate cultivar_code', async () => {
    strainsRepo.findByCode.mockResolvedValue(fakeStrain);

    await expect(useCase.execute(createDto, USER_ID)).rejects.toThrow(BadRequestException);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it('propagates transaction errors', async () => {
    mockDb.transaction.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(createDto, USER_ID)).rejects.toThrow('DB error');
  });
});
