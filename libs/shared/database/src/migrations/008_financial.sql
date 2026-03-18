-- ================================================================
-- Migration 008: Financial — Accounts, Journal Entries, Biological Assets
-- EPIC 8 — GACP-ERP Financial Service
-- IAS 41 compliance for biological asset valuation
-- ================================================================

-- Sequences
CREATE SEQUENCE IF NOT EXISTS journal_entries_seq START 1;
CREATE SEQUENCE IF NOT EXISTS biological_assets_seq START 1;
CREATE SEQUENCE IF NOT EXISTS cost_allocations_seq START 1;

-- ─── CHART OF ACCOUNTS ──────────────────────────────────────────────────────
CREATE TABLE accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code     VARCHAR(4) UNIQUE NOT NULL CHECK (account_code ~ '^\d{4}$'),
  account_type     VARCHAR(20) NOT NULL CHECK (account_type IN (
    'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
  )),
  parent_id        UUID REFERENCES accounts(id),
  name             TEXT NOT NULL,
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID NOT NULL,
  updated_by       UUID NOT NULL
);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_parent ON accounts(parent_id);

-- ─── JOURNAL ENTRIES ─────────────────────────────────────────────────────────
CREATE TABLE journal_entries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number         VARCHAR(20) UNIQUE NOT NULL,  -- JE-YYYY-NNNNNN
  description          TEXT NOT NULL,
  entry_date           DATE NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                         CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED')),
  reversal_of_id       UUID REFERENCES journal_entries(id),
  electronic_signature JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by           UUID NOT NULL,
  updated_by           UUID NOT NULL
);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);

-- ─── JOURNAL LINES ───────────────────────────────────────────────────────────
CREATE TABLE journal_lines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id   UUID NOT NULL REFERENCES accounts(id),
  account_code VARCHAR(4) NOT NULL,
  description  TEXT NOT NULL,
  debit_amount  NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  batch_id     UUID  -- FK to plant_batches (cross-service, no hard FK)
);
CREATE INDEX idx_journal_lines_entry ON journal_lines(entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- ─── BIOLOGICAL ASSETS (IAS 41) ──────────────────────────────────────────────
CREATE TABLE biological_assets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id              UUID NOT NULL,  -- cross-service ref to plant_batches
  valuation_method      VARCHAR(20) NOT NULL CHECK (valuation_method IN ('FAIR_VALUE', 'COST')),
  fair_value            NUMERIC(18, 4),
  cost_to_sell          NUMERIC(18, 4),
  net_realizable_value  NUMERIC(18, 4),
  cost_value            NUMERIC(18, 4),
  quantity_grams        NUMERIC(18, 3) NOT NULL DEFAULT 0,
  valued_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valued_by             UUID NOT NULL,
  electronic_signature  JSONB NOT NULL,
  journal_entry_id      UUID REFERENCES journal_entries(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID NOT NULL,
  updated_by            UUID NOT NULL
);
CREATE INDEX idx_biological_assets_batch ON biological_assets(batch_id);
CREATE INDEX idx_biological_assets_valued_at ON biological_assets(valued_at);

-- ─── COST ALLOCATIONS ────────────────────────────────────────────────────────
CREATE TABLE cost_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         UUID NOT NULL,
  cost_type        VARCHAR(30) NOT NULL CHECK (cost_type IN (
    'DIRECT_LABOR', 'OVERHEAD', 'MATERIAL', 'DEPRECIATION', 'UTILITIES'
  )),
  amount           NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  period           VARCHAR(7) NOT NULL CHECK (period ~ '^\d{4}-\d{2}$'),  -- YYYY-MM
  allocation_basis TEXT NOT NULL,
  journal_entry_id UUID REFERENCES journal_entries(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID NOT NULL,
  updated_by       UUID NOT NULL
);
CREATE INDEX idx_cost_allocations_batch ON cost_allocations(batch_id);
CREATE INDEX idx_cost_allocations_period ON cost_allocations(period);
