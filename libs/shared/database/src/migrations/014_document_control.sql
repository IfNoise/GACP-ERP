-- =============================================================================
-- Migration 014: Document Control — Documents, Versions
-- EPIC 9 — Document Management (Mayan-EDMS integration)
-- Compliance: EU GMP Annex 11 §7, 21 CFR Part 11 §11.10(a)
-- =============================================================================

-- ── Document Status ───────────────────────────────────────────────────────────
CREATE TYPE document_status AS ENUM (
  'DRAFT', 'UNDER_REVIEW', 'APPROVED', 'EFFECTIVE', 'SUPERSEDED', 'OBSOLETE'
);

-- ── Document Type ─────────────────────────────────────────────────────────────
CREATE TYPE document_type AS ENUM (
  'SOP', 'FORM', 'REPORT', 'PROTOCOL', 'POLICY', 'WORK_INSTRUCTION', 'SPECIFICATION'
);

-- ── Documents ─────────────────────────────────────────────────────────────────
CREATE TABLE documents (
  id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number   VARCHAR(50)     UNIQUE NOT NULL,
  title             TEXT            NOT NULL,
  type              document_type   NOT NULL,
  status            document_status NOT NULL DEFAULT 'DRAFT',
  current_version   VARCHAR(10)     NOT NULL DEFAULT '1.0',
  /** Mayan-EDMS document ID — for binary file storage */
  mayan_document_id INTEGER,
  retention_class   VARCHAR(20)     NOT NULL DEFAULT '7_YEAR'
    CHECK (retention_class IN ('PERMANENT', '7_YEAR', '30_YEAR')),
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  created_by        UUID            NOT NULL REFERENCES users(id),
  updated_by        UUID            NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX documents_number_idx    ON documents(document_number);
CREATE        INDEX documents_type_idx      ON documents(type);
CREATE        INDEX documents_status_idx    ON documents(status);

-- ── Document Versions ─────────────────────────────────────────────────────────
-- Each version is immutable once approved (21 CFR Part 11 §11.10(e))
CREATE TABLE document_versions (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id          UUID        NOT NULL REFERENCES documents(id),
  version              VARCHAR(10) NOT NULL,
  change_summary       TEXT        NOT NULL,
  approved_by          UUID        REFERENCES users(id),
  electronic_signature JSONB,       -- required for APPROVED status
  effective_date       DATE,
  superseded_at        TIMESTAMPTZ,
  /** Mayan-EDMS version ID */
  mayan_version_id     INTEGER,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID        NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX doc_versions_doc_version_idx ON document_versions(document_id, version);
CREATE        INDEX doc_versions_document_idx    ON document_versions(document_id);
CREATE        INDEX doc_versions_effective_idx   ON document_versions(effective_date);
