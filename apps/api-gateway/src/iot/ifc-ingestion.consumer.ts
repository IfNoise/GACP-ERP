import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import {
  IFC_INGESTION_TOPIC,
  IFC_PROJECTION_TOPIC,
  IfcIngestionApprovedEventSchema,
  type IfcProjectionIotUpdatedEvent,
} from '@gacp-erp/shared-events';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Controller()
export class IfcIngestionConsumer {
  private readonly logger = new Logger(IfcIngestionConsumer.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  @EventPattern(IFC_INGESTION_TOPIC)
  async handle(@Payload() raw: unknown): Promise<void> {
    const parsed = IfcIngestionApprovedEventSchema.safeParse(raw);
    if (!parsed.success) return;

    const input = parsed.data;
    const now = new Date().toISOString();

    const projectionEvent: IfcProjectionIotUpdatedEvent = {
      eventId: randomUUID(),
      occurredAt: now,
      eventVersion: '1.0',
      producerService: 'api-gateway',
      topic: IFC_PROJECTION_TOPIC,
      correlationId: input.correlationId,
      triggeredBy: input.triggeredBy,
      eventType: 'ifc.projection.iot.updated',
      payload: {
        revisionId: input.payload.revisionId,
        projectionRunId: randomUUID(),
        updatedAnchors: 0,
        unresolvedAnchors: 0,
        unresolvedAnchorIds: [],
        status: 'success',
      },
    };

    this.kafkaProducer.publish(IFC_PROJECTION_TOPIC, input.payload.revisionId, projectionEvent);

    this.logger.log(
      `Published IFC IoT projection skeleton for revision ${input.payload.revisionId}`,
    );
  }
}
