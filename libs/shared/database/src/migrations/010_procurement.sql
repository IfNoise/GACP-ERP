-- ================================================================
-- Migration 010: Procurement — Suppliers, Purchase Orders, Receiving
-- EPIC 8 — GACP-ERP Financial Service
-- EU GMP Chapter 7 supplier management
-- ================================================================

CREATE SEQUENCE IF NOT EXISTS suppliers_seq START 1;
CREATE SEQUENCE IF NOT EXISTS purchase_orders_seq START 1;
CREATE SEQUENCE IF NOT EXISTS receiving_records_seq START 1;

-- ─── SUPPLIERS ───────────────────────────────────────────────────────────────
CREATE TABLE suppliers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code         VARCHAR(10) UNIQUE NOT NULL,  -- SUP-NNNN
  name                  TEXT NOT NULL,
  qualification_status  VARCHAR(20) NOT NULL DEFAULT 'PROVISIONAL'
                          CHECK (qualification_status IN ('QUALIFIED', 'PROVISIONAL', 'DISQUALIFIED')),
  qualification_expiry  DATE,
  contact_email         VARCHAR(320),
  contact_phone         VARCHAR(30),
  contact_address       TEXT,
  contact_person        VARCHAR(200),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID NOT NULL,
  updated_by            UUID NOT NULL
);
CREATE INDEX idx_suppliers_status ON suppliers(qualification_status);
CREATE INDEX idx_suppliers_expiry ON suppliers(qualification_expiry);

-- ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────
CREATE TABLE purchase_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number             VARCHAR(15) UNIQUE NOT NULL,  -- PO-YYYY-NNNN
  supplier_id           UUID NOT NULL REFERENCES suppliers(id),
  status                VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                          CHECK (status IN (
                            'DRAFT', 'SUBMITTED', 'ACKNOWLEDGED', 'RECEIVING', 'CLOSED', 'CANCELLED'
                          )),
  total_value           NUMERIC(18, 4) NOT NULL DEFAULT 0,
  currency              CHAR(3) NOT NULL DEFAULT 'USD',
  expected_delivery_date DATE,
  three_way_match_passed BOOLEAN,
  electronic_signature  JSONB,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID NOT NULL,
  updated_by            UUID NOT NULL
);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- ─── PO LINES ────────────────────────────────────────────────────────────────
CREATE TABLE po_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id            UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_number      INTEGER NOT NULL,
  item_description TEXT NOT NULL,
  quantity         NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
  unit_price       NUMERIC(12, 4) NOT NULL CHECK (unit_price >= 0),
  unit_of_measure  VARCHAR(20) NOT NULL,
  received_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  UNIQUE (po_id, line_number)
);
CREATE INDEX idx_po_lines_po ON po_lines(po_id);

-- ─── RECEIVING RECORDS (GRN) ─────────────────────────────────────────────────
CREATE TABLE receiving_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number            VARCHAR(15) UNIQUE NOT NULL,  -- GRN-YYYY-NNNN
  po_id                 UUID NOT NULL REFERENCES purchase_orders(id),
  received_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by           UUID NOT NULL,
  quality_check_passed  BOOLEAN NOT NULL,
  quality_check_notes   TEXT,
  electronic_signature  JSONB NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID NOT NULL,
  updated_by            UUID NOT NULL
);
CREATE INDEX idx_receiving_records_po ON receiving_records(po_id);

-- ─── RECEIVING LINES ─────────────────────────────────────────────────────────
CREATE TABLE receiving_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiving_record_id UUID NOT NULL REFERENCES receiving_records(id) ON DELETE CASCADE,
  po_line_id          UUID NOT NULL REFERENCES po_lines(id),
  quantity_received   NUMERIC(12, 3) NOT NULL CHECK (quantity_received > 0),
  condition_notes     TEXT
);
CREATE INDEX idx_receiving_lines_record ON receiving_lines(receiving_record_id);
