import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import {
  IFC_INGESTION_TOPIC,
  IFC_PROJECTION_TOPIC,
  IfcIngestionApprovedEventSchema,
  type IfcProjectionSpatialUpdatedEvent,
} from '@gacp-erp/shared-events';
import { type Database } from '@gacp-erp/shared-database';
import { DATABASE_TOKEN } from './database/database.module';
import { OutboxRepository } from './outbox/outbox.repository';

@Controller()
export class IfcIngestionConsumer {
  private readonly logger = new Logger(IfcIngestionConsumer.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly outboxRepo: OutboxRepository,
  ) {}

  @EventPattern(IFC_INGESTION_TOPIC)
  async handle(@Payload() raw: unknown): Promise<void> {
    const parsed = IfcIngestionApprovedEventSchema.safeParse(raw);
    if (!parsed.success) return;

    const input = parsed.data;
    const now = new Date().toISOString();

    const projectionEvent: IfcProjectionSpatialUpdatedEvent = {
      eventId: randomUUID(),
      occurredAt: now,
      eventVersion: '1.0',
      producerService: 'spatial-service',
      topic: IFC_PROJECTION_TOPIC,
      correlationId: input.correlationId,
      triggeredBy: input.triggeredBy,
      eventType: 'ifc.projection.spatial.updated',
      payload: {
        revisionId: input.payload.revisionId,
        projectionRunId: randomUUID(),
        upsertedSpaces: 0,
        updatedZoneBindings: 0,
        topologyWarnings: 0,
        status: 'success',
      },
    };

    await this.db.transaction(async (tx) => {
      await this.outboxRepo.createWithTx(tx, {
        topic: IFC_PROJECTION_TOPIC,
        key: input.payload.revisionId,
        payload: projectionEvent as unknown as Record<string, unknown>,
      });
    });

    this.logger.log(
      `Queued IFC spatial projection skeleton for revision ${input.payload.revisionId}`,
    );
  }
}
