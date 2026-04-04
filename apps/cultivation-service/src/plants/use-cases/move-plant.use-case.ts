import { Injectable, BadRequestException, NotFoundException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Plant,
  type MovePlant,
  type PlantId,
  type ZoneId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type PlantMovedEvent } from '@gacp-erp/shared-events';
import { plantOperationsTable } from '@gacp-erp/shared-database';
import { PlantsRepository } from '../plants.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { ZoneRepository } from '../../facilities/zone.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

/**
 * MovePlantUseCase
 *
 * Relocates a plant to a different zone with full audit trail:
 * 1. Validate plant exists
 * 2. No-op if target zone == current zone
 * 3. Validate target zone exists + is active
 * 4. Transaction: update zone_id + record transplant operation + outbox PLANT_MOVED event
 */
@Injectable()
export class MovePlantUseCase {
  private readonly logger = new Logger(MovePlantUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly plantsRepo: PlantsRepository,
    private readonly outboxRepo: OutboxRepository,
    private readonly zoneRepo: ZoneRepository,
  ) {}

  async execute(plantId: string, dto: MovePlant, movedBy: string): Promise<Plant> {
    const plant = await this.plantsRepo.findById(plantId);
    if (!plant) {
      throw new NotFoundException(`Plant ${plantId} not found`);
    }

    // No-op: already in target zone
    if (plant.zone_id === dto.zone_id) {
      return plant;
    }

    // Validate target zone
    const newZone = await this.zoneRepo.findById(dto.zone_id);
    if (!newZone) {
      throw new BadRequestException(`Zone "${dto.zone_id}" not found`);
    }
    if (!newZone.is_active) {
      throw new BadRequestException(`Zone "${dto.zone_id}" is inactive`);
    }

    const previousZoneId = plant.zone_id;

    await this.db.transaction(async (tx) => {
      // a. Update plant zone_id
      await this.plantsRepo.updateZoneWithTx(tx, plantId, dto.zone_id, movedBy);

      // b. Record transplant operation
      const [operation] = await tx
        .insert(plantOperationsTable)
        .values({
          plant_id: plantId,
          operation_type: 'transplant',
          operation_data: {
            previousZoneId,
            newZoneId: dto.zone_id,
            reason: dto.reason,
          },
          performed_by: movedBy,
        })
        .returning();

      // c. Outbox event
      const event: PlantMovedEvent = {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        eventVersion: '2.0',
        producerService: 'cultivation-service',
        topic: CULTIVATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: movedBy as UserId,
        eventType: 'PLANT_MOVED',
        payload: {
          plantId: plantId as PlantId,
          plantCode: plant.plant_code,
          previousZoneId: previousZoneId as ZoneId,
          newZoneId: dto.zone_id as ZoneId,
          operationId: operation!.id,
          movedAt: new Date().toISOString(),
          reason: dto.reason,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: CULTIVATION_TOPIC,
        key: plantId,
        payload: event as unknown as Record<string, unknown>,
      });
    });

    this.logger.log(`Plant ${plant.plant_code} moved: zone ${previousZoneId} → ${dto.zone_id}`);

    const updated = await this.plantsRepo.findById(plantId);
    if (!updated) throw new NotFoundException(`Plant ${plantId} not found after move`);
    return updated;
  }
}
