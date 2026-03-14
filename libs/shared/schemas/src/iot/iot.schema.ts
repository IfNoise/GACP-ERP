import { z } from 'zod';

import { FacilityIdSchema, ZoneIdSchema } from '../common/branded-ids';

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
