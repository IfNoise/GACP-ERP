import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { facilitiesTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import {
  type Facility,
  type CreateFacility,
  type UpdateFacility,
  type PaginationQuery,
  type PaginatedResponse,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class FacilityRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Facility | null> {
    const rows = await this.db
      .select()
      .from(facilitiesTable)
      .where(eq(facilitiesTable.id, id))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Facility> {
    const facility = await this.findById(id);
    if (!facility) throw new NotFoundException(`Facility ${id} not found`);
    return facility;
  }

  async findByCode(code: string): Promise<Facility | null> {
    const rows = await this.db
      .select()
      .from(facilitiesTable)
      .where(eq(facilitiesTable.facility_code, code))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findMany(
    filters: { is_active?: boolean },
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Facility>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(facilitiesTable)
      .where(
        and(
          filters.is_active !== undefined
            ? eq(facilitiesTable.is_active, filters.is_active)
            : undefined,
        ),
      )
      .limit(limit)
      .offset(offset)
      .orderBy(desc(facilitiesTable.created_at));

    return {
      data: rows.map((r) => this.mapRow(r)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async createWithTx(tx: DbContext, dto: CreateFacility, createdBy: string): Promise<Facility> {
    const rows = await tx
      .insert(facilitiesTable)
      .values({
        facility_code: dto.facility_code,
        name: dto.name,
        address: dto.address,
        coordinates: dto.coordinates ?? null,
        dimensions: dto.dimensions ?? null,
        license_number: dto.license_number ?? null,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    if (!rows[0]) throw new Error('Facility insert returned no rows');
    return this.mapRow(rows[0]);
  }

  async update(id: string, dto: UpdateFacility, updatedBy: string): Promise<Facility | null> {
    const rows = await this.db
      .update(facilitiesTable)
      .set({
        ...(dto.facility_code !== undefined && { facility_code: dto.facility_code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.coordinates !== undefined && { coordinates: dto.coordinates }),
        ...(dto.dimensions !== undefined && { dimensions: dto.dimensions }),
        ...(dto.license_number !== undefined && { license_number: dto.license_number }),
        updated_by: updatedBy,
        updated_at: new Date(),
      })
      .where(eq(facilitiesTable.id, id))
      .returning();

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: typeof facilitiesTable.$inferSelect): Facility {
    return {
      id: row.id,
      facility_code: row.facility_code,
      name: row.name,
      address: row.address,
      coordinates: row.coordinates as Record<string, unknown> | null,
      dimensions: row.dimensions as Record<string, unknown> | null,
      license_number: row.license_number ?? undefined,
      is_active: row.is_active,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    } as unknown as Facility;
  }
}
