-- ─── IFC Integration: Revision Lifecycle Table ───────────────────────────────
-- ALCOA+: hard deletes forbidden, status_history JSONB keeps full audit trail.
-- References: RFC IFC Deep Integration v0.3 / ADR-001

CREATE TYPE ifc_revision_status AS ENUM (
  'uploaded',
  'parsed',
  'diff_ready',
  'pending_approval',
  'approved',
  'rejected',
  'projected',
  'failed'
);

CREATE TABLE ifc_revisions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id          VARCHAR(255) NOT NULL,
  source_file_uri   TEXT         NOT NULL,
  source_file_hash  VARCHAR(64)  NOT NULL,
  status            ifc_revision_status NOT NULL DEFAULT 'uploaded',
  manifest_uri      TEXT,
  change_summary    TEXT,
  change_control_id VARCHAR(100),
  approved_by       JSONB        NOT NULL DEFAULT '[]'::jsonb,
  approved_at       TIMESTAMPTZ,
  status_history    JSONB        NOT NULL DEFAULT '[]'::jsonb,
  uploaded_by       UUID         NOT NULL REFERENCES users(id),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ifc_revisions_model_id_idx   ON ifc_revisions (model_id);
CREATE INDEX ifc_revisions_status_idx     ON ifc_revisions (status);
CREATE INDEX ifc_revisions_hash_idx       ON ifc_revisions (source_file_hash);
