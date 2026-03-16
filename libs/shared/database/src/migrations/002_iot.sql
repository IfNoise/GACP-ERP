-- EPIC 5: IoT & Environmental Monitoring
-- Migration: 002_iot.sql
-- Creates tables for alert thresholds and alert history.
-- Raw sensor readings are stored in VictoriaMetrics IoT (time-series DB).
-- Only alert metadata and configuration is persisted in PostgreSQL.

-- ─── Alert Level Enum ─────────────────────────────────────────────────────────
CREATE TYPE "public"."alert_level" AS ENUM('WARNING', 'CRITICAL');

-- ─── Alert Thresholds ─────────────────────────────────────────────────────────
-- Configurable per zone + sensor type.
-- Managed by QUALITY_MANAGER+ role (AuditLevel: FULL).
-- Changes create an audit trail entry and publish ThresholdCreatedEvent to Kafka.
CREATE TABLE "alert_thresholds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "zone_id" uuid NOT NULL REFERENCES "zones"("id"),
  "sensor_type" varchar(50) NOT NULL
    CHECK (sensor_type IN (
      'TEMPERATURE','HUMIDITY','CO2','LIGHT_INTENSITY','LIGHT_SPECTRUM',
      'SOIL_MOISTURE','SOIL_PH','SOIL_EC','AIR_PRESSURE','VOC',
      'WATER_PH','WATER_EC','WATER_TEMPERATURE','POWER_CONSUMPTION'
    )),
  "min_value" numeric(10, 4),
  "max_value" numeric(10, 4),
  "alert_level" "alert_level" NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" uuid NOT NULL,
  "updated_by" uuid NOT NULL,
  CONSTRAINT "alert_thresholds_min_or_max_required"
    CHECK (min_value IS NOT NULL OR max_value IS NOT NULL)
);

CREATE INDEX "alert_thresholds_zone_idx" ON "alert_thresholds" ("zone_id");
CREATE INDEX "alert_thresholds_active_idx" ON "alert_thresholds" ("is_active");
CREATE INDEX "alert_thresholds_zone_sensor_idx" ON "alert_thresholds" ("zone_id", "sensor_type");

-- ─── Alert History ────────────────────────────────────────────────────────────
-- Immutable record of every alert triggered by AlertEvaluationService cron.
-- ALCOA+: source_hash ensures data integrity (Accurate + Original).
-- Records are never deleted — soft-archival via retention policies only.
CREATE TABLE "alert_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "threshold_id" uuid NOT NULL REFERENCES "alert_thresholds"("id"),
  "zone_id" uuid NOT NULL REFERENCES "zones"("id"),
  "sensor_type" varchar(50) NOT NULL,
  "triggered_value" numeric(10, 4) NOT NULL,
  "alert_level" "alert_level" NOT NULL,
  "triggered_at" timestamp with time zone NOT NULL,
  "acknowledged" boolean NOT NULL DEFAULT false,
  "acknowledged_by" uuid,
  "acknowledged_at" timestamp with time zone,
  -- SHA-256 of (threshold_id || ':' || triggered_value || ':' || triggered_at ISO8601)
  -- Provides ALCOA+ data integrity proof without ImmuDB overhead for raw readings.
  "source_hash" varchar(64) NOT NULL
);

CREATE INDEX "alert_history_zone_idx" ON "alert_history" ("zone_id");
CREATE INDEX "alert_history_triggered_at_idx" ON "alert_history" ("triggered_at");
CREATE INDEX "alert_history_acknowledged_idx" ON "alert_history" ("acknowledged");
CREATE INDEX "alert_history_threshold_idx" ON "alert_history" ("threshold_id");

-- ─── Trigger: auto-update updated_at on alert_thresholds ─────────────────────
CREATE OR REPLACE FUNCTION update_alert_thresholds_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER alert_thresholds_updated_at
  BEFORE UPDATE ON alert_thresholds
  FOR EACH ROW EXECUTE FUNCTION update_alert_thresholds_updated_at();
