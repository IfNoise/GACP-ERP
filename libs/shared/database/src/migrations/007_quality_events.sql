-- ─── EPIC 7 — Quality Events ──────────────────────────────────────────────────
-- Migration: 007_quality_events.sql
-- Compliant with: ICH Q10 §3.1, FDA 21 CFR Part 820.100, EU GMP Chapter 1
-- ─────────────────────────────────────────────────────────────────────────────

-- Sequence for QE-YYYY-NNNN numbering
CREATE SEQUENCE IF NOT EXISTS quality_events_seq START 1;

CREATE TABLE IF NOT EXISTS quality_events (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_number          VARCHAR(20)   UNIQUE NOT NULL,
  type                  VARCHAR(30)   NOT NULL
                          CHECK (type IN ('COMPLAINT','AUDIT_FINDING','INSPECTION_OBSERVATION','QUALITY_ISSUE')),
  severity              VARCHAR(10)   NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status                VARCHAR(20)   NOT NULL DEFAULT 'OPEN'
                          CHECK (status IN ('OPEN','INVESTIGATING','CAPA_INITIATED','CLOSED')),
  title                 TEXT          NOT NULL,
  description           TEXT          NOT NULL,
  -- Optional FK to CAPA if one was initiated for this event
  capa_id               UUID          REFERENCES capas(id) ON DELETE SET NULL,
  electronic_signature  JSONB,
  -- GxP Validation Fields
  validation_status     VARCHAR(20)   NOT NULL DEFAULT 'unvalidated'
                          CHECK (validation_status IN ('unvalidated','validated','under_review','superseded')),
  validation_protocol_id UUID          REFERENCES validation_protocols(id) ON DELETE SET NULL,
  last_validated_at     TIMESTAMPTZ,
  next_review_date      DATE,
  retention_class       VARCHAR(20)   NOT NULL DEFAULT '7_YEAR'
                          CHECK (retention_class IN ('PERMANENT','7_YEAR','30_YEAR')),
  audit_tx_id           VARCHAR(200),
  -- Base entity audit columns
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by            UUID          NOT NULL REFERENCES users(id),
  updated_by            UUID          NOT NULL REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS qe_status_idx      ON quality_events(status);
CREATE INDEX IF NOT EXISTS qe_type_idx        ON quality_events(type);
CREATE INDEX IF NOT EXISTS qe_severity_idx    ON quality_events(severity);
CREATE INDEX IF NOT EXISTS qe_capa_idx        ON quality_events(capa_id);
CREATE INDEX IF NOT EXISTS qe_created_at_idx  ON quality_events(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS qe_number_idx ON quality_events(event_number);

-- ─── Linked Records (polymorphic junction) ───────────────────────────────────
-- Cross-module traceability: quality_events ↔ change_controls | capas | deviations
-- Also: quality_events ↔ validation_protocols (via linked_records)
-- per ICH Q10 §3.2 — Corrective and Preventive Action (CAPA) system

CREATE TABLE IF NOT EXISTS linked_records (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  quality_event_id  UUID          NOT NULL REFERENCES quality_events(id) ON DELETE CASCADE,
  record_type       VARCHAR(30)   NOT NULL
                      CHECK (record_type IN ('change_control','capa','deviation')),
  record_id         UUID          NOT NULL,
  linked_by         UUID          NOT NULL REFERENCES users(id),
  linked_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (quality_event_id, record_type, record_id)
);

CREATE INDEX IF NOT EXISTS lr_event_idx       ON linked_records(quality_event_id);
CREATE INDEX IF NOT EXISTS lr_record_type_idx ON linked_records(record_type, record_id);
