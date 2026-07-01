import {
  IFC_INGESTION_TOPIC,
  IFC_PROJECTION_TOPIC,
  IfcProjectionFinancialUpdatedEventSchema,
} from '@gacp-erp/shared-events';
import { type IfcIngestionConsumer as IfcIngestionConsumerType } from './ifc-ingestion.consumer';

const { IfcIngestionConsumer } = require('./ifc-ingestion.consumer') as {
  IfcIngestionConsumer: new (...args: unknown[]) => IfcIngestionConsumerType;
};

function makeDbMock() {
  return {
    transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {};
      return cb(tx);
    }),
  };
}

function makeOutboxMock() {
  return {
    createWithTx: jest.fn().mockResolvedValue(undefined),
  };
}

describe('IfcIngestionConsumer', () => {
  let consumer: IfcIngestionConsumerType;
  let db: ReturnType<typeof makeDbMock>;
  let outbox: ReturnType<typeof makeOutboxMock>;

  beforeEach(() => {
    db = makeDbMock();
    outbox = makeOutboxMock();
    consumer = new IfcIngestionConsumer(db as never, outbox as never);
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

    expect(outbox.createWithTx).not.toHaveBeenCalled();
  });

  it('publishes ifc.projection.financial.updated to outbox for approved ingestion event', async () => {
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
        approvedDomains: ['spatial', 'financial'],
        baselineSwitched: true,
      },
    };

    await consumer.handle(raw);

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(outbox.createWithTx).toHaveBeenCalledTimes(1);

    const [, entry] = outbox.createWithTx.mock.calls[0] as [
      unknown,
      {
        topic: string;
        key: string;
        payload: Record<string, unknown>;
      },
    ];

    expect(entry.topic).toBe(IFC_PROJECTION_TOPIC);
    expect(entry.key).toBe('66666666-6666-6666-6666-666666666666');

    const parsed = IfcProjectionFinancialUpdatedEventSchema.safeParse(entry.payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payload.revisionId).toBe('66666666-6666-6666-6666-666666666666');
      expect(parsed.data.eventType).toBe('ifc.projection.financial.updated');
    }
  });
});
