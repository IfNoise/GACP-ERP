import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc, sql } from 'drizzle-orm';
import { timeEntriesTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import type {
  TimeEntry,
  TimeEntryFilters,
  PaginationOpts,
  PaginatedResult,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class TimeEntryRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<TimeEntry | null> {
    const rows = await this.db
      .select()
      .from(timeEntriesTable)
      .where(eq(timeEntriesTable.id, id))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<TimeEntry> {
    const entry = await this.findById(id);
    if (!entry) throw new NotFoundException(`TimeEntry ${id} not found`);
    return entry;
  }

  async findMany(
    _filters: TimeEntryFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<TimeEntry>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const rows = await this.db
      .select()
      .from(timeEntriesTable)
      .orderBy(desc(timeEntriesTable.created_at))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(timeEntriesTable);

    const total = countResult[0]?.count ?? 0;

    return {
      data: rows.map((r) => this.mapRow(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async clockIn(
    data: {
      employee_id: string;
      task_id?: string | null;
      clock_in_at: string;
      recorded_via: TimeEntry['recorded_via'];
    },
    userId: string,
    tx?: DbContext,
  ): Promise<TimeEntry> {
    const sourceMap: Record<string, 'MANUAL' | 'MOBILE' | 'SYSTEM' | 'BIOMETRIC'> = {
      TERMINAL: 'MOBILE',
      WEB: 'MANUAL',
      API: 'SYSTEM',
    };
    const dbSource = sourceMap[data.recorded_via] ?? 'MANUAL';
    const ctx = tx ?? this.db;
    const rows = await ctx
      .insert(timeEntriesTable)
      .values({
        employee_id: data.employee_id,
        task_id: data.task_id ?? null,
        clock_in: new Date(data.clock_in_at),
        source: dbSource,
        created_by: userId,
        updated_by: userId,
      })
      .returning();
    return this.mapRow(rows[0]!);
  }

  async clockOut(id: string, userId: string, tx?: DbContext): Promise<TimeEntry> {
    const ctx = tx ?? this.db;
    const now = new Date();
    const rows = await ctx
      .update(timeEntriesTable)
      .set({
        clock_out: now,
        updated_by: userId,
        updated_at: now,
      })
      .where(eq(timeEntriesTable.id, id))
      .returning();
    if (!rows[0]) throw new NotFoundException(`TimeEntry ${id} not found`);
    return this.mapRow(rows[0]);
  }

  private mapRow(row: typeof timeEntriesTable.$inferSelect): TimeEntry {
    const sourceReverseMap: Record<string, TimeEntry['recorded_via']> = {
      MOBILE: 'TERMINAL',
      MANUAL: 'WEB',
      SYSTEM: 'API',
      BIOMETRIC: 'TERMINAL',
    };
    return {
      id: row.id,
      employee_id: row.employee_id,
      task_id: row.task_id ?? null,
      clock_in_at: row.clock_in.toISOString(),
      clock_out_at: row.clock_out?.toISOString() ?? null,
      duration_minutes: row.duration_minutes ?? null,
      recorded_via: sourceReverseMap[row.source] ?? 'WEB',
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by,
      updated_by: row.updated_by,
    } as unknown as TimeEntry;
  }
}
