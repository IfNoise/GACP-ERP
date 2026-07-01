import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const IFC_INGESTION_TOPIC = 'ifc.ingestion.v1' as const;
export const IFC_PROJECTION_TOPIC = 'ifc.projection.v1' as const;

const ImpactedDomainEnum = z.enum(['spatial', 'financial', 'iot']);
const ProjectionStatusEnum = z.enum(['success', 'partial', 'failed']);

const DiffSummarySchema = z.object({
  added_count: z.number().int().nonnegative(),
  updated_count: z.number().int().nonnegative(),
  removed_count: z.number().int().nonnegative(),
  by_severity: z.object({
    low: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative(),
  }),
});

// ════════════════════════════════════════════════════════════════════════════════
// IFC INGESTION EVENTS — topic: ifc.ingestion.v1
// ════════════════════════════════════════════════════════════════════════════════

export const IfcIngestionStartedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.ingestion.started'),
  topic: z.literal(IFC_INGESTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    modelId: z.string().min(1),
    sourceFileHash: z.string().regex(/^[0-9a-f]{64}$/),
    sourceFileUri: z.string().min(1),
  }),
});
export type IfcIngestionStartedEvent = z.infer<typeof IfcIngestionStartedEventSchema>;

export const IfcIngestionParsedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.ingestion.parsed'),
  topic: z.literal(IFC_INGESTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    modelId: z.string().min(1),
    parsedObjects: z.number().int().nonnegative(),
    parsedProperties: z.number().int().nonnegative(),
    parsedClassifications: z.number().int().nonnegative(),
    validationPassed: z.boolean(),
  }),
});
export type IfcIngestionParsedEvent = z.infer<typeof IfcIngestionParsedEventSchema>;

export const IfcIngestionDiffReadyEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.ingestion.diff_ready'),
  topic: z.literal(IFC_INGESTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    baselineRevisionId: z.string().uuid(),
    modelId: z.string().min(1),
    summary: DiffSummarySchema,
    impactedDomains: z.array(ImpactedDomainEnum).min(1),
    criticalObjects: z.array(z.string().min(1)),
    diffArtifactUri: z.string().min(1),
  }),
});
export type IfcIngestionDiffReadyEvent = z.infer<typeof IfcIngestionDiffReadyEventSchema>;

export const IfcIngestionApprovalRequestedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.ingestion.approval_requested'),
  topic: z.literal(IFC_INGESTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    modelId: z.string().min(1),
    requiredApprovals: z.number().int().positive(),
    changeControlId: z.string().min(1),
    approvalPacketUri: z.string().min(1),
  }),
});
export type IfcIngestionApprovalRequestedEvent = z.infer<
  typeof IfcIngestionApprovalRequestedEventSchema
>;

export const IfcIngestionApprovedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.ingestion.approved'),
  topic: z.literal(IFC_INGESTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    approvedBy: z.array(z.string().uuid()).min(1),
    approvedAt: z.string().datetime({ offset: true }),
    approvalReason: z.string().min(1),
    changeControlId: z.string().min(1),
    approvedDomains: z.array(ImpactedDomainEnum).min(1),
    baselineSwitched: z.boolean(),
  }),
});
export type IfcIngestionApprovedEvent = z.infer<typeof IfcIngestionApprovedEventSchema>;

export const IfcIngestionRejectedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.ingestion.rejected'),
  topic: z.literal(IFC_INGESTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    rejectedBy: z.array(z.string().uuid()).min(1),
    rejectedAt: z.string().datetime({ offset: true }),
    rejectionReason: z.string().min(1),
    remediationNotes: z.string().optional(),
  }),
});
export type IfcIngestionRejectedEvent = z.infer<typeof IfcIngestionRejectedEventSchema>;

export const IfcIngestionFailedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.ingestion.failed'),
  topic: z.literal(IFC_INGESTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    modelId: z.string().min(1),
    stage: z.enum(['upload', 'parse', 'diff', 'approval', 'projection']),
    errorCode: z.string().min(1),
    errorMessage: z.string().min(1),
    retriable: z.boolean(),
  }),
});
export type IfcIngestionFailedEvent = z.infer<typeof IfcIngestionFailedEventSchema>;

export const IfcIngestionEventSchema = z.discriminatedUnion('eventType', [
  IfcIngestionStartedEventSchema,
  IfcIngestionParsedEventSchema,
  IfcIngestionDiffReadyEventSchema,
  IfcIngestionApprovalRequestedEventSchema,
  IfcIngestionApprovedEventSchema,
  IfcIngestionRejectedEventSchema,
  IfcIngestionFailedEventSchema,
]);
export type IfcIngestionEvent = z.infer<typeof IfcIngestionEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// IFC PROJECTION EVENTS — topic: ifc.projection.v1
// ════════════════════════════════════════════════════════════════════════════════

export const IfcProjectionSpatialUpdatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.projection.spatial.updated'),
  topic: z.literal(IFC_PROJECTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    projectionRunId: z.string().uuid(),
    upsertedSpaces: z.number().int().nonnegative(),
    updatedZoneBindings: z.number().int().nonnegative(),
    topologyWarnings: z.number().int().nonnegative(),
    status: ProjectionStatusEnum,
  }),
});
export type IfcProjectionSpatialUpdatedEvent = z.infer<
  typeof IfcProjectionSpatialUpdatedEventSchema
>;

export const IfcProjectionFinancialUpdatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.projection.financial.updated'),
  topic: z.literal(IFC_PROJECTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    projectionRunId: z.string().uuid(),
    upsertedAssets: z.number().int().nonnegative(),
    archivedAssets: z.number().int().nonnegative(),
    mappingWarnings: z.number().int().nonnegative(),
    warningsUri: z.string().nullable(),
    status: ProjectionStatusEnum,
  }),
});
export type IfcProjectionFinancialUpdatedEvent = z.infer<
  typeof IfcProjectionFinancialUpdatedEventSchema
>;

export const IfcProjectionIotUpdatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('ifc.projection.iot.updated'),
  topic: z.literal(IFC_PROJECTION_TOPIC),
  payload: z.object({
    revisionId: z.string().uuid(),
    projectionRunId: z.string().uuid(),
    updatedAnchors: z.number().int().nonnegative(),
    unresolvedAnchors: z.number().int().nonnegative(),
    unresolvedAnchorIds: z.array(z.string().min(1)),
    status: ProjectionStatusEnum,
  }),
});
export type IfcProjectionIotUpdatedEvent = z.infer<typeof IfcProjectionIotUpdatedEventSchema>;

export const IfcProjectionEventSchema = z.discriminatedUnion('eventType', [
  IfcProjectionSpatialUpdatedEventSchema,
  IfcProjectionFinancialUpdatedEventSchema,
  IfcProjectionIotUpdatedEventSchema,
]);
export type IfcProjectionEvent = z.infer<typeof IfcProjectionEventSchema>;

export const IfcEventSchema = z.discriminatedUnion('eventType', [
  ...IfcIngestionEventSchema.options,
  ...IfcProjectionEventSchema.options,
]);
export type IfcEvent = z.infer<typeof IfcEventSchema>;
