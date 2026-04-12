-- Migration 021: Link PO lines to strains + incoming inspections table
-- Part of: Procurement flow for genetic material (Supplier → PO → GRN → Inspection → Release)

-- 1. Add strain_id to po_lines
ALTER TABLE po_lines ADD COLUMN IF NOT EXISTS strain_id UUID REFERENCES strains(id);
CREATE INDEX IF NOT EXISTS pol_strain_idx ON po_lines (strain_id) WHERE strain_id IS NOT NULL;

-- 2. Incoming inspection status enum
DO $$ BEGIN
  CREATE TYPE incoming_inspection_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'QUARANTINE',
    'RELEASED',
    'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Incoming inspections table
CREATE TABLE IF NOT EXISTS incoming_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number VARCHAR(20) NOT NULL UNIQUE,

  -- References
  grn_id UUID NOT NULL REFERENCES receiving_records(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  strain_id UUID REFERENCES strains(id),

  -- Status
  status incoming_inspection_status NOT NULL DEFAULT 'PENDING',

  -- Visual & quantitative inspection
  visual_check_passed BOOLEAN,
  quantity_verified BOOLEAN,
  quality_assessment_notes TEXT,

  -- Lab test results
  dna_fingerprint_passed BOOLEAN,
  cannabinoid_profile_passed BOOLEAN,
  pathogen_screening_passed BOOLEAN,
  germination_rate DECIMAL(5,2),

  -- Quarantine tracking
  quarantine_days_required INTEGER NOT NULL DEFAULT 7,
  quarantine_start_date TIMESTAMPTZ,
  quarantine_end_date TIMESTAMPTZ,

  -- Disposition
  disposition_decision VARCHAR(20),
  disposition_reason TEXT,
  electronic_signature JSONB,

  -- GxP validation fields (same as deviations, capas, etc.)
  validation_status validation_status NOT NULL DEFAULT 'unvalidated',
  validation_protocol_id UUID,
  last_validated_at TIMESTAMPTZ,
  next_review_date TEXT,
  retention_class retention_class NOT NULL DEFAULT '7_YEAR',
  audit_tx_id VARCHAR(200),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS ii_status_idx ON incoming_inspections (status);
CREATE INDEX IF NOT EXISTS ii_grn_idx ON incoming_inspections (grn_id);
CREATE INDEX IF NOT EXISTS ii_po_idx ON incoming_inspections (po_id);
CREATE INDEX IF NOT EXISTS ii_supplier_idx ON incoming_inspections (supplier_id);
CREATE INDEX IF NOT EXISTS ii_strain_idx ON incoming_inspections (strain_id) WHERE strain_id IS NOT NULL;

-- 5. Sequence for inspection numbers
CREATE SEQUENCE IF NOT EXISTS incoming_inspections_seq START 1;
