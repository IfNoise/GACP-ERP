import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and, isNull, desc, sql, or, SQL } from 'drizzle-orm';
import {
  facilityZonesTable,
  zoneAssignmentsTable,
  racksTable,
  shelvesTable,
  traysTable,
  buildingsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import type {
  FacilityZone,
  ZoneAssignment,
  ZoneType,
  UserId,
  Rack,
  Shelf,
  Tray,
} from '@gacp-erp/shared-schemas';
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

export interface BuildingRecord {
  id: string;
  facility_id: string;
  building_name: string;
  building_code: string;
  is_active: boolean;
  model_url: string | null;
  model_format: string | null;
  created_at: string;
  updated_at: string;
}

type ShelfWithTrays = Shelf & { trays: Tray[] };
type RackWithShelves = Rack & { shelves: ShelfWithTrays[] };
type ZoneWithHierarchy = FacilityZone & {
  sub_zones: (FacilityZone & { racks: RackWithShelves[] })[];
  racks: RackWithShelves[];
};

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

    const whereConditions: SQL[] = [];
    if (filters.zone_type) {
      whereConditions.push(eq(facilityZonesTable.zone_type, filters.zone_type));
    }
    if (filters.is_active !== undefined) {
      whereConditions.push(eq(facilityZonesTable.is_active, filters.is_active));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const rows = await this.db
      .select()
      .from(facilityZonesTable)
      .where(whereClause)
      .orderBy(facilityZonesTable.zone_code)
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(facilityZonesTable)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data: rows.map((r) => this.mapZoneRow(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
        bounds_3d: data.bounds_3d ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();
    return this.mapZoneRow(rows[0]!);
  }

  async updateZoneBounds(
    tx: DbContext,
    id: string,
    bounds_3d: [number, number, number, number, number, number],
    updatedBy: UserId,
  ): Promise<FacilityZone> {
    await tx
      .update(facilityZonesTable)
      .set({ bounds_3d: JSON.stringify(bounds_3d), updated_at: new Date(), updated_by: updatedBy })
      .where(eq(facilityZonesTable.id, id));
    return this.findZoneByIdOrThrow(id);
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

  async findZoneWithSubzones(parentZoneId: string): Promise<FacilityZone[]> {
    const rows = await this.db
      .select()
      .from(facilityZonesTable)
      .where(
        or(
          eq(facilityZonesTable.id, parentZoneId),
          eq(facilityZonesTable.parent_zone_id, parentZoneId),
        ),
      )
      .orderBy(facilityZonesTable.zone_code);

    return rows.map((r) => this.mapZoneRow(r));
  }

  async findZoneHierarchy(zoneId: string): Promise<ZoneWithHierarchy | null> {
    const zone = await this.findZoneById(zoneId);
    if (!zone) return null;

    const subZoneRows = await this.db
      .select()
      .from(facilityZonesTable)
      .where(eq(facilityZonesTable.parent_zone_id, zoneId))
      .orderBy(facilityZonesTable.zone_code);

    const subZones = await Promise.all(
      subZoneRows.map(async (subZoneRow) => {
        const mapped = this.mapZoneRow(subZoneRow);
        const racks = await this.findRacksByZone(subZoneRow.id);
        return { ...mapped, racks };
      }),
    );

    const racks = await this.findRacksByZone(zoneId);

    return {
      ...zone,
      sub_zones: subZones,
      racks,
    };
  }

  async findRacksByZone(zoneId: string): Promise<RackWithShelves[]> {
    const racks = await this.db
      .select()
      .from(racksTable)
      .where(eq(racksTable.zone_id, zoneId))
      .orderBy(racksTable.rack_code);

    return Promise.all(
      racks.map(async (rack) => {
        const mappedRack = this.mapRackRow(rack);
        const shelves = await this.db
          .select()
          .from(shelvesTable)
          .where(eq(shelvesTable.rack_id, rack.id))
          .orderBy(shelvesTable.shelf_index);

        const shelvesWithTrays = await Promise.all(
          shelves.map(async (shelf) => {
            const trays = await this.db
              .select()
              .from(traysTable)
              .where(
                and(eq(traysTable.rack_id, rack.id), eq(traysTable.shelf_index, shelf.shelf_index)),
              )
              .orderBy(traysTable.position_index);

            return { ...this.mapShelfRow(shelf), trays: trays.map((t) => this.mapTrayRow(t)) };
          }),
        );

        return { ...mappedRack, shelves: shelvesWithTrays };
      }),
    );
  }

  async findTopLevelZones(
    filters: ZoneFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<FacilityZone>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const whereConditions: SQL[] = [isNull(facilityZonesTable.parent_zone_id)];
    if (filters.zone_type) {
      whereConditions.push(eq(facilityZonesTable.zone_type, filters.zone_type));
    }
    if (filters.is_active !== undefined) {
      whereConditions.push(eq(facilityZonesTable.is_active, filters.is_active));
    }

    const whereClause = and(...whereConditions);

    const rows = await this.db
      .select()
      .from(facilityZonesTable)
      .where(whereClause)
      .orderBy(facilityZonesTable.zone_code)
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(facilityZonesTable)
      .where(whereClause);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data: rows.map((r) => this.mapZoneRow(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Rack CRUD ─────────────────────────────────────────────────────────────────

  async nextRackCode(zoneId: string): Promise<string> {
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(racksTable)
      .where(eq(racksTable.zone_id, zoneId));
    const seq = Number(result[0]?.count ?? 0) + 1;
    return `R-${String(seq).padStart(3, '0')}`;
  }

  async findRackById(id: string): Promise<Rack | null> {
    const rows = await this.db.select().from(racksTable).where(eq(racksTable.id, id)).limit(1);
    return rows[0] ? this.mapRackRow(rows[0]) : null;
  }

  async findRackByIdOrThrow(id: string): Promise<Rack> {
    const rack = await this.findRackById(id);
    if (!rack) throw new NotFoundException(`Rack ${id} not found`);
    return rack;
  }

  async createRack(
    tx: DbContext,
    data: Omit<Rack, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
  ): Promise<Rack> {
    const rows = await tx
      .insert(racksTable)
      .values({
        zone_id: data.zone_id,
        rack_code: data.rack_code,
        rack_type: data.rack_type as '1-shelf' | '2-shelf' | '3-shelf' | 'custom',
        shelf_count: data.shelf_count,
        row_position: data.row_position ?? null,
        column_position: data.column_position ?? null,
        coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
        max_tray_capacity: data.max_tray_capacity ?? null,
        supported_tray_sizes: data.supported_tray_sizes ?? null,
      })
      .returning();
    return this.mapRackRow(rows[0]!);
  }

  async deleteRack(tx: DbContext, id: string): Promise<void> {
    await tx.delete(racksTable).where(eq(racksTable.id, id));
  }

  async findRacksByZonePaginated(
    zoneId: string,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<Rack>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(racksTable)
      .where(eq(racksTable.zone_id, zoneId))
      .orderBy(racksTable.rack_code)
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(racksTable)
      .where(eq(racksTable.zone_id, zoneId));

    const total = Number(totalResult[0]?.count ?? 0);
    return {
      data: rows.map((r) => this.mapRackRow(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Shelf CRUD ────────────────────────────────────────────────────────────────

  async createShelf(
    tx: DbContext,
    data: Omit<Shelf, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
  ): Promise<Shelf> {
    const rows = await tx
      .insert(shelvesTable)
      .values({
        rack_id: data.rack_id,
        shelf_index: data.shelf_index,
        height_from_floor: data.height_from_floor !== null ? String(data.height_from_floor) : null,
        max_trays: data.max_trays ?? null,
        occupied_positions: data.occupied_positions ?? 0,
      })
      .returning();
    return this.mapShelfRow(rows[0]!);
  }

  async listShelvesByRack(rackId: string): Promise<Shelf[]> {
    const rows = await this.db
      .select()
      .from(shelvesTable)
      .where(eq(shelvesTable.rack_id, rackId))
      .orderBy(shelvesTable.shelf_index);
    return rows.map((r) => this.mapShelfRow(r));
  }

  // ── Tray CRUD ─────────────────────────────────────────────────────────────────

  async findTrayById(id: string): Promise<Tray | null> {
    const rows = await this.db.select().from(traysTable).where(eq(traysTable.id, id)).limit(1);
    return rows[0] ? this.mapTrayRow(rows[0]) : null;
  }

  async findTrayByIdOrThrow(id: string): Promise<Tray> {
    const tray = await this.findTrayById(id);
    if (!tray) throw new NotFoundException(`Tray ${id} not found`);
    return tray;
  }

  async createTray(
    tx: DbContext,
    data: Omit<Tray, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
  ): Promise<Tray> {
    const rows = await tx
      .insert(traysTable)
      .values({
        rack_id: data.rack_id,
        shelf_index: data.shelf_index,
        position_index: data.position_index,
        tray_code: data.tray_code,
        tray_size: data.tray_size as 'small' | 'medium' | 'large' | 'custom',
        plant_capacity: data.plant_capacity ?? null,
        plant_layout: data.plant_layout ? JSON.stringify(data.plant_layout) : null,
        occupied_slots: data.occupied_slots ?? 0,
      })
      .returning();
    return this.mapTrayRow(rows[0]!);
  }

  async deleteTray(tx: DbContext, id: string): Promise<void> {
    await tx.delete(traysTable).where(eq(traysTable.id, id));
  }

  async listTraysByRack(
    rackId: string,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<Tray>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(traysTable)
      .where(eq(traysTable.rack_id, rackId))
      .orderBy(traysTable.shelf_index, traysTable.position_index)
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(traysTable)
      .where(eq(traysTable.rack_id, rackId));

    const total = Number(totalResult[0]?.count ?? 0);
    return {
      data: rows.map((r) => this.mapTrayRow(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Buildings ─────────────────────────────────────────────────────────────────

  async findAllBuildings(): Promise<BuildingRecord[]> {
    const rows = await this.db
      .select()
      .from(buildingsTable)
      .where(eq(buildingsTable.is_active, true))
      .orderBy(buildingsTable.building_code);
    return rows.map((r) => this.mapBuildingRow(r));
  }

  async findBuildingById(id: string): Promise<BuildingRecord | null> {
    const rows = await this.db
      .select()
      .from(buildingsTable)
      .where(eq(buildingsTable.id, id))
      .limit(1);
    return rows[0] ? this.mapBuildingRow(rows[0]) : null;
  }

  async findBuildingByIdOrThrow(id: string): Promise<BuildingRecord> {
    const building = await this.findBuildingById(id);
    if (!building) throw new NotFoundException(`Building ${id} not found`);
    return building;
  }

  async updateBuildingModel(
    id: string,
    model_url: string,
    model_format: 'ifc' | 'gltf' | 'xkt',
  ): Promise<BuildingRecord> {
    await this.db
      .update(buildingsTable)
      .set({ model_url, model_format, updated_at: new Date() })
      .where(eq(buildingsTable.id, id));
    return this.findBuildingByIdOrThrow(id);
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
      bounds_3d: row.bounds_3d as [number, number, number, number, number, number] | null,
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

  private mapRackRow(row: typeof racksTable.$inferSelect): Rack {
    return {
      id: row.id,
      zone_id: row.zone_id,
      rack_code: row.rack_code,
      rack_type: row.rack_type as Rack['rack_type'],
      shelf_count: row.shelf_count,
      row_position: row.row_position ?? null,
      column_position: row.column_position ?? null,
      coordinates: row.coordinates
        ? (row.coordinates as { x: number; y: number; z: number })
        : null,
      max_tray_capacity: row.max_tray_capacity ?? null,
      supported_tray_sizes: row.supported_tray_sizes ?? null,
      qr_code: row.qr_code ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: 'system' as UserId,
      updated_by: 'system' as UserId,
    };
  }

  private mapShelfRow(row: typeof shelvesTable.$inferSelect): Shelf {
    return {
      id: row.id,
      rack_id: row.rack_id,
      shelf_index: row.shelf_index,
      height_from_floor: row.height_from_floor !== null ? parseFloat(row.height_from_floor) : null,
      max_trays: row.max_trays ?? null,
      occupied_positions: row.occupied_positions,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: 'system' as UserId,
      updated_by: 'system' as UserId,
    };
  }

  private mapTrayRow(row: typeof traysTable.$inferSelect): Tray {
    return {
      id: row.id,
      rack_id: row.rack_id,
      shelf_index: row.shelf_index,
      position_index: row.position_index,
      tray_code: row.tray_code,
      tray_size: row.tray_size as Tray['tray_size'],
      plant_capacity: row.plant_capacity ?? null,
      plant_layout: row.plant_layout ? (row.plant_layout as Tray['plant_layout']) : null,
      occupied_slots: row.occupied_slots,
      qr_code: row.qr_code ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: 'system' as UserId,
      updated_by: 'system' as UserId,
    };
  }

  private mapBuildingRow(row: typeof buildingsTable.$inferSelect): BuildingRecord {
    return {
      id: row.id,
      facility_id: row.facility_id,
      building_name: row.name,
      building_code: row.building_code,
      is_active: row.is_active,
      model_url: row.model_url ?? null,
      model_format: row.model_format ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}
