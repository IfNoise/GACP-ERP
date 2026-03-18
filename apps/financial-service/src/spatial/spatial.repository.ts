import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import {
  facilityZonesTable,
  zoneAssignmentsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import type { FacilityZone, ZoneAssignment, ZoneType, UserId } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

function buildZoneCode(seq: number): string {
  return `ZONE-${String(seq).padStart(8, '0')}`;
}

export interface ZoneFilters {
  zone_type?: ZoneType;
  is_active?: boolean;
}

export interface PaginationOpts {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class SpatialRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async nextZoneCode(): Promise<string> {
    const result = await this.db.execute<{ nextval: string }>(
      sql`SELECT nextval('facility_zones_seq')`,
    );
    const seq = parseInt(result.rows[0]!.nextval, 10);
    return buildZoneCode(seq);
  }

  async findZoneById(id: string): Promise<FacilityZone | null> {
    const rows = await this.db
      .select()
      .from(facilityZonesTable)
      .where(eq(facilityZonesTable.id, id))
      .limit(1);
    return rows[0] ? this.mapZoneRow(rows[0]) : null;
  }

  async findZoneByIdOrThrow(id: string): Promise<FacilityZone> {
    const zone = await this.findZoneById(id);
    if (!zone) throw new NotFoundException(`Facility zone ${id} not found`);
    return zone;
  }

  async findManyZones(
    filters: ZoneFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<FacilityZone>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(facilityZonesTable)
      .where(
        and(
          filters.zone_type ? eq(facilityZonesTable.zone_type, filters.zone_type) : undefined,
          filters.is_active !== undefined
            ? eq(facilityZonesTable.is_active, filters.is_active)
            : undefined,
        ),
      )
      .orderBy(facilityZonesTable.zone_code)
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => this.mapZoneRow(r)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async createZone(
    tx: DbContext,
    data: Omit<FacilityZone, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<FacilityZone> {
    const rows = await tx
      .insert(facilityZonesTable)
      .values({
        zone_code: data.zone_code,
        zone_name: data.zone_name,
        zone_type: data.zone_type,
        area_sqm: data.area_sqm !== undefined ? String(data.area_sqm) : null,
        capacity: data.capacity ?? null,
        parent_zone_id: data.parent_zone_id ?? null,
        is_active: data.is_active ?? true,
        current_occupancy: data.current_occupancy ?? 0,
        notes: data.notes ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();
    return this.mapZoneRow(rows[0]!);
  }

  async findAssignmentById(id: string): Promise<ZoneAssignment | null> {
    const rows = await this.db
      .select()
      .from(zoneAssignmentsTable)
      .where(eq(zoneAssignmentsTable.id, id))
      .limit(1);
    return rows[0] ? this.mapAssignmentRow(rows[0]) : null;
  }

  async findAssignmentByIdOrThrow(id: string): Promise<ZoneAssignment> {
    const assignment = await this.findAssignmentById(id);
    if (!assignment) throw new NotFoundException(`Zone assignment ${id} not found`);
    return assignment;
  }

  async findActiveAssignmentForBatch(batchId: string): Promise<ZoneAssignment | null> {
    const rows = await this.db
      .select()
      .from(zoneAssignmentsTable)
      .where(
        and(eq(zoneAssignmentsTable.batch_id, batchId), isNull(zoneAssignmentsTable.released_at)),
      )
      .limit(1);
    return rows[0] ? this.mapAssignmentRow(rows[0]) : null;
  }

  async listActiveAssignmentsForZone(
    zoneId: string,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<ZoneAssignment>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(zoneAssignmentsTable)
      .where(
        and(eq(zoneAssignmentsTable.zone_id, zoneId), isNull(zoneAssignmentsTable.released_at)),
      )
      .orderBy(desc(zoneAssignmentsTable.assigned_at))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => this.mapAssignmentRow(r)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  /**
   * Assigns a batch to a zone.
   * Increments zone occupancy within the same transaction.
   */
  async assignBatch(
    tx: DbContext,
    data: Omit<ZoneAssignment, 'id' | 'created_at' | 'updated_at' | 'released_at' | 'released_by'>,
  ): Promise<ZoneAssignment> {
    const rows = await tx
      .insert(zoneAssignmentsTable)
      .values({
        zone_id: data.zone_id,
        batch_id: data.batch_id,
        assigned_at: new Date(data.assigned_at),
        assigned_by: data.assigned_by,
        notes: data.notes ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();

    await tx
      .update(facilityZonesTable)
      .set({ current_occupancy: sql`current_occupancy + 1`, updated_at: new Date() })
      .where(eq(facilityZonesTable.id, data.zone_id));

    return this.mapAssignmentRow(rows[0]!);
  }

  /**
   * Releases a batch from its zone.
   * Decrements zone occupancy within the same transaction.
   */
  async releaseBatch(
    tx: DbContext,
    assignmentId: string,
    releasedBy: UserId,
    notes?: string,
  ): Promise<ZoneAssignment> {
    const assignment = await this.findAssignmentByIdOrThrow(assignmentId);

    if (assignment.released_at) {
      throw new ConflictException(`Assignment ${assignmentId} has already been released`);
    }

    const now = new Date();
    await tx
      .update(zoneAssignmentsTable)
      .set({
        released_at: now,
        released_by: releasedBy,
        notes: notes ?? assignment.notes ?? null,
        updated_by: releasedBy,
        updated_at: now,
      })
      .where(eq(zoneAssignmentsTable.id, assignmentId));

    await tx
      .update(facilityZonesTable)
      .set({
        current_occupancy: sql`GREATEST(0, current_occupancy - 1)`,
        updated_at: now,
      })
      .where(eq(facilityZonesTable.id, assignment.zone_id));

    return (await this.findAssignmentById(assignmentId))!;
  }

  private mapZoneRow(row: typeof facilityZonesTable.$inferSelect): FacilityZone {
    return {
      id: row.id,
      zone_code: row.zone_code,
      zone_name: row.zone_name,
      zone_type: row.zone_type as ZoneType,
      area_sqm: row.area_sqm !== null ? parseFloat(row.area_sqm) : null,
      capacity: row.capacity ?? null,
      parent_zone_id: row.parent_zone_id ?? null,
      is_active: row.is_active,
      current_occupancy: row.current_occupancy,
      notes: row.notes ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }

  private mapAssignmentRow(row: typeof zoneAssignmentsTable.$inferSelect): ZoneAssignment {
    return {
      id: row.id,
      zone_id: row.zone_id,
      batch_id: row.batch_id,
      assigned_at: row.assigned_at.toISOString(),
      assigned_by: row.assigned_by as UserId,
      released_at: row.released_at?.toISOString() ?? null,
      released_by: (row.released_by as UserId | null) ?? null,
      notes: row.notes ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }
}
