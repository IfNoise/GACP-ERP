import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, type SQL, ilike } from 'drizzle-orm';
import { accountsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import type { Account, AccountType, UserId } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

export interface AccountFilters {
  account_type?: AccountType;
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

@Injectable()
export class AccountRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findById(id: string): Promise<Account | null> {
    const rows = await this.db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, id))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByIdOrThrow(id: string): Promise<Account> {
    const account = await this.findById(id);
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async findByCode(code: string): Promise<Account | null> {
    const rows = await this.db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.account_code, code))
      .limit(1);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findMany(
    filters: AccountFilters,
    pagination: PaginationOpts,
  ): Promise<PaginatedResult<Account>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters.account_type) conditions.push(eq(accountsTable.account_type, filters.account_type));
    if (filters.is_active !== undefined)
      conditions.push(eq(accountsTable.is_active, filters.is_active));
    if (filters.search) conditions.push(ilike(accountsTable.name, `%${filters.search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(accountsTable)
      .where(where)
      .orderBy(accountsTable.account_code)
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
    data: Omit<Account, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Account> {
    const rows = await tx
      .insert(accountsTable)
      .values({
        account_code: data.account_code,
        account_type: data.account_type,
        parent_id: data.parent_id ?? null,
        name: data.name,
        description: data.description ?? null,
        is_active: data.is_active ?? true,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();
    return this.mapRow(rows[0]!);
  }

  private mapRow(row: typeof accountsTable.$inferSelect): Account {
    return {
      id: row.id,
      account_code: row.account_code,
      account_type: row.account_type as AccountType,
      parent_id: row.parent_id,
      name: row.name,
      description: row.description,
      is_active: row.is_active,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }
}
