import { BadRequestException } from '@nestjs/common';
import { CreateFacilityUseCase } from './create-facility.use-case';
import type { FacilityRepository } from '../facility.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Facility, CreateFacility } from '@gacp-erp/shared-schemas';

const fakeFacility = {
  id: 'facility-uuid-1',
  facility_code: 'FAC-001',
  name: 'Main Facility',
  license_number: 'LIC-001',
  address: '123 Main St',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
} as unknown as Facility;

const createDto = {
  facility_code: 'FAC-001',
  name: 'Main Facility',
  license_number: 'LIC-001',
  address: '123 Main St',
} as unknown as CreateFacility;

describe('CreateFacilityUseCase', () => {
  let useCase: CreateFacilityUseCase;
  let facilityRepo: jest.Mocked<FacilityRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    facilityRepo = {
      findByCode: jest.fn(),
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<FacilityRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<Facility>) => cb(mockDb)),
    };

    useCase = new CreateFacilityUseCase(mockDb as never, facilityRepo, outboxRepo);
  });

  describe('duplicate facility_code check', () => {
    it('throws BadRequestException when facility_code already exists', async () => {
      facilityRepo.findByCode.mockResolvedValue(fakeFacility);

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Facility code "FAC-001" already exists'),
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('successful facility creation', () => {
    beforeEach(() => {
      facilityRepo.findByCode.mockResolvedValue(null);
      facilityRepo.createWithTx.mockResolvedValue(fakeFacility);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the created facility', async () => {
      const result = await useCase.execute(createDto, 'user-1');
      expect(result).toEqual(fakeFacility);
    });

    it('calls facilityRepo.createWithTx inside transaction', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(facilityRepo.createWithTx).toHaveBeenCalledWith(mockDb, createDto, 'user-1');
    });

    it('calls outboxRepo.createWithTx with FACILITY_CREATED event', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [txArg, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(txArg).toBe(mockDb);
      expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('FACILITY_CREATED');
    });

    it('wraps calls in a single transaction', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('transaction failure', () => {
    it('propagates errors thrown inside transaction', async () => {
      facilityRepo.findByCode.mockResolvedValue(null);
      facilityRepo.createWithTx.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow('DB error');
    });
  });
});
