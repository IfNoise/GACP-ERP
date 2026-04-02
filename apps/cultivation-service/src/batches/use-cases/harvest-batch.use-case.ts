import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Batch, type BatchId, type UserId } from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type BatchStatusChangedEvent } from '@gacp-erp/shared-events';
import { harvestRecordsTable } from '@gacp-erp/shared-database';
import { BatchesRepository } from '../batches.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';

export interface HarvestBatchDto {
  batchId: string;
  freshWeightG: number;
  dryWeightG?: number;
  qualityGrade?: 'AAA' | 'AA' | 'A' | 'B' | 'C' | 'REJECTED';
  harvestedBy: string;
  harvestSignature: Record<string, unknown>;
  notes?: string;
}

/**
 * HarvestBatchUseCase — Step 3.2
 *
 * Orchestrates batch harvest:
 * 1. Validate batch exists and is in an harvestable state (ACTIVE | HARVESTING)
 * 2. DB transaction:
 *    a. INSERT harvest_record
 *    b. UPDATE batch status → HARVESTING (or COMPLETED if all plants harvested)
 *    c. INSERT outbox_event (BatchStatusChangedEvent)
 *
 * Uses outbox pattern — BatchStatusChangedEvent is published to Kafka by
 * OutboxRelayService after the transaction commits.
 */
@Injectable()
export class HarvestBatchUseCase {
  private readonly logger = new Logger(HarvestBatchUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly batchesRepo: BatchesRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: HarvestBatchDto): Promise<Batch> {
    const batch = await this.batchesRepo.findById(dto.batchId);
    if (!batch) throw new NotFoundException(`Batch ${dto.batchId} not found`);

    if (!['ACTIVE', 'HARVESTING'].includes(batch.status)) {
      throw new BadRequestException(
        `Batch cannot be harvested in status "${batch.status}". ` +
          `Required: ACTIVE or HARVESTING`,
      );
    }

    const newStatus = 'HARVESTING' as const;

    await this.db.transaction(async (tx) => {
      // a. Record harvest
      await tx.insert(harvestRecordsTable).values({
        batch_id: dto.batchId,
        fresh_weight_g: String(dto.freshWeightG),
        dry_weight_g: dto.dryWeightG !== undefined ? String(dto.dryWeightG) : undefined,
        quality_grade: dto.qualityGrade,
        harvested_by: dto.harvestedBy,
        harvest_signature: dto.harvestSignature,
        notes: dto.notes,
      });

      // b. Advance batch status
      await this.batchesRepo.updateStatusWithTx(tx, dto.batchId, newStatus, dto.harvestedBy);

      // c. Outbox event
      const event: BatchStatusChangedEvent = {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: CULTIVATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: dto.harvestedBy as UserId,
        eventType: 'BATCH_STATUS_CHANGED',
        payload: {
          batchId: dto.batchId as BatchId,
          batchNumber: batch.batch_number,
          previousStatus: batch.status,
          newStatus,
          changedAt: new Date().toISOString(),
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: CULTIVATION_TOPIC,
        key: dto.batchId,
        payload: event as unknown as Record<string, unknown>,
      });
    });

    this.logger.log(`Batch ${dto.batchId} harvested → status: ${newStatus}`);

    const updated = await this.batchesRepo.findById(dto.batchId);
    if (!updated) throw new NotFoundException(`Batch ${dto.batchId} not found after harvest`);
    return updated;
  }
}
