-- EPIC 6: Quality Management — CAPAs
-- Migration: 004_capas.sql
-- Tables: capas, rca_findings, capa_action_plans, effectiveness_checks
--
-- Compliance: ICH Q10 §3.2, FDA 21 CFR §820.100, EU GMP Chapter 8
-- Prerequisite: 003_change_controls.sql (shares retention_class, validation_status enums)

-- ─── CAPA-specific Enums ──────────────────────────────────────────────────────

CREATE TYPE "public"."capa_type"   AS ENUM ('CORRECTIVE', 'PREVENTIVE');
CREATE TYPE "public"."capa_source" AS ENUM ('DEVIATION', 'AUDIT', 'COMPLAINT', 'TREND', 'INSPECTION');

CREATE TYPE "public"."capa_status" AS ENUM (
  'OPEN',
  'RCA_IN_PROGRESS',
  'ACTION_PLAN',
  'IMPLEMENTING',
  'EFFECTIVENESS_CHECK',
  'CLOSED'
);

CREATE TYPE "public"."root_cause_category" AS ENUM (
  'HUMAN_ERROR',
  'PROCESS_FAILURE',
  'EQUIPMENT_FAILURE',
  'MATERIAL_DEFECT',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'TRAINING_GAP',
  'SYSTEM_FAILURE',
  'UNKNOWN'
);

CREATE TYPE "public"."effectiveness_result" AS ENUM (
  'EFFECTIVE',
  'PARTIALLY_EFFECTIVE',
  'INEFFECTIVE'
);

-- ─── CAPAs ────────────────────────────────────────────────────────────────────
-- CAPA number: CA-YYYY-NNNN (system-generated sequence per year).

CREATE TABLE "capas" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "capa_number"           VARCHAR(20) UNIQUE NOT NULL,  -- CA-2026-0001
  "type"                  capa_type NOT NULL,
  "source"                capa_source NOT NULL,
  "status"                capa_status NOT NULL DEFAULT 'OPEN',
  "title"                 TEXT NOT NULL CHECK (char_length("title") BETWEEN 3 AND 500),
  "description"           TEXT NOT NULL CHECK (char_length("description") >= 10),
  "root_cause_category"   root_cause_category,
  -- Polymorphic FK to the triggering record (deviation, audit finding, etc.)
  "source_record_type"    VARCHAR(50),
  "source_record_id"      UUID,
  "due_date"              DATE,
  "assigned_to"           UUID REFERENCES "users"("id"),
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

CREATE SEQUENCE IF NOT EXISTS "capa_seq" START 1 INCREMENT 1;

CREATE INDEX "capa_status_idx"      ON "capas" ("status");
CREATE INDEX "capa_type_idx"        ON "capas" ("type");
CREATE INDEX "capa_assigned_idx"    ON "capas" ("assigned_to");
CREATE INDEX "capa_due_date_idx"    ON "capas" ("due_date");
CREATE INDEX "capa_source_rec_idx"  ON "capas" ("source_record_type", "source_record_id");

-- ─── RCA Findings ─────────────────────────────────────────────────────────────
-- Root Cause Analysis — created when CAPA transitions to RCA_IN_PROGRESS.

CREATE TABLE "rca_findings" (
  "id"                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "capa_id"                      UUID NOT NULL REFERENCES "capas"("id") ON DELETE CASCADE,
  "root_cause_category"          root_cause_category NOT NULL,
  "root_cause_description"       TEXT NOT NULL CHECK (char_length("root_cause_description") >= 10),
  "contributing_factors"         JSONB NOT NULL DEFAULT '[]',
  "immediate_actions_taken"      TEXT,
  "investigated_by"              UUID NOT NULL REFERENCES "users"("id"),
  "investigated_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "rca_capa_idx" ON "rca_findings" ("capa_id");

-- ─── CAPA Action Plans ────────────────────────────────────────────────────────
-- Individual action items created when transitioning to ACTION_PLAN status.

CREATE TABLE "capa_action_plans" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "capa_id"           UUID NOT NULL REFERENCES "capas"("id") ON DELETE CASCADE,
  "description"       TEXT NOT NULL CHECK (char_length("description") >= 5),
  "responsible_person" UUID NOT NULL REFERENCES "users"("id"),
  "target_date"       DATE NOT NULL,
  "completed_at"      TIMESTAMPTZ,
  "completion_notes"  TEXT,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "cap_capa_idx" ON "capa_action_plans" ("capa_id");
CREATE INDEX "cap_responsible_idx" ON "capa_action_plans" ("responsible_person");

-- ─── Effectiveness Checks ─────────────────────────────────────────────────────
-- Required before CAPA can be CLOSED (EFFECTIVENESS_CHECK → CLOSED).

CREATE TABLE "effectiveness_checks" (
  "id"                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "capa_id"                  UUID NOT NULL REFERENCES "capas"("id") ON DELETE CASCADE,
  "result"                   effectiveness_result NOT NULL,
  "evidence_description"     TEXT NOT NULL CHECK (char_length("evidence_description") >= 10),
  "check_date"               DATE NOT NULL,
  "checked_by"               UUID NOT NULL REFERENCES "users"("id"),
  -- If INEFFECTIVE: link to follow-up CAPA
  "follow_up_capa_id"        UUID REFERENCES "capas"("id"),
  -- Electronic signature required
  "electronic_signature"     JSONB NOT NULL,
  "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "ec_capa_idx"     ON "effectiveness_checks" ("capa_id");
CREATE INDEX "ec_checked_idx"  ON "effectiveness_checks" ("checked_by");

-- ─── Trigger: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION "update_capas_updated_at"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER "capas_updated_at"
  BEFORE UPDATE ON "capas"
  FOR EACH ROW EXECUTE FUNCTION "update_capas_updated_at"();
