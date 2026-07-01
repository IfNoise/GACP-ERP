import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type Database } from '@gacp-erp/shared-database';
import { IFC_INGESTION_TOPIC, type IfcIngestionStartedEvent } from '@gacp-erp/shared-events';
import type { IfcUploadRevisionBody, IfcRevision, UserId } from '@gacp-erp/shared-schemas';
import { UserIdSchema } from '@gacp-erp/shared-schemas';
import { IfcRevisionRepository } from '../ifc-revision.repository';
import { OutboxRepository } from '../../outbox/outbox.repository';

@Injectable()
export class UploadIfcRevisionUseCase {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly revisionRepo: IfcRevisionRepository,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  async execute(body: IfcUploadRevisionBody, userId: string): Promise<IfcRevision> {
    const existing = await this.revisionRepo.findByHash(body.model_id, body.source_file_hash);
    if (existing) {
      throw new ConflictException(
        `A revision with hash ${body.source_file_hash} already exists for model ${body.model_id}`,
      );
    }

    return this.db.transaction(async (tx) => {
      const created = await this.revisionRepo.createWithTx(tx, {
        model_id: body.model_id,
        source_file_uri: body.source_file_uri,
        source_file_hash: body.source_file_hash,
        uploaded_by: userId as UserId,
      });

      const event: IfcIngestionStartedEvent = {
        eventId: uuidv4(),
        occurredAt: new Date().toISOString(),
        eventVersion: '1.0',
        producerService: 'ifc-service',
        topic: IFC_INGESTION_TOPIC,
        correlationId: uuidv4(),
        triggeredBy: UserIdSchema.parse(userId),
        eventType: 'ifc.ingestion.started',
        payload: {
          revisionId: created.revision_id,
          modelId: created.model_id,
          sourceFileHash: created.source_file_hash,
          sourceFileUri: created.source_file_uri,
        },
      };

      await this.outboxRepo.createWithTx(tx, {
        topic: IFC_INGESTION_TOPIC,
        key: created.revision_id,
        payload: event as unknown as Record<string, unknown>,
      });

      return created;
    });
  }
}
