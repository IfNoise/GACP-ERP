import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, type SQL, sql } from 'drizzle-orm';
import {
  purchaseOrdersTable,
  poLinesTable,
  receivingRecordsTable,
  receivingLinesTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  ReceivingRecord,
  UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface POFilters {
  status?: PurchaseOrderStatus;
  supplier_id?: string;
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

function buildPoNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `PO-${year}-${String(seq).padStart(4, '0')}`;
}

function buildGrnNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `GRN-${year}-${String(seq).padStart(4, '0')}`;
}

@Injectable()
export class ProcurementRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async nextPoNumber(): Promise<string> {
    const result = await this.db.execute<{ nextval: string }>(
      sql`SELECT nextval('purchase_orders_seq')`,
    );
    const seq = parseInt(result.rows[0]!.nextval, 10);
    return buildPoNumber(seq);
  }

  async nextGrnNumber(): Promise<string> {
    const result = await this.db.execute<{ nextval: string }>(
      sql`SELECT nextval('receiving_records_seq')`,
    );
    const seq = parseInt(result.rows[0]!.nextval, 10);
    return buildGrnNumber(seq);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const orders = await this.db
      .select()
      .from(purchaseOrdersTable)
      .where(eq(purchaseOrdersTable.id, id))
      .limit(1);

    if (!orders[0]) return null;

    const lines = await this.db
      .select()
      .from(poLinesTable)
      .where(eq(poLinesTable.po_id, id))
      .orderBy(poLinesTable.line_number);

    return this.mapOrderRow(orders[0], lines);
  }

  async findByIdOrThrow(id: string): Promise<PurchaseOrder> {
    const po = await this.findById(id);
    if (!po) throw new NotFoundException(`Purchase order ${id} not found`);
    return po;
  }

  async findMany(
    filters: POFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<PurchaseOrder>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.status) conditions.push(eq(purchaseOrdersTable.status, filters.status));
    if (filters.supplier_id)
      conditions.push(eq(purchaseOrdersTable.supplier_id, filters.supplier_id));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orders = await this.db
      .select()
      .from(purchaseOrdersTable)
      .where(where)
      .orderBy(desc(purchaseOrdersTable.created_at))
      .limit(limit)
      .offset(offset);

    const results = await Promise.all(
      orders.map(async (order) => {
        const lines = await this.db
          .select()
          .from(poLinesTable)
          .where(eq(poLinesTable.po_id, order.id))
          .orderBy(poLinesTable.line_number);
        return this.mapOrderRow(order, lines);
      }),
    );

    return {
      data: results,
      page,
      limit,
      total: results.length,
      totalPages: Math.ceil(results.length / limit),
    };
  }

  async create(
    tx: DbContext,
    data: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<PurchaseOrder> {
    const orderRows = await tx
      .insert(purchaseOrdersTable)
      .values({
        po_number: data.po_number,
        supplier_id: data.supplier_id,
        status: data.status,
        total_value: String(data.total_value),
        currency: data.currency,
        expected_delivery_date: data.expected_delivery_date
          ? new Date(data.expected_delivery_date)
          : null,
        three_way_match_passed: data.three_way_match_passed ?? null,
        electronic_signature: data.electronic_signature ?? null,
        notes: data.notes ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();

    const order = orderRows[0]!;

    const lineRows = await tx
      .insert(poLinesTable)
      .values(
        data.lines.map((line) => ({
          po_id: order.id,
          line_number: line.line_number,
          item_description: line.item_description,
          quantity: String(line.quantity),
          unit_price: String(line.unit_price),
          unit_of_measure: line.unit_of_measure,
          received_quantity: String(line.received_quantity ?? 0),
          strain_id: line.strain_id ?? null,
        })),
      )
      .returning();

    return this.mapOrderRow(order, lineRows);
  }

  async updateStatus(
    tx: DbContext,
    id: string,
    status: PurchaseOrderStatus,
    extra: Partial<
      Pick<PurchaseOrder, 'electronic_signature' | 'three_way_match_passed' | 'updated_by'>
    >,
  ): Promise<PurchaseOrder> {
    await tx
      .update(purchaseOrdersTable)
      .set({
        status,
        ...(extra.electronic_signature !== undefined && {
          electronic_signature: extra.electronic_signature as Record<string, unknown> | null,
        }),
        ...(extra.three_way_match_passed !== undefined && {
          three_way_match_passed: extra.three_way_match_passed ?? null,
        }),
        ...(extra.updated_by !== undefined && { updated_by: extra.updated_by }),
        updated_at: new Date(),
      })
      .where(eq(purchaseOrdersTable.id, id));
    return (await this.findById(id))!;
  }

  async addReceivingRecord(
    tx: DbContext,
    data: Omit<ReceivingRecord, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<ReceivingRecord> {
    const recRows = await tx
      .insert(receivingRecordsTable)
      .values({
        grn_number: data.grn_number,
        po_id: data.po_id,
        received_at: new Date(data.received_at),
        received_by: data.received_by,
        quality_check_passed: data.quality_check_passed ?? null,
        electronic_signature: data.electronic_signature as Record<string, unknown>,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();

    const rec = recRows[0]!;

    const lineRows = await tx
      .insert(receivingLinesTable)
      .values(
        data.lines.map((line) => ({
          grn_id: rec.id,
          po_line_id: line.po_line_id,
          received_quantity: String(line.quantity_received),
          notes: line.condition_notes ?? null,
        })),
      )
      .returning();

    return {
      id: rec.id,
      grn_number: rec.grn_number,
      po_id: rec.po_id,
      received_at: rec.received_at.toISOString(),
      received_by: rec.received_by as UserId,
      lines: lineRows.map((l) => ({
        id: l.id,
        receiving_record_id: l.grn_id,
        po_line_id: l.po_line_id,
        quantity_received: parseFloat(l.received_quantity),
        condition_notes: l.notes ?? null,
      })),
      quality_check_passed: rec.quality_check_passed as boolean,
      quality_check_notes: null,
      electronic_signature: rec.electronic_signature as ReceivingRecord['electronic_signature'],
      created_at: rec.created_at.toISOString(),
      updated_at: rec.updated_at.toISOString(),
      created_by: rec.created_by as UserId,
      updated_by: rec.updated_by as UserId,
    };
  }

  private mapOrderRow(
    row: typeof purchaseOrdersTable.$inferSelect,
    lines: (typeof poLinesTable.$inferSelect)[],
  ): PurchaseOrder {
    return {
      id: row.id,
      po_number: row.po_number,
      supplier_id: row.supplier_id,
      status: row.status as PurchaseOrderStatus,
      lines: lines.map((l) => ({
        id: l.id,
        po_id: l.po_id,
        line_number: l.line_number,
        item_description: l.item_description,
        quantity: parseFloat(l.quantity),
        unit_price: parseFloat(l.unit_price),
        unit_of_measure: l.unit_of_measure,
        received_quantity: parseFloat(l.received_quantity),
        strain_id: l.strain_id ?? null,
      })),
      total_value: parseFloat(row.total_value),
      currency: row.currency,
      expected_delivery_date: row.expected_delivery_date?.toISOString() ?? null,
      three_way_match_passed: row.three_way_match_passed ?? null,
      electronic_signature:
        (row.electronic_signature as PurchaseOrder['electronic_signature']) ?? null,
      notes: row.notes ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }
}
