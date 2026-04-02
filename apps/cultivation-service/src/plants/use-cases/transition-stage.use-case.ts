import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type PlantStageTransitionRecord,
  type ElectronicSignature,
  type GrowthStage,
  type PlantId,
  type BatchId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type PlantStageChangedEvent } from '@gacp-erp/shared-events';
import { PlantsRepository } from '../plants.repository';
import { PlantAggregate } from '../plant.aggregate';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

/**
 * TransitionStageUseCase — Step 3.2
 *
 * Orchestrates:
 * 1. Load plant + stage history
 * 2. Validate state machine transition via PlantAggregate
 * 3. DB transaction: UPDATE plant stage + INSERT stage_record + INSERT outbox_event
 *
 * The outbox guarantee ensures PlantStageChangedEvent reaches Kafka even if the
 * process crashes between DB commit and Kafka publish.
 */
@Injectable()
export class TransitionStageUseCase {
  private readonly logger = new Logger(TransitionStageUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly plantsRepo: PlantsRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(
    plantId: string,
    toStage: GrowthStage,
    transitionedBy: string,
    notes?: string,
    signature?: ElectronicSignature,
  ): Promise<PlantStageTransitionRecord> {
    const plant = await this.plantsRepo.findById(plantId);
    if (!plant) throw new NotFoundException(`Plant ${plantId} not found`);

    const history = await this.plantsRepo.getStageHistory(plantId);
    const aggregate = new PlantAggregate(plant, history);
    const result = aggregate.transition(toStage, transitionedBy, notes, signature);

    if (!result.success) {
      const e = result.error;
      switch (e.code) {
        case 'INVALID_TRANSITION':
          throw new BadRequestException(`Cannot transition from ${e.from} to ${e.to}`);
        case 'SIGNATURE_REQUIRED':
          throw new BadRequestException(
            `Electronic signature required for transition to ${e.stage} (21 CFR §11.50)`,
          );
        case 'PLANT_DESTROYED':
        case 'PLANT_HARVESTED':
          throw new BadRequestException(`Plant is in terminal state: ${plant.current_stage}`);
      }
    }

    const stageRecord = result.data;

    const savedRecord = await this.db.transaction(async (tx) => {
      await this.plantsRepo.updateStageWithTx(tx, plantId, toStage, transitionedBy, {
        plant_id: plantId,
        from_stage: stageRecord.from_stage,
        to_stage: toStage,
        transitioned_by: transitionedBy,
        transitioned_at: new Date(),
        notes: notes ?? null,
        electronic_signature: (signature as unknown as Record<string, unknown>) ?? null,
      });

      const event: PlantStageChangedEvent = {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: CULTIVATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: transitionedBy as UserId,
        eventType: 'PLANT_STAGE_CHANGED',
        payload: {
          plantId: plantId as PlantId,
          plantCode: plant.plant_code,
          batchId: plant.batch_id as BatchId,
          previousStage: stageRecord.from_stage,
          newStage: toStage,
          stageRecordId: stageRecord.id,
          transitionedAt: new Date().toISOString(),
          notes,
          signatureProvided: !!signature,
          isHarvest: toStage === 'HARVESTED',
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: CULTIVATION_TOPIC,
        key: plantId,
        payload: event as unknown as Record<string, unknown>,
      });

      return stageRecord;
    });

    this.logger.log(
      `Plant ${plantId} transitioned: ${stageRecord.from_stage} → ${toStage} by ${transitionedBy}`,
    );

    return savedRecord;
  }
}
