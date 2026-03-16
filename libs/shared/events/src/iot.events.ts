import { z } from 'zod';

import { ZoneIdSchema } from '@gacp-erp/shared-schemas';
import { AlertLevelEnum, SensorTypeEnum } from '@gacp-erp/shared-schemas';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
/**
 * IoT alert events topic.
 * NOTE: Raw sensor readings flow directly via Telegraf → VictoriaMetrics IoT.
 * Only alert/threshold events reach Kafka (stateful evaluation).
 */
export const IOT_ALERTS_TOPIC = 'iot.alerts.v1' as const;

// ─── ALERT TRIGGERED ─────────────────────────────────────────────────────────
/**
 * Published when a sensor reading breaches an active threshold.
 * Produced by AlertEvaluationService (api-gateway cron job).
 * Consumers: notification service, audit trail.
 */
export const AlertTriggeredEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('iot.alert.triggered'),
  topic: z.literal(IOT_ALERTS_TOPIC),
  payload: z.object({
    /** ID of the created alert_history record */
    alertHistoryId: z.string().uuid(),
    threshold_id: z.string().uuid(),
    zone_id: ZoneIdSchema,
    sensor_type: SensorTypeEnum,
    /** The value that triggered the alert */
    triggered_value: z.number(),
    alert_level: AlertLevelEnum,
    /** ISO 8601 UTC timestamp when the breach was detected */
    triggered_at: z.string().datetime({ offset: true }),
    /** SHA-256 integrity hash of (threshold_id + triggered_value + triggered_at) */
    source_hash: z.string().regex(/^[0-9a-f]{64}$/, {
      message: 'source_hash must be a SHA-256 hex string',
    }),
  }),
});
export type AlertTriggeredEvent = z.infer<typeof AlertTriggeredEventSchema>;

// ─── THRESHOLD BREACHED ──────────────────────────────────────────────────────
/**
 * Published alongside AlertTriggeredEvent when a CRITICAL threshold is breached.
 * Provides extended ALCOA+ metadata for regulatory audit trail.
 */
export const ThresholdBreachedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('iot.threshold.breached'),
  topic: z.literal(IOT_ALERTS_TOPIC),
  payload: z.object({
    threshold_id: z.string().uuid(),
    zone_id: ZoneIdSchema,
    sensor_type: SensorTypeEnum,
    triggered_value: z.number(),
    /** Configured min threshold value (null if only max is configured) */
    configured_min: z.number().nullable(),
    /** Configured max threshold value (null if only min is configured) */
    configured_max: z.number().nullable(),
    alert_level: AlertLevelEnum,
    triggered_at: z.string().datetime({ offset: true }),
    /** ALCOA+ — Attributable: who configured this threshold */
    threshold_created_by: z.string().uuid(),
    /** ALCOA+ — Contemporaneous: when the threshold was last updated */
    threshold_updated_at: z.string().datetime({ offset: true }),
    source_hash: z.string().regex(/^[0-9a-f]{64}$/),
  }),
});
export type ThresholdBreachedEvent = z.infer<typeof ThresholdBreachedEventSchema>;

// ─── THRESHOLD CREATED ───────────────────────────────────────────────────────
/**
 * Published when a new alert threshold is created by QUALITY_MANAGER+.
 */
export const ThresholdCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('iot.threshold.created'),
  topic: z.literal(IOT_ALERTS_TOPIC),
  payload: z.object({
    threshold_id: z.string().uuid(),
    zone_id: ZoneIdSchema,
    sensor_type: SensorTypeEnum,
    min_value: z.number().nullable(),
    max_value: z.number().nullable(),
    alert_level: AlertLevelEnum,
    created_by: z.string().uuid(),
  }),
});
export type ThresholdCreatedEvent = z.infer<typeof ThresholdCreatedEventSchema>;

// ─── THRESHOLD DEACTIVATED ───────────────────────────────────────────────────
/**
 * Published when a threshold is deactivated (soft-delete) by QUALITY_MANAGER+.
 */
export const ThresholdDeactivatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('iot.threshold.deactivated'),
  topic: z.literal(IOT_ALERTS_TOPIC),
  payload: z.object({
    threshold_id: z.string().uuid(),
    zone_id: ZoneIdSchema,
    sensor_type: SensorTypeEnum,
    deactivated_by: z.string().uuid(),
    deactivated_at: z.string().datetime({ offset: true }),
  }),
});
export type ThresholdDeactivatedEvent = z.infer<typeof ThresholdDeactivatedEventSchema>;

// ─── DISCRIMINATED UNION ─────────────────────────────────────────────────────
export const IotEventSchema = z.discriminatedUnion('eventType', [
  AlertTriggeredEventSchema,
  ThresholdBreachedEventSchema,
  ThresholdCreatedEventSchema,
  ThresholdDeactivatedEventSchema,
]);
export type IotEvent = z.infer<typeof IotEventSchema>;
