import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { outboxEventsTable, type Database, type DbContext } from '@gacp-erp/shared-database';
import { DATABASE_TOKEN } from '../database/database.module';

export interface OutboxEventCreate {
  topic: string;
  key: string;
  payload: Record<string, unknown>;
}

export interface OutboxEvent {
  id: string;
  topic: string;
  key: string;
  payload: Record<string, unknown>;
  retryCount: number;
}

/** Maximum publish attempts before an event is marked DEAD */
const MAX_RETRY_COUNT = 5;

/**
 * OutboxRepository — data access for the transactional outbox table.
 *
 * Two usage modes:
 *  1. createWithTx(tx, ...) — called inside a DB transaction by use cases
 *  2. findPending / markPublished / markFailed — called by OutboxRelayService
 */
@Injectable()
export class OutboxRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  /**
   * Insert an outbox event within an active database transaction.
   * Must be called with the `tx` object from `db.transaction()`.
   */
  async createWithTx(tx: DbContext, event: OutboxEventCreate): Promise<void> {
    await tx.insert(outboxEventsTable).values({
      topic: event.topic,
      key: event.key,
      payload: event.payload,
    });
  }

  /** Fetch up to `limit` PENDING events ordered by creation time (FIFO). */
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

  /** Mark an event as successfully published. */
  async markPublished(id: string): Promise<void> {
    await this.db
      .update(outboxEventsTable)
      .set({
        status: 'PUBLISHED',
        published_at: new Date(),
      })
      .where(eq(outboxEventsTable.id, id));
  }

  /**
   * Record a publish failure. If retry_count exceeds the threshold,
   * mark the event as DEAD to stop further processing.
   */
  async markFailed(id: string, error: string, currentRetryCount: number): Promise<void> {
    const nextRetryCount = currentRetryCount + 1;
    const newStatus = nextRetryCount >= MAX_RETRY_COUNT ? 'DEAD' : 'FAILED';

    await this.db
      .update(outboxEventsTable)
      .set({
        status: newStatus,
        last_error: error.slice(0, 2000), // guard against oversized error strings
        retry_count: nextRetryCount,
      })
      .where(eq(outboxEventsTable.id, id));
  }

  /**
   * Reset FAILED events back to PENDING so they are retried on the next poll.
   * Called once at service startup.
   */
  async requeueFailed(): Promise<void> {
    await this.db
      .update(outboxEventsTable)
      .set({ status: 'PENDING' })
      .where(eq(outboxEventsTable.status, 'FAILED'));
  }
}
