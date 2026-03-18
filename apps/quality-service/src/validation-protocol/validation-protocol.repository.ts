import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, type SQL } from 'drizzle-orm';
import {
  validationProtocolsTable,
  validationTestsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import {
  type ValidationProtocol,
  type ValidationTest,
  type ValidationProtocolStatus,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface ValidationProtocolFilters {
  status?: ValidationProtocolStatus;
  type?: string;
  change_control_id?: string;
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
export class ValidationProtocolRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<ValidationProtocol | null> {
    const rows = await this.db
      .select()
      .from(validationProtocolsTable)
      .where(eq(validationProtocolsTable.id, id))
      .limit(1);

    if (!rows[0]) return null;

    const tests = await this.db
      .select()
      .from(validationTestsTable)
      .where(eq(validationTestsTable.protocol_id, id))
      .orderBy(validationTestsTable.step_number);

    return this.mapRow(rows[0], tests);
  }

  async findByIdOrThrow(id: string): Promise<ValidationProtocol> {
    const protocol = await this.findById(id);
    if (!protocol) throw new NotFoundException(`ValidationProtocol ${id} not found`);
    return protocol;
  }

  async findMany(
    filters: ValidationProtocolFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<ValidationProtocol>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.status) conditions.push(eq(validationProtocolsTable.status, filters.status));
    if (filters.type)
      conditions.push(eq(validationProtocolsTable.type, filters.type as 'IQ' | 'OQ' | 'PQ'));
    if (filters.change_control_id)
      conditions.push(eq(validationProtocolsTable.change_control_id, filters.change_control_id));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(validationProtocolsTable)
      .where(where)
      .orderBy(desc(validationProtocolsTable.created_at))
      .limit(limit)
      .offset(offset);

    const protocols: ValidationProtocol[] = [];
    for (const row of rows) {
      const tests = await this.db
        .select()
        .from(validationTestsTable)
        .where(eq(validationTestsTable.protocol_id, row.id))
        .orderBy(validationTestsTable.step_number);
      protocols.push(this.mapRow(row, tests));
    }

    return {
      data: protocols,
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async create(
    tx: DbContext,
    data: Omit<ValidationProtocol, 'id' | 'created_at' | 'updated_at' | 'test_steps'> & {
      test_steps: Array<Pick<ValidationTest, 'step_number' | 'description' | 'expected_result'>>;
    },
  ): Promise<ValidationProtocol> {
    const rows = await tx
      .insert(validationProtocolsTable)
      .values({
        protocol_number: data.protocol_number,
        type: data.type,
        status: data.status,
        system_under_test: data.system_under_test,
        change_control_id: data.change_control_id ?? null,
        electronic_signature: data.electronic_signature ?? null,
        validation_status: data.validation_status ?? 'unvalidated',
        validation_protocol_id: data.validation_protocol_id ?? null,
        retention_class: data.retention_class ?? 'PERMANENT',
        audit_tx_id: data.audit_tx_id ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();

    const protocol = rows[0]!;

    // Insert initial test steps if provided
    const insertedTests: (typeof validationTestsTable.$inferSelect)[] = [];
    if (data.test_steps && data.test_steps.length > 0) {
      const testRows = await tx
        .insert(validationTestsTable)
        .values(
          data.test_steps.map((step) => ({
            protocol_id: protocol.id,
            step_number: step.step_number,
            description: step.description,
            expected_result: step.expected_result,
            actual_result: null,
            status: 'PENDING' as const,
            exception_note: null,
            executed_by: null,
            executed_at: null,
            electronic_signature: null,
          })),
        )
        .returning();
      insertedTests.push(...testRows);
    }

    return this.mapRow(protocol, insertedTests);
  }

  async update(
    tx: DbContext,
    id: string,
    data: Partial<ValidationProtocol>,
  ): Promise<ValidationProtocol> {
    const rows = await tx
      .update(validationProtocolsTable)
      .set({
        ...(data.status !== undefined && { status: data.status }),
        ...(data.electronic_signature !== undefined && {
          electronic_signature: data.electronic_signature,
        }),
        ...(data.audit_tx_id !== undefined && { audit_tx_id: data.audit_tx_id }),
        updated_by: data.updated_by!,
        updated_at: new Date(),
      })
      .where(eq(validationProtocolsTable.id, id))
      .returning();

    const tests = await tx
      .select()
      .from(validationTestsTable)
      .where(eq(validationTestsTable.protocol_id, id))
      .orderBy(validationTestsTable.step_number);

    return this.mapRow(rows[0]!, tests);
  }

  async upsertTestStep(
    tx: DbContext,
    protocolId: string,
    step: {
      step_number: number;
      actual_result: string;
      status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE';
      exception_note?: string;
      executed_by: UserId;
      executed_at: string;
      electronic_signature: ValidationTest['electronic_signature'];
    },
  ): Promise<void> {
    await tx
      .update(validationTestsTable)
      .set({
        actual_result: step.actual_result,
        status: step.status,
        exception_note: step.exception_note ?? null,
        executed_by: step.executed_by,
        executed_at: new Date(step.executed_at),
        electronic_signature: step.electronic_signature,
      })
      .where(
        and(
          eq(validationTestsTable.protocol_id, protocolId),
          eq(validationTestsTable.step_number, step.step_number),
        ),
      );
  }

  async nextProtocolNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.db.execute<{ nextval: string }>(
      `SELECT nextval('validation_protocols_seq')::text AS nextval`,
    );
    const seq = String(result.rows[0]?.nextval ?? '1').padStart(4, '0');
    return `VAL-${year}-${seq}`;
  }

  private mapRow(
    row: typeof validationProtocolsTable.$inferSelect,
    tests: (typeof validationTestsTable.$inferSelect)[],
  ): ValidationProtocol {
    return {
      id: row.id,
      protocol_number: row.protocol_number,
      type: row.type,
      status: row.status,
      system_under_test: row.system_under_test,
      change_control_id: row.change_control_id ?? null,
      test_steps: tests.map((t) => this.mapTestRow(t)),
      electronic_signature: row.electronic_signature as ValidationProtocol['electronic_signature'],
      validation_status: row.validation_status,
      validation_protocol_id: row.validation_protocol_id ?? null,
      last_validated_at: row.last_validated_at?.toISOString() ?? null,
      next_review_date: row.next_review_date ?? null,
      retention_class: row.retention_class,
      audit_tx_id: row.audit_tx_id ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }

  private mapTestRow(row: typeof validationTestsTable.$inferSelect): ValidationTest {
    return {
      id: row.id,
      protocol_id: row.protocol_id,
      step_number: row.step_number,
      description: row.description,
      expected_result: row.expected_result,
      actual_result: row.actual_result ?? null,
      status: row.status,
      exception_note: row.exception_note ?? null,
      executed_by: (row.executed_by as UserId | null) ?? null,
      executed_at: row.executed_at?.toISOString() ?? null,
      electronic_signature: row.electronic_signature as ValidationTest['electronic_signature'],
    };
  }
}
