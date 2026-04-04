import { z } from 'zod';

import {
  BatchIdSchema,
  FacilityIdSchema,
  PlantIdSchema,
  UserIdSchema,
  ZoneIdSchema,
} from '@gacp-erp/shared-schemas';
import {
  BatchStatusEnum,
  ComplianceStatusEnum,
  GrowthStageEnum,
  QualityGradeEnum,
} from '@gacp-erp/shared-schemas';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPIC ──────────────────────────────────────────────────────────────
export const CULTIVATION_TOPIC = 'cultivation.plants.v1' as const;

// ─── PLANT CREATED ────────────────────────────────────────────────────────────
export const PlantCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('PLANT_CREATED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    plantId: PlantIdSchema,
    plantCode: z.string(),
    batchId: BatchIdSchema,
    strainId: z.string().uuid(),
    zoneId: ZoneIdSchema,
    plantedAt: z.string().datetime({ offset: true }),
    initialStage: GrowthStageEnum,
  }),
});
export type PlantCreatedEvent = z.infer<typeof PlantCreatedEventSchema>;

// ─── PLANT STAGE CHANGED ─────────────────────────────────────────────────────
export const PlantStageChangedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('PLANT_STAGE_CHANGED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    plantId: PlantIdSchema,
    plantCode: z.string(),
    batchId: BatchIdSchema,
    previousStage: GrowthStageEnum,
    newStage: GrowthStageEnum,
    stageRecordId: z.string().uuid(),
    transitionedAt: z.string().datetime({ offset: true }),
    notes: z.string().optional(),
    signatureProvided: z.boolean(),
    isHarvest: z.boolean().default(false),
  }),
});
export type PlantStageChangedEvent = z.infer<typeof PlantStageChangedEventSchema>;

// ─── PLANT MOVED ──────────────────────────────────────────────────────────────
/** Published when a plant is physically relocated to a different zone. */
export const PlantMovedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('PLANT_MOVED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    plantId: PlantIdSchema,
    plantCode: z.string(),
    previousZoneId: ZoneIdSchema,
    newZoneId: ZoneIdSchema,
    operationId: z.string().uuid(),
    movedAt: z.string().datetime({ offset: true }),
    reason: z.string().max(500).optional(),
  }),
});
export type PlantMovedEvent = z.infer<typeof PlantMovedEventSchema>;

// ─── PLANT HEALTH UPDATED ─────────────────────────────────────────────────────
/** Published when the health score of a plant is assessed/updated. */
export const PlantHealthUpdatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('PLANT_HEALTH_UPDATED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    plantId: PlantIdSchema,
    plantCode: z.string(),
    previousHealthScore: z.number().int().min(0).max(100).nullable(),
    newHealthScore: z.number().int().min(0).max(100),
    /** Triggered by a plant_operation of type health_check */
    operationId: z.string().uuid(),
    assessedAt: z.string().datetime({ offset: true }),
    notes: z.string().max(1000).optional(),
  }),
});
export type PlantHealthUpdatedEvent = z.infer<typeof PlantHealthUpdatedEventSchema>;

// ─── PLANT DESTROYED ──────────────────────────────────────────────────────────
export const PlantDestroyedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('PLANT_DESTROYED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    plantId: PlantIdSchema,
    plantCode: z.string(),
    batchId: BatchIdSchema,
    destroyedAt: z.string().datetime({ offset: true }),
    reason: z.string().min(1).max(1000),
    deviationId: z.string().uuid().optional(),
    signatureId: z.string().uuid(),
  }),
});
export type PlantDestroyedEvent = z.infer<typeof PlantDestroyedEventSchema>;

// ─── BATCH CREATED ────────────────────────────────────────────────────────────
export const BatchCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('BATCH_CREATED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    batchId: BatchIdSchema,
    batchNumber: z.string(),
    strainId: z.string().uuid(),
    facilityId: FacilityIdSchema,
    initialQuantity: z.number().int().positive(),
    startedAt: z.string().datetime({ offset: true }),
    targetHarvestAt: z.string().datetime({ offset: true }).optional(),
    propagationMethod: z.enum(['seed', 'clone', 'tissue_culture']),
  }),
});
export type BatchCreatedEvent = z.infer<typeof BatchCreatedEventSchema>;

// ─── BATCH CLONED ─────────────────────────────────────────────────────────────
/** Published when a batch is split/cloned from an existing batch. */
export const BatchClonedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('BATCH_CLONED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    newBatchId: BatchIdSchema,
    newBatchNumber: z.string(),
    parentBatchId: BatchIdSchema,
    strainId: z.string().uuid(),
    facilityId: FacilityIdSchema,
    clonedPlantCount: z.number().int().positive(),
    clonedAt: z.string().datetime({ offset: true }),
    reason: z.string().max(500).optional(),
  }),
});
export type BatchClonedEvent = z.infer<typeof BatchClonedEventSchema>;

// ─── BATCH STATUS CHANGED ─────────────────────────────────────────────────────
export const BatchStatusChangedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('BATCH_STATUS_CHANGED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    batchId: BatchIdSchema,
    batchNumber: z.string(),
    previousStatus: BatchStatusEnum,
    newStatus: BatchStatusEnum,
    reason: z.string().optional(),
    changedAt: z.string().datetime({ offset: true }),
  }),
});
export type BatchStatusChangedEvent = z.infer<typeof BatchStatusChangedEventSchema>;

// ─── BATCH COMPLIANCE STATUS CHANGED ─────────────────────────────────────────
/** Published when QA approves or rejects a batch. */
export const BatchComplianceStatusChangedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('BATCH_COMPLIANCE_STATUS_CHANGED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    batchId: BatchIdSchema,
    batchNumber: z.string(),
    previousStatus: ComplianceStatusEnum,
    newStatus: ComplianceStatusEnum,
    reviewedBy: UserIdSchema,
    reviewedAt: z.string().datetime({ offset: true }),
    /** Required when rejecting */
    rejectionReason: z.string().max(1000).optional(),
    signatureId: z.string().uuid(),
  }),
});
export type BatchComplianceStatusChangedEvent = z.infer<
  typeof BatchComplianceStatusChangedEventSchema
>;

// ─── HARVEST COMPLETED ────────────────────────────────────────────────────────
export const HarvestCompletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('HARVEST_COMPLETED'),
  topic: z.literal(CULTIVATION_TOPIC),
  payload: z.object({
    harvestRecordId: z.string().uuid(),
    batchId: BatchIdSchema,
    wetWeightGrams: z.number().positive(),
    moistureContentPercent: z.number(),
    qualityGrade: QualityGradeEnum,
    harvestedAt: z.string().datetime({ offset: true }),
    signatureId: z.string().uuid(),
  }),
});
export type HarvestCompletedEvent = z.infer<typeof HarvestCompletedEventSchema>;

// ─── DISCRIMINATED UNION ──────────────────────────────────────────────────────
/**
 * Union of all cultivation domain events.
 *
 * Use for Kafka consumer type narrowing:
 * @example
 * const event = CultivationEventSchema.parse(message.value);
 * if (event.eventType === 'PLANT_STAGE_CHANGED') {
 *   console.log(event.payload.newStage); // fully typed
 * }
 */
export const CultivationEventSchema = z.discriminatedUnion('eventType', [
  PlantCreatedEventSchema,
  PlantStageChangedEventSchema,
  PlantMovedEventSchema,
  PlantHealthUpdatedEventSchema,
  PlantDestroyedEventSchema,
  BatchCreatedEventSchema,
  BatchClonedEventSchema,
  BatchStatusChangedEventSchema,
  BatchComplianceStatusChangedEventSchema,
  HarvestCompletedEventSchema,
]);
export type CultivationEvent = z.infer<typeof CultivationEventSchema>;
