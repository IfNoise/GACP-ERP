import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import { type UserId } from '@gacp-erp/shared-schemas';
import { WORKFORCE_TASK_TOPIC, type TaskCompletedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { TaskRepository } from '../task.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CompleteTaskUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly taskRepo: TaskRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(taskId: string, userId: string) {
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const completed = await this.taskRepo.complete(taskId, userId, tx);

      const event: TaskCompletedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'workforce-service',
        topic: WORKFORCE_TASK_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'workforce.task.completed',
        payload: {
          taskId: completed.id,
          taskNumber: completed.task_number,
          title: completed.title,
          completedBy: userId,
          completedAt: now,
          actualMinutes: null,
          sopReference: completed.sop_reference ?? null,
          hasSignature: false,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: WORKFORCE_TASK_TOPIC,
        key: completed.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return completed;
    });
  }
}
