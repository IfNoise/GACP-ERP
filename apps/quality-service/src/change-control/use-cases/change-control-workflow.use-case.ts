import { Injectable, Logger, Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import { type ChangeControl, type UserId } from '@gacp-erp/shared-schemas';
import {
  QUALITY_CHANGE_TOPIC,
  type ChangeSubmittedEvent,
  type ChangeApprovedEvent,
  type ChangeRejectedEvent,
  type ChangeImplementedEvent,
  type ChangeVerifiedEvent,
  type ChangeClosedEvent,
} from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type ChangeControlRepository } from '../change-control.repository';
import { type OutboxRepository } from '../../outbox/outbox.repository';
import {
  ChangeControlWorkflowEngine,
  InvalidChangeControlTransitionError,
} from '../change-control-workflow.engine';

/**
 * Handles all single-step workflow transitions for Change Control:
 * Submit, Approve, Reject, Implement, Verify, Close.
 * Each method is a single transactional unit (DB update + outbox event).
 */
@Injectable()
export class ChangeControlWorkflowUseCase {
  private readonly logger = new Logger(ChangeControlWorkflowUseCase.name);
  private readonly engine = new ChangeControlWorkflowEngine();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: ChangeControlRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async submit(id: string, userId: string, _notes?: string): Promise<ChangeControl> {
    const cc = await this.repo.findByIdOrThrow(id);
    this.assertTransition(cc, 'SUBMITTED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'SUBMITTED',
        updated_by: userId as UserId,
      });

      const event: ChangeSubmittedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CHANGE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.change.submitted',
        payload: {
          changeControlId: id,
          ccnNumber: cc.ccn_number,
          changeType: cc.change_type,
          submittedBy: userId,
          submittedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CHANGE_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`CC ${cc.ccn_number} submitted by ${userId}`);
      return updated;
    });
  }

  async approve(
    id: string,
    approverId: string,
    approvalLevel: number,
    electronic_signature: ChangeControl['electronic_signature'],
    _justification?: string,
  ): Promise<ChangeControl> {
    const cc = await this.repo.findByIdOrThrow(id);
    this.assertTransition(cc, 'APPROVED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      await this.repo.createApproval(tx, {
        change_control_id: id,
        approver_id: approverId as UserId,
        approval_level: approvalLevel,
        status: 'APPROVED',
        electronic_signature,
      });

      const updated = await this.repo.update(tx, id, {
        status: 'APPROVED',
        electronic_signature,
        updated_by: approverId as UserId,
      });

      const event: ChangeApprovedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CHANGE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: approverId as UserId,
        eventType: 'quality.change.approved',
        payload: {
          changeControlId: id,
          ccnNumber: cc.ccn_number,
          changeType: cc.change_type,
          approverId,
          approvalLevel,
          auditTxId: null,
          approvedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CHANGE_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`CC ${cc.ccn_number} approved by ${approverId}`);
      return updated;
    });
  }

  async reject(
    id: string,
    userId: string,
    rejectionReason: string,
    electronic_signature: ChangeControl['electronic_signature'],
  ): Promise<ChangeControl> {
    const cc = await this.repo.findByIdOrThrow(id);
    this.assertTransition(cc, 'REJECTED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'REJECTED',
        electronic_signature,
        updated_by: userId as UserId,
      });

      const event: ChangeRejectedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CHANGE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.change.rejected',
        payload: {
          changeControlId: id,
          ccnNumber: cc.ccn_number,
          changeType: cc.change_type,
          rejectedBy: userId,
          rejectionReason,
          rejectedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CHANGE_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`CC ${cc.ccn_number} rejected by ${userId}`);
      return updated;
    });
  }

  async implement(id: string, userId: string): Promise<ChangeControl> {
    const cc = await this.repo.findByIdOrThrow(id);
    this.assertTransition(cc, 'IMPLEMENTING');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'IMPLEMENTING',
        updated_by: userId as UserId,
      });

      const event: ChangeImplementedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CHANGE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.change.implemented',
        payload: {
          changeControlId: id,
          ccnNumber: cc.ccn_number,
          changeType: cc.change_type,
          implementedBy: userId,
          implementedAt: now,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CHANGE_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async verify(
    id: string,
    userId: string,
    verificationNotes: string,
    electronic_signature: ChangeControl['electronic_signature'],
  ): Promise<ChangeControl> {
    const cc = await this.repo.findByIdOrThrow(id);
    this.assertTransition(cc, 'VERIFIED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'VERIFIED',
        electronic_signature,
        updated_by: userId as UserId,
      });

      const event: ChangeVerifiedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CHANGE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.change.verified',
        payload: {
          changeControlId: id,
          ccnNumber: cc.ccn_number,
          changeType: cc.change_type,
          verifiedBy: userId,
          verifiedAt: now,
          verificationNotes,
          auditTxId: null,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CHANGE_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }

  async close(id: string, userId: string, closureSummary: string): Promise<ChangeControl> {
    const cc = await this.repo.findByIdOrThrow(id);
    this.assertTransition(cc, 'CLOSED');
    const now = new Date().toISOString();

    return this.db.transaction(async (tx) => {
      const updated = await this.repo.update(tx, id, {
        status: 'CLOSED',
        updated_by: userId as UserId,
      });

      const event: ChangeClosedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CHANGE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: userId as UserId,
        eventType: 'quality.change.closed',
        payload: {
          changeControlId: id,
          ccnNumber: cc.ccn_number,
          changeType: cc.change_type,
          closedBy: userId,
          closedAt: now,
          closureSummary,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CHANGE_TOPIC,
        key: id,
        payload: event as unknown as Record<string, unknown>,
      });

      this.logger.log(`CC ${cc.ccn_number} closed by ${userId}`);
      return updated;
    });
  }

  private assertTransition(cc: ChangeControl, to: ChangeControl['status']): void {
    try {
      this.engine.transition(cc, to);
    } catch (e) {
      if (e instanceof InvalidChangeControlTransitionError) {
        throw new ConflictException(e.message);
      }
      throw e;
    }
  }
}
