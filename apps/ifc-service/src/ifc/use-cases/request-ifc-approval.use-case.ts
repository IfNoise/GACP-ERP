import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';
import {
  IFC_INGESTION_TOPIC,
  type IfcIngestionApprovalRequestedEvent,
} from '@gacp-erp/shared-events';
import type { IfcRequestApprovalBody, IfcRevision } from '@gacp-erp/shared-schemas';
import { UserIdSchema } from '@gacp-erp/shared-schemas';
import { IfcRevisionRepository } from '../ifc-revision.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class RequestIfcApprovalUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly revisionRepo: IfcRevisionRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(
    revisionId: string,
    body: IfcRequestApprovalBody,
    userId: string,
  ): Promise<IfcRevision> {
    const revision = await this.revisionRepo.findById(revisionId);
    if (!revision) {
      throw new NotFoundException(`IFC revision ${revisionId} not found`);
    }
    if (revision.status === 'approved' || revision.status === 'rejected') {
      throw new ConflictException(
        `IFC revision ${revisionId} is already in terminal state: ${revision.status}`,
      );
    }
    if (revision.status === 'pending_approval') {
      throw new ConflictException(`IFC revision ${revisionId} already has pending approval`);
    }

    return this.db.transaction(async (tx) => {
      const updated = await this.revisionRepo.updateStatusWithTx(tx, revisionId, {
        status: 'pending_approval',
        change_control_id: body.change_control_id,
      });

      const event: IfcIngestionApprovalRequestedEvent = {
        eventId: uuidv4(),
        occurredAt: new Date().toISOString(),
        eventVersion: '1.0',
        producerService: 'ifc-service',
        topic: IFC_INGESTION_TOPIC,
        correlationId: uuidv4(),
        triggeredBy: UserIdSchema.parse(userId),
        eventType: 'ifc.ingestion.approval_requested',
        payload: {
          revisionId,
          modelId: revision.model_id,
          requiredApprovals: 2, // EU GMP Annex 11 dual-approval minimum
          changeControlId: body.change_control_id,
          approvalPacketUri: body.approval_packet_uri,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: IFC_INGESTION_TOPIC,
        key: revisionId,
        payload: event as unknown as Record<string, unknown>,
      });

      return updated;
    });
  }
}
