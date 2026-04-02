import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import { type CompleteTrainingExecution, type UserId } from '@gacp-erp/shared-schemas';
import {
  TRAINING_EXECUTION_TOPIC,
  TRAINING_CERTIFICATION_TOPIC,
  type TrainingCompletedEvent,
  type CertificationIssuedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { TrainingRepository } from '../training.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CompleteTrainingUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly trainingRepo: TrainingRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(executionId: string, dto: CompleteTrainingExecution, userId: string) {
    const now = new Date().toISOString();
    const today = now.split('T')[0]!;

    return this.db.transaction(async (tx) => {
      const execution = await this.trainingRepo.completeExecution(
        executionId,
        dto.score,
        dto.electronic_signature as Record<string, unknown>,
        userId,
        tx,
      );

      const course = await this.trainingRepo.findCourseByIdOrThrow(execution.course_id);
      const passed = execution.status === 'COMPLETED';

      const completedEvent: TrainingCompletedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'workforce-service',
        topic: TRAINING_EXECUTION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'training.execution.completed',
        payload: {
          executionId: execution.id,
          employeeId: execution.trainee_id,
          courseId: execution.course_id,
          completedDate: today,
          score: dto.score,
          passed,
          expiryDate: null,
          hasSignature: true,
          completedBy: userId,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: TRAINING_EXECUTION_TOPIC,
        key: execution.id,
        payload: completedEvent as unknown as Record<string, unknown>,
      });

      // Issue certification if passed
      if (passed) {
        const year = new Date().getFullYear();
        const seq = String(Math.floor(Math.random() * 900000) + 100000);
        const certNumber = `CERT-${year}-${seq}`;

        // valid for 1 year
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);

        const cert = await this.trainingRepo.createCertification(
          {
            employee_id: execution.trainee_id,
            course_id: execution.course_id,
            execution_id: execution.id,
            issued_at: now,
            valid_until: validUntil.toISOString(),
            certificate_number: certNumber,
          },
          userId,
          tx,
        );

        const certEvent: CertificationIssuedEvent = {
          eventId: randomUUID(),
          occurredAt: now,
          eventVersion: '1.0',
          producerService: 'workforce-service',
          topic: TRAINING_CERTIFICATION_TOPIC,
          correlationId: randomUUID(),
          triggeredBy: userId as UserId,
          eventType: 'training.certification.issued',
          payload: {
            certificationId: cert.id,
            certificateNumber: certNumber,
            employeeId: execution.trainee_id,
            course: {
              courseId: course.id,
              courseCode: course.course_id,
              title: course.title,
              trainingType: course.type as
                | 'INITIAL'
                | 'REFRESHER'
                | 'GMP'
                | 'SAFETY'
                | 'ROLE_SPECIFIC'
                | 'COMPLIANCE'
                | 'SOP',
            },
            issuedDate: today,
            expiryDate: validUntil.toISOString().split('T')[0]!,
            issuedBy: userId,
          },
        };

        await this.outboxRepo.createWithTx(tx, {
          topic: TRAINING_CERTIFICATION_TOPIC,
          key: cert.id,
          payload: certEvent as unknown as Record<string, unknown>,
        });
      }

      return execution;
    });
  }
}
