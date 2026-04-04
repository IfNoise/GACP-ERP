import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Plant,
  type CreatePlant,
  type PlantId,
  type BatchId,
  type ZoneId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type PlantCreatedEvent } from '@gacp-erp/shared-events';
import { PlantsRepository } from '../plants.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { ZoneRepository } from '../../facilities/zone.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

/**
 * CreatePlantUseCase
 *
 * Orchestrates:
 * 1. Duplicate plant_code check
 * 2. Zone existence + active validation
 * 3. DB transaction: INSERT into plants + INSERT into outbox_events
 * 4. The OutboxRelayService later publishes the outbox event to Kafka
 */
@Injectable()
export class CreatePlantUseCase {
  private readonly logger = new Logger(CreatePlantUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly plantsRepo: PlantsRepository,
    private readonly outboxRepo: OutboxRepository,
    private readonly zoneRepo: ZoneRepository,
  ) {}

  async execute(dto: CreatePlant, createdBy: string): Promise<Plant> {
    const existing = await this.plantsRepo.findByCode(dto.plant_code);
    if (existing) {
      throw new BadRequestException(`Plant code "${dto.plant_code}" already exists`);
    }

    // Validate zone exists and is active
    const zone = await this.zoneRepo.findById(dto.zone_id);
    if (!zone) {
      throw new BadRequestException(`Zone "${dto.zone_id}" not found`);
    }
    if (!zone.is_active) {
      throw new BadRequestException(`Zone "${dto.zone_id}" is inactive`);
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
          zoneId: newPlant.zone_id as ZoneId,
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
