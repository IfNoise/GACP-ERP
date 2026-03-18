import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import {
  journalEntriesTable,
  journalLinesTable,
  type Database,
  type DbContext,
} from '@gacp-erp/shared-database';
import type { JournalEntry, JournalEntryStatus, UserId } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

/**
 * Generates the next JE number in the form JE-YYYY-NNNNNN.
 * Sequence resets each calendar year.
 */
function buildEntryNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `JE-${year}-${String(seq).padStart(6, '0')}`;
}

@Injectable()
export class JournalEntryRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async nextEntryNumber(): Promise<string> {
    const result = await this.db.execute<{ nextval: string }>(
      sql`SELECT nextval('journal_entries_seq')`,
    );
    const seq = parseInt(result.rows[0]!.nextval, 10);
    return buildEntryNumber(seq);
  }

  async findById(id: string): Promise<JournalEntry | null> {
    const entries = await this.db
      .select()
      .from(journalEntriesTable)
      .where(eq(journalEntriesTable.id, id))
      .limit(1);

    if (!entries[0]) return null;

    const lines = await this.db
      .select()
      .from(journalLinesTable)
      .where(eq(journalLinesTable.entry_id, id))
      .orderBy(journalLinesTable.id);

    return this.mapRow(entries[0], lines);
  }

  async findByIdOrThrow(id: string): Promise<JournalEntry> {
    const entry = await this.findById(id);
    if (!entry) throw new NotFoundException(`Journal entry ${id} not found`);
    return entry;
  }

  async create(
    tx: DbContext,
    data: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'lines'> & {
      lines: Array<{
        account_id: string;
        account_code: string;
        description: string;
        debit_amount: number;
        credit_amount: number;
        batch_id?: string | null;
      }>;
    },
  ): Promise<JournalEntry> {
    const entryRows = await tx
      .insert(journalEntriesTable)
      .values({
        entry_number: data.entry_number,
        description: data.description,
        entry_date: new Date(data.entry_date),
        status: data.status,
        reversal_of_id: data.reversal_of_id ?? null,
        electronic_signature: data.electronic_signature ?? null,
        created_by: data.created_by,
        updated_by: data.updated_by,
      })
      .returning();

    const entry = entryRows[0]!;

    const lineRows = await tx
      .insert(journalLinesTable)
      .values(
        data.lines.map((line) => ({
          entry_id: entry.id,
          account_id: line.account_id,
          account_code: line.account_code,
          description: line.description,
          debit_amount: String(line.debit_amount ?? 0),
          credit_amount: String(line.credit_amount ?? 0),
          batch_id: line.batch_id ?? null,
        })),
      )
      .returning();

    return this.mapRow(entry, lineRows);
  }

  async post(
    tx: DbContext,
    id: string,
    signature: unknown,
    updatedBy: UserId,
  ): Promise<JournalEntry> {
    const existing = await this.findByIdOrThrow(id);
    if (existing.status !== 'DRAFT') {
      throw new ConflictException(`Journal entry ${id} is not in DRAFT status`);
    }

    await tx
      .update(journalEntriesTable)
      .set({
        status: 'POSTED',
        electronic_signature: signature as Record<string, unknown>,
        updated_by: updatedBy,
        updated_at: new Date(),
      })
      .where(eq(journalEntriesTable.id, id));

    return (await this.findById(id))!;
  }

  async reverse(
    tx: DbContext,
    originalId: string,
    reversalEntryNumber: string,
    signature: unknown,
    createdBy: UserId,
    description: string,
  ): Promise<JournalEntry> {
    const original = await this.findByIdOrThrow(originalId);
    if (original.status !== 'POSTED') {
      throw new ConflictException(`Journal entry ${originalId} is not in POSTED status`);
    }

    // Mark original as REVERSED
    await tx
      .update(journalEntriesTable)
      .set({ status: 'REVERSED', updated_by: createdBy, updated_at: new Date() })
      .where(eq(journalEntriesTable.id, originalId));

    // Create reversal entry with flipped debits/credits
    const reversalRows = await tx
      .insert(journalEntriesTable)
      .values({
        entry_number: reversalEntryNumber,
        description,
        entry_date: new Date(),
        status: 'POSTED',
        reversal_of_id: originalId,
        electronic_signature: signature as Record<string, unknown>,
        created_by: createdBy,
        updated_by: createdBy,
      })
      .returning();

    const reversal = reversalRows[0]!;

    const reversalLineRows = await tx
      .insert(journalLinesTable)
      .values(
        original.lines.map((line) => ({
          entry_id: reversal.id,
          account_id: line.account_id,
          account_code: line.account_code,
          description: line.description,
          debit_amount: String(line.credit_amount ?? 0),
          credit_amount: String(line.debit_amount ?? 0),
          batch_id: line.batch_id ?? null,
        })),
      )
      .returning();

    return this.mapRow(reversal, reversalLineRows);
  }

  private mapRow(
    row: typeof journalEntriesTable.$inferSelect,
    lines: (typeof journalLinesTable.$inferSelect)[],
  ): JournalEntry {
    return {
      id: row.id,
      entry_number: row.entry_number,
      description: row.description,
      entry_date: row.entry_date.toISOString(),
      status: row.status as JournalEntryStatus,
      lines: lines.map((l) => ({
        id: l.id,
        entry_id: l.entry_id,
        account_id: l.account_id,
        account_code: l.account_code,
        description: l.description,
        debit_amount: parseFloat(l.debit_amount),
        credit_amount: parseFloat(l.credit_amount),
        batch_id: l.batch_id ?? null,
      })),
      reversal_of_id: row.reversal_of_id,
      electronic_signature:
        (row.electronic_signature as JournalEntry['electronic_signature']) ?? null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
      created_by: row.created_by as UserId,
      updated_by: row.updated_by as UserId,
    };
  }
}
