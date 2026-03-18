import { Injectable, Logger, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type Database } from '@gacp-erp/shared-database';
import {
  type CreateChangeControl,
  type ChangeControl,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { QUALITY_CHANGE_TOPIC, type ChangeRequestedEvent } from '@gacp-erp/shared-events';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type ChangeControlRepository } from '../change-control.repository';
import { type OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class CreateChangeControlUseCase {
  private readonly logger = new Logger(CreateChangeControlUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: ChangeControlRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(dto: CreateChangeControl, requestorId: string): Promise<ChangeControl> {
    const ccnNumber = await this.repo.nextCcnNumber();
    const now = new Date().toISOString();

    const cc = await this.db.transaction(async (tx) => {
      const created = await this.repo.create(tx, {
        ccn_number: ccnNumber,
        title: dto.title,
        description: dto.description,
        change_type: dto.change_type,
        status: 'DRAFT',
        requestor_id: requestorId as UserId,
        approver_ids: dto.approver_ids ?? [],
        electronic_signature: null,
        validation_status: 'unvalidated',
        validation_protocol_id: null,
        last_validated_at: null,
        next_review_date: null,
        retention_class: '7_YEAR',
        audit_tx_id: null,
        created_by: requestorId as UserId,
        updated_by: requestorId as UserId,
      });

      const event: ChangeRequestedEvent = {
        eventId: randomUUID(),
        occurredAt: now,
        eventVersion: '1.0',
        producerService: 'quality-service',
        topic: QUALITY_CHANGE_TOPIC,
        correlationId: randomUUID(),
        triggeredBy: requestorId as UserId,
        eventType: 'quality.change.requested',
        payload: {
          changeControlId: created.id,
          ccnNumber: created.ccn_number,
          changeType: created.change_type,
          requestorId,
          title: created.title,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: QUALITY_CHANGE_TOPIC,
        key: created.id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });

    this.logger.log(`Change Control created: ${cc.ccn_number} (id: ${cc.id})`);
    return cc;
  }
}
