import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import {
  tasksTable,
  taskAssignmentsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import type {
  Task,
  UserId,
  TaskFilters,
  PaginationOpts,
  PaginatedResult,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class TaskRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Task | null> {
    const rows = await this.db
      .select({
        id: tasksTable.id,
        task_number: tasksTable.task_number,
        title: tasksTable.title,
        description: tasksTable.description,
        task_type: tasksTable.task_type,
        priority: tasksTable.priority,
        status: tasksTable.status,
        zone_id: tasksTable.zone_id,
        batch_id: tasksTable.batch_id,
        scheduled_date: tasksTable.scheduled_date,
        scheduled_start: tasksTable.scheduled_start,
        scheduled_end: tasksTable.scheduled_end,
        actual_start: tasksTable.actual_start,
        actual_end: tasksTable.actual_end,
        sop_reference: tasksTable.sop_reference,
        completion_notes: tasksTable.completion_notes,
        created_at: tasksTable.created_at,
        updated_at: tasksTable.updated_at,
        created_by: tasksTable.created_by,
        updated_by: tasksTable.updated_by,
        assigned_to_employee: taskAssignmentsTable.employee_id,
      })
      .from(tasksTable)
      .leftJoin(
        taskAssignmentsTable,
        and(
          eq(taskAssignmentsTable.task_id, tasksTable.id),
          eq(taskAssignmentsTable.is_lead, true),
        ),
      )
      .where(eq(tasksTable.id, id))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Task> {
    const task = await this.findById(id);
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async findMany(filters: TaskFilters, pagination: PaginationOpts): Promise<PaginatedResult<Task>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.status) {
      conditions.push(eq(tasksTable.status, filters.status as Task['status']));
    }
    if (filters.zone_id) {
      conditions.push(eq(tasksTable.zone_id, filters.zone_id));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const selectedFields = {
      id: tasksTable.id,
      task_number: tasksTable.task_number,
      title: tasksTable.title,
      description: tasksTable.description,
      task_type: tasksTable.task_type,
      priority: tasksTable.priority,
      status: tasksTable.status,
      zone_id: tasksTable.zone_id,
      batch_id: tasksTable.batch_id,
      scheduled_date: tasksTable.scheduled_date,
      scheduled_start: tasksTable.scheduled_start,
      scheduled_end: tasksTable.scheduled_end,
      actual_start: tasksTable.actual_start,
      actual_end: tasksTable.actual_end,
      sop_reference: tasksTable.sop_reference,
      completion_notes: tasksTable.completion_notes,
      created_at: tasksTable.created_at,
      updated_at: tasksTable.updated_at,
      created_by: tasksTable.created_by,
      updated_by: tasksTable.updated_by,
      assigned_to_employee: taskAssignmentsTable.employee_id,
    };

    const [rows, countResult] = await Promise.all([
      this.db
        .select(selectedFields)
        .from(tasksTable)
        .leftJoin(
          taskAssignmentsTable,
          and(
            eq(taskAssignmentsTable.task_id, tasksTable.id),
            eq(taskAssignmentsTable.is_lead, true),
          ),
        )
        .where(where)
        .orderBy(desc(tasksTable.created_at))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(tasksTable)
        .where(where),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data: rows.map((r) => this.mapRow(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(
    data: {
      task_number: string;
      title: string;
      description?: string | null;
      task_type: string;
      assigned_to: UserId;
      zone_id?: string | null;
      batch_id?: string | null;
      priority: Task['priority'];
      scheduled_date: string;
      scheduled_start?: string | null;
      scheduled_end?: string | null;
      sop_reference?: string | null;
    },
    userId: string,
    tx?: DbContext,
  ): Promise<Task> {
    const ctx = tx ?? this.db;

    const rows = await ctx
      .insert(tasksTable)
      .values({
        task_number: data.task_number,
        title: data.title,
        description: data.description ?? null,
        task_type: data.task_type,
        priority: (data.priority === 'URGENT' ? 'CRITICAL' : data.priority) as
          | 'CRITICAL'
          | 'HIGH'
          | 'MEDIUM'
          | 'LOW',
        status: 'PENDING' as const,
        zone_id: data.zone_id ?? null,
        batch_id: data.batch_id ?? null,
        scheduled_date: data.scheduled_date,
        scheduled_start: data.scheduled_start ?? null,
        scheduled_end: data.scheduled_end ?? null,
        sop_reference: data.sop_reference ?? null,
        created_by: userId,
        updated_by: userId,
      })
      .returning();

    const task = rows[0]!;

    // Insert lead assignment
    await ctx.insert(taskAssignmentsTable).values({
      task_id: task.id,
      employee_id: data.assigned_to,
      assigned_by: userId,
      is_lead: true,
    });

    return this.mapRow({ ...task, assigned_to_employee: data.assigned_to });
  }

  async complete(id: string, userId: string, tx?: DbContext): Promise<Task> {
    const ctx = tx ?? this.db;
    const now = new Date();
    const rows = await ctx
      .update(tasksTable)
      .set({
        status: 'COMPLETED' as const,
        actual_end: now,
        updated_by: userId,
        updated_at: now,
      })
      .where(eq(tasksTable.id, id))
      .returning();
    if (!rows[0]) throw new NotFoundException(`Task ${id} not found`);
    return this.mapRow({ ...rows[0], assigned_to_employee: null });
  }

  private mapRow(
    row: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Record<string, any>,
  ): Task {
    return {
      id: row['id'] as string,
      task_number: row['task_number'] as string,
      title: row['title'] as string,
      description: (row['description'] as string | null) ?? null,
      assigned_to: ((row['assigned_to_employee'] as string | null) ?? '') as UserId,
      zone_id: (row['zone_id'] as string | null) ?? null,
      batch_id: (row['batch_id'] as string | null) ?? null,
      priority: ((row['priority'] as string) === 'CRITICAL'
        ? 'URGENT'
        : (row['priority'] as string)) as Task['priority'],
      status: row['status'] as Task['status'],
      scheduled_start: row['scheduled_start']
        ? `${row['scheduled_date'] as string}T${row['scheduled_start'] as string}:00Z`
        : null,
      scheduled_end: row['scheduled_end']
        ? `${row['scheduled_date'] as string}T${row['scheduled_end'] as string}:00Z`
        : null,
      completed_at: row['actual_end'] ? (row['actual_end'] as Date).toISOString() : null,
      sop_reference: (row['sop_reference'] as string | null) ?? null,
      created_at: (row['created_at'] as Date).toISOString(),
      updated_at: (row['updated_at'] as Date).toISOString(),
      created_by: row['created_by'] as string,
      updated_by: row['updated_by'] as string,
    } as unknown as Task;
  }
}
