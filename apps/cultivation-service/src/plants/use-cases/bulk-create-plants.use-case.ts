import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, isNull, like, max } from 'drizzle-orm';
import {
  type BulkCreatePlants,
  type BulkCreatePlantsResult,
  type BatchId,
  type PlantId,
  type StrainId,
  type UserId,
  type ZoneId,
} from '@gacp-erp/shared-schemas';
import { CULTIVATION_TOPIC, type PlantsCreatedInBulkEvent } from '@gacp-erp/shared-events';
import { plantsTable, type Database } from '@gacp-erp/shared-database';
import { ZoneRepository } from '../../facilities/zone.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { DATABASE_TOKEN } from '../../database/database.module';

/**
 * BulkCreatePlantsUseCase
 *
 * Intake wizard step 2: creates N plants in a single DB transaction with a
 * single outbox event (PLANTS_CREATED_IN_BULK). Plant codes are auto-generated
 * as `{prefix}-{NNNN}` where NNNN is a zero-padded sequential integer that
 * continues from the highest existing code with that prefix.
 */
@Injectable()
export class BulkCreatePlantsUseCase {
  private readonly logger = new Logger(BulkCreatePlantsUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly outboxRepo: OutboxRepository,
    private readonly zoneRepo: ZoneRepository,
  ) {}

  async execute(dto: BulkCreatePlants, createdBy: string): Promise<BulkCreatePlantsResult> {
    const zone = await this.zoneRepo.findById(dto.zone_id);
    if (!zone) throw new BadRequestException(`Zone "${dto.zone_id}" not found`);
    if (!zone.is_active) throw new BadRequestException(`Zone "${dto.zone_id}" is inactive`);

    const result = await this.db.transaction(async (tx) => {
      // Find the highest existing sequence for this prefix to avoid collisions
      const [maxRow] = await tx
        .select({ maxCode: max(plantsTable.plant_code) })
        .from(plantsTable)
        .where(
          and(
            like(plantsTable.plant_code, `${dto.plant_code_prefix}-%`),
            isNull(plantsTable.deleted_at),
          ),
        );

      const startSeq = this.parseNextSeq(maxRow?.maxCode ?? null, dto.plant_code_prefix);
      const padLen = String(startSeq + dto.count - 1).length;

      const initialStage = this.resolveInitialStage(dto.source_type);

      const plantValues = Array.from({ length: dto.count }, (_, i) => {
        const seq = String(startSeq + i).padStart(Math.max(padLen, 4), '0');
        return {
          plant_code: `${dto.plant_code_prefix}-${seq}`.substring(0, 20),
          batch_id: dto.batch_id,
          strain_id: dto.strain_id,
          zone_id: dto.zone_id,
          current_stage: initialStage,
          source_type: dto.source_type as 'seed' | 'clone' | 'tissue_culture',
          current_health_score: 100,
          notes: dto.notes,
          created_by: createdBy,
          updated_by: createdBy,
        };
      });

      const inserted = await tx
        .insert(plantsTable)
        .values(plantValues)
        .returning({ id: plantsTable.id });
      const plantIds = inserted.map((r) => r.id);

      const event: PlantsCreatedInBulkEvent = {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        eventVersion: '1.0',
        producerService: 'cultivation-service',
        topic: CULTIVATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: createdBy as UserId,
        eventType: 'PLANTS_CREATED_IN_BULK',
        payload: {
          batchId: dto.batch_id as BatchId,
          strainId: dto.strain_id as StrainId,
          zoneId: dto.zone_id as ZoneId,
          sourceType: dto.source_type,
          plantCount: dto.count,
          plantIds: plantIds as PlantId[],
          createdAt: new Date().toISOString(),
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: CULTIVATION_TOPIC,
        key: dto.batch_id,
        payload: event as unknown as Record<string, unknown>,
      });

      return { created: plantIds.length, plant_ids: plantIds };
    });

    this.logger.log(
      `Bulk created ${result.created} plants for batch ${dto.batch_id} (prefix: ${dto.plant_code_prefix})`,
    );
    return result;
  }

  /**
   * Parse the numeric suffix from the max plant code to determine the next
   * sequential number. E.g. "CLN-2026-0042" → 43.
   */
  private parseNextSeq(maxCode: string | null, prefix: string): number {
    if (!maxCode) return 1;
    const suffix = maxCode.slice(prefix.length + 1); // strip "PREFIX-"
    const n = parseInt(suffix, 10);
    return isNaN(n) ? 1 : n + 1;
  }

  /** Map plant source type to the correct initial growth stage for bulk intake. */
  private resolveInitialStage(
    sourceType: BulkCreatePlants['source_type'],
  ): 'SEED' | 'CLONING' | 'GERMINATION' {
    if (sourceType === 'clone') return 'CLONING';
    if (sourceType === 'tissue_culture') return 'GERMINATION';
    return 'SEED';
  }
}
