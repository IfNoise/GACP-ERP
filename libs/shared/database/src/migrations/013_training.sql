-- =============================================================================
-- Migration 013: Training — Courses, Executions, Certifications, Competency
-- EPIC 9 — Workforce & Training Management
-- Compliance: EU GMP Annex 11 §2, 21 CFR Part 11 §11.50
-- =============================================================================

-- ── Training Type ─────────────────────────────────────────────────────────────
CREATE TYPE training_type AS ENUM ('INITIAL', 'REFRESHER', 'ANNUAL_RECERTIFICATION');

-- ── Training Status ───────────────────────────────────────────────────────────
CREATE TYPE training_status AS ENUM (
  'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED'
);

-- ── Training Courses ──────────────────────────────────────────────────────────
CREATE TABLE training_courses (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        VARCHAR(10)   UNIQUE NOT NULL, -- CUR-NNN
  title            TEXT          NOT NULL,
  type             training_type NOT NULL,
  duration_hours   DECIMAL(5,2)  NOT NULL,
  passing_score    INTEGER       NOT NULL CHECK (passing_score BETWEEN 0 AND 100),
  applicable_roles JSONB         NOT NULL DEFAULT '[]',
  sop_references   JSONB         NOT NULL DEFAULT '[]',
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by       UUID          NOT NULL REFERENCES users(id),
  updated_by       UUID          NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX training_courses_course_id_idx ON training_courses(course_id);
CREATE        INDEX training_courses_type_idx      ON training_courses(type);
CREATE        INDEX training_courses_active_idx    ON training_courses(is_active);

-- ── Curriculum (Position → Required Courses mapping) ─────────────────────────
CREATE TABLE curriculum (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position   VARCHAR(255) NOT NULL,
  course_id  UUID         NOT NULL REFERENCES training_courses(id),
  is_required BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX curriculum_position_course_idx ON curriculum(position, course_id);

-- ── Competency Profiles ───────────────────────────────────────────────────────
CREATE TABLE competency_profiles (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  position         VARCHAR(255) UNIQUE NOT NULL,
  required_courses JSONB        NOT NULL DEFAULT '[]',
  minimum_scores   JSONB        NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by       UUID         NOT NULL REFERENCES users(id),
  updated_by       UUID         NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX competency_profiles_position_idx ON competency_profiles(position);

-- ── Back-fill employees.competency_profile_id FK ─────────────────────────────
ALTER TABLE employees
  ADD CONSTRAINT fk_employees_competency
  FOREIGN KEY (competency_profile_id)
  REFERENCES competency_profiles(id)
  ON DELETE SET NULL;

-- ── Training Executions ───────────────────────────────────────────────────────
-- Immutable once COMPLETED/FAILED (21 CFR Part 11 §11.10(e))
CREATE TABLE training_executions (
  id                   UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id            UUID            NOT NULL REFERENCES training_courses(id),
  trainee_id           UUID            NOT NULL REFERENCES employees(id),
  trainer_id           UUID            REFERENCES employees(id),
  status               training_status NOT NULL DEFAULT 'SCHEDULED',
  score                INTEGER         CHECK (score BETWEEN 0 AND 100),
  completed_at         TIMESTAMPTZ,
  electronic_signature JSONB,          -- 21 CFR Part 11 §11.50
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  created_by           UUID            NOT NULL REFERENCES users(id),
  updated_by           UUID            NOT NULL REFERENCES users(id)
);

CREATE INDEX training_exec_trainee_idx    ON training_executions(trainee_id);
CREATE INDEX training_exec_course_idx     ON training_executions(course_id);
CREATE INDEX training_exec_status_idx     ON training_executions(status);
CREATE INDEX training_exec_completed_idx  ON training_executions(completed_at);

-- ── Certifications ────────────────────────────────────────────────────────────
CREATE TABLE certifications (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          UUID        NOT NULL REFERENCES employees(id),
  course_id            UUID        NOT NULL REFERENCES training_courses(id),
  issued_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until          TIMESTAMPTZ NOT NULL,
  certificate_number   VARCHAR(20) UNIQUE NOT NULL, -- CERT-YYYY-NNNNNN
  electronic_signature JSONB       NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID        NOT NULL REFERENCES users(id),
  updated_by           UUID        NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX certifications_cert_number_idx    ON certifications(certificate_number);
CREATE        INDEX certifications_employee_idx        ON certifications(employee_id);
CREATE        INDEX certifications_course_idx          ON certifications(course_id);
CREATE        INDEX certifications_valid_until_idx     ON certifications(valid_until);
