-- =============================================================================
-- Migration 012: Workforce — Employees, Tasks, Time Entries
-- EPIC 9 — Workforce & Task Management
-- Compliance: EU GMP Annex 11 §2 (Personnel Qualification)
-- =============================================================================

-- ── Employee Task Priority ───────────────────────────────────────────────────
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- ── Task Status ───────────────────────────────────────────────────────────────
CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE');

-- ── Time Entry Source ─────────────────────────────────────────────────────────
CREATE TYPE time_entry_source AS ENUM ('TERMINAL', 'WEB', 'API');

-- ── Employees ─────────────────────────────────────────────────────────────────
CREATE TABLE employees (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number       VARCHAR(12)   UNIQUE NOT NULL, -- EMP-NNNNNN
  user_id               UUID          NOT NULL REFERENCES users(id),
  position              VARCHAR(255)  NOT NULL,
  department            VARCHAR(100)  NOT NULL,
  hire_date             DATE          NOT NULL,
  competency_profile_id UUID,                          -- FK added after competency_profiles
  is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by            UUID          NOT NULL REFERENCES users(id),
  updated_by            UUID          NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX employees_user_id_idx      ON employees(user_id);
CREATE UNIQUE INDEX employees_emp_number_idx   ON employees(employee_number);
CREATE        INDEX employees_department_idx   ON employees(department);
CREATE        INDEX employees_active_idx       ON employees(is_active);

-- ── Tasks ─────────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number     VARCHAR(20)  UNIQUE NOT NULL,             -- TASK-YYYYNNNNN
  title           TEXT         NOT NULL,
  description     TEXT,
  assigned_to     UUID         NOT NULL REFERENCES users(id),
  zone_id         UUID         REFERENCES facility_zones(id),
  batch_id        UUID         REFERENCES batches(id),
  priority        task_priority NOT NULL DEFAULT 'MEDIUM',
  status          task_status   NOT NULL DEFAULT 'PENDING',
  scheduled_start TIMESTAMPTZ,
  scheduled_end   TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  sop_reference   VARCHAR(50),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by      UUID         NOT NULL REFERENCES users(id),
  updated_by      UUID         NOT NULL REFERENCES users(id)
);

CREATE INDEX tasks_assigned_idx       ON tasks(assigned_to);
CREATE INDEX tasks_status_idx         ON tasks(status);
CREATE INDEX tasks_priority_idx       ON tasks(priority);
CREATE INDEX tasks_zone_idx           ON tasks(zone_id);
CREATE INDEX tasks_scheduled_idx      ON tasks(scheduled_start);

-- ── Task Assignments (many-to-many: task ↔ employee) ─────────────────────────
CREATE TABLE task_assignments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID        NOT NULL REFERENCES employees(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID        NOT NULL REFERENCES users(id)
);

CREATE UNIQUE INDEX task_assignments_unique_idx ON task_assignments(task_id, employee_id);
CREATE        INDEX task_assignments_task_idx   ON task_assignments(task_id);
CREATE        INDEX task_assignments_emp_idx    ON task_assignments(employee_id);

-- ── Time Entries ──────────────────────────────────────────────────────────────
-- Append-only: no UPDATE/DELETE (ALCOA+ Contemporaneous, Enduring)
CREATE TABLE time_entries (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID             NOT NULL REFERENCES employees(id),
  task_id          UUID             REFERENCES tasks(id),
  clock_in_at      TIMESTAMPTZ      NOT NULL,
  clock_out_at     TIMESTAMPTZ,
  duration_minutes INTEGER          GENERATED ALWAYS AS (
    CASE WHEN clock_out_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (clock_out_at - clock_in_at))::INTEGER / 60
      ELSE NULL
    END
  ) STORED,
  recorded_via     time_entry_source NOT NULL DEFAULT 'WEB',
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  created_by       UUID              NOT NULL REFERENCES users(id),
  updated_by       UUID              NOT NULL REFERENCES users(id)
);

CREATE INDEX time_entries_employee_idx   ON time_entries(employee_id);
CREATE INDEX time_entries_task_idx       ON time_entries(task_id);
CREATE INDEX time_entries_clock_in_idx   ON time_entries(clock_in_at);

-- ── Shift Schedules ───────────────────────────────────────────────────────────
CREATE TABLE shift_schedules (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID        NOT NULL REFERENCES employees(id),
  shift_date   DATE        NOT NULL,
  shift_start  TIME        NOT NULL,
  shift_end    TIME        NOT NULL,
  zone_id      UUID        REFERENCES facility_zones(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID        NOT NULL REFERENCES users(id)
);

CREATE INDEX shift_schedules_employee_idx ON shift_schedules(employee_id);
CREATE INDEX shift_schedules_date_idx     ON shift_schedules(shift_date);
