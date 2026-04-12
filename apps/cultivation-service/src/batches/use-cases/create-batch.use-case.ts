import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Batch,
  type CreateBatch,
  type BatchId,
  type FacilityId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type BatchCreatedEvent } from '@gacp-erp/shared-events';
import { type Database } from '@gacp-erp/shared-database';
import { BatchesRepository } from '../batches.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

/**
 * CreateBatchUseCase
 *
 * Atomically creates a batch and inserts the BATCH_CREATED outbox event in a
 * single DB transaction. The OutboxRelayService handles Kafka delivery.
 *
 * Replaces the legacy pattern in BatchesService.create() that called
 * kafkaProducer.publish() directly after the DB insert (not atomic).
 */
@Injectable()
export class CreateBatchUseCase {
  private readonly logger = new Logger(CreateBatchUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly batchesRepo: BatchesRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateBatch, userId: string): Promise<Batch> {
    const batch = await this.db.transaction(async (tx) => {
      const created = await this.batchesRepo.createWithTx(tx, dto, userId);

      const propagationMethod = this.resolvePropagationMethod(dto.batch_source_type);

      const event: BatchCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: created.created_at,
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: CULTIVATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'BATCH_CREATED',
        payload: {
          batchId: created.id as BatchId,
          batchNumber: created.batch_number,
          strainId: created.strain_id,
          facilityId: created.facility_id as FacilityId,
          initialQuantity: created.planned_plant_count,
          startedAt: created.created_at,
          ...(created.planned_harvest_date && { targetHarvestAt: created.planned_harvest_date }),
          propagationMethod,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: CULTIVATION_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`Batch created via outbox: ${batch.id} (${batch.batch_number})`);
    return batch;
  }

  private resolvePropagationMethod(
    sourceType: CreateBatch['batch_source_type'],
  ): 'seed' | 'clone' | 'tissue_culture' {
    if (sourceType === 'internal_clone') return 'clone';
    if (sourceType === 'tissue_culture') return 'tissue_culture';
    return 'seed'; // external_purchase or seed_bank
  }
}
