import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import {
  type ApproveValidationProtocol,
  type ExecuteValidationTest,
  type CloseValidationProtocol,
  type ValidationProtocol,
  type UserId,
} from '@gacp-erp/shared-schemas';
import {
  QUALITY_VALIDATION_TOPIC,
  type ValidationStartedEvent,
  type TestExecutedEvent,
  type ValidationCompletedEvent,
  type ExceptionRaisedEvent,
  type ValidationClosedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { ValidationProtocolRepository } from '../validation-protocol.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';
import { ValidationProtocolWorkflowEngine } from '../validation-protocol-workflow.engine';

@Injectable()
export class ValidationProtocolWorkflowUseCase {
  private readonly logger = new Logger(ValidationProtocolWorkflowUseCase.name);
  private readonly engine = new ValidationProtocolWorkflowEngine();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: ValidationProtocolRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async submitForReview(id: string, userId: string): Promise<ValidationProtocol> {
    const protocol = await this.repo.findByIdOrThrow(id);
    this.engine.assertTransition(protocol.status, 'REVIEW');

    return this.db.transaction(async (tx) =>
      this.repo.update(tx, id, { status: 'REVIEW', updated_by: userId as UserId }),
    );
  }

  async returnToDraft(id: string, userId: string): Promise<ValidationProtocol> {
    const protocol = await this.repo.findByIdOrThrow(id);
    this.engine.assertTransition(protocol.status, 'DRAFT');

    return this.db.transaction(async (tx) =>
      this.repo.update(tx, id, { status: 'DRAFT', updated_by: userId as UserId }),
    );
  }

  async approve(
    id: string,
    dto: ApproveValidationProtocol,
    userId: string,
  ): Promise<ValidationProtocol> {
    const protocol = await this.repo.findByIdOrThrow(id);
    this.engine.assertTransition(protocol.status, 'APPROVED');

    return this.db.transaction(async (tx) =>
      this.repo.update(tx, id, {
        status: 'APPROVED',
        electronic_signature: dto.electronic_signature,
        updated_by: userId as UserId,
      }),
    );
  }

  async startExecution(id: string, userId: string): Promise<ValidationProtocol> {
    const protocol = await this.repo.findByIdOrThrow(id);
    this.engine.assertTransition(protocol.status, 'EXECUTING');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'EXECUTING',
        updated_by: userId as UserId,
      });

      const event: ValidationStartedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_VALIDATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.validation.started',
        payload: {
          protocolId: protocol.id,
          protocolNumber: protocol.protocol_number,
          protocolType: protocol.type,
          systemUnderTest: protocol.system_under_test,
          changeControlId: protocol.change_control_id,
          startedBy: userId,
          startedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_VALIDATION_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`Validation Protocol ${protocol.protocol_number} execution started`);
      return updated;
    });
  }

  async executeTest(
    id: string,
    dto: ExecuteValidationTest,
    userId: string,
  ): Promise<ValidationProtocol> {
    const protocol = await this.repo.findByIdOrThrow(id);

    if (protocol.status !== 'EXECUTING') {
      throw new Error(`Protocol must be in EXECUTING status, current: ${protocol.status}`);
    }

    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      await this.repo.upsertTestStep(tx, id, {
        step_number: dto.step_number,
        actual_result: dto.actual_result,
        status: dto.status,
        ...(dto.exception_note !== undefined && { exception_note: dto.exception_note }),
        executed_by: userId as UserId,
        executed_at: now,
        electronic_signature: dto.electronic_signature,
      });
      const updated = await this.repo.update(tx, id, { updated_by: userId as UserId });

      const event: TestExecutedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_VALIDATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.validation.test_executed',
        payload: {
          protocolId: protocol.id,
          protocolNumber: protocol.protocol_number,
          protocolType: protocol.type,
          stepNumber: dto.step_number,
          testStatus: dto.status,
          executedBy: userId,
          executedAt: now,
          exceptionNote: dto.exception_note ?? null,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_VALIDATION_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      if (dto.status === 'FAIL') {
        const exceptionEvent: ExceptionRaisedEvent = {
          eventId: randomUUID(),
          occurredAt: now,
          eventVersion: '1.0',
          producerService: 'quality-service',
          topic: QUALITY_VALIDATION_TOPIC,
          correlationId: randomUUID(),
          triggeredBy: userId as UserId,
          eventType: 'quality.validation.exception_raised',
          payload: {
            protocolId: protocol.id,
            protocolNumber: protocol.protocol_number,
            protocolType: protocol.type,
            stepNumber: dto.step_number,
            exceptionNote: dto.exception_note ?? `Step ${dto.step_number} failed`,
            raisedBy: userId,
            raisedAt: now,
          },
        };

        await this.outboxRepo.createWithTx(tx, {
          topic: QUALITY_VALIDATION_TOPIC,
          key: id,
          payload: exceptionEvent as unknown as Record<string, unknown>,
        });
      }

      return updated;
    });
  }

  async complete(id: string, userId: string): Promise<ValidationProtocol> {
    const protocol = await this.repo.findByIdOrThrow(id);
    this.engine.assertTransition(protocol.status, 'COMPLETED');
    const now = new Date().toISOString();

    const total = protocol.test_steps.length;
    const passed = protocol.test_steps.filter((s) => s.status === 'PASS').length;
    const failed = protocol.test_steps.filter((s) => s.status === 'FAIL').length;
    const passRatePct = total > 0 ? Math.round((passed / total) * 100) : 0;

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'COMPLETED',
        updated_by: userId as UserId,
      });

      const event: ValidationCompletedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_VALIDATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.validation.completed',
        payload: {
          protocolId: protocol.id,
          protocolNumber: protocol.protocol_number,
          protocolType: protocol.type,
          totalSteps: total,
          passedSteps: passed,
          failedSteps: failed,
          passRatePct,
          completedBy: userId,
          completedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_VALIDATION_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(
        `Validation Protocol ${protocol.protocol_number} completed — pass rate: ${passRatePct}%`,
      );
      return updated;
    });
  }

  async close(
    id: string,
    dto: CloseValidationProtocol,
    userId: string,
  ): Promise<ValidationProtocol> {
    const protocol = await this.repo.findByIdOrThrow(id);
    this.engine.assertTransition(protocol.status, 'CLOSED');
    const now = new Date().toISOString();
    const auditTxId = randomUUID();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'CLOSED',
        electronic_signature: dto.electronic_signature,
        audit_tx_id: auditTxId,
        updated_by: userId as UserId,
      });

      const event: ValidationClosedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_VALIDATION_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.validation.closed',
        payload: {
          protocolId: protocol.id,
          protocolNumber: protocol.protocol_number,
          protocolType: protocol.type,
          closureSummary: dto.closure_summary,
          auditTxId,
          closedBy: userId,
          closedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_VALIDATION_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`Validation Protocol ${protocol.protocol_number} closed`);
      return updated;
    });
  }
}
