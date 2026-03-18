import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { biologicalAssetsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import type { BiologicalAsset, ValuationMethod, UserId } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class BiologicalAssetRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<BiologicalAsset | null> {
    const rows = await this.db
      .select()
      .from(biologicalAssetsTable)
      .where(eq(biologicalAssetsTable.id, id))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<BiologicalAsset> {
    const asset = await this.findById(id);
    if (!asset) throw new NotFoundException(`Biological asset valuation ${id} not found`);
    return asset;
  }

  async findLatestByBatchId(batchId: string): Promise<BiologicalAsset | null> {
    const rows = await this.db
      .select()
      .from(biologicalAssetsTable)
      .where(eq(biologicalAssetsTable.batch_id, batchId))
      .orderBy(desc(biologicalAssetsTable.valued_at))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async create(
    tx: DbContext,
    data: Omit<BiologicalAsset, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<BiologicalAsset> {
    const rows = await tx
      .insert(biologicalAssetsTable)
      .values({
        batch_id: data.batch_id,
        valuation_method: data.valuation_method,
        fair_value: data.fair_value !== undefined ? String(data.fair_value) : null,
        cost_to_sell: data.cost_to_sell !== undefined ? String(data.cost_to_sell) : null,
        net_realizable_value:
          data.net_realizable_value !== undefined ? String(data.net_realizable_value) : null,
        cost_value: data.cost_value !== undefined ? String(data.cost_value) : null,
        quantity_grams: String(data.quantity_grams),
        valued_at: new Date(data.valued_at),
        valued_by: data.valued_by,
        electronic_signature: data.electronic_signature as Record<string, unknown>,
        journal_entry_id: data.journal_entry_id ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();
    return this.mapRow(rows[0]!);
  }

  private mapRow(row: typeof biologicalAssetsTable.$inferSelect): BiologicalAsset {
    return {
      id: row.id,
      batch_id: row.batch_id,
      valuation_method: row.valuation_method as ValuationMethod,
      fair_value: row.fair_value !== null ? parseFloat(row.fair_value) : null,
      cost_to_sell: row.cost_to_sell !== null ? parseFloat(row.cost_to_sell) : null,
      net_realizable_value:
        row.net_realizable_value !== null ? parseFloat(row.net_realizable_value) : null,
      cost_value: row.cost_value !== null ? parseFloat(row.cost_value) : null,
      quantity_grams: parseFloat(row.quantity_grams),
      valued_at: row.valued_at.toISOString(),
      valued_by: row.valued_by as UserId,
      electronic_signature: row.electronic_signature as BiologicalAsset['electronic_signature'],
      journal_entry_id: row.journal_entry_id ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }
}
