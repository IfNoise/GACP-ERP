-- EPIC 6: Quality Management — Deviations
-- Migration: 005_deviations.sql
-- Tables: deviations, deviation_investigations
--
-- Compliance: EU GMP Chapter 8, ICH Q10 §3.1, FDA 21 CFR §211.192, ALCOA+
-- Prerequisite: 003_change_controls.sql (shares retention_class, validation_status enums)
--               004_capas.sql (FK to capas.id)

-- ─── Deviation-specific Enums ─────────────────────────────────────────────────

CREATE TYPE "public"."deviation_classification" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

CREATE TYPE "public"."deviation_category" AS ENUM (
  'PROCESS',
  'EQUIPMENT',
  'MATERIAL',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'PERSONNEL',
  'UTILITY'
);

CREATE TYPE "public"."deviation_status" AS ENUM (
  'REPORTED',
  'UNDER_INVESTIGATION',
  'IMPACT_ASSESSED',
  'CAPA_INITIATED',
  'CLOSED'
);

-- ─── Deviations ───────────────────────────────────────────────────────────────
-- Deviation number: DEV-YYYY-NNNN (system-generated sequence per year).

CREATE TABLE "deviations" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviation_number"      VARCHAR(20) UNIQUE NOT NULL,  -- DEV-2026-0001
  "classification"        deviation_classification NOT NULL,
  "category"              deviation_category NOT NULL,
  "status"                deviation_status NOT NULL DEFAULT 'REPORTED',
  "title"                 TEXT NOT NULL CHECK (char_length("title") BETWEEN 3 AND 500),
  "description"           TEXT NOT NULL CHECK (char_length("description") >= 10),
  "location"              VARCHAR(300),
  -- Denormalized batch references (source of truth: deviation_batch_links)
  "batch_ids"             JSONB NOT NULL DEFAULT '[]',
  "occurred_at"           TIMESTAMPTZ,
  "reported_by"           UUID NOT NULL REFERENCES "users"("id"),
  -- Set when status transitions to CAPA_INITIATED
  "linked_capa_id"        UUID REFERENCES "capas"("id"),
  -- Product impact summary (populated during investigation)
  "product_impact"        TEXT,
  -- 21 CFR Part 11 §11.50: signature captured at CLOSED transition
  "electronic_signature"  JSONB,
  -- GxP Validation Fields
  "validation_status"     validation_status NOT NULL DEFAULT 'unvalidated',
  "validation_protocol_id" UUID,
  "last_validated_at"     TIMESTAMPTZ,
  "next_review_date"      DATE,
  "retention_class"       retention_class NOT NULL DEFAULT '7_YEAR',
  "audit_tx_id"           VARCHAR(200),
  -- Audit columns
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by"            UUID NOT NULL REFERENCES "users"("id"),
  "updated_by"            UUID NOT NULL REFERENCES "users"("id")
);

CREATE SEQUENCE IF NOT EXISTS "deviation_seq" START 1 INCREMENT 1;

CREATE INDEX "dev_status_idx"         ON "deviations" ("status");
CREATE INDEX "dev_classification_idx" ON "deviations" ("classification");
CREATE INDEX "dev_category_idx"       ON "deviations" ("category");
CREATE INDEX "dev_reported_by_idx"    ON "deviations" ("reported_by");
CREATE INDEX "dev_occurred_at_idx"    ON "deviations" ("occurred_at");
CREATE INDEX "dev_capa_idx"           ON "deviations" ("linked_capa_id");

-- ─── Deviation Investigations ─────────────────────────────────────────────────
-- Formal investigation record — created when transitioning to UNDER_INVESTIGATION.
-- Electronic signature required.

CREATE TABLE "deviation_investigations" (
  "id"                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deviation_id"                    UUID NOT NULL REFERENCES "deviations"("id") ON DELETE CASCADE,
  "investigator_id"                 UUID NOT NULL REFERENCES "users"("id"),
  "investigation_summary"           TEXT NOT NULL CHECK (char_length("investigation_summary") >= 10),
  "immediate_containment_actions"   TEXT NOT NULL,
  "product_impact_assessment"      TEXT NOT NULL,
  -- UUIDs of affected batches (denormalized for query convenience)
  "batches_affected"               JSONB NOT NULL DEFAULT '[]',
  "investigated_at"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 21 CFR Part 11 §11.50 compliant signature
  "electronic_signature"           JSONB
);

CREATE INDEX "di_deviation_idx"         ON "deviation_investigations" ("deviation_id");
CREATE INDEX "di_investigator_idx"       ON "deviation_investigations" ("investigator_id");
CREATE INDEX "di_investigated_at_idx"   ON "deviation_investigations" ("investigated_at");

-- ─── Trigger: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION "update_deviations_updated_at"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER "deviations_updated_at"
  BEFORE UPDATE ON "deviations"
  FOR EACH ROW EXECUTE FUNCTION "update_deviations_updated_at"();
