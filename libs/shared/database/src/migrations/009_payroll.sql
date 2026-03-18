-- ================================================================
-- Migration 009: Payroll
-- EPIC 8 — GACP-ERP Financial Service
-- ================================================================

CREATE SEQUENCE IF NOT EXISTS payroll_runs_seq START 1;

-- ─── EMPLOYEE COMPENSATION RATES ────────────────────────────────────────────
CREATE TABLE employee_compensation_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL,  -- cross-service ref to employees
  pay_type        VARCHAR(20) NOT NULL CHECK (pay_type IN ('SALARY', 'HOURLY', 'BONUS', 'OVERTIME')),
  rate            NUMERIC(12, 4) NOT NULL CHECK (rate >= 0),
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID NOT NULL,
  updated_by      UUID NOT NULL
);
CREATE INDEX idx_comp_rates_employee ON employee_compensation_rates(employee_id);

-- ─── PAYROLL RUNS ────────────────────────────────────────────────────────────
CREATE TABLE payroll_runs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_number           VARCHAR(15) UNIQUE NOT NULL,  -- PR-YYYY-NNNN
  pay_period_start     DATE NOT NULL,
  pay_period_end       DATE NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                         CHECK (status IN ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED')),
  total_gross          NUMERIC(18, 4) NOT NULL DEFAULT 0,
  total_deductions     NUMERIC(18, 4) NOT NULL DEFAULT 0,
  total_net            NUMERIC(18, 4) NOT NULL DEFAULT 0,
  electronic_signature JSONB,
  journal_entry_id     UUID REFERENCES journal_entries(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID NOT NULL,
  updated_by           UUID NOT NULL,
  CONSTRAINT payroll_period_valid CHECK (pay_period_end >= pay_period_start)
);
CREATE INDEX idx_payroll_runs_period ON payroll_runs(pay_period_start, pay_period_end);
CREATE INDEX idx_payroll_runs_status ON payroll_runs(status);

-- ─── PAYROLL LINES ───────────────────────────────────────────────────────────
CREATE TABLE payroll_lines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id  UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL,
  gross_pay       NUMERIC(12, 4) NOT NULL DEFAULT 0 CHECK (gross_pay >= 0),
  deductions      NUMERIC(12, 4) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net_pay         NUMERIC(12, 4) NOT NULL DEFAULT 0 CHECK (net_pay >= 0),
  pay_type        VARCHAR(20) NOT NULL CHECK (pay_type IN ('SALARY', 'HOURLY', 'BONUS', 'OVERTIME')),
  hours_worked    NUMERIC(8, 2) CHECK (hours_worked >= 0)
);
CREATE INDEX idx_payroll_lines_run ON payroll_lines(payroll_run_id);
CREATE INDEX idx_payroll_lines_employee ON payroll_lines(employee_id);
