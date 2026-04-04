import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Building,
  type CreateBuilding,
  type BuildingId,
  type BuildingType,
  type FacilityId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { FACILITY_TOPIC, type BuildingCreatedEvent } from '@gacp-erp/shared-events';
import { FacilityRepository } from '../facility.repository';
import { BuildingRepository } from '../building.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

@Injectable()
export class CreateBuildingUseCase {
  private readonly logger = new Logger(CreateBuildingUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly facilityRepo: FacilityRepository,
    private readonly buildingRepo: BuildingRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateBuilding, createdBy: string): Promise<Building> {
    const facility = await this.facilityRepo.findByIdOrThrow(dto.facility_id);

    if (!facility.is_active) {
      throw new BadRequestException(`Facility "${dto.facility_id}" is inactive`);
    }

    const existing = await this.buildingRepo.findByCode(dto.facility_id, dto.building_code);
    if (existing) {
      throw new BadRequestException(
        `Building code "${dto.building_code}" already exists in facility "${dto.facility_id}"`,
      );
    }

    const building = await this.db.transaction(async (tx) => {
      const created = await this.buildingRepo.createWithTx(tx, dto, createdBy);

      const event: BuildingCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: created.created_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: FACILITY_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: createdBy as UserId,
        eventType: 'BUILDING_CREATED',
        payload: {
          buildingId: created.id as BuildingId,
          buildingCode: created.building_code,
          facilityId: dto.facility_id as FacilityId,
          buildingType: created.building_type as BuildingType,
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

    this.logger.log(`Building created: ${building.id} (code: ${building.building_code})`);
    return building;
  }
}
