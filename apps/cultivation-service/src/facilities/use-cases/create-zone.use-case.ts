import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Zone,
  type CreateZone,
  type BuildingId,
  type FacilityId,
  type RoomId,
  type ZoneId,
  type UserId,
  type PlantZoneType,
} from '@gacp-erp/shared-schemas';
import { FACILITY_TOPIC, type ZoneCreatedEvent } from '@gacp-erp/shared-events';
import { BuildingRepository } from '../building.repository';
import { RoomRepository } from '../room.repository';
import { ZoneRepository } from '../zone.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

@Injectable()
export class CreateZoneUseCase {
  private readonly logger = new Logger(CreateZoneUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly buildingRepo: BuildingRepository,
    private readonly roomRepo: RoomRepository,
    private readonly zoneRepo: ZoneRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateZone, createdBy: string): Promise<Zone> {
    const room = await this.roomRepo.findByIdOrThrow(dto.room_id);

    if (!room.is_active) {
      throw new BadRequestException(`Room "${dto.room_id}" is inactive`);
    }

    const existing = await this.zoneRepo.findByCode(dto.room_id, dto.zone_code);
    if (existing) {
      throw new BadRequestException(
        `Zone code "${dto.zone_code}" already exists in room "${dto.room_id}"`,
      );
    }

    // Resolve building and facility for the event
    const building = await this.buildingRepo.findByIdOrThrow(room.building_id);

    const zone = await this.db.transaction(async (tx) => {
      const created = await this.zoneRepo.createWithTx(tx, dto, createdBy);

      const event: ZoneCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: created.created_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: FACILITY_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: createdBy as UserId,
        eventType: 'ZONE_CREATED',
        payload: {
          zoneId: created.id as ZoneId,
          zoneCode: created.zone_code,
          roomId: dto.room_id as RoomId,
          buildingId: building.id as BuildingId,
          facilityId: building.facility_id as FacilityId,
          zoneType: created.zone_type as PlantZoneType,
          name: created.name,
          maxPlants: created.max_plants,
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

    this.logger.log(`Zone created: ${zone.id} (code: ${zone.zone_code})`);
    return zone;
  }
}
