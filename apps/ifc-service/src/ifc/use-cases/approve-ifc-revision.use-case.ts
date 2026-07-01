import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';
import { IFC_INGESTION_TOPIC, type IfcIngestionApprovedEvent } from '@gacp-erp/shared-events';
import type { IfcApproveRevisionBody, IfcRevision } from '@gacp-erp/shared-schemas';
import { UserIdSchema } from '@gacp-erp/shared-schemas';
import { IfcRevisionRepository } from '../ifc-revision.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class ApproveIfcRevisionUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly revisionRepo: IfcRevisionRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(
    revisionId: string,
    body: IfcApproveRevisionBody,
    userId: string,
  ): Promise<IfcRevision> {
    const revision = await this.revisionRepo.findById(revisionId);
    if (!revision) {
      throw new NotFoundException(`IFC revision ${revisionId} not found`);
    }
    if (revision.status !== 'pending_approval') {
      throw new ConflictException(
        `IFC revision ${revisionId} must be in pending_approval state to approve, current: ${revision.status}`,
      );
    }

    const approvedAt = new Date();

    return this.db.transaction(async (tx) => {
      const updated = await this.revisionRepo.updateStatusWithTx(tx, revisionId, {
        status: 'approved',
        approved_by: [userId],
        approved_at: approvedAt,
      });

      const event: IfcIngestionApprovedEvent = {
        eventId: uuidv4(),
        occurredAt: approvedAt.toISOString(),
        eventVersion: '1.0',
        producerService: 'ifc-service',
        topic: IFC_INGESTION_TOPIC,
        correlationId: uuidv4(),
        triggeredBy: UserIdSchema.parse(userId),
        eventType: 'ifc.ingestion.approved',
        payload: {
          revisionId,
          approvedBy: [userId],
          approvedAt: approvedAt.toISOString(),
          approvalReason: body.approval_reason,
          changeControlId: revision.change_control_id ?? body.change_control_id,
          approvedDomains: body.approved_domains,
          baselineSwitched: true,
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
