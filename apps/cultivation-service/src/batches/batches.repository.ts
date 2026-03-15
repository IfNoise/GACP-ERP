import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { batchesTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import {
  type Batch,
  type CreateBatch,
  type UpdateBatch,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class BatchesRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Batch | null> {
    const rows = await this.db
      .select()
      .from(batchesTable)
      .where(and(eq(batchesTable.id, id), isNull(batchesTable.deleted_at)))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByBatchNumber(batchNumber: string): Promise<Batch | null> {
    const rows = await this.db
      .select()
      .from(batchesTable)
      .where(and(eq(batchesTable.batch_number, batchNumber), isNull(batchesTable.deleted_at)))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findMany(facilityId?: string): Promise<Batch[]> {
    const conditions = facilityId
      ? and(eq(batchesTable.facility_id, facilityId), isNull(batchesTable.deleted_at))
      : isNull(batchesTable.deleted_at);

    const rows = await this.db
      .select()
      .from(batchesTable)
      .where(conditions)
      .orderBy(desc(batchesTable.created_at));

    return rows.map((r) => this.mapRow(r));
  }

  async create(dto: CreateBatch, createdBy: string): Promise<Batch> {
    const rows = await this.db
      .insert(batchesTable)
      .values({
        batch_number: dto.batch_number,
        parent_batch_id: dto.parent_batch_id ?? undefined,
        strain_id: dto.strain_id,
        facility_id: dto.facility_id,
        zone_id: dto.zone_id,
        compliance_status: dto.compliance_status ?? 'pending',
        planned_plant_count: dto.planned_plant_count,
        notes: dto.notes,
        planned_start_date: dto.planned_start_date ? new Date(dto.planned_start_date) : undefined,
        planned_harvest_date: dto.planned_harvest_date
          ? new Date(dto.planned_harvest_date)
          : undefined,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    if (!rows[0]) throw new Error('Batch insert returned no rows');
    return this.mapRow(rows[0]);
  }

  async updateFields(id: string, dto: UpdateBatch, updatedBy: string): Promise<void> {
    await this.db
      .update(batchesTable)
      .set({
        ...(dto.zone_id !== undefined && { zone_id: dto.zone_id }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.planned_harvest_date !== undefined && {
          planned_harvest_date: new Date(dto.planned_harvest_date),
        }),
        ...(dto.status !== undefined && {
          status: dto.status as (typeof batchesTable.$inferInsert)['status'],
        }),
        updated_by: updatedBy,
        updated_at: new Date(),
      })
      .where(and(eq(batchesTable.id, id), isNull(batchesTable.deleted_at)));
  }

  async updateStatus(
    batchId: string,
    status: (typeof batchesTable.$inferInsert)['status'],
    updatedBy: string,
  ): Promise<void> {
    await this.db
      .update(batchesTable)
      .set({ status, updated_by: updatedBy, updated_at: new Date() })
      .where(eq(batchesTable.id, batchId));
  }

  /**
   * Transaction-aware variant of `updateStatus`.
   * Use inside `db.transaction()` in HarvestBatchUseCase.
   */
  async updateStatusWithTx(
    tx: DbContext,
    batchId: string,
    status: (typeof batchesTable.$inferInsert)['status'],
    updatedBy: string,
  ): Promise<void> {
    await tx
      .update(batchesTable)
      .set({ status, updated_by: updatedBy, updated_at: new Date() })
      .where(eq(batchesTable.id, batchId));
  }

  private mapRow(row: typeof batchesTable.$inferSelect): Batch {
    return {
      id: row.id,
      batch_number: row.batch_number,
      parent_batch_id: row.parent_batch_id ?? null,
      strain_id: row.strain_id,
      status: row.status as Batch['status'],
      compliance_status: row.compliance_status as Batch['compliance_status'],
      facility_id: row.facility_id,
      zone_id: row.zone_id ?? undefined,
      planned_plant_count: row.planned_plant_count,
      actual_plant_count: row.actual_plant_count,
      notes: row.notes ?? undefined,
      planned_start_date: row.planned_start_date?.toISOString(),
      actual_start_date: row.actual_start_date?.toISOString(),
      planned_harvest_date: row.planned_harvest_date?.toISOString(),
      actual_harvest_date: row.actual_harvest_date?.toISOString(),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
      is_deleted: row.is_deleted,
      deleted_at: row.deleted_at?.toISOString() ?? null,
      deleted_by: row.deleted_by as UserId | null,
    } as unknown as Batch;
  }
}
