import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { plantsTable, stageRecordsTable, type Database } from '@gacp-erp/shared-database';
import {
  type Plant,
  type PlantStageTransitionRecord,
  type UserId,
  type CreatePlant,
  type PaginationQuery,
  type PaginatedResponse,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class PlantsRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Plant | null> {
    const rows = await this.db
      .select()
      .from(plantsTable)
      .where(and(eq(plantsTable.id, id), isNull(plantsTable.deleted_at)))
      .limit(1);

    return rows[0] ? this.mapRowToPlant(rows[0]) : null;
  }

  async findByCode(plantCode: string): Promise<Plant | null> {
    const rows = await this.db
      .select()
      .from(plantsTable)
      .where(and(eq(plantsTable.plant_code, plantCode), isNull(plantsTable.deleted_at)))
      .limit(1);

    return rows[0] ? this.mapRowToPlant(rows[0]) : null;
  }

  async findManyByBatch(
    batchId: string,
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Plant>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(plantsTable)
      .where(and(eq(plantsTable.batch_id, batchId), isNull(plantsTable.deleted_at)))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(plantsTable.created_at));

    return {
      data: rows.map((r) => this.mapRowToPlant(r)),
      page,
      limit,
      total: rows.length, // TODO: count query for accurate total
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async create(dto: CreatePlant, createdBy: string): Promise<Plant> {
    const rows = await this.db
      .insert(plantsTable)
      .values({
        plant_code: dto.plant_code,
        batch_id: dto.batch_id,
        strain_id: dto.strain_id,
        facility_id: dto.facility_id,
        zone_id: dto.zone_id,
        notes: dto.notes,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    if (!rows[0]) {
      throw new Error('Plant insert returned no rows');
    }
    return this.mapRowToPlant(rows[0]);
  }

  async updateStage(
    plantId: string,
    newStage: string,
    updatedBy: string,
    stageRecord: Omit<typeof stageRecordsTable.$inferInsert, 'id' | 'created_at'>,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(plantsTable)
        .set({
          current_stage: newStage as (typeof plantsTable.$inferInsert)['current_stage'],
          last_stage_change_at: new Date(),
          updated_by: updatedBy,
          updated_at: new Date(),
        })
        .where(eq(plantsTable.id, plantId));

      await tx.insert(stageRecordsTable).values({
        ...stageRecord,
        plant_id: plantId,
      });
    });
  }

  async getStageHistory(plantId: string): Promise<PlantStageTransitionRecord[]> {
    const rows = await this.db
      .select()
      .from(stageRecordsTable)
      .where(eq(stageRecordsTable.plant_id, plantId))
      .orderBy(desc(stageRecordsTable.transitioned_at));

    return rows.map(
      (r) =>
        ({
          id: r.id,
          plant_id: r.plant_id,
          from_stage: r.from_stage,
          to_stage: r.to_stage,
          transitioned_by: r.transitioned_by,
          transitioned_at: r.transitioned_at.toISOString(),
          created_at: r.created_at.toISOString(),
          notes: r.notes ?? undefined,
          electronic_signature: r.electronic_signature ?? undefined,
        }) as unknown as PlantStageTransitionRecord,
    );
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.db
      .update(plantsTable)
      .set({
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: deletedBy,
      })
      .where(eq(plantsTable.id, id));
  }

  private mapRowToPlant(row: typeof plantsTable.$inferSelect): Plant {
    return {
      id: row.id,
      plant_code: row.plant_code,
      batch_id: row.batch_id,
      strain_id: row.strain_id,
      current_stage: row.current_stage as Plant['current_stage'],
      facility_id: row.facility_id,
      zone_id: row.zone_id ?? undefined,
      last_stage_change_at: row.last_stage_change_at?.toISOString(),
      notes: row.notes ?? undefined,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
      is_deleted: row.is_deleted,
      deleted_at: row.deleted_at?.toISOString() ?? null,
      deleted_by: row.deleted_by as UserId | null,
    } as unknown as Plant;
  }
}
