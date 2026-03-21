import {
  // topics
  CULTIVATION_TOPIC,
  FACILITY_TOPIC,
  AUDIT_TOPIC,
  IOT_ALERTS_TOPIC,
  QUALITY_CHANGE_TOPIC,
  QUALITY_CAPA_TOPIC,
  QUALITY_DEVIATION_TOPIC,
  QUALITY_VALIDATION_TOPIC,
  QUALITY_EVENTS_TOPIC,
  FINANCE_TRANSACTION_TOPIC,
  PROCUREMENT_PO_TOPIC,
  SPATIAL_ZONE_TOPIC,
  WORKFORCE_EMPLOYEE_TOPIC,
  WORKFORCE_TASK_TOPIC,
  WORKFORCE_TIME_TOPIC,
  TRAINING_EXECUTION_TOPIC,
  TRAINING_CERTIFICATION_TOPIC,
  ANALYTICS_REPORT_TOPIC,
  // base
  EventHeaderSchema,
  SopReferenceSchema,
} from './index';

describe('Event topics', () => {
  it('all topic constants are non-empty strings', () => {
    const topics = [
      CULTIVATION_TOPIC,
      FACILITY_TOPIC,
      AUDIT_TOPIC,
      IOT_ALERTS_TOPIC,
      QUALITY_CHANGE_TOPIC,
      QUALITY_CAPA_TOPIC,
      QUALITY_DEVIATION_TOPIC,
      QUALITY_VALIDATION_TOPIC,
      QUALITY_EVENTS_TOPIC,
      FINANCE_TRANSACTION_TOPIC,
      PROCUREMENT_PO_TOPIC,
      SPATIAL_ZONE_TOPIC,
      WORKFORCE_EMPLOYEE_TOPIC,
      WORKFORCE_TASK_TOPIC,
      WORKFORCE_TIME_TOPIC,
      TRAINING_EXECUTION_TOPIC,
      TRAINING_CERTIFICATION_TOPIC,
      ANALYTICS_REPORT_TOPIC,
    ];
    for (const t of topics) {
      expect(typeof t).toBe('string');
      expect(t.length).toBeGreaterThan(0);
    }
  });
});

describe('Base event schemas', () => {
  it('EventHeaderSchema parses', () => {
    expect(
      EventHeaderSchema.parse({
        eventId: '00000000-0000-0000-0000-000000000001',
        occurredAt: '2025-01-01T00:00:00.000Z',
        eventVersion: '1.0',
        producerService: 'test',
        topic: 'test-topic',
        correlationId: '00000000-0000-0000-0000-000000000002',
        triggeredBy: '00000000-0000-0000-0000-000000000003',
      }),
    ).toBeDefined();
  });

  it('SopReferenceSchema parses', () => {
    expect(
      SopReferenceSchema.parse({
        sopId: 'SOP-001',
        sopVersion: '1.0',
      }),
    ).toBeDefined();
  });
});
