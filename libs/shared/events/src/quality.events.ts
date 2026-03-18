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
