import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import type { CreateJournalEntry, JournalEntry, UserId } from '@gacp-erp/shared-schemas';
import { FINANCE_TRANSACTION_TOPIC, type JournalEntryPostedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type JournalEntryRepository } from '../journal-entry.repository';
import { type OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CreateJournalEntryUseCase {
  private readonly logger = new Logger(CreateJournalEntryUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: JournalEntryRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateJournalEntry, authorId: string): Promise<JournalEntry> {
    // Validate double-entry balance: sum(debits) must equal sum(credits)
    const totalDebits = dto.lines.reduce((sum, l) => sum + (l.debit_amount ?? 0), 0);
    const totalCredits = dto.lines.reduce((sum, l) => sum + (l.credit_amount ?? 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      throw new BadRequestException(
        `Journal entry is unbalanced: debits=${totalDebits}, credits=${totalCredits}`,
      );
    }

    const entryNumber = await this.repo.nextEntryNumber();
    const now = new Date().toISOString();

    const entry = await this.db.transaction(async (tx) => {
      const created = await this.repo.create(tx, {
        entry_number: entryNumber,
        description: dto.description,
        entry_date: dto.entry_date,
        status: 'POSTED',
        lines: dto.lines.map((l) => ({
          account_id: l.account_id,
          account_code: l.account_code,
          description: l.description,
          debit_amount: l.debit_amount,
          credit_amount: l.credit_amount,
          batch_id: l.batch_id ?? null,
        })),
        reversal_of_id: null,
        electronic_signature: dto.electronic_signature ?? null,
        created_by: authorId as UserId,
        updated_by: authorId as UserId,
      });

      const event: JournalEntryPostedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'financial-service',
        topic: FINANCE_TRANSACTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: authorId as UserId,
        eventType: 'finance.journal_entry.posted',
        payload: {
          journalEntryId: created.id,
          entryNumber: created.entry_number,
          description: created.description,
          totalDebit: totalDebits,
          entryDate: created.entry_date,
          postedBy: authorId,
          postedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: FINANCE_TRANSACTION_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`Journal entry created: ${entry.entry_number} (id: ${entry.id})`);
    return entry;
  }
}
