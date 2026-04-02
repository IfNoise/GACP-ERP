import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Plant,
  type CreatePlant,
  type PlantId,
  type BatchId,
  type FacilityId,
  type ZoneId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type PlantCreatedEvent } from '@gacp-erp/shared-events';
import { PlantsRepository } from '../plants.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

/**
 * CreatePlantUseCase — Step 3.2
 *
 * Orchestrates:
 * 1. Duplicate plant_code check
 * 2. DB transaction: INSERT into plants + INSERT into outbox_events
 * 3. The OutboxRelayService later publishes the outbox event to Kafka
 *
 * Outbox pattern guarantees: if DB commit succeeds, the PlantCreatedEvent
 * will eventually be published to Kafka (AT-LEAST-ONCE).
 */
@Injectable()
export class CreatePlantUseCase {
  private readonly logger = new Logger(CreatePlantUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly plantsRepo: PlantsRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreatePlant, createdBy: string): Promise<Plant> {
    const existing = await this.plantsRepo.findByCode(dto.plant_code);
    if (existing) {
      throw new BadRequestException(`Plant code "${dto.plant_code}" already exists`);
    }

    const plant = await this.db.transaction(async (tx) => {
      const newPlant = await this.plantsRepo.createWithTx(tx, dto, createdBy);

      const event: PlantCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: newPlant.created_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: CULTIVATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: createdBy as UserId,
        eventType: 'PLANT_CREATED',
        payload: {
          plantId: newPlant.id as PlantId,
          plantCode: newPlant.plant_code,
          batchId: newPlant.batch_id as BatchId,
          strainId: newPlant.strain_id,
          facilityId: newPlant.facility_id as FacilityId,
          ...(newPlant.zone_id ? { zoneId: newPlant.zone_id as ZoneId } : {}),
          plantedAt: newPlant.created_at,
          initialStage: newPlant.current_stage,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: CULTIVATION_TOPIC,
        key: newPlant.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return newPlant;
    });

    this.logger.log(`Plant created: ${plant.id} (code: ${plant.plant_code})`);
    return plant;
  }
}
