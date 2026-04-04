import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { buildingsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import {
  type Building,
  type CreateBuilding,
  type UpdateBuilding,
  type BuildingType,
  type PaginationQuery,
  type PaginatedResponse,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class BuildingRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Building | null> {
    const rows = await this.db
      .select()
      .from(buildingsTable)
      .where(eq(buildingsTable.id, id))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Building> {
    const building = await this.findById(id);
    if (!building) throw new NotFoundException(`Building ${id} not found`);
    return building;
  }

  async findByCode(facilityId: string, code: string): Promise<Building | null> {
    const rows = await this.db
      .select()
      .from(buildingsTable)
      .where(
        and(eq(buildingsTable.facility_id, facilityId), eq(buildingsTable.building_code, code)),
      )
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findManyByFacility(
    facilityId: string,
    filters: { building_type?: BuildingType },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Building>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const bt = filters.building_type;
    const rows = await this.db
      .select()
      .from(buildingsTable)
      .where(
        and(
          eq(buildingsTable.facility_id, facilityId),
          bt !== undefined
            ? eq(buildingsTable.building_type, bt as 'indoor' | 'greenhouse' | 'open_ground')
            : undefined,
        ),
      )
      .limit(limit)
      .offset(offset)
      .orderBy(desc(buildingsTable.created_at));

    return {
      data: rows.map((r) => this.mapRow(r)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async createWithTx(tx: DbContext, dto: CreateBuilding, createdBy: string): Promise<Building> {
    const rows = await tx
      .insert(buildingsTable)
      .values({
        facility_id: dto.facility_id,
        building_code: dto.building_code,
        name: dto.name,
        building_type: dto.building_type as (typeof buildingsTable.$inferInsert)['building_type'],
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    if (!rows[0]) throw new Error('Building insert returned no rows');
    return this.mapRow(rows[0]);
  }

  async update(id: string, dto: UpdateBuilding, updatedBy: string): Promise<Building | null> {
    const rows = await this.db
      .update(buildingsTable)
      .set({
        ...(dto.building_code !== undefined && { building_code: dto.building_code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.building_type !== undefined && {
          building_type: dto.building_type as (typeof buildingsTable.$inferInsert)['building_type'],
        }),
        updated_by: updatedBy,
        updated_at: new Date(),
      })
      .where(eq(buildingsTable.id, id))
      .returning();

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: typeof buildingsTable.$inferSelect): Building {
    return {
      id: row.id,
      facility_id: row.facility_id,
      building_code: row.building_code,
      name: row.name,
      building_type: row.building_type as Building['building_type'],
      is_active: row.is_active,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    } as unknown as Building;
  }
}
