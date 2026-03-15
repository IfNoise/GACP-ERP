import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Plant,
  type CreatePlant,
  type UpdatePlant,
  type PlantStageTransitionRecord,
  type ElectronicSignature,
  type PaginationQuery,
  type PaginatedResponse,
  type GrowthStage,
  type PlantId,
  type BatchId,
  type FacilityId,
  type ZoneId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import {
  CULTIVATION_TOPIC,
  type PlantCreatedEvent,
  type PlantStageChangedEvent,
} from '@gacp-erp/shared-events';
import { type PlantsRepository } from './plants.repository';
import { PlantAggregate } from './plant.aggregate';
import { type KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class PlantsService {
  private readonly logger = new Logger(PlantsService.name);

  constructor(
    private readonly plantsRepo: PlantsRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async getById(id: string): Promise<Plant> {
    const plant = await this.plantsRepo.findById(id);
    if (!plant) {
      throw new NotFoundException(`Plant ${id} not found`);
    }
    return plant;
  }

  async getByBatch(
    batchId: string,
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Plant>> {
    return this.plantsRepo.findManyByBatch(batchId, pagination);
  }

  async create(dto: CreatePlant, createdBy: string): Promise<Plant> {
    const existing = await this.plantsRepo.findByCode(dto.plant_code);
    if (existing) {
      throw new BadRequestException(`Plant code "${dto.plant_code}" already exists`);
    }
    const plant = await this.plantsRepo.create(dto, createdBy);
    this.logger.log(`Plant created: ${plant.id} (code: ${plant.plant_code})`);

    const event: PlantCreatedEvent = {
      eventId: randomUUID(),
      occurredAt: plant.created_at,
      eventVersion: '1.0',
      producerService: 'cultivation-service',
      topic: CULTIVATION_TOPIC,
      correlationId: randomUUID(),
      triggeredBy: createdBy as UserId,
      eventType: 'PLANT_CREATED',
      payload: {
        plantId: plant.id as PlantId,
        plantCode: plant.plant_code,
        batchId: plant.batch_id as BatchId,
        strainId: plant.strain_id,
        facilityId: plant.facility_id as FacilityId,
        ...(plant.zone_id && { zoneId: plant.zone_id as ZoneId }),
        plantedAt: plant.created_at,
        initialStage: plant.current_stage,
      },
    };
    this.kafkaProducer.publish(CULTIVATION_TOPIC, plant.id, event);
    return plant;
  }

  async transitionStage(
    plantId: string,
    toStage: GrowthStage,
    transitionedBy: string,
    notes?: string,
    signature?: ElectronicSignature,
  ): Promise<PlantStageTransitionRecord> {
    const plant = await this.getById(plantId);
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

    await this.plantsRepo.updateStage(plantId, toStage, transitionedBy, {
      plant_id: plantId,
      from_stage: stageRecord.from_stage,
      to_stage: toStage,
      transitioned_by: transitionedBy,
      transitioned_at: new Date(),
      notes: notes ?? null,
      electronic_signature: (signature as unknown as Record<string, unknown>) ?? null,
    });

    this.logger.log(
      `Plant ${plantId} transitioned: ${stageRecord.from_stage} → ${toStage} by ${transitionedBy}`,
    );

    const stageEvent: PlantStageChangedEvent = {
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
    this.kafkaProducer.publish(CULTIVATION_TOPIC, plantId, stageEvent);

    return stageRecord;
  }

  async getStageHistory(plantId: string): Promise<PlantStageTransitionRecord[]> {
    await this.getById(plantId); // ensures plant exists
    return this.plantsRepo.getStageHistory(plantId);
  }

  async list(
    filters: { batch_id?: string; zone_id?: string; stage?: GrowthStage },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Plant>> {
    return this.plantsRepo.findMany(filters, pagination);
  }

  async update(id: string, dto: UpdatePlant, updatedBy: string): Promise<Plant> {
    await this.getById(id); // throws NotFoundException if not found
    const plant = await this.plantsRepo.update(id, dto, updatedBy);
    if (!plant) throw new NotFoundException(`Plant ${id} not found`);
    return plant;
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.getById(id); // throws NotFoundException if not found
    await this.plantsRepo.softDelete(id, deletedBy);
    this.logger.log(`Plant ${id} soft-deleted by ${deletedBy}`);
  }
}
