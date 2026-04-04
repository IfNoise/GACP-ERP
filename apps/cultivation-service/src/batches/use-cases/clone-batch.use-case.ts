import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  type Batch,
  type Plant,
  type CloneBatch,
  type BatchId,
  type FacilityId,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type BatchClonedEvent } from '@gacp-erp/shared-events';
import { batchesTable, plantsTable } from '@gacp-erp/shared-database';
import { type Database } from '@gacp-erp/shared-database';
import { BatchesRepository } from '../batches.repository';
import { PlantsRepository } from '../../plants/plants.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

/**
 * CloneBatchUseCase
 *
 * Core business operation: take cuttings from a mother plant, create a new
 * child batch with N clone plants linked back to the source mother.
 *
 * Orchestrates:
 * 1. Validate mother plant exists and is in MOTHER_PLANT stage
 * 2. DB transaction:
 *    a. INSERT new batch (parent_batch_id = mother's batch)
 *    b. INSERT N plant records (source_type='clone', mother_plant_id, generation)
 *    c. INSERT cloning operation on the mother plant
 *    d. INSERT outbox event (BatchClonedEvent)
 *
 * Uses outbox pattern for Kafka delivery guarantee.
 */
@Injectable()
export class CloneBatchUseCase {
  private readonly logger = new Logger(CloneBatchUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly batchesRepo: BatchesRepository,
    private readonly plantsRepo: PlantsRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CloneBatch, createdBy: string): Promise<{ batch: Batch; plants: Plant[] }> {
    // 1. Validate mother plant
    const mother = await this.plantsRepo.findById(dto.mother_plant_id);
    if (!mother) {
      throw new NotFoundException(`Mother plant ${dto.mother_plant_id} not found`);
    }
    if (mother.current_stage !== 'MOTHER_PLANT') {
      throw new BadRequestException(
        `Plant ${dto.mother_plant_id} is in stage "${mother.current_stage}". ` +
          `Only plants in MOTHER_PLANT stage can be used for cloning.`,
      );
    }

    // Check for duplicate batch_number
    const existingBatch = await this.batchesRepo.findByBatchNumber(dto.batch_number);
    if (existingBatch) {
      throw new BadRequestException(`Batch number "${dto.batch_number}" already exists`);
    }

    // Determine generation: mother's generation + 1
    const motherGeneration = (mother as unknown as { generation?: number }).generation ?? 0;
    const cloneGeneration = motherGeneration + 1;

    // Build plant code prefix
    const prefix = dto.plant_code_prefix ?? `CLN-${dto.batch_number}`;

    const result = await this.db.transaction(async (tx) => {
      // a. Create the new clone batch
      const [newBatch] = await tx
        .insert(batchesTable)
        .values({
          batch_number: dto.batch_number,
          parent_batch_id: mother.batch_id,
          strain_id: mother.strain_id,
          facility_id: dto.facility_id,
          status: 'ACTIVE',
          planned_plant_count: dto.clone_count,
          actual_plant_count: dto.clone_count,
          notes: dto.notes,
          actual_start_date: new Date(),
          planned_harvest_date: dto.planned_harvest_date
            ? new Date(dto.planned_harvest_date)
            : undefined,
          created_by: createdBy,
          updated_by: createdBy,
        })
        .returning();

      if (!newBatch) throw new Error('Batch insert returned no rows');

      // b. Create N clone plants
      const plantValues = Array.from({ length: dto.clone_count }, (_, i) => {
        const seq = String(i + 1).padStart(3, '0');
        return {
          plant_code: `${prefix}-${seq}`.substring(0, 20),
          batch_id: newBatch.id,
          strain_id: mother.strain_id,
          current_stage: 'CLONING' as const,
          source_type: 'clone' as const,
          mother_plant_id: mother.id,
          generation: cloneGeneration,
          zone_id: dto.zone_id,
          current_health_score: 100,
          notes: `Clone from mother ${mother.plant_code} (gen ${cloneGeneration})`,
          created_by: createdBy,
          updated_by: createdBy,
        };
      });

      const clonePlants = await tx.insert(plantsTable).values(plantValues).returning();

      // c. Record cloning operation on the mother plant
      // (using plant_operations table import would add coupling,
      //  so we record it via raw insert to keep use-case self-contained)
      const { plantOperationsTable } = await import('@gacp-erp/shared-database');
      await tx.insert(plantOperationsTable).values({
        plant_id: mother.id,
        operation_type: 'cloning',
        operation_data: {
          clone_batch_id: newBatch.id,
          clone_count: dto.clone_count,
          clone_generation: cloneGeneration,
        },
        performed_by: createdBy,
      });

      // d. Outbox event
      const event: BatchClonedEvent = {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: CULTIVATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: createdBy as UserId,
        eventType: 'BATCH_CLONED',
        payload: {
          newBatchId: newBatch.id as BatchId,
          newBatchNumber: newBatch.batch_number,
          parentBatchId: mother.batch_id as BatchId,
          strainId: mother.strain_id,
          facilityId: dto.facility_id as FacilityId,
          clonedPlantCount: dto.clone_count,
          clonedAt: new Date().toISOString(),
          reason: dto.notes,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: CULTIVATION_TOPIC,
        key: newBatch.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return {
        batch: newBatch,
        plants: clonePlants,
      };
    });

    this.logger.log(
      `Cloned ${dto.clone_count} plants from mother ${mother.plant_code} → batch ${dto.batch_number}`,
    );

    // Re-fetch to get properly mapped data
    const batch = await this.batchesRepo.findById(result.batch.id);
    if (!batch) throw new Error('Batch not found after creation');

    // Map the raw plant rows through the repository mapper
    const plants: Plant[] = result.plants.map(
      (row) =>
        ({
          id: row.id,
          plant_code: row.plant_code,
          batch_id: row.batch_id,
          strain_id: row.strain_id,
          current_stage: row.current_stage,
          source_type: row.source_type ?? 'clone',
          mother_plant_id: row.mother_plant_id ?? null,
          generation: row.generation ?? cloneGeneration,
          zone_id: row.zone_id,
          health_score: row.current_health_score ?? 100,
          notes: row.notes ?? undefined,
          created_at: row.created_at.toISOString(),
          updated_at: row.updated_at.toISOString(),
          created_by: row.created_by as UserId,
          updated_by: row.updated_by as UserId,
          is_deleted: row.is_deleted,
          deleted_at: null,
          deleted_by: null,
        }) as unknown as Plant,
    );

    return { batch, plants };
  }
}
