import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, type SQL, ilike, sql } from 'drizzle-orm';
import { suppliersTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import type { Supplier, SupplierQualificationStatus, UserId } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface SupplierFilters {
  qualification_status?: SupplierQualificationStatus;
  is_active?: boolean;
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

function buildSupplierCode(seq: number): string {
  return `SUP-${String(seq).padStart(4, '0')}`;
}

@Injectable()
export class SupplierRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async nextSupplierCode(): Promise<string> {
    const result = await this.db.execute<{ nextval: string }>(sql`SELECT nextval('suppliers_seq')`);
    const seq = parseInt(result.rows[0]!.nextval, 10);
    return buildSupplierCode(seq);
  }

  async findById(id: string): Promise<Supplier | null> {
    const rows = await this.db
      .select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, id))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Supplier> {
    const supplier = await this.findById(id);
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  async findMany(
    filters: SupplierFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<Supplier>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.qualification_status)
      conditions.push(eq(suppliersTable.qualification_status, filters.qualification_status));
    if (filters.is_active !== undefined)
      conditions.push(eq(suppliersTable.is_active, filters.is_active));
    if (filters.search) conditions.push(ilike(suppliersTable.name, `%${filters.search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(suppliersTable)
      .where(where)
      .orderBy(desc(suppliersTable.created_at))
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
    data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Supplier> {
    const rows = await tx
      .insert(suppliersTable)
      .values({
        supplier_code: data.supplier_code,
        name: data.name,
        qualification_status: data.qualification_status,
        qualification_expiry: data.qualification_expiry
          ? new Date(data.qualification_expiry)
          : null,
        contact_details: data.contact_details as Record<string, unknown>,
        is_active: data.is_active ?? true,
        notes: data.notes ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();
    return this.mapRow(rows[0]!);
  }

  async update(tx: DbContext, id: string, data: Partial<Supplier>): Promise<Supplier> {
    const rows = await tx
      .update(suppliersTable)
      .set({
        ...(data.qualification_status !== undefined && {
          qualification_status: data.qualification_status,
        }),
        ...(data.qualification_expiry !== undefined && {
          qualification_expiry: data.qualification_expiry
            ? new Date(data.qualification_expiry)
            : null,
        }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        ...(data.notes !== undefined && { notes: data.notes ?? null }),
        ...(data.updated_by !== undefined && { updated_by: data.updated_by }),
        updated_at: new Date(),
      })
      .where(eq(suppliersTable.id, id))
      .returning();

    if (!rows[0]) throw new NotFoundException(`Supplier ${id} not found`);
    return this.mapRow(rows[0]);
  }

  private mapRow(row: typeof suppliersTable.$inferSelect): Supplier {
    return {
      id: row.id,
      supplier_code: row.supplier_code,
      name: row.name,
      qualification_status: row.qualification_status as SupplierQualificationStatus,
      qualification_expiry: row.qualification_expiry?.toISOString() ?? null,
      contact_details: row.contact_details as Supplier['contact_details'],
      is_active: row.is_active,
      notes: row.notes ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }
}
