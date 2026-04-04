import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateBuildingUseCase } from './create-building.use-case';
import type { FacilityRepository } from '../facility.repository';
import type { BuildingRepository } from '../building.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Building, CreateBuilding, Facility } from '@gacp-erp/shared-schemas';

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

const fakeBuilding = {
  id: 'building-uuid-1',
  facility_id: 'facility-uuid-1',
  building_code: 'BLD-001',
  name: 'Main Indoor',
  building_type: 'indoor',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
} as unknown as Building;

const createDto = {
  facility_id: 'facility-uuid-1',
  building_code: 'BLD-001',
  name: 'Main Indoor',
  building_type: 'indoor',
} as unknown as CreateBuilding;

describe('CreateBuildingUseCase', () => {
  let useCase: CreateBuildingUseCase;
  let facilityRepo: jest.Mocked<FacilityRepository>;
  let buildingRepo: jest.Mocked<BuildingRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    facilityRepo = {
      findByIdOrThrow: jest.fn().mockResolvedValue(fakeFacility),
    } as unknown as jest.Mocked<FacilityRepository>;

    buildingRepo = {
      findByCode: jest.fn(),
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<BuildingRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<Building>) => cb(mockDb)),
    };

    useCase = new CreateBuildingUseCase(mockDb as never, facilityRepo, buildingRepo, outboxRepo);
  });

  describe('facility validation', () => {
    it('throws when facility is not found', async () => {
      facilityRepo.findByIdOrThrow.mockRejectedValue(new NotFoundException('Facility not found'));

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when facility is inactive', async () => {
      facilityRepo.findByIdOrThrow.mockResolvedValue({
        ...fakeFacility,
        is_active: false,
      } as Facility);

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('duplicate building_code check', () => {
    it('throws BadRequestException when building_code already exists in facility', async () => {
      buildingRepo.findByCode.mockResolvedValue(fakeBuilding);

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(
        new BadRequestException(
          'Building code "BLD-001" already exists in facility "facility-uuid-1"',
        ),
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('successful building creation', () => {
    beforeEach(() => {
      buildingRepo.findByCode.mockResolvedValue(null);
      buildingRepo.createWithTx.mockResolvedValue(fakeBuilding);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the created building', async () => {
      const result = await useCase.execute(createDto, 'user-1');
      expect(result).toEqual(fakeBuilding);
    });

    it('calls buildingRepo.createWithTx inside transaction', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(buildingRepo.createWithTx).toHaveBeenCalledWith(mockDb, createDto, 'user-1');
    });

    it('calls outboxRepo.createWithTx with BUILDING_CREATED event', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [txArg, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(txArg).toBe(mockDb);
      expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('BUILDING_CREATED');
    });

    it('wraps calls in a single transaction', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('transaction failure', () => {
    it('propagates errors thrown inside transaction', async () => {
      buildingRepo.findByCode.mockResolvedValue(null);
      buildingRepo.createWithTx.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow('DB error');
    });
  });
});
