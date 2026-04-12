import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const QUALITY_CHANGE_TOPIC = 'quality.change.v1' as const;
export const QUALITY_CAPA_TOPIC = 'quality.capa.v1' as const;
export const QUALITY_DEVIATION_TOPIC = 'quality.deviation.v1' as const;

// ─── SHARED PAYLOAD FRAGMENTS ─────────────────────────────────────────────────

const ChangeControlRefSchema = z.object({
  changeControlId: z.string().uuid(),
  ccnNumber: z.string().regex(/^CCN-\d{4}-\d{4}$/),
  changeType: z.enum(['MINOR', 'MAJOR', 'EMERGENCY']),
});

const CapaRefSchema = z.object({
  capaId: z.string().uuid(),
  capaNumber: z.string().regex(/^CA-\d{4}-\d{4}$/),
  capaType: z.enum(['CORRECTIVE', 'PREVENTIVE']),
});

const DeviationRefSchema = z.object({
  deviationId: z.string().uuid(),
  deviationNumber: z.string().regex(/^DEV-\d{4}-\d{4}$/),
  classification: z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
});

// ════════════════════════════════════════════════════════════════════════════════
// CHANGE CONTROL EVENTS — topic: quality.change.v1
// ════════════════════════════════════════════════════════════════════════════════

export const ChangeRequestedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.change.requested'),
  topic: z.literal(QUALITY_CHANGE_TOPIC),
  payload: ChangeControlRefSchema.extend({
    requestorId: z.string().uuid(),
    title: z.string(),
  }),
});
export type ChangeRequestedEvent = z.infer<typeof ChangeRequestedEventSchema>;

export const ChangeSubmittedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.change.submitted'),
  topic: z.literal(QUALITY_CHANGE_TOPIC),
  payload: ChangeControlRefSchema.extend({
    submittedBy: z.string().uuid(),
    submittedAt: z.string().datetime({ offset: true }),
  }),
});
export type ChangeSubmittedEvent = z.infer<typeof ChangeSubmittedEventSchema>;

export const ChangeImpactAssessedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.change.impact_assessed'),
  topic: z.literal(QUALITY_CHANGE_TOPIC),
  payload: ChangeControlRefSchema.extend({
    impactCount: z.number().int().nonnegative(),
    maxRiskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    assessedBy: z.string().uuid(),
  }),
});
export type ChangeImpactAssessedEvent = z.infer<typeof ChangeImpactAssessedEventSchema>;

export const ChangeApprovedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.change.approved'),
  topic: z.literal(QUALITY_CHANGE_TOPIC),
  payload: ChangeControlRefSchema.extend({
    approverId: z.string().uuid(),
    approvalLevel: z.number().int().min(1),
    /** ImmuDB TX-id captured at signature time */
    auditTxId: z.string().nullable(),
    approvedAt: z.string().datetime({ offset: true }),
  }),
});
export type ChangeApprovedEvent = z.infer<typeof ChangeApprovedEventSchema>;

export const ChangeRejectedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.change.rejected'),
  topic: z.literal(QUALITY_CHANGE_TOPIC),
  payload: ChangeControlRefSchema.extend({
    rejectedBy: z.string().uuid(),
    rejectionReason: z.string(),
    rejectedAt: z.string().datetime({ offset: true }),
  }),
});
export type ChangeRejectedEvent = z.infer<typeof ChangeRejectedEventSchema>;

export const ChangeImplementedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.change.implemented'),
  topic: z.literal(QUALITY_CHANGE_TOPIC),
  payload: ChangeControlRefSchema.extend({
    implementedBy: z.string().uuid(),
    implementedAt: z.string().datetime({ offset: true }),
  }),
});
export type ChangeImplementedEvent = z.infer<typeof ChangeImplementedEventSchema>;

export const ChangeVerifiedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.change.verified'),
  topic: z.literal(QUALITY_CHANGE_TOPIC),
  payload: ChangeControlRefSchema.extend({
    verifiedBy: z.string().uuid(),
    verificationNotes: z.string(),
    auditTxId: z.string().nullable(),
    verifiedAt: z.string().datetime({ offset: true }),
  }),
});
export type ChangeVerifiedEvent = z.infer<typeof ChangeVerifiedEventSchema>;

export const ChangeClosedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.change.closed'),
  topic: z.literal(QUALITY_CHANGE_TOPIC),
  payload: ChangeControlRefSchema.extend({
    closedBy: z.string().uuid(),
    closureSummary: z.string(),
    closedAt: z.string().datetime({ offset: true }),
  }),
});
export type ChangeClosedEvent = z.infer<typeof ChangeClosedEventSchema>;

/** Discriminated union of all change control events */
export const ChangeControlEventSchema = z.discriminatedUnion('eventType', [
  ChangeRequestedEventSchema,
  ChangeSubmittedEventSchema,
  ChangeImpactAssessedEventSchema,
  ChangeApprovedEventSchema,
  ChangeRejectedEventSchema,
  ChangeImplementedEventSchema,
  ChangeVerifiedEventSchema,
  ChangeClosedEventSchema,
]);
export type ChangeControlEvent = z.infer<typeof ChangeControlEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// CAPA EVENTS — topic: quality.capa.v1
// ════════════════════════════════════════════════════════════════════════════════

export const CapaInitiatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.capa.initiated'),
  topic: z.literal(QUALITY_CAPA_TOPIC),
  payload: CapaRefSchema.extend({
    source: z.enum(['DEVIATION', 'AUDIT', 'COMPLAINT', 'TREND', 'INSPECTION']),
    initiatedBy: z.string().uuid(),
    /** FK to the source record that triggered this CAPA */
    sourceRecordType: z.string().nullable(),
    sourceRecordId: z.string().uuid().nullable(),
    dueDate: z.string().date().nullable(),
  }),
});
export type CapaInitiatedEvent = z.infer<typeof CapaInitiatedEventSchema>;

export const RcaCompletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.capa.rca_completed'),
  topic: z.literal(QUALITY_CAPA_TOPIC),
  payload: CapaRefSchema.extend({
    rootCauseCategory: z.string(),
    investigatedBy: z.string().uuid(),
    investigatedAt: z.string().datetime({ offset: true }),
  }),
});
export type RcaCompletedEvent = z.infer<typeof RcaCompletedEventSchema>;

export const ActionPlanCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.capa.action_plan_created'),
  topic: z.literal(QUALITY_CAPA_TOPIC),
  payload: CapaRefSchema.extend({
    actionCount: z.number().int().positive(),
    createdBy: z.string().uuid(),
  }),
});
export type ActionPlanCreatedEvent = z.infer<typeof ActionPlanCreatedEventSchema>;

export const CapaImplementedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.capa.implemented'),
  topic: z.literal(QUALITY_CAPA_TOPIC),
  payload: CapaRefSchema.extend({
    implementedBy: z.string().uuid(),
    implementedAt: z.string().datetime({ offset: true }),
  }),
});
export type CapaImplementedEvent = z.infer<typeof CapaImplementedEventSchema>;

export const EffectivenessCheckCompletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.capa.effectiveness_checked'),
  topic: z.literal(QUALITY_CAPA_TOPIC),
  payload: CapaRefSchema.extend({
    result: z.enum(['EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE']),
    checkedBy: z.string().uuid(),
    /** If INEFFECTIVE — a follow-up CAPA was initiated */
    followUpCapaId: z.string().uuid().nullable(),
  }),
});
export type EffectivenessCheckCompletedEvent = z.infer<
  typeof EffectivenessCheckCompletedEventSchema
>;

export const CapaClosedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.capa.closed'),
  topic: z.literal(QUALITY_CAPA_TOPIC),
  payload: CapaRefSchema.extend({
    closedBy: z.string().uuid(),
    auditTxId: z.string().nullable(),
    closedAt: z.string().datetime({ offset: true }),
  }),
});
export type CapaClosedEvent = z.infer<typeof CapaClosedEventSchema>;

/** Discriminated union of all CAPA events */
export const CapaEventSchema = z.discriminatedUnion('eventType', [
  CapaInitiatedEventSchema,
  RcaCompletedEventSchema,
  ActionPlanCreatedEventSchema,
  CapaImplementedEventSchema,
  EffectivenessCheckCompletedEventSchema,
  CapaClosedEventSchema,
]);
export type CapaEvent = z.infer<typeof CapaEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// DEVIATION EVENTS — topic: quality.deviation.v1
// ════════════════════════════════════════════════════════════════════════════════

export const DeviationReportedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.deviation.reported'),
  topic: z.literal(QUALITY_DEVIATION_TOPIC),
  payload: DeviationRefSchema.extend({
    category: z.enum([
      'PROCESS',
      'EQUIPMENT',
      'MATERIAL',
      'ENVIRONMENTAL',
      'DOCUMENTATION',
      'PERSONNEL',
      'UTILITY',
    ]),
    reportedBy: z.string().uuid(),
    location: z.string().nullable(),
    batchIds: z.array(z.string().uuid()),
    occurredAt: z.string().datetime({ offset: true }).nullable(),
  }),
});
export type DeviationReportedEvent = z.infer<typeof DeviationReportedEventSchema>;

export const DeviationInvestigatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.deviation.investigated'),
  topic: z.literal(QUALITY_DEVIATION_TOPIC),
  payload: DeviationRefSchema.extend({
    investigatorId: z.string().uuid(),
    investigatedAt: z.string().datetime({ offset: true }),
    batchesAffected: z.array(z.string().uuid()),
  }),
});
export type DeviationInvestigatedEvent = z.infer<typeof DeviationInvestigatedEventSchema>;

export const DeviationImpactAssessedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.deviation.impact_assessed'),
  topic: z.literal(QUALITY_DEVIATION_TOPIC),
  payload: DeviationRefSchema.extend({
    capaRequired: z.boolean(),
    productImpact: z.string(),
    assessedBy: z.string().uuid(),
  }),
});
export type DeviationImpactAssessedEvent = z.infer<typeof DeviationImpactAssessedEventSchema>;

export const DeviationCapaLinkedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.deviation.capa_linked'),
  topic: z.literal(QUALITY_DEVIATION_TOPIC),
  payload: DeviationRefSchema.extend({
    capaId: z.string().uuid(),
    capaNumber: z.string().regex(/^CA-\d{4}-\d{4}$/),
    linkedBy: z.string().uuid(),
  }),
});
export type DeviationCapaLinkedEvent = z.infer<typeof DeviationCapaLinkedEventSchema>;

export const DeviationClosedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.deviation.closed'),
  topic: z.literal(QUALITY_DEVIATION_TOPIC),
  payload: DeviationRefSchema.extend({
    closedBy: z.string().uuid(),
    auditTxId: z.string().nullable(),
    closedAt: z.string().datetime({ offset: true }),
  }),
});
export type DeviationClosedEvent = z.infer<typeof DeviationClosedEventSchema>;

/** Discriminated union of all Deviation events */
export const DeviationEventSchema = z.discriminatedUnion('eventType', [
  DeviationReportedEventSchema,
  DeviationInvestigatedEventSchema,
  DeviationImpactAssessedEventSchema,
  DeviationCapaLinkedEventSchema,
  DeviationClosedEventSchema,
]);
export type DeviationEvent = z.infer<typeof DeviationEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// EPIC 7 — VALIDATION PROTOCOL EVENTS — topic: quality.validation.v1
// ════════════════════════════════════════════════════════════════════════════════

export const QUALITY_VALIDATION_TOPIC = 'quality.validation.v1' as const;
export const QUALITY_EVENTS_TOPIC = 'quality.events.v1' as const;

const ValidationProtocolRefSchema = z.object({
  protocolId: z.string().uuid(),
  protocolNumber: z.string().regex(/^VAL-\d{4}-\d{4}$/),
  protocolType: z.enum(['IQ', 'OQ', 'PQ']),
});

const QualityEventRefSchema = z.object({
  eventId: z.string().uuid(),
  eventNumber: z.string().regex(/^QE-\d{4}-\d{4}$/),
  eventType: z.string(),
});

export const ValidationStartedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.validation.started'),
  topic: z.literal(QUALITY_VALIDATION_TOPIC),
  payload: ValidationProtocolRefSchema.extend({
    systemUnderTest: z.string(),
    changeControlId: z.string().uuid().nullable(),
    startedBy: z.string().uuid(),
    startedAt: z.string().datetime({ offset: true }),
  }),
});
export type ValidationStartedEvent = z.infer<typeof ValidationStartedEventSchema>;

export const TestExecutedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.validation.test_executed'),
  topic: z.literal(QUALITY_VALIDATION_TOPIC),
  payload: ValidationProtocolRefSchema.extend({
    stepNumber: z.number().int().positive(),
    testStatus: z.enum(['PASS', 'FAIL', 'NOT_APPLICABLE']),
    executedBy: z.string().uuid(),
    executedAt: z.string().datetime({ offset: true }),
    /** Only present when status = FAIL or NOT_APPLICABLE */
    exceptionNote: z.string().nullable(),
  }),
});
export type TestExecutedEvent = z.infer<typeof TestExecutedEventSchema>;

export const ValidationCompletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.validation.completed'),
  topic: z.literal(QUALITY_VALIDATION_TOPIC),
  payload: ValidationProtocolRefSchema.extend({
    totalSteps: z.number().int().nonnegative(),
    passedSteps: z.number().int().nonnegative(),
    failedSteps: z.number().int().nonnegative(),
    passRatePct: z.number().min(0).max(100),
    completedBy: z.string().uuid(),
    completedAt: z.string().datetime({ offset: true }),
  }),
});
export type ValidationCompletedEvent = z.infer<typeof ValidationCompletedEventSchema>;

export const ExceptionRaisedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.validation.exception_raised'),
  topic: z.literal(QUALITY_VALIDATION_TOPIC),
  payload: ValidationProtocolRefSchema.extend({
    stepNumber: z.number().int().positive(),
    exceptionNote: z.string(),
    raisedBy: z.string().uuid(),
    raisedAt: z.string().datetime({ offset: true }),
  }),
});
export type ExceptionRaisedEvent = z.infer<typeof ExceptionRaisedEventSchema>;

export const ValidationClosedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.validation.closed'),
  topic: z.literal(QUALITY_VALIDATION_TOPIC),
  payload: ValidationProtocolRefSchema.extend({
    closureSummary: z.string(),
    auditTxId: z.string().nullable(),
    closedBy: z.string().uuid(),
    closedAt: z.string().datetime({ offset: true }),
  }),
});
export type ValidationClosedEvent = z.infer<typeof ValidationClosedEventSchema>;

/** Discriminated union of all Validation Protocol events */
export const ValidationProtocolEventSchema = z.discriminatedUnion('eventType', [
  ValidationStartedEventSchema,
  TestExecutedEventSchema,
  ValidationCompletedEventSchema,
  ExceptionRaisedEventSchema,
  ValidationClosedEventSchema,
]);
export type ValidationProtocolEvent = z.infer<typeof ValidationProtocolEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// EPIC 7 — QUALITY EVENT EVENTS — topic: quality.events.v1
// ════════════════════════════════════════════════════════════════════════════════

export const QualityEventReportedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.events.reported'),
  topic: z.literal(QUALITY_EVENTS_TOPIC),
  payload: QualityEventRefSchema.extend({
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    reportedBy: z.string().uuid(),
    reportedAt: z.string().datetime({ offset: true }),
  }),
});
export type QualityEventReportedEvent = z.infer<typeof QualityEventReportedEventSchema>;

export const QualityEventInvestigatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.events.investigated'),
  topic: z.literal(QUALITY_EVENTS_TOPIC),
  payload: QualityEventRefSchema.extend({
    investigatedBy: z.string().uuid(),
    investigatedAt: z.string().datetime({ offset: true }),
  }),
});
export type QualityEventInvestigatedEvent = z.infer<typeof QualityEventInvestigatedEventSchema>;

export const QualityEventCapaLinkedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.events.capa_linked'),
  topic: z.literal(QUALITY_EVENTS_TOPIC),
  payload: QualityEventRefSchema.extend({
    capaId: z.string().uuid(),
    capaNumber: z.string().regex(/^CA-\d{4}-\d{4}$/),
    linkedBy: z.string().uuid(),
  }),
});
export type QualityEventCapaLinkedEvent = z.infer<typeof QualityEventCapaLinkedEventSchema>;

export const QualityEventClosedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.events.closed'),
  topic: z.literal(QUALITY_EVENTS_TOPIC),
  payload: QualityEventRefSchema.extend({
    closureSummary: z.string(),
    auditTxId: z.string().nullable(),
    closedBy: z.string().uuid(),
    closedAt: z.string().datetime({ offset: true }),
  }),
});
export type QualityEventClosedEvent = z.infer<typeof QualityEventClosedEventSchema>;

/** Discriminated union of all Quality Event events */
export const QualityEventEventSchema = z.discriminatedUnion('eventType', [
  QualityEventReportedEventSchema,
  QualityEventInvestigatedEventSchema,
  QualityEventCapaLinkedEventSchema,
  QualityEventClosedEventSchema,
]);
export type QualityEventEvent = z.infer<typeof QualityEventEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// INCOMING INSPECTION EVENTS — topic: quality.inspection.v1
// ════════════════════════════════════════════════════════════════════════════════

export const QUALITY_INSPECTION_TOPIC = 'quality.inspection.v1' as const;

const InspectionRefSchema = z.object({
  inspectionId: z.string().uuid(),
  inspectionNumber: z.string().regex(/^INS-\d{4}-\d{4}$/),
  grnId: z.string().uuid(),
  poId: z.string().uuid(),
  supplierId: z.string().uuid(),
  strainId: z.string().uuid().nullable(),
});

export const InspectionCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.inspection.created'),
  topic: z.literal(QUALITY_INSPECTION_TOPIC),
  payload: InspectionRefSchema.extend({
    createdBy: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
  }),
});
export type InspectionCreatedEvent = z.infer<typeof InspectionCreatedEventSchema>;

export const InspectionStartedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.inspection.started'),
  topic: z.literal(QUALITY_INSPECTION_TOPIC),
  payload: InspectionRefSchema.extend({
    startedBy: z.string().uuid(),
    startedAt: z.string().datetime({ offset: true }),
  }),
});
export type InspectionStartedEvent = z.infer<typeof InspectionStartedEventSchema>;

export const InspectionQuarantinedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.inspection.quarantined'),
  topic: z.literal(QUALITY_INSPECTION_TOPIC),
  payload: InspectionRefSchema.extend({
    quarantineStartDate: z.string().datetime({ offset: true }),
    quarantineEndDate: z.string().datetime({ offset: true }),
    quarantineDaysRequired: z.number().int(),
    quarantinedBy: z.string().uuid(),
  }),
});
export type InspectionQuarantinedEvent = z.infer<typeof InspectionQuarantinedEventSchema>;

export const InspectionReleasedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.inspection.released'),
  topic: z.literal(QUALITY_INSPECTION_TOPIC),
  payload: InspectionRefSchema.extend({
    dispositionReason: z.string().nullable(),
    releasedBy: z.string().uuid(),
    releasedAt: z.string().datetime({ offset: true }),
  }),
});
export type InspectionReleasedEvent = z.infer<typeof InspectionReleasedEventSchema>;

export const InspectionRejectedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('quality.inspection.rejected'),
  topic: z.literal(QUALITY_INSPECTION_TOPIC),
  payload: InspectionRefSchema.extend({
    dispositionReason: z.string(),
    rejectedBy: z.string().uuid(),
    rejectedAt: z.string().datetime({ offset: true }),
  }),
});
export type InspectionRejectedEvent = z.infer<typeof InspectionRejectedEventSchema>;

/** Discriminated union of all Incoming Inspection events */
export const IncomingInspectionEventSchema = z.discriminatedUnion('eventType', [
  InspectionCreatedEventSchema,
  InspectionStartedEventSchema,
  InspectionQuarantinedEventSchema,
  InspectionReleasedEventSchema,
  InspectionRejectedEventSchema,
]);
export type IncomingInspectionEvent = z.infer<typeof IncomingInspectionEventSchema>;
