import {
  IFC_INGESTION_TOPIC,
  IFC_PROJECTION_TOPIC,
  IfcProjectionIotUpdatedEventSchema,
} from '@gacp-erp/shared-events';
import type { IfcIngestionConsumer as IfcIngestionConsumerType } from './ifc-ingestion.consumer';
import type { KafkaProducerService } from '../kafka/kafka-producer.service';

const { IfcIngestionConsumer } = require('./ifc-ingestion.consumer') as {
  IfcIngestionConsumer: new (...args: unknown[]) => IfcIngestionConsumerType;
};

function makeKafkaMock(): { publish: jest.Mock } {
  return { publish: jest.fn() };
}

describe('Iot IfcIngestionConsumer', () => {
  let consumer: IfcIngestionConsumerType;
  let kafka: { publish: jest.Mock };

  beforeEach(() => {
    kafka = makeKafkaMock();
    consumer = new IfcIngestionConsumer(kafka as unknown as KafkaProducerService);
  });

  it('ignores non-approved ingestion events', async () => {
    const raw = {
      eventId: '11111111-1111-1111-1111-111111111111',
      occurredAt: '2026-06-29T00:00:00.000Z',
      eventVersion: '1.0',
      producerService: 'ifc-integration-service',
      topic: IFC_INGESTION_TOPIC,
      correlationId: '22222222-2222-2222-2222-222222222222',
      triggeredBy: '00000000-0000-0000-0000-000000000001',
      eventType: 'ifc.ingestion.started',
      payload: {
        revisionId: '33333333-3333-3333-3333-333333333333',
        modelId: 'facility-a',
        sourceFileHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        sourceFileUri: 's3://ifc/models/facility-a.ifc',
      },
    };

    await consumer.handle(raw);

    expect(kafka.publish).not.toHaveBeenCalled();
  });

  it('publishes ifc.projection.iot.updated for approved ingestion event', async () => {
    const raw = {
      eventId: '44444444-4444-4444-4444-444444444444',
      occurredAt: '2026-06-29T00:00:00.000Z',
      eventVersion: '1.0',
      producerService: 'ifc-integration-service',
      topic: IFC_INGESTION_TOPIC,
      correlationId: '55555555-5555-5555-5555-555555555555',
      triggeredBy: '00000000-0000-0000-0000-000000000001',
      eventType: 'ifc.ingestion.approved',
      payload: {
        revisionId: '66666666-6666-6666-6666-666666666666',
        approvedBy: ['00000000-0000-0000-0000-000000000001'],
        approvedAt: '2026-06-29T00:00:00.000Z',
        approvalReason: 'approved for projection',
        changeControlId: 'CC-IFC-001',
        approvedDomains: ['spatial', 'iot'],
        baselineSwitched: true,
      },
    };

    await consumer.handle(raw);

    expect(kafka.publish).toHaveBeenCalledTimes(1);
    const [topic, key, event] = kafka.publish.mock.calls[0] as [string, string, unknown];
    expect(topic).toBe(IFC_PROJECTION_TOPIC);
    expect(key).toBe('66666666-6666-6666-6666-666666666666');

    const parsed = IfcProjectionIotUpdatedEventSchema.safeParse(event);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payload.revisionId).toBe('66666666-6666-6666-6666-666666666666');
      expect(parsed.data.eventType).toBe('ifc.projection.iot.updated');
    }
  });
});
