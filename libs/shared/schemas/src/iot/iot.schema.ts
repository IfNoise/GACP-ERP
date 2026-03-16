import { z } from 'zod';

import { UserIdSchema, FacilityIdSchema, ZoneIdSchema } from '../common/branded-ids';

// ─── SENSOR TYPES ─────────────────────────────────────────────────────────────
export const SensorTypeEnum = z.enum([
  'TEMPERATURE',
  'HUMIDITY',
  'CO2',
  'LIGHT_INTENSITY',
  'LIGHT_SPECTRUM',
  'SOIL_MOISTURE',
  'SOIL_PH',
  'SOIL_EC', // Electrical conductivity
  'AIR_PRESSURE',
  'VOC',
  'WATER_PH',
  'WATER_EC',
  'WATER_TEMPERATURE',
  'POWER_CONSUMPTION',
]);
export type SensorType = z.infer<typeof SensorTypeEnum>;

// ─── SENSOR ──────────────────────────────────────────────────────────────────
export const SensorSchema = z.object({
  id: z.string().uuid(),
  /** Physical device identifier (MAC address or serial) */
  device_id: z.string().min(1).max(100),
  sensor_type: SensorTypeEnum,
  facility_id: FacilityIdSchema,
  zone_id: ZoneIdSchema,
  /** Human-readable sensor name */
  name: z.string().min(1).max(200),
  /** Unit of measurement (°C, %, ppm, lux, etc.) */
  unit: z.string().min(1).max(20),
  is_active: z.boolean().default(true),
  /** Calibration date (ISO 8601) */
  last_calibrated_at: z.string().datetime({ offset: true }).nullable(),
  /** Next calibration due date */
  calibration_due_at: z.string().datetime({ offset: true }).nullable(),
  /** Min/max valid range for this sensor */
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  /** Alert thresholds */
  alert_min: z.number().optional(),
  alert_max: z.number().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
export type Sensor = z.infer<typeof SensorSchema>;

// ─── SENSOR READING ──────────────────────────────────────────────────────────
/**
 * Individual sensor measurement.
 * Stored in VictoriaMetrics time-series database.
 * Also published to Kafka topic `iot.sensors.v1`.
 */
export const SensorReadingSchema = z.object({
  id: z.string().uuid(),
  sensor_id: z.string().uuid(),
  sensor_type: SensorTypeEnum,
  facility_id: FacilityIdSchema,
  zone_id: ZoneIdSchema,
  /** The measurement value */
  value: z.number(),
  /** Unit of measurement */
  unit: z.string().min(1).max(20),
  /** When the reading was captured by the sensor */
  captured_at: z.string().datetime({ offset: true }),
  /** When the reading was received by the system */
  received_at: z.string().datetime({ offset: true }),
  /** Whether this reading triggered an alert */
  is_alert: z.boolean().default(false),
  /** Alert message if triggered */
  alert_message: z.string().max(500).optional(),
  /** Quality flag: 0 = valid, 1 = questionable, 2 = invalid */
  quality_flag: z.enum(['0', '1', '2']).default('0'),
  /** Sensor firmware version at time of reading */
  firmware_version: z.string().max(50).optional(),
});
export type SensorReading = z.infer<typeof SensorReadingSchema>;

// ─── ENVIRONMENT DATA (AGGREGATED) ───────────────────────────────────────────
/**
 * Aggregated environmental snapshot for a zone.
 * Computed from sensor readings over a time window.
 */
export const EnvironmentDataSchema = z.object({
  zone_id: ZoneIdSchema,
  facility_id: FacilityIdSchema,
  /** Start of aggregation window */
  window_start: z.string().datetime({ offset: true }),
  /** End of aggregation window */
  window_end: z.string().datetime({ offset: true }),
  /** Temperature stats */
  temperature_celsius: z
    .object({
      min: z.number(),
      max: z.number(),
      avg: z.number(),
      stddev: z.number(),
    })
    .optional(),
  /** Relative humidity stats */
  humidity_percent: z
    .object({
      min: z.number(),
      max: z.number(),
      avg: z.number(),
    })
    .optional(),
  /** CO2 concentration stats */
  co2_ppm: z
    .object({
      min: z.number(),
      max: z.number(),
      avg: z.number(),
    })
    .optional(),
  /** VPD — Vapour Pressure Deficit (computed from temp + humidity) */
  vpd_kpa: z.number().optional(),
  /** Number of alert events in this window */
  alert_count: z.number().int().nonnegative().default(0),
});
export type EnvironmentData = z.infer<typeof EnvironmentDataSchema>;

// ─── ALERT LEVEL ─────────────────────────────────────────────────────────────
export const AlertLevelEnum = z.enum(['WARNING', 'CRITICAL']);
export type AlertLevel = z.infer<typeof AlertLevelEnum>;

// ─── ALERT THRESHOLD ─────────────────────────────────────────────────────────
/**
 * Configurable threshold for a sensor type within a zone.
 * When exceeded, triggers an AlertTriggeredEvent on Kafka topic iot.alerts.v1.
 * Managed by QUALITY_MANAGER+ role only.
 * ALCOA+: Attributable (created_by), Contemporaneous (created_at).
 */
export const AlertThresholdSchema = z.object({
  id: z.string().uuid(),
  zone_id: ZoneIdSchema,
  sensor_type: SensorTypeEnum,
  /** Lower bound — values below this trigger an alert (null = no lower bound) */
  min_value: z.number().nullable(),
  /** Upper bound — values above this trigger an alert (null = no upper bound) */
  max_value: z.number().nullable(),
  alert_level: AlertLevelEnum,
  /** Whether this threshold is currently active */
  is_active: z.boolean().default(true),
  created_by: UserIdSchema,
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  updated_by: UserIdSchema,
});
export type AlertThreshold = z.infer<typeof AlertThresholdSchema>;

export const CreateAlertThresholdSchema = AlertThresholdSchema.omit({
  id: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  updated_by: true,
});
export type CreateAlertThreshold = z.infer<typeof CreateAlertThresholdSchema>;

// ─── ALERT HISTORY ───────────────────────────────────────────────────────────
/**
 * Persistent record of a triggered alert.
 * Stored in PostgreSQL for audit trail and regulatory reporting.
 */
export const AlertHistorySchema = z.object({
  id: z.string().uuid(),
  threshold_id: z.string().uuid(),
  zone_id: ZoneIdSchema,
  sensor_type: SensorTypeEnum,
  /** The value that triggered the alert */
  triggered_value: z.number(),
  alert_level: AlertLevelEnum,
  /** When the alert was detected */
  triggered_at: z.string().datetime({ offset: true }),
  /** Whether the alert has been acknowledged */
  acknowledged: z.boolean().default(false),
  acknowledged_by: UserIdSchema.nullable().optional(),
  acknowledged_at: z.string().datetime({ offset: true }).nullable().optional(),
  /** SHA-256 hash of (threshold_id + triggered_value + triggered_at) for integrity */
  source_hash: z.string().regex(/^[0-9a-f]{64}$/, { message: 'source_hash must be SHA-256 hex' }),
});
export type AlertHistory = z.infer<typeof AlertHistorySchema>;

// ─── VICTORIAMETRICS QUERY RESULT ────────────────────────────────────────────
/**
 * Parsed result from VictoriaMetrics instant query (/api/v1/query).
 */
export const VmInstantQueryResultSchema = z.object({
  metric: z.record(z.string()),
  value: z.tuple([z.number(), z.string()]),
});

export const VmRangeQueryResultSchema = z.object({
  metric: z.record(z.string()),
  values: z.array(z.tuple([z.number(), z.string()])),
});

export const VmQueryResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    resultType: z.enum(['matrix', 'vector', 'scalar', 'string']),
    result: z.array(z.union([VmInstantQueryResultSchema, VmRangeQueryResultSchema])),
  }),
});
export type VmQueryResponse = z.infer<typeof VmQueryResponseSchema>;
