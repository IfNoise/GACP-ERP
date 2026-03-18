import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, type SQL } from 'drizzle-orm';
import {
  qualityEventsTable,
  linkedRecordsTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import {
  type QualityEvent,
  type LinkedRecord,
  type QualityEventStatus,
  type LinkedRecordType,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface QualityEventFilters {
  status?: QualityEventStatus;
  type?: string;
  severity?: string;
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
export class QualityEventRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<QualityEvent | null> {
    const rows = await this.db
      .select()
      .from(qualityEventsTable)
      .where(eq(qualityEventsTable.id, id))
      .limit(1);

    if (!rows[0]) return null;

    const links = await this.db
      .select()
      .from(linkedRecordsTable)
      .where(eq(linkedRecordsTable.quality_event_id, id));

    return this.mapRow(rows[0], links);
  }

  async findByIdOrThrow(id: string): Promise<QualityEvent> {
    const event = await this.findById(id);
    if (!event) throw new NotFoundException(`QualityEvent ${id} not found`);
    return event;
  }

  async findMany(
    filters: QualityEventFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<QualityEvent>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.status) conditions.push(eq(qualityEventsTable.status, filters.status));
    if (filters.type)
      conditions.push(
        eq(
          qualityEventsTable.type,
          filters.type as
            | 'COMPLAINT'
            | 'AUDIT_FINDING'
            | 'INSPECTION_OBSERVATION'
            | 'QUALITY_ISSUE',
        ),
      );
    if (filters.severity)
      conditions.push(
        eq(qualityEventsTable.severity, filters.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'),
      );

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(qualityEventsTable)
      .where(where)
      .orderBy(desc(qualityEventsTable.created_at))
      .limit(limit)
      .offset(offset);

    const events: QualityEvent[] = [];
    for (const row of rows) {
      const links = await this.db
        .select()
        .from(linkedRecordsTable)
        .where(eq(linkedRecordsTable.quality_event_id, row.id));
      events.push(this.mapRow(row, links));
    }

    return {
      data: events,
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit),
    };
  }

  async create(
    tx: DbContext,
    data: Omit<QualityEvent, 'id' | 'created_at' | 'updated_at' | 'linked_records'>,
  ): Promise<QualityEvent> {
    const rows = await tx
      .insert(qualityEventsTable)
      .values({
        event_number: data.event_number,
        type: data.type,
        severity: data.severity,
        status: data.status,
        title: data.title,
        description: data.description,
        capa_id: data.capa_id ?? null,
        electronic_signature: data.electronic_signature ?? null,
        validation_status: data.validation_status ?? 'unvalidated',
        validation_protocol_id: data.validation_protocol_id ?? null,
        retention_class: data.retention_class ?? '7_YEAR',
        audit_tx_id: data.audit_tx_id ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();

    return this.mapRow(rows[0]!, []);
  }

  async update(tx: DbContext, id: string, data: Partial<QualityEvent>): Promise<QualityEvent> {
    const rows = await tx
      .update(qualityEventsTable)
      .set({
        ...(data.status !== undefined && { status: data.status }),
        ...(data.capa_id !== undefined && { capa_id: data.capa_id }),
        ...(data.electronic_signature !== undefined && {
          electronic_signature: data.electronic_signature,
        }),
        ...(data.audit_tx_id !== undefined && { audit_tx_id: data.audit_tx_id }),
        updated_by: data.updated_by!,
        updated_at: new Date(),
      })
      .where(eq(qualityEventsTable.id, id))
      .returning();

    const links = await tx
      .select()
      .from(linkedRecordsTable)
      .where(eq(linkedRecordsTable.quality_event_id, id));

    return this.mapRow(rows[0]!, links);
  }

  async addLinkedRecord(
    tx: DbContext,
    eventId: string,
    recordType: LinkedRecordType,
    recordId: string,
    linkedBy: UserId,
  ): Promise<LinkedRecord> {
    const rows = await tx
      .insert(linkedRecordsTable)
      .values({
        quality_event_id: eventId,
        record_type: recordType,
        record_id: recordId,
        linked_by: linkedBy,
      })
      .returning();

    const row = rows[0]!;
    return {
      id: row.id,
      quality_event_id: row.quality_event_id,
      record_type: row.record_type,
      record_id: row.record_id,
      linked_by: row.linked_by as UserId,
      linked_at: row.linked_at.toISOString(),
    };
  }

  async nextEventNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.db.execute<{ nextval: string }>(
      `SELECT nextval('quality_events_seq')::text AS nextval`,
    );
    const seq = String(result.rows[0]?.nextval ?? '1').padStart(4, '0');
    return `QE-${year}-${seq}`;
  }

  private mapRow(
    row: typeof qualityEventsTable.$inferSelect,
    links: (typeof linkedRecordsTable.$inferSelect)[],
  ): QualityEvent {
    return {
      id: row.id,
      event_number: row.event_number,
      type: row.type,
      severity: row.severity,
      status: row.status,
      title: row.title,
      description: row.description,
      capa_id: row.capa_id ?? null,
      linked_records: links.map((l) => ({
        id: l.id,
        quality_event_id: l.quality_event_id,
        record_type: l.record_type,
        record_id: l.record_id,
        linked_by: l.linked_by as UserId,
        linked_at: l.linked_at.toISOString(),
      })),
      electronic_signature: row.electronic_signature as QualityEvent['electronic_signature'],
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
