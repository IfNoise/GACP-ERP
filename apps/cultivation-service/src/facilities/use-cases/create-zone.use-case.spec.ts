import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateZoneUseCase } from './create-zone.use-case';
import type { BuildingRepository } from '../building.repository';
import type { RoomRepository } from '../room.repository';
import type { ZoneRepository } from '../zone.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Zone, CreateZone, Room, Building } from '@gacp-erp/shared-schemas';

const fakeBuilding = {
  id: 'building-uuid-1',
  building_code: 'BLD-001',
  facility_id: 'facility-uuid-1',
  building_type: 'indoor',
  is_active: true,
} as unknown as Building;

const fakeRoom = {
  id: 'room-uuid-1',
  room_code: 'RM-001',
  building_id: 'building-uuid-1',
  is_active: true,
} as unknown as Room;

const fakeZone = {
  id: 'zone-uuid-1',
  zone_code: 'ZN-001',
  room_id: 'room-uuid-1',
  zone_type: 'flowering',
  name: 'Flowering Zone 1',
  max_plants: 100,
  area_m2: 50,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
} as unknown as Zone;

const createDto = {
  zone_code: 'ZN-001',
  room_id: 'room-uuid-1',
  zone_type: 'flowering',
  name: 'Flowering Zone 1',
  max_plants: 100,
  area_m2: 50,
} as unknown as CreateZone;

describe('CreateZoneUseCase', () => {
  let useCase: CreateZoneUseCase;
  let buildingRepo: jest.Mocked<BuildingRepository>;
  let roomRepo: jest.Mocked<RoomRepository>;
  let zoneRepo: jest.Mocked<ZoneRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    buildingRepo = {
      findByIdOrThrow: jest.fn().mockResolvedValue(fakeBuilding),
    } as unknown as jest.Mocked<BuildingRepository>;

    roomRepo = {
      findByIdOrThrow: jest.fn().mockResolvedValue(fakeRoom),
    } as unknown as jest.Mocked<RoomRepository>;

    zoneRepo = {
      findByCode: jest.fn(),
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<ZoneRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<Zone>) => cb(mockDb)),
    };

    useCase = new CreateZoneUseCase(mockDb as never, buildingRepo, roomRepo, zoneRepo, outboxRepo);
  });

  describe('room validation', () => {
    it('throws when room is not found', async () => {
      roomRepo.findByIdOrThrow.mockRejectedValue(new NotFoundException('Room not found'));

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when room is inactive', async () => {
      roomRepo.findByIdOrThrow.mockResolvedValue({
        ...fakeRoom,
        is_active: false,
      } as Room);

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('duplicate zone_code check', () => {
    it('throws BadRequestException when zone_code already exists in room', async () => {
      zoneRepo.findByCode.mockResolvedValue(fakeZone);

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Zone code "ZN-001" already exists in room "room-uuid-1"'),
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('successful zone creation', () => {
    beforeEach(() => {
      zoneRepo.findByCode.mockResolvedValue(null);
      zoneRepo.createWithTx.mockResolvedValue(fakeZone);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the created zone', async () => {
      const result = await useCase.execute(createDto, 'user-1');
      expect(result).toEqual(fakeZone);
    });

    it('calls zoneRepo.createWithTx inside transaction', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(zoneRepo.createWithTx).toHaveBeenCalledWith(mockDb, createDto, 'user-1');
    });

    it('calls outboxRepo.createWithTx with ZONE_CREATED event', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [txArg, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(txArg).toBe(mockDb);
      expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('ZONE_CREATED');
    });

    it('wraps calls in a single transaction', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('transaction failure', () => {
    it('propagates errors thrown inside transaction', async () => {
      zoneRepo.findByCode.mockResolvedValue(null);
      zoneRepo.createWithTx.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow('DB error');
    });
  });
});
