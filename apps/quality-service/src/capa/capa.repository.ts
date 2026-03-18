import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, type SQL, ilike } from 'drizzle-orm';
import {
  capasTable,
  rcaFindingsTable,
  capaActionPlansTable,
  effectivenessChecksTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import {
  type CAPA,
  type RcaFinding,
  type EffectivenessCheck,
  type CapaStatus,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface CapaFilters {
  status?: CapaStatus;
  type?: string;
  assigned_to?: string;
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
export class CapaRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<CAPA | null> {
    const rows = await this.db.select().from(capasTable).where(eq(capasTable.id, id)).limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<CAPA> {
    const capa = await this.findById(id);
    if (!capa) throw new NotFoundException(`CAPA ${id} not found`);
    return capa;
  }

  async findMany(filters: CapaFilters, pagination: PaginationOpts): Promise<PaginatedResult<CAPA>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.status) conditions.push(eq(capasTable.status, filters.status));
    if (filters.type)
      conditions.push(eq(capasTable.type, filters.type as 'CORRECTIVE' | 'PREVENTIVE'));
    if (filters.assigned_to) conditions.push(eq(capasTable.assigned_to, filters.assigned_to));
    if (filters.search) conditions.push(ilike(capasTable.title, `%${filters.search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(capasTable)
      .where(where)
      .orderBy(desc(capasTable.created_at))
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

  async create(tx: DbContext, data: Omit<CAPA, 'id' | 'created_at' | 'updated_at'>): Promise<CAPA> {
    const rows = await tx
      .insert(capasTable)
      .values({
        capa_number: data.capa_number,
        type: data.type,
        source: data.source,
        status: data.status,
        title: data.title,
        description: data.description,
        root_cause_category: data.root_cause_category ?? null,
        source_record_type: data.source_record_type ?? null,
        source_record_id: data.source_record_id ?? null,
        due_date: data.due_date ?? null,
        assigned_to: data.assigned_to ?? null,
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

  async update(tx: DbContext, id: string, data: Partial<CAPA>): Promise<CAPA> {
    const rows = await tx
      .update(capasTable)
      .set({
        ...(data.status !== undefined && { status: data.status }),
        ...(data.root_cause_category !== undefined && {
          root_cause_category: data.root_cause_category,
        }),
        ...(data.electronic_signature !== undefined && {
          electronic_signature: data.electronic_signature,
        }),
        updated_by: data.updated_by!,
        updated_at: new Date(),
      })
      .where(eq(capasTable.id, id))
      .returning();

    return this.mapRow(rows[0]!);
  }

  async createRcaFinding(
    tx: DbContext,
    data: Omit<RcaFinding, 'id' | 'investigated_at'>,
  ): Promise<RcaFinding> {
    const rows = await tx
      .insert(rcaFindingsTable)
      .values({
        capa_id: data.capa_id,
        root_cause_category: data.root_cause_category,
        root_cause_description: data.root_cause_description,
        contributing_factors: data.contributing_factors ?? [],
        immediate_actions_taken: data.immediate_actions_taken ?? null,
        investigated_by: data.investigated_by,
      })
      .returning();

    return {
      id: rows[0]!.id,
      capa_id: rows[0]!.capa_id,
      root_cause_category: rows[0]!.root_cause_category,
      root_cause_description: rows[0]!.root_cause_description,
      contributing_factors: rows[0]!.contributing_factors as string[],
      immediate_actions_taken: rows[0]!.immediate_actions_taken ?? undefined,
      investigated_by: rows[0]!.investigated_by as UserId,
      investigated_at: rows[0]!.investigated_at.toISOString(),
    };
  }

  async createActionPlans(
    tx: DbContext,
    capaId: string,
    actions: Array<{ description: string; responsible_person: string; target_date: string }>,
  ): Promise<void> {
    await tx.insert(capaActionPlansTable).values(
      actions.map((a) => ({
        capa_id: capaId,
        description: a.description,
        responsible_person: a.responsible_person,
        target_date: a.target_date,
      })),
    );
  }

  async createEffectivenessCheck(
    tx: DbContext,
    data: Omit<EffectivenessCheck, 'id'>,
  ): Promise<EffectivenessCheck> {
    const rows = await tx
      .insert(effectivenessChecksTable)
      .values({
        capa_id: data.capa_id,
        result: data.result,
        evidence_description: data.evidence_description,
        check_date: data.check_date,
        checked_by: data.checked_by,
        follow_up_capa_id: data.follow_up_capa_id ?? null,
        electronic_signature: data.electronic_signature,
      })
      .returning();

    const row = rows[0]!;
    return {
      id: row.id,
      capa_id: row.capa_id,
      result: row.result,
      evidence_description: row.evidence_description,
      check_date: row.check_date,
      checked_by: row.checked_by as UserId,
      follow_up_capa_id: row.follow_up_capa_id ?? null,
      electronic_signature: row.electronic_signature as EffectivenessCheck['electronic_signature'],
    };
  }

  async nextCapaNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.db.execute<{ nextval: string }>(
      `SELECT nextval('capa_seq')::text AS nextval`,
    );
    const seq = String(result.rows[0]?.nextval ?? '1').padStart(4, '0');
    return `CA-${year}-${seq}`;
  }

  private mapRow(row: typeof capasTable.$inferSelect): CAPA {
    return {
      id: row.id,
      capa_number: row.capa_number,
      type: row.type,
      source: row.source,
      status: row.status,
      title: row.title,
      description: row.description,
      root_cause_category: row.root_cause_category ?? null,
      source_record_type: row.source_record_type ?? null,
      source_record_id: row.source_record_id ?? null,
      due_date: row.due_date ?? null,
      assigned_to: (row.assigned_to as UserId | null) ?? null,
      electronic_signature: row.electronic_signature as CAPA['electronic_signature'],
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
}
