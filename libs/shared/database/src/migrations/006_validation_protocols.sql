-- ─── EPIC 7 — Validation Protocols ──────────────────────────────────────────
-- Migration: 006_validation_protocols.sql
-- Compliant with: GAMP 5 §5.4, EU GMP Annex 11 §4.7, FDA 21 CFR Part 211.68
-- All validation records must be retained PERMANENTLY per EU GMP Annex 11 §17
-- ─────────────────────────────────────────────────────────────────────────────

-- Sequence for VAL-YYYY-NNNN numbering
CREATE SEQUENCE IF NOT EXISTS validation_protocols_seq START 1;

CREATE TABLE IF NOT EXISTS validation_protocols (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_number       VARCHAR(20)   UNIQUE NOT NULL,
  type                  VARCHAR(5)    NOT NULL CHECK (type IN ('IQ', 'OQ', 'PQ')),
  status                VARCHAR(20)   NOT NULL DEFAULT 'DRAFT'
                          CHECK (status IN ('DRAFT','REVIEW','APPROVED','EXECUTING','COMPLETED','CLOSED','SUPERSEDED')),
  system_under_test     TEXT          NOT NULL,
  change_control_id     UUID          REFERENCES change_controls(id) ON DELETE SET NULL,
  electronic_signature  JSONB,
  -- GxP Validation Fields (GAMP 5 / EU GMP Annex 11 §4.8)
  validation_status     VARCHAR(20)   NOT NULL DEFAULT 'unvalidated'
                          CHECK (validation_status IN ('unvalidated','validated','under_review','superseded')),
  validation_protocol_id UUID,   -- self-reference: which protocol validated this protocol
  last_validated_at     TIMESTAMPTZ,
  next_review_date      DATE,
  retention_class       VARCHAR(20)   NOT NULL DEFAULT 'PERMANENT'
                          CHECK (retention_class IN ('PERMANENT','7_YEAR','30_YEAR')),
  audit_tx_id           VARCHAR(200),
  -- Base entity audit columns
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by            UUID          NOT NULL REFERENCES users(id),
  updated_by            UUID          NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS vp_status_idx           ON validation_protocols(status);
CREATE INDEX IF NOT EXISTS vp_type_idx             ON validation_protocols(type);
CREATE INDEX IF NOT EXISTS vp_change_control_idx   ON validation_protocols(change_control_id);
CREATE INDEX IF NOT EXISTS vp_created_at_idx       ON validation_protocols(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS vp_number_idx    ON validation_protocols(protocol_number);

-- ─── Validation Test Steps ─────────────────────────────────────────────────────
-- Append-only per step number per protocol.
-- Step status is updated in-place during EXECUTING phase (allowed by GAMP 5).

CREATE TABLE IF NOT EXISTS validation_tests (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id           UUID          NOT NULL REFERENCES validation_protocols(id) ON DELETE CASCADE,
  step_number           INTEGER       NOT NULL,
  description           TEXT          NOT NULL,
  expected_result       TEXT          NOT NULL,
  actual_result         TEXT,
  status                VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING','PASS','FAIL','NOT_APPLICABLE')),
  -- FAIL or NOT_APPLICABLE requires exception_note documenting the deviation
  exception_note        TEXT,
  executed_by           UUID          REFERENCES users(id),
  executed_at           TIMESTAMPTZ,
  electronic_signature  JSONB,
  UNIQUE (protocol_id, step_number)
);

CREATE INDEX IF NOT EXISTS vt_protocol_idx    ON validation_tests(protocol_id);
CREATE INDEX IF NOT EXISTS vt_status_idx      ON validation_tests(status);
CREATE INDEX IF NOT EXISTS vt_executed_by_idx ON validation_tests(executed_by);
