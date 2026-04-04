import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateRoomUseCase } from './create-room.use-case';
import type { BuildingRepository } from '../building.repository';
import type { RoomRepository } from '../room.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type { Room, CreateRoom, Building } from '@gacp-erp/shared-schemas';

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
  name: 'Room 1',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
} as unknown as Room;

const createDto = {
  room_code: 'RM-001',
  building_id: 'building-uuid-1',
  name: 'Room 1',
} as unknown as CreateRoom;

describe('CreateRoomUseCase', () => {
  let useCase: CreateRoomUseCase;
  let buildingRepo: jest.Mocked<BuildingRepository>;
  let roomRepo: jest.Mocked<RoomRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    buildingRepo = {
      findByIdOrThrow: jest.fn().mockResolvedValue(fakeBuilding),
    } as unknown as jest.Mocked<BuildingRepository>;

    roomRepo = {
      findByCode: jest.fn(),
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<RoomRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<Room>) => cb(mockDb)),
    };

    useCase = new CreateRoomUseCase(mockDb as never, buildingRepo, roomRepo, outboxRepo);
  });

  describe('building validation', () => {
    it('throws when building is not found', async () => {
      buildingRepo.findByIdOrThrow.mockRejectedValue(new NotFoundException('Building not found'));

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when building is inactive', async () => {
      buildingRepo.findByIdOrThrow.mockResolvedValue({
        ...fakeBuilding,
        is_active: false,
      } as Building);

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('duplicate room_code check', () => {
    it('throws BadRequestException when room_code already exists in building', async () => {
      roomRepo.findByCode.mockResolvedValue(fakeRoom);

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Room code "RM-001" already exists in building "building-uuid-1"'),
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('successful room creation', () => {
    beforeEach(() => {
      roomRepo.findByCode.mockResolvedValue(null);
      roomRepo.createWithTx.mockResolvedValue(fakeRoom);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the created room', async () => {
      const result = await useCase.execute(createDto, 'user-1');
      expect(result).toEqual(fakeRoom);
    });

    it('calls roomRepo.createWithTx inside transaction', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(roomRepo.createWithTx).toHaveBeenCalledWith(mockDb, createDto, 'user-1');
    });

    it('calls outboxRepo.createWithTx with ROOM_CREATED event', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [txArg, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(txArg).toBe(mockDb);
      expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe('ROOM_CREATED');
    });

    it('wraps calls in a single transaction', async () => {
      await useCase.execute(createDto, 'user-1');
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('transaction failure', () => {
    it('propagates errors thrown inside transaction', async () => {
      roomRepo.findByCode.mockResolvedValue(null);
      roomRepo.createWithTx.mockRejectedValue(new Error('DB error'));

      await expect(useCase.execute(createDto, 'user-1')).rejects.toThrow('DB error');
    });
  });
});
