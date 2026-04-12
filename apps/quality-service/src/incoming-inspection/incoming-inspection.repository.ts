import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, type SQL, sql } from 'drizzle-orm';
import { incomingInspectionsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import type {
  IncomingInspection,
  IncomingInspectionStatus,
  UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface InspectionFilters {
  status?: IncomingInspectionStatus;
  supplier_id?: string;
  strain_id?: string;
  po_id?: string;
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

function buildInspectionNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `INS-${year}-${String(seq).padStart(4, '0')}`;
}

@Injectable()
export class IncomingInspectionRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async nextInspectionNumber(): Promise<string> {
    const result = await this.db.execute<{ nextval: string }>(
      sql`SELECT nextval('incoming_inspections_seq')`,
    );
    const seq = parseInt(result.rows[0]!.nextval, 10);
    return buildInspectionNumber(seq);
  }

  async findById(id: string): Promise<IncomingInspection | null> {
    const rows = await this.db
      .select()
      .from(incomingInspectionsTable)
      .where(eq(incomingInspectionsTable.id, id))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<IncomingInspection> {
    const inspection = await this.findById(id);
    if (!inspection) throw new NotFoundException(`Incoming inspection ${id} not found`);
    return inspection;
  }

  async findMany(
    filters: InspectionFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<IncomingInspection>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.status) conditions.push(eq(incomingInspectionsTable.status, filters.status));
    if (filters.supplier_id)
      conditions.push(eq(incomingInspectionsTable.supplier_id, filters.supplier_id));
    if (filters.strain_id)
      conditions.push(eq(incomingInspectionsTable.strain_id, filters.strain_id));
    if (filters.po_id) conditions.push(eq(incomingInspectionsTable.po_id, filters.po_id));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(incomingInspectionsTable)
      .where(where)
      .orderBy(desc(incomingInspectionsTable.created_at))
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
    data: Omit<IncomingInspection, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<IncomingInspection> {
    const rows = await tx
      .insert(incomingInspectionsTable)
      .values({
        inspection_number: data.inspection_number,
        grn_id: data.grn_id,
        po_id: data.po_id,
        supplier_id: data.supplier_id,
        strain_id: data.strain_id ?? null,
        status: data.status,
        visual_check_passed: data.visual_check_passed ?? null,
        quantity_verified: data.quantity_verified ?? null,
        quality_assessment_notes: data.quality_assessment_notes ?? null,
        dna_fingerprint_passed: data.dna_fingerprint_passed ?? null,
        cannabinoid_profile_passed: data.cannabinoid_profile_passed ?? null,
        pathogen_screening_passed: data.pathogen_screening_passed ?? null,
        germination_rate: data.germination_rate != null ? String(data.germination_rate) : null,
        quarantine_days_required: data.quarantine_days_required,
        quarantine_start_date: data.quarantine_start_date
          ? new Date(data.quarantine_start_date)
          : null,
        quarantine_end_date: data.quarantine_end_date ? new Date(data.quarantine_end_date) : null,
        disposition_decision: data.disposition_decision ?? null,
        disposition_reason: data.disposition_reason ?? null,
        electronic_signature: data.electronic_signature
          ? (data.electronic_signature as unknown as Record<string, unknown>)
          : null,
        validation_status: data.validation_status ?? 'unvalidated',
        validation_protocol_id: data.validation_protocol_id ?? null,
        last_validated_at: data.last_validated_at ? new Date(data.last_validated_at) : null,
        next_review_date: data.next_review_date ?? null,
        retention_class: data.retention_class ?? '7_YEAR',
        audit_tx_id: data.audit_tx_id ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();
    return this.mapRow(rows[0]!);
  }

  async update(
    tx: DbContext,
    id: string,
    data: Partial<IncomingInspection>,
  ): Promise<IncomingInspection> {
    const set: Record<string, unknown> = { updated_at: new Date() };

    if (data.status !== undefined) set.status = data.status;
    if (data.visual_check_passed !== undefined) set.visual_check_passed = data.visual_check_passed;
    if (data.quantity_verified !== undefined) set.quantity_verified = data.quantity_verified;
    if (data.quality_assessment_notes !== undefined)
      set.quality_assessment_notes = data.quality_assessment_notes;
    if (data.dna_fingerprint_passed !== undefined)
      set.dna_fingerprint_passed = data.dna_fingerprint_passed;
    if (data.cannabinoid_profile_passed !== undefined)
      set.cannabinoid_profile_passed = data.cannabinoid_profile_passed;
    if (data.pathogen_screening_passed !== undefined)
      set.pathogen_screening_passed = data.pathogen_screening_passed;
    if (data.germination_rate !== undefined)
      set.germination_rate = data.germination_rate != null ? String(data.germination_rate) : null;
    if (data.quarantine_start_date !== undefined)
      set.quarantine_start_date = data.quarantine_start_date
        ? new Date(data.quarantine_start_date)
        : null;
    if (data.quarantine_end_date !== undefined)
      set.quarantine_end_date = data.quarantine_end_date
        ? new Date(data.quarantine_end_date)
        : null;
    if (data.disposition_decision !== undefined)
      set.disposition_decision = data.disposition_decision;
    if (data.disposition_reason !== undefined) set.disposition_reason = data.disposition_reason;
    if (data.electronic_signature !== undefined)
      set.electronic_signature = data.electronic_signature as unknown as Record<string, unknown>;
    if (data.updated_by !== undefined) set.updated_by = data.updated_by;

    const rows = await tx
      .update(incomingInspectionsTable)
      .set(set)
      .where(eq(incomingInspectionsTable.id, id))
      .returning();

    if (!rows[0]) throw new NotFoundException(`Incoming inspection ${id} not found`);
    return this.mapRow(rows[0]);
  }

  private mapRow(row: typeof incomingInspectionsTable.$inferSelect): IncomingInspection {
    return {
      id: row.id,
      inspection_number: row.inspection_number,
      grn_id: row.grn_id,
      po_id: row.po_id,
      supplier_id: row.supplier_id,
      strain_id: row.strain_id ?? null,
      status: row.status as IncomingInspectionStatus,
      visual_check_passed: row.visual_check_passed ?? null,
      quantity_verified: row.quantity_verified ?? null,
      quality_assessment_notes: row.quality_assessment_notes ?? null,
      dna_fingerprint_passed: row.dna_fingerprint_passed ?? null,
      cannabinoid_profile_passed: row.cannabinoid_profile_passed ?? null,
      pathogen_screening_passed: row.pathogen_screening_passed ?? null,
      germination_rate: row.germination_rate ? parseFloat(row.germination_rate) : null,
      quarantine_days_required: row.quarantine_days_required,
      quarantine_start_date: row.quarantine_start_date?.toISOString() ?? null,
      quarantine_end_date: row.quarantine_end_date?.toISOString() ?? null,
      disposition_decision: row.disposition_decision as IncomingInspection['disposition_decision'],
      disposition_reason: row.disposition_reason ?? null,
      electronic_signature:
        (row.electronic_signature as IncomingInspection['electronic_signature']) ?? null,
      validation_status:
        (row.validation_status as IncomingInspection['validation_status']) ?? 'unvalidated',
      validation_protocol_id: row.validation_protocol_id ?? null,
      last_validated_at: row.last_validated_at?.toISOString() ?? null,
      next_review_date: row.next_review_date ?? null,
      retention_class: (row.retention_class as IncomingInspection['retention_class']) ?? '7_YEAR',
      audit_tx_id: row.audit_tx_id ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }
}
