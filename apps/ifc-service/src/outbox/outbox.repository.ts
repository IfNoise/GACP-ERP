import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { outboxEventsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import { DATABASE_TOKEN } from '../database/database.module';

export interface OutboxEventCreate {
  topic: string;
  key: string;
  payload: Record<string, unknown>;
}

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

  async findPending(limit = 50) {
    return this.db
      .select()
      .from(outboxEventsTable)
      .where(and(eq(outboxEventsTable.status, 'PENDING')))
      .orderBy(outboxEventsTable.created_at)
      .limit(limit);
  }

  async markPublished(id: string): Promise<void> {
    await this.db
      .update(outboxEventsTable)
      .set({ status: 'PUBLISHED', published_at: new Date() })
      .where(eq(outboxEventsTable.id, id));
  }

  async markFailed(id: string, error: string, retryCount: number): Promise<void> {
    const next = retryCount + 1;
    await this.db
      .update(outboxEventsTable)
      .set({
        status: next >= 5 ? 'DEAD' : 'FAILED',
        last_error: error.slice(0, 2000),
        retry_count: next,
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
