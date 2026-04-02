import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import { type CreateTimeEntry, type UserId } from '@gacp-erp/shared-schemas';
import { WORKFORCE_TIME_TOPIC, type TimeEntryCreatedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { TimeEntryRepository } from '../time-entry.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

const SOURCE_MAP: Record<string, 'MANUAL' | 'MOBILE' | 'SYSTEM'> = {
  TERMINAL: 'MOBILE',
  WEB: 'MANUAL',
  API: 'SYSTEM',
};

@Injectable()
export class ClockInUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly timeEntryRepo: TimeEntryRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateTimeEntry, userId: string) {
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const created = await this.timeEntryRepo.clockIn(
        {
          employee_id: dto.employee_id,
          task_id: dto.task_id,
          clock_in_at: dto.clock_in_at,
          recorded_via: dto.recorded_via,
        },
        userId,
        tx,
      );

      const event: TimeEntryCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'workforce-service',
        topic: WORKFORCE_TIME_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'workforce.time_entry.created',
        payload: {
          timeEntryId: created.id,
          employeeId: created.employee_id,
          taskId: created.task_id ?? null,
          clockIn: created.clock_in_at,
          source: SOURCE_MAP[created.recorded_via] ?? 'MANUAL',
          createdBy: userId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: WORKFORCE_TIME_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });
  }
}
