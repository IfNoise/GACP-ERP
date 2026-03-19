import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { outboxEventsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import type { OutboxEventCreate, OutboxEvent } from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../database/database.module';

const MAX_RETRY_COUNT = 5;

@Injectable()
export class OutboxRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async createWithTx(tx: DbContext, event: OutboxEventCreate): Promise<void> {
    await tx.insert(outboxEventsTable).values({
      topic: event.topic,
      key: event.key,
      payload: event.payload,
    });
  }

  async findPending(limit = 50): Promise<OutboxEvent[]> {
    const rows = await this.db
      .select()
      .from(outboxEventsTable)
      .where(and(eq(outboxEventsTable.status, 'PENDING')))
      .orderBy(outboxEventsTable.created_at)
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      topic: r.topic,
      key: r.key,
      payload: r.payload as Record<string, unknown>,
      retryCount: r.retry_count,
    }));
  }

  async markPublished(id: string): Promise<void> {
    await this.db
      .update(outboxEventsTable)
      .set({ status: 'PUBLISHED', published_at: new Date() })
      .where(eq(outboxEventsTable.id, id));
  }

  async markFailed(id: string, error: string, currentRetryCount: number): Promise<void> {
    const nextRetryCount = currentRetryCount + 1;
    const newStatus = nextRetryCount >= MAX_RETRY_COUNT ? 'DEAD' : 'FAILED';

    await this.db
      .update(outboxEventsTable)
      .set({
        status: newStatus,
        last_error: error.slice(0, 2000),
        retry_count: nextRetryCount,
      })
      .where(eq(outboxEventsTable.id, id));
  }

  async requeueFailed(): Promise<void> {
    await this.db
      .update(outboxEventsTable)
      .set({ status: 'PENDING' })
      .where(eq(outboxEventsTable.status, 'FAILED'));
  }
}
