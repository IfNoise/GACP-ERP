import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Room,
  type CreateRoom,
  type BuildingId,
  type FacilityId,
  type RoomId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { FACILITY_TOPIC, type RoomCreatedEvent } from '@gacp-erp/shared-events';
import { BuildingRepository } from '../building.repository';
import { RoomRepository } from '../room.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

@Injectable()
export class CreateRoomUseCase {
  private readonly logger = new Logger(CreateRoomUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly buildingRepo: BuildingRepository,
    private readonly roomRepo: RoomRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateRoom, createdBy: string): Promise<Room> {
    const building = await this.buildingRepo.findByIdOrThrow(dto.building_id);

    if (!building.is_active) {
      throw new BadRequestException(`Building "${dto.building_id}" is inactive`);
    }

    const existing = await this.roomRepo.findByCode(dto.building_id, dto.room_code);
    if (existing) {
      throw new BadRequestException(
        `Room code "${dto.room_code}" already exists in building "${dto.building_id}"`,
      );
    }

    const room = await this.db.transaction(async (tx) => {
      const created = await this.roomRepo.createWithTx(tx, dto, createdBy);

      const event: RoomCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: created.created_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: FACILITY_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: createdBy as UserId,
        eventType: 'ROOM_CREATED',
        payload: {
          roomId: created.id as RoomId,
          roomCode: created.room_code,
          buildingId: dto.building_id as BuildingId,
          facilityId: building.facility_id as FacilityId,
          name: created.name,
          createdBy: createdBy as UserId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: FACILITY_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`Room created: ${room.id} (code: ${room.room_code})`);
    return room;
  }
}
