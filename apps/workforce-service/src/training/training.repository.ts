import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc, sql } from 'drizzle-orm';
import {
  trainingCoursesTable,
  trainingExecutionsTable,
  certificationsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import type {
  Course,
  TrainingExecution,
  Certification,
  PaginationOpts,
  PaginatedResult,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class TrainingRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  // ─── COURSES ─────────────────────────────────────────────────────────────

  async findCourseById(id: string): Promise<Course | null> {
    const rows = await this.db
      .select()
      .from(trainingCoursesTable)
      .where(eq(trainingCoursesTable.id, id))
      .limit(1);
    return rows[0] ? this.mapCourse(rows[0]) : null;
  }

  async findCourseByIdOrThrow(id: string): Promise<Course> {
    const c = await this.findCourseById(id);
    if (!c) throw new NotFoundException(`Course ${id} not found`);
    return c;
  }

  async findManyCourses(pagination: PaginationOpts): Promise<PaginatedResult<Course>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(trainingCoursesTable)
        .orderBy(desc(trainingCoursesTable.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(trainingCoursesTable),
    ]);

    const total = countResult[0]?.count ?? 0;
    return {
      data: rows.map((r) => this.mapCourse(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createCourse(
    data: {
      course_id: string;
      title: string;
      type: Course['type'];
      duration_hours: number;
      passing_score: number;
      applicable_roles: string[];
      sop_references: string[];
    },
    userId: string,
    tx?: DbContext,
  ): Promise<Course> {
    const ctx = tx ?? this.db;
    // Map Zod type to DB enum (DB uses different values)
    const dbTypeMap: Record<
      string,
      'INITIAL' | 'REFRESHER' | 'GMP' | 'SAFETY' | 'ROLE_SPECIFIC' | 'COMPLIANCE' | 'SOP'
    > = {
      INITIAL: 'INITIAL',
      REFRESHER: 'REFRESHER',
      ANNUAL_RECERTIFICATION: 'COMPLIANCE',
    };
    const rows = await ctx
      .insert(trainingCoursesTable)
      .values({
        course_id: data.course_id,
        title: data.title,
        training_type: dbTypeMap[data.type] ?? 'INITIAL',
        // duration_minutes: convert hours to minutes
        duration_minutes: Math.round(data.duration_hours * 60),
        passing_score: data.passing_score,
        applicable_roles: data.applicable_roles,
        sop_references: data.sop_references,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .returning();
    return this.mapCourse(rows[0]!);
  }

  // ─── EXECUTIONS ──────────────────────────────────────────────────────────

  async findExecutionById(id: string): Promise<TrainingExecution | null> {
    const rows = await this.db
      .select()
      .from(trainingExecutionsTable)
      .where(eq(trainingExecutionsTable.id, id))
      .limit(1);
    return rows[0] ? this.mapExecution(rows[0]) : null;
  }

  async findExecutionByIdOrThrow(id: string): Promise<TrainingExecution> {
    const e = await this.findExecutionById(id);
    if (!e) throw new NotFoundException(`TrainingExecution ${id} not found`);
    return e;
  }

  async findManyExecutions(
    _filters: { trainee_id?: string; course_id?: string },
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<TrainingExecution>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(trainingExecutionsTable)
        .orderBy(desc(trainingExecutionsTable.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(trainingExecutionsTable),
    ]);

    const total = countResult[0]?.count ?? 0;
    return {
      data: rows.map((r) => this.mapExecution(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createExecution(
    data: {
      course_id: string;
      trainee_id: string;
      trainer_id?: string | null;
    },
    userId: string,
    tx?: DbContext,
  ): Promise<TrainingExecution> {
    const ctx = tx ?? this.db;
    const today = new Date().toISOString().split('T')[0]!;
    const rows = await ctx
      .insert(trainingExecutionsTable)
      .values({
        course_id: data.course_id,
        // trainingExecutionsTable uses employee_id for the trainee
        employee_id: data.trainee_id,
        trainer_id: data.trainer_id ?? null,
        status: 'SCHEDULED' as const,
        scheduled_date: today,
        created_by: userId,
        updated_by: userId,
      })
      .returning();
    return this.mapExecution(rows[0]!);
  }

  async completeExecution(
    id: string,
    score: number,
    signature: Record<string, unknown>,
    userId: string,
    tx?: DbContext,
  ): Promise<TrainingExecution> {
    const ctx = tx ?? this.db;
    const existing = await this.findExecutionByIdOrThrow(id);
    if (existing.status === 'COMPLETED' || existing.status === 'FAILED') {
      throw new BadRequestException(`Execution ${id} is already finalized`);
    }

    const course = await this.findCourseByIdOrThrow(existing.course_id);
    const passed = score >= course.passing_score;
    const today = new Date().toISOString().split('T')[0]!;
    const now = new Date();

    const rows = await ctx
      .update(trainingExecutionsTable)
      .set({
        status: passed ? 'COMPLETED' : 'FAILED',
        score,
        passed,
        completed_date: today,
        signature,
        updated_by: userId,
        updated_at: now,
      })
      .where(eq(trainingExecutionsTable.id, id))
      .returning();

    return this.mapExecution(rows[0]!);
  }

  // ─── CERTIFICATIONS ──────────────────────────────────────────────────────

  async findManyCertifications(
    _filters: { employee_id?: string },
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<Certification>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(certificationsTable)
        .orderBy(desc(certificationsTable.created_at))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(certificationsTable),
    ]);

    const total = countResult[0]?.count ?? 0;
    return {
      data: rows.map((r) => this.mapCertification(r)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createCertification(
    data: {
      employee_id: string;
      course_id: string;
      execution_id: string;
      issued_at: string;
      valid_until: string;
      certificate_number: string;
    },
    userId: string,
    tx?: DbContext,
  ): Promise<Certification> {
    const ctx = tx ?? this.db;
    const rows = await ctx
      .insert(certificationsTable)
      .values({
        employee_id: data.employee_id,
        course_id: data.course_id,
        execution_id: data.execution_id,
        issued_date: data.issued_at.split('T')[0]!,
        expiry_date: data.valid_until.split('T')[0] ?? null,
        certificate_number: data.certificate_number,
        is_active: true,
        issued_by: userId,
      })
      .returning();
    return this.mapCertification(rows[0]!);
  }

  // ─── MAPPERS ─────────────────────────────────────────────────────────────

  private mapCourse(row: typeof trainingCoursesTable.$inferSelect): Course {
    return {
      id: row.id,
      course_id: row.course_id,
      title: row.title,
      type: row.training_type as Course['type'],
      // Convert minutes to hours for the schema
      duration_hours: row.duration_minutes / 60,
      passing_score: row.passing_score,
      applicable_roles: (row.applicable_roles as string[]) ?? [],
      sop_references: (row.sop_references as string[]) ?? [],
      is_active: row.is_active,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by,
      updated_by: row.updated_by,
    } as unknown as Course;
  }

  private mapExecution(row: typeof trainingExecutionsTable.$inferSelect): TrainingExecution {
    return {
      id: row.id,
      course_id: row.course_id,
      // DB stores as employee_id, schema calls it trainee_id
      trainee_id: row.employee_id,
      trainer_id: row.trainer_id ?? null,
      status: row.status as TrainingExecution['status'],
      score: row.score ?? null,
      completed_at: row.completed_date ?? null,
      electronic_signature: (row.signature as Record<string, unknown>) ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by,
      updated_by: row.updated_by,
    } as unknown as TrainingExecution;
  }

  private mapCertification(row: typeof certificationsTable.$inferSelect): Certification {
    return {
      id: row.id,
      employee_id: row.employee_id,
      course_id: row.course_id,
      issued_at: row.issued_date,
      valid_until: row.expiry_date ?? '',
      certificate_number: row.certificate_number,
      electronic_signature: {},
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.issued_by,
      updated_by: row.issued_by,
    } as unknown as Certification;
  }
}
