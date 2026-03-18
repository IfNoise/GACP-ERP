-- EPIC 6: Quality Management — Change Control
-- Migration: 003_change_controls.sql
-- Tables: change_controls, change_impacts, change_approvals
--
-- Compliance: ICH Q10, EU GMP Annex 11, 21 CFR Part 11, ALCOA+
-- Electronic signatures required for: APPROVED, REJECTED, VERIFIED transitions.
-- All records are immutable AFTER approval (audit_tx_id binds to ImmuDB).

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "public"."change_control_status" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'IMPACT_ASSESSED',
  'APPROVED',
  'REJECTED',
  'IMPLEMENTING',
  'VERIFIED',
  'CLOSED'
);

CREATE TYPE "public"."change_type" AS ENUM ('MINOR', 'MAJOR', 'EMERGENCY');

CREATE TYPE "public"."impact_risk_level" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "public"."approval_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE "public"."retention_class" AS ENUM ('PERMANENT', '7_YEAR', '30_YEAR');

CREATE TYPE "public"."validation_status" AS ENUM (
  'unvalidated',
  'validated',
  'under_review',
  'superseded'
);

-- ─── Change Controls ──────────────────────────────────────────────────────────
-- Primary regulatory change management record.
-- CCN number: CCN-YYYY-NNNN (system-generated sequence per year).
-- electronic_signature JSONB: stored at APPROVED and VERIFIED transitions.

CREATE TABLE "change_controls" (
  "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ccn_number"              VARCHAR(20) UNIQUE NOT NULL,  -- CCN-2026-0001
  "title"                   TEXT NOT NULL
    CHECK (char_length("title") BETWEEN 3 AND 500),
  "description"             TEXT NOT NULL
    CHECK (char_length("description") >= 10),
  "change_type"             change_type NOT NULL,
  "status"                  change_control_status NOT NULL DEFAULT 'DRAFT',
  "requestor_id"            UUID NOT NULL REFERENCES "users"("id"),
  -- 21 CFR Part 11 §11.50: signature captured at APPROVED transition
  "electronic_signature"    JSONB,
  -- GxP Validation Fields (GAMP 5)
  "validation_status"       validation_status NOT NULL DEFAULT 'unvalidated',
  "validation_protocol_id"  UUID,                         -- FK to validation_protocols (EPIC 7)
  "last_validated_at"       TIMESTAMPTZ,
  "next_review_date"        DATE,
  "retention_class"         retention_class NOT NULL DEFAULT '7_YEAR',
  -- ImmuDB TX-id (written after first approved signature) — ALCOA+ Enduring
  "audit_tx_id"             VARCHAR(200),
  -- Audit columns
  "created_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_by"              UUID NOT NULL REFERENCES "users"("id"),
  "updated_by"              UUID NOT NULL REFERENCES "users"("id")
);

CREATE INDEX "cc_status_idx"       ON "change_controls" ("status");
CREATE INDEX "cc_requestor_idx"    ON "change_controls" ("requestor_id");
CREATE INDEX "cc_type_idx"         ON "change_controls" ("change_type");
CREATE INDEX "cc_created_at_idx"   ON "change_controls" ("created_at");
CREATE INDEX "cc_ccn_number_idx"   ON "change_controls" ("ccn_number");

-- ─── Sequence for CCN numbering ───────────────────────────────────────────────
-- Used by the application to generate CCN-YYYY-NNNN numbers.
CREATE SEQUENCE IF NOT EXISTS "change_control_seq" START 1 INCREMENT 1;

-- ─── Change Impacts ───────────────────────────────────────────────────────────
-- At least one impact assessment required before IMPACT_ASSESSED transition.

CREATE TABLE "change_impacts" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "change_control_id"     UUID NOT NULL REFERENCES "change_controls"("id") ON DELETE CASCADE,
  "area"                  VARCHAR(100) NOT NULL,
  "impact_description"    TEXT NOT NULL,
  "risk_level"            impact_risk_level NOT NULL,
  "assessed_by"           UUID NOT NULL REFERENCES "users"("id"),
  "assessed_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "ci_change_control_idx" ON "change_impacts" ("change_control_id");
CREATE INDEX "ci_risk_level_idx"     ON "change_impacts" ("risk_level");

-- ─── Change Approvals ─────────────────────────────────────────────────────────
-- Stores per-approver decisions with electronic signatures.
-- approval_level allows multi-level approval workflows (L1, L2, L3...).

CREATE TABLE "change_approvals" (
  "id"                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "change_control_id"     UUID NOT NULL REFERENCES "change_controls"("id") ON DELETE CASCADE,
  "approver_id"           UUID NOT NULL REFERENCES "users"("id"),
  "approval_level"        INTEGER NOT NULL CHECK ("approval_level" >= 1),
  "status"                approval_status NOT NULL DEFAULT 'PENDING',
  -- electronic_signature NOT NULL when status = 'APPROVED' or 'REJECTED'
  "electronic_signature"  JSONB,
  "decided_at"            TIMESTAMPTZ,
  -- justification/rejection reason stored in signature JSONB or here
  "decision_notes"        TEXT,
  UNIQUE ("change_control_id", "approver_id")
);

CREATE INDEX "ca_change_control_idx" ON "change_approvals" ("change_control_id");
CREATE INDEX "ca_approver_idx"       ON "change_approvals" ("approver_id");
CREATE INDEX "ca_status_idx"         ON "change_approvals" ("status");

-- ─── Trigger: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION "update_change_controls_updated_at"()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER "change_controls_updated_at"
  BEFORE UPDATE ON "change_controls"
  FOR EACH ROW EXECUTE FUNCTION "update_change_controls_updated_at"();
