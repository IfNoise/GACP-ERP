import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import { type CreateTrainingExecution, type UserId } from '@gacp-erp/shared-schemas';
import { TRAINING_EXECUTION_TOPIC, type TrainingScheduledEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type TrainingRepository } from '../training.repository';
import { type OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class ScheduleTrainingUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly trainingRepo: TrainingRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateTrainingExecution, userId: string) {
    const now = new Date().toISOString();
    const today = now.split('T')[0]!;

    return this.db.transaction(async (tx) => {
      const execution = await this.trainingRepo.createExecution(
        {
          course_id: dto.course_id,
          trainee_id: dto.trainee_id,
          trainer_id: dto.trainer_id ?? null,
        },
        userId,
        tx,
      );

      const event: TrainingScheduledEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'workforce-service',
        topic: TRAINING_EXECUTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'training.execution.scheduled',
        payload: {
          executionId: execution.id,
          employeeId: execution.trainee_id,
          courseId: execution.course_id,
          scheduledDate: today,
          trainerId: execution.trainer_id ?? null,
          scheduledBy: userId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: TRAINING_EXECUTION_TOPIC,
        key: execution.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return execution;
    });
  }
}
