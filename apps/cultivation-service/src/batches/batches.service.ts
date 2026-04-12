import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  type Batch,
  type Plant,
  type CreateBatch,
  type UpdateBatch,
  type CloneBatch,
  type BatchStatus,
  type BatchId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type BatchStatusChangedEvent } from '@gacp-erp/shared-events';
import { BatchesRepository } from './batches.repository';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { CloneBatchUseCase } from './use-cases/clone-batch.use-case';
import { CreateBatchUseCase } from './use-cases/create-batch.use-case';
import { FacilityRepository } from '../facilities/facility.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class BatchesService {
  constructor(
    private readonly batchesRepo: BatchesRepository,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly cloneBatchUseCase: CloneBatchUseCase,
    private readonly createBatchUseCase: CreateBatchUseCase,
    private readonly facilityRepo: FacilityRepository,
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

    const facility = await this.facilityRepo.findById(dto.facility_id);
    if (!facility) {
      throw new BadRequestException(`Facility "${dto.facility_id}" not found`);
    }
    if (!facility.is_active) {
      throw new BadRequestException(`Facility "${dto.facility_id}" is inactive`);
    }

    return this.createBatchUseCase.execute(dto, createdBy);
  }

  async update(id: string, dto: UpdateBatch, updatedBy: string): Promise<Batch> {
    await this.getById(id);
    await this.batchesRepo.updateFields(id, dto, updatedBy);
    return this.getById(id);
  }

  async updateStatus(id: string, status: BatchStatus, updatedBy: string): Promise<void> {
    const batch = await this.getById(id);
    const previousStatus = batch.status;
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

  async cloneBatch(dto: CloneBatch, createdBy: string): Promise<{ batch: Batch; plants: Plant[] }> {
    return this.cloneBatchUseCase.execute(dto, createdBy);
  }
}
