import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { roomsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import {
  type Room,
  type CreateRoom,
  type UpdateRoom,
  type PaginationQuery,
  type PaginatedResponse,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class RoomRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Room | null> {
    const rows = await this.db.select().from(roomsTable).where(eq(roomsTable.id, id)).limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Room> {
    const room = await this.findById(id);
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return room;
  }

  async findByCode(buildingId: string, code: string): Promise<Room | null> {
    const rows = await this.db
      .select()
      .from(roomsTable)
      .where(and(eq(roomsTable.building_id, buildingId), eq(roomsTable.room_code, code)))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findManyByBuilding(
    buildingId: string,
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<Room>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.building_id, buildingId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(roomsTable.created_at));

    return {
      data: rows.map((r) => this.mapRow(r)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async createWithTx(tx: DbContext, dto: CreateRoom, createdBy: string): Promise<Room> {
    const rows = await tx
      .insert(roomsTable)
      .values({
        building_id: dto.building_id,
        room_code: dto.room_code,
        name: dto.name,
        dimensions: dto.dimensions ?? null,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    if (!rows[0]) throw new Error('Room insert returned no rows');
    return this.mapRow(rows[0]);
  }

  async update(id: string, dto: UpdateRoom, updatedBy: string): Promise<Room | null> {
    const rows = await this.db
      .update(roomsTable)
      .set({
        ...(dto.room_code !== undefined && { room_code: dto.room_code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.dimensions !== undefined && { dimensions: dto.dimensions }),
        updated_by: updatedBy,
        updated_at: new Date(),
      })
      .where(eq(roomsTable.id, id))
      .returning();

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  private mapRow(row: typeof roomsTable.$inferSelect): Room {
    return {
      id: row.id,
      building_id: row.building_id,
      room_code: row.room_code,
      name: row.name,
      dimensions: row.dimensions as Record<string, unknown> | null,
      is_active: row.is_active,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    } as unknown as Room;
  }
}
