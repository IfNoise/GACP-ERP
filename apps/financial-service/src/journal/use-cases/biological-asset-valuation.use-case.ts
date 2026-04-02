import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type {
  RecordBiologicalAssetValuation,
  BiologicalAsset,
  UserId,
} from '@gacp-erp/shared-schemas';
import {
  FINANCE_TRANSACTION_TOPIC,
  type BiologicalAssetValuedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { BiologicalAssetRepository } from '../biological-asset.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class BiologicalAssetValuationUseCase {
  private readonly logger = new Logger(BiologicalAssetValuationUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: BiologicalAssetRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: RecordBiologicalAssetValuation, authorId: string): Promise<BiologicalAsset> {
    const now = new Date().toISOString();

    const asset = await this.db.transaction(async (tx) => {
      const nrv =
        dto.valuation_method === 'FAIR_VALUE'
          ? (dto.fair_value ?? 0) - (dto.cost_to_sell ?? 0)
          : null;

      const created = await this.repo.create(tx, {
        batch_id: dto.batch_id,
        valuation_method: dto.valuation_method,
        fair_value: dto.fair_value ?? null,
        cost_to_sell: dto.cost_to_sell ?? null,
        net_realizable_value: nrv,
        cost_value: dto.cost_value ?? null,
        quantity_grams: dto.quantity_grams,
        valued_at: now,
        valued_by: authorId as UserId,
        electronic_signature: dto.electronic_signature,
        journal_entry_id: null,
        created_by: authorId as UserId,
        updated_by: authorId as UserId,
      });

      const event: BiologicalAssetValuedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: FINANCE_TRANSACTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'finance.biological_asset.valued',
        payload: {
          biologicalAssetId: created.id,
          batchId: created.batch_id,
          valuationMethod: created.valuation_method,
          fairValue: created.fair_value,
          netRealizableValue: nrv,
          quantityGrams: created.quantity_grams,
          valuedBy: created.valued_by,
          valuedAt: created.valued_at,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: FINANCE_TRANSACTION_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(
      `Biological asset valuation recorded for batch ${asset.batch_id} (id: ${asset.id})`,
    );
    return asset;
  }
}
