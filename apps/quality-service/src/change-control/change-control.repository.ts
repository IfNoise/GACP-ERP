import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, type SQL, ilike } from 'drizzle-orm';
import {
  changeControlsTable,
  changeImpactsTable,
  changeApprovalsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import {
  type ChangeControl,
  type ChangeImpact,
  type ChangeApproval,
  type ChangeControlStatus,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface ChangeControlFilters {
  status?: ChangeControlStatus;
  requestor_id?: string;
  change_type?: string;
  search?: string;
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
export class ChangeControlRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<ChangeControl | null> {
    const rows = await this.db
      .select()
      .from(changeControlsTable)
      .where(eq(changeControlsTable.id, id))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<ChangeControl> {
    const cc = await this.findById(id);
    if (!cc) throw new NotFoundException(`Change Control ${id} not found`);
    return cc;
  }

  async findMany(
    filters: ChangeControlFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<ChangeControl>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.status) conditions.push(eq(changeControlsTable.status, filters.status));
    if (filters.requestor_id)
      conditions.push(eq(changeControlsTable.requestor_id, filters.requestor_id));
    if (filters.change_type)
      conditions.push(
        eq(changeControlsTable.change_type, filters.change_type as 'MINOR' | 'MAJOR' | 'EMERGENCY'),
      );
    if (filters.search) conditions.push(ilike(changeControlsTable.title, `%${filters.search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(changeControlsTable)
      .where(where)
      .orderBy(desc(changeControlsTable.created_at))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => this.mapRow(r)),
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async create(
    tx: DbContext,
    data: Omit<ChangeControl, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<ChangeControl> {
    const rows = await tx
      .insert(changeControlsTable)
      .values({
        ccn_number: data.ccn_number,
        title: data.title,
        description: data.description,
        change_type: data.change_type,
        status: data.status,
        requestor_id: data.requestor_id,
        electronic_signature: data.electronic_signature ?? null,
        validation_status: data.validation_status ?? 'unvalidated',
        retention_class: data.retention_class ?? '7_YEAR',
        audit_tx_id: data.audit_tx_id ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();

    return this.mapRow(rows[0]!);
  }

  async update(tx: DbContext, id: string, data: Partial<ChangeControl>): Promise<ChangeControl> {
    const rows = await tx
      .update(changeControlsTable)
      .set({
        ...(data.status !== undefined && { status: data.status }),
        ...(data.electronic_signature !== undefined && {
          electronic_signature: data.electronic_signature,
        }),
        ...(data.audit_tx_id !== undefined && { audit_tx_id: data.audit_tx_id }),
        updated_by: data.updated_by!,
        updated_at: new Date(),
      })
      .where(eq(changeControlsTable.id, id))
      .returning();

    return this.mapRow(rows[0]!);
  }

  async createImpact(
    tx: DbContext,
    data: Omit<ChangeImpact, 'id' | 'assessed_at'>,
  ): Promise<ChangeImpact> {
    const rows = await tx
      .insert(changeImpactsTable)
      .values({
        change_control_id: data.change_control_id,
        area: data.area,
        impact_description: data.impact_description,
        risk_level: data.risk_level,
        assessed_by: data.assessed_by,
      })
      .returning();

    return this.mapImpactRow(rows[0]!);
  }

  async findImpacts(changeControlId: string): Promise<ChangeImpact[]> {
    const rows = await this.db
      .select()
      .from(changeImpactsTable)
      .where(eq(changeImpactsTable.change_control_id, changeControlId));

    return rows.map((r) => this.mapImpactRow(r));
  }

  async createApproval(
    tx: DbContext,
    data: Omit<ChangeApproval, 'id' | 'decided_at'>,
  ): Promise<ChangeApproval> {
    const rows = await tx
      .insert(changeApprovalsTable)
      .values({
        change_control_id: data.change_control_id,
        approver_id: data.approver_id,
        approval_level: data.approval_level,
        status: data.status,
        electronic_signature: data.electronic_signature,
      })
      .returning();

    return this.mapApprovalRow(rows[0]!);
  }

  async findApprovals(changeControlId: string): Promise<ChangeApproval[]> {
    const rows = await this.db
      .select()
      .from(changeApprovalsTable)
      .where(eq(changeApprovalsTable.change_control_id, changeControlId));

    return rows.map((r) => this.mapApprovalRow(r));
  }

  async nextCcnNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.db.execute<{ nextval: string }>(
      `SELECT nextval('change_control_seq')::text AS nextval`,
    );
    const seq = String(result.rows[0]?.nextval ?? '1').padStart(4, '0');
    return `CCN-${year}-${seq}`;
  }

  // ─── PRIVATE MAPPERS ─────────────────────────────────────────────────────────

  private mapRow(row: typeof changeControlsTable.$inferSelect): ChangeControl {
    return {
      id: row.id,
      ccn_number: row.ccn_number,
      title: row.title,
      description: row.description,
      change_type: row.change_type,
      status: row.status,
      requestor_id: row.requestor_id as UserId,
      approver_ids: [], // populated separately when needed
      electronic_signature: row.electronic_signature as ChangeControl['electronic_signature'],
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

  private mapImpactRow(row: typeof changeImpactsTable.$inferSelect): ChangeImpact {
    return {
      id: row.id,
      change_control_id: row.change_control_id,
      area: row.area,
      impact_description: row.impact_description,
      risk_level: row.risk_level,
      assessed_by: row.assessed_by as UserId,
      assessed_at: row.assessed_at.toISOString(),
    };
  }

  private mapApprovalRow(row: typeof changeApprovalsTable.$inferSelect): ChangeApproval {
    return {
      id: row.id,
      change_control_id: row.change_control_id,
      approver_id: row.approver_id as UserId,
      approval_level: row.approval_level,
      status: row.status,
      electronic_signature:
        (row.electronic_signature as ChangeApproval['electronic_signature']) ?? null,
      decided_at: row.decided_at?.toISOString() ?? null,
    };
  }
}
