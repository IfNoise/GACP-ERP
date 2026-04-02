import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Batch,
  type CreateBatch,
  type UpdateBatch,
  type BatchStatus,
  type BatchId,
  type FacilityId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import {
  CULTIVATION_TOPIC,
  type BatchCreatedEvent,
  type BatchStatusChangedEvent,
} from '@gacp-erp/shared-events';
import { BatchesRepository } from './batches.repository';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);

  constructor(
    private readonly batchesRepo: BatchesRepository,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async getById(id: string): Promise<Batch> {
    const batch = await this.batchesRepo.findById(id);
    if (!batch) throw new NotFoundException(`Batch ${id} not found`);
    return batch;
  }

  async list(facilityId?: string): Promise<Batch[]> {
    return this.batchesRepo.findMany(facilityId);
  }

  async create(dto: CreateBatch, createdBy: string): Promise<Batch> {
    const existing = await this.batchesRepo.findByBatchNumber(dto.batch_number);
    if (existing) {
      throw new BadRequestException(`Batch number "${dto.batch_number}" already exists`);
    }
    const batch = await this.batchesRepo.create(dto, createdBy);
    this.logger.log(`Batch created: ${batch.id} (${batch.batch_number})`);

    const event: BatchCreatedEvent = {
      eventId: randomUUID(),
      occurredAt: batch.created_at,
      eventVersion: '1.0',
      producerService: 'cultivation-service',
      topic: CULTIVATION_TOPIC,
      correlationId: randomUUID(),
      triggeredBy: createdBy as UserId,
      eventType: 'BATCH_CREATED',
      payload: {
        batchId: batch.id as BatchId,
        batchNumber: batch.batch_number,
        strainId: batch.strain_id,
        facilityId: batch.facility_id as FacilityId,
        initialQuantity: batch.planned_plant_count,
        startedAt: batch.created_at,
        ...(batch.planned_harvest_date && { targetHarvestAt: batch.planned_harvest_date }),
        propagationMethod: batch.parent_batch_id ? 'clone' : 'seed',
      },
    };
    this.kafkaProducer.publish(CULTIVATION_TOPIC, batch.id, event);
    return batch;
  }

  async update(id: string, dto: UpdateBatch, updatedBy: string): Promise<Batch> {
    await this.getById(id); // throws NotFoundException if not found
    await this.batchesRepo.updateFields(id, dto, updatedBy);
    return this.getById(id);
  }

  async updateStatus(id: string, status: BatchStatus, updatedBy: string): Promise<void> {
    const batch = await this.getById(id); // throws NotFoundException if not found
    const previousStatus = batch.status;
    // BatchStatus values match batchesTable status enum values
    await this.batchesRepo.updateStatus(id, status as never, updatedBy);

    const event: BatchStatusChangedEvent = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      eventVersion: '1.0',
      producerService: 'cultivation-service',
      topic: CULTIVATION_TOPIC,
      correlationId: randomUUID(),
      triggeredBy: updatedBy as UserId,
      eventType: 'BATCH_STATUS_CHANGED',
      payload: {
        batchId: batch.id as BatchId,
        batchNumber: batch.batch_number,
        previousStatus,
        newStatus: status,
        changedAt: new Date().toISOString(),
      },
    };
    this.kafkaProducer.publish(CULTIVATION_TOPIC, batch.id, event);
  }
}
