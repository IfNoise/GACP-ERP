import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, type SQL, ilike } from 'drizzle-orm';
import {
  deviationsTable,
  deviationInvestigationsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import {
  type Deviation,
  type DeviationInvestigation,
  type DeviationStatus,
  type DeviationClassification,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface DeviationFilters {
  status?: DeviationStatus;
  classification?: DeviationClassification;
  reported_by?: string;
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
export class DeviationRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Deviation | null> {
    const rows = await this.db
      .select()
      .from(deviationsTable)
      .where(eq(deviationsTable.id, id))
      .limit(1);

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Deviation> {
    const dev = await this.findById(id);
    if (!dev) throw new NotFoundException(`Deviation ${id} not found`);
    return dev;
  }

  async findMany(
    filters: DeviationFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<Deviation>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.status) conditions.push(eq(deviationsTable.status, filters.status));
    if (filters.classification)
      conditions.push(eq(deviationsTable.classification, filters.classification));
    if (filters.reported_by) conditions.push(eq(deviationsTable.reported_by, filters.reported_by));
    if (filters.search) conditions.push(ilike(deviationsTable.title, `%${filters.search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(deviationsTable)
      .where(where)
      .orderBy(desc(deviationsTable.created_at))
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
    data: Omit<Deviation, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Deviation> {
    const rows = await tx
      .insert(deviationsTable)
      .values({
        deviation_number: data.deviation_number,
        classification: data.classification,
        category: data.category,
        status: data.status,
        title: data.title,
        description: data.description,
        location: data.location ?? null,
        batch_ids: data.batch_ids ?? [],
        occurred_at: data.occurred_at ? new Date(data.occurred_at) : null,
        reported_by: data.reported_by,
        linked_capa_id: data.linked_capa_id ?? null,
        product_impact: data.product_impact ?? null,
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

  async update(tx: DbContext, id: string, data: Partial<Deviation>): Promise<Deviation> {
    const rows = await tx
      .update(deviationsTable)
      .set({
        ...(data.status !== undefined && { status: data.status }),
        ...(data.linked_capa_id !== undefined && { linked_capa_id: data.linked_capa_id }),
        ...(data.product_impact !== undefined && { product_impact: data.product_impact }),
        ...(data.electronic_signature !== undefined && {
          electronic_signature: data.electronic_signature,
        }),
        updated_by: data.updated_by!,
        updated_at: new Date(),
      })
      .where(eq(deviationsTable.id, id))
      .returning();

    return this.mapRow(rows[0]!);
  }

  async createInvestigation(
    tx: DbContext,
    data: Omit<DeviationInvestigation, 'id' | 'investigated_at'>,
  ): Promise<DeviationInvestigation> {
    const rows = await tx
      .insert(deviationInvestigationsTable)
      .values({
        deviation_id: data.deviation_id,
        investigator_id: data.investigator_id,
        investigation_summary: data.investigation_summary,
        immediate_containment_actions: data.immediate_containment_actions,
        product_impact_assessment: data.product_impact_assessment,
        batches_affected: data.batches_affected ?? [],
        electronic_signature: data.electronic_signature ?? null,
      })
      .returning();

    const row = rows[0]!;
    return {
      id: row.id,
      deviation_id: row.deviation_id,
      investigator_id: row.investigator_id as UserId,
      investigation_summary: row.investigation_summary,
      immediate_containment_actions: row.immediate_containment_actions,
      product_impact_assessment: row.product_impact_assessment,
      batches_affected: row.batches_affected as string[],
      investigated_at: row.investigated_at.toISOString(),
      electronic_signature:
        row.electronic_signature as DeviationInvestigation['electronic_signature'],
    };
  }

  async nextDeviationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.db.execute<{ nextval: string }>(
      `SELECT nextval('deviation_seq')::text AS nextval`,
    );
    const seq = String(result.rows[0]?.nextval ?? '1').padStart(4, '0');
    return `DEV-${year}-${seq}`;
  }

  private mapRow(row: typeof deviationsTable.$inferSelect): Deviation {
    return {
      id: row.id,
      deviation_number: row.deviation_number,
      classification: row.classification,
      category: row.category,
      status: row.status,
      title: row.title,
      description: row.description,
      location: row.location ?? null,
      batch_ids: row.batch_ids as string[],
      occurred_at: row.occurred_at?.toISOString() ?? null,
      reported_by: row.reported_by as UserId,
      linked_capa_id: row.linked_capa_id ?? null,
      product_impact: row.product_impact ?? null,
      electronic_signature: row.electronic_signature as Deviation['electronic_signature'],
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
