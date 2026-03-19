import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import { employeesTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import type {
  Employee,
  UserId,
  EmployeeFilters,
  PaginationOpts,
  PaginatedResult,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class EmployeeRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Employee | null> {
    const rows = await this.db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Employee> {
    const emp = await this.findById(id);
    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return emp;
  }

  async findByEmployeeNumber(employeeNumber: string): Promise<Employee | null> {
    const rows = await this.db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.employee_number, employeeNumber))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findMany(
    filters: EmployeeFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<Employee>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.department) {
      conditions.push(eq(employeesTable.department, filters.department));
    }
    if (filters.is_active !== undefined) {
      conditions.push(eq(employeesTable.is_active, filters.is_active));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(employeesTable)
        .where(where)
        .orderBy(desc(employeesTable.created_at))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(employeesTable)
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
      employee_number: string;
      user_id: UserId;
      position: string;
      department: string;
      hire_date: string;
      competency_profile_id?: string | null;
    },
    userId: string,
    tx?: DbContext,
  ): Promise<Employee> {
    const ctx = tx ?? this.db;
    const rows = await ctx
      .insert(employeesTable)
      .values({
        employee_number: data.employee_number,
        user_id: data.user_id,
        first_name: data.position.split(' ')[0] ?? data.position,
        last_name: data.position.split(' ')[1] ?? '-',
        email: `${data.employee_number.toLowerCase()}@internal`,
        role: data.position,
        job_title: data.position,
        department: data.department,
        hire_date: data.hire_date,
        competency_profile_id: data.competency_profile_id ?? null,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .returning();
    return this.mapRow(rows[0]!);
  }

  async deactivate(id: string, userId: string): Promise<Employee> {
    const rows = await this.db
      .update(employeesTable)
      .set({ is_active: false, updated_by: userId, updated_at: new Date() })
      .where(eq(employeesTable.id, id))
      .returning();
    if (!rows[0]) throw new NotFoundException(`Employee ${id} not found`);
    return this.mapRow(rows[0]);
  }

  private mapRow(row: typeof employeesTable.$inferSelect): Employee {
    return {
      id: row.id,
      employee_number: row.employee_number,
      user_id: (row.user_id ?? '') as UserId,
      position: row.job_title,
      department: row.department,
      hire_date: row.hire_date,
      competency_profile_id: row.competency_profile_id ?? null,
      is_active: row.is_active,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by,
      updated_by: row.updated_by,
    } as unknown as Employee;
  }
}
