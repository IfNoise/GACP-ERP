import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';
import { IFC_INGESTION_TOPIC, type IfcIngestionRejectedEvent } from '@gacp-erp/shared-events';
import type { IfcRejectRevisionBody, IfcRevision } from '@gacp-erp/shared-schemas';
import { UserIdSchema } from '@gacp-erp/shared-schemas';
import { IfcRevisionRepository } from '../ifc-revision.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class RejectIfcRevisionUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly revisionRepo: IfcRevisionRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(
    revisionId: string,
    body: IfcRejectRevisionBody,
    userId: string,
  ): Promise<IfcRevision> {
    const revision = await this.revisionRepo.findById(revisionId);
    if (!revision) {
      throw new NotFoundException(`IFC revision ${revisionId} not found`);
    }
    if (revision.status !== 'pending_approval') {
      throw new ConflictException(
        `IFC revision ${revisionId} must be in pending_approval state to reject, current: ${revision.status}`,
      );
    }

    const rejectedAt = new Date();

    return this.db.transaction(async (tx) => {
      const updated = await this.revisionRepo.updateStatusWithTx(tx, revisionId, {
        status: 'rejected',
      });

      const event: IfcIngestionRejectedEvent = {
        eventId: uuidv4(),
        occurredAt: rejectedAt.toISOString(),
        eventVersion: '1.0',
        producerService: 'ifc-service',
        topic: IFC_INGESTION_TOPIC,
        correlationId: uuidv4(),
        triggeredBy: UserIdSchema.parse(userId),
        eventType: 'ifc.ingestion.rejected',
        payload: {
          revisionId,
          rejectedBy: [userId],
          rejectedAt: rejectedAt.toISOString(),
          rejectionReason: body.rejection_reason,
          remediationNotes: body.remediation_notes,
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
