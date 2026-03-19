import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import { type CreateTask, type UserId } from '@gacp-erp/shared-schemas';
import { WORKFORCE_TASK_TOPIC, type TaskCreatedEvent } from '@gacp-erp/shared-events';
import { Inject } from '@nestjs/common';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type TaskRepository } from '../task.repository';
import { type OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly taskRepo: TaskRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateTask, userId: string) {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0');
    const taskNumber = `TASK-${year}${seq}`;
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const scheduledDate = dto.scheduled_start
        ? dto.scheduled_start.split('T')[0]!
        : now.split('T')[0]!;

      const created = await this.taskRepo.create(
        {
          task_number: taskNumber,
          title: dto.title,
          description: dto.description,
          task_type: 'OPERATIONAL',
          assigned_to: dto.assigned_to,
          zone_id: dto.zone_id,
          batch_id: dto.batch_id,
          priority: dto.priority,
          scheduled_date: scheduledDate,
          scheduled_start: dto.scheduled_start
            ? (dto.scheduled_start.split('T')[1]?.substring(0, 5) ?? null)
            : null,
          scheduled_end: dto.scheduled_end
            ? (dto.scheduled_end.split('T')[1]?.substring(0, 5) ?? null)
            : null,
          sop_reference: dto.sop_reference,
        },
        userId,
        tx,
      );

      const event: TaskCreatedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'workforce-service',
        topic: WORKFORCE_TASK_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'workforce.task.created',
        payload: {
          taskId: created.id,
          taskNumber: created.task_number,
          title: created.title,
          taskType: 'OPERATIONAL',
          priority: (created.priority === 'LOW'
            ? 'LOW'
            : created.priority === 'MEDIUM'
              ? 'MEDIUM'
              : 'HIGH') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
          scheduledDate: created.scheduled_start ?? now.split('T')[0]!,
          zoneId: created.zone_id ?? null,
          batchId: created.batch_id ?? null,
          createdBy: userId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: WORKFORCE_TASK_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });
  }
}
