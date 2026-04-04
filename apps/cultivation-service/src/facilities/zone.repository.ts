import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import {
  zonesTable,
  roomsTable,
  buildingsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import {
  type Zone,
  type CreateZone,
  type UpdateZone,
  type PlantZoneType,
  type PaginationQuery,
  type PaginatedResponse,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class ZoneRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Zone | null> {
    const rows = await this.db.select().from(zonesTable).where(eq(zonesTable.id, id)).limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Zone> {
    const zone = await this.findById(id);
    if (!zone) throw new NotFoundException(`Zone ${id} not found`);
    return zone;
  }

  async findByCode(roomId: string, code: string): Promise<Zone | null> {
    const rows = await this.db
      .select()
      .from(zonesTable)
      .where(and(eq(zonesTable.room_id, roomId), eq(zonesTable.zone_code, code)))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findManyByRoom(
    roomId: string,
    filters: { zone_type?: PlantZoneType },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Zone>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(zonesTable)
      .where(
        and(
          eq(zonesTable.room_id, roomId),
          filters.zone_type ? eq(zonesTable.zone_type, filters.zone_type) : undefined,
        ),
      )
      .limit(limit)
      .offset(offset)
      .orderBy(desc(zonesTable.created_at));

    return {
      data: rows.map((r) => this.mapRow(r)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async findManyByFacility(
    facilityId: string,
    filters: { zone_type?: PlantZoneType },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Zone>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select({ zone: zonesTable })
      .from(zonesTable)
      .innerJoin(roomsTable, eq(zonesTable.room_id, roomsTable.id))
      .innerJoin(buildingsTable, eq(roomsTable.building_id, buildingsTable.id))
      .where(
        and(
          eq(buildingsTable.facility_id, facilityId),
          filters.zone_type ? eq(zonesTable.zone_type, filters.zone_type) : undefined,
        ),
      )
      .limit(limit)
      .offset(offset)
      .orderBy(desc(zonesTable.created_at));

    return {
      data: rows.map((r) => this.mapRow(r.zone)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async createWithTx(tx: DbContext, dto: CreateZone, createdBy: string): Promise<Zone> {
    const rows = await tx
      .insert(zonesTable)
      .values({
        room_id: dto.room_id,
        zone_code: dto.zone_code,
        zone_type: dto.zone_type as (typeof zonesTable.$inferInsert)['zone_type'],
        name: dto.name,
        area_m2: dto.area_m2 != null ? String(dto.area_m2) : null,
        max_plants: dto.max_plants ?? null,
        environment_config: dto.environment_config ?? null,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    if (!rows[0]) throw new Error('Zone insert returned no rows');
    return this.mapRow(rows[0]);
  }

  async update(id: string, dto: UpdateZone, updatedBy: string): Promise<Zone | null> {
    const rows = await this.db
      .update(zonesTable)
      .set({
        ...(dto.zone_code !== undefined && { zone_code: dto.zone_code }),
        ...(dto.zone_type !== undefined && {
          zone_type: dto.zone_type as (typeof zonesTable.$inferInsert)['zone_type'],
        }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.area_m2 !== undefined && {
          area_m2: dto.area_m2 != null ? String(dto.area_m2) : null,
        }),
        ...(dto.max_plants !== undefined && { max_plants: dto.max_plants }),
        ...(dto.environment_config !== undefined && {
          environment_config: dto.environment_config,
        }),
        updated_by: updatedBy,
        updated_at: new Date(),
      })
      .where(eq(zonesTable.id, id))
      .returning();

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async resolveFacilityId(zoneId: string): Promise<string | null> {
    const rows = await this.db
      .select({ facilityId: buildingsTable.facility_id })
      .from(zonesTable)
      .innerJoin(roomsTable, eq(zonesTable.room_id, roomsTable.id))
      .innerJoin(buildingsTable, eq(roomsTable.building_id, buildingsTable.id))
      .where(eq(zonesTable.id, zoneId))
      .limit(1);
    return rows[0]?.facilityId ?? null;
  }

  private mapRow(row: typeof zonesTable.$inferSelect): Zone {
    return {
      id: row.id,
      room_id: row.room_id,
      zone_code: row.zone_code,
      zone_type: row.zone_type as Zone['zone_type'],
      name: row.name,
      area_m2: row.area_m2 != null ? parseFloat(row.area_m2) : undefined,
      environment_config: row.environment_config as Record<string, unknown> | null,
      coordinates: row.coordinates as Record<string, unknown> | null,
      max_plants: row.max_plants ?? undefined,
      is_active: row.is_active,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    } as unknown as Zone;
  }
}
