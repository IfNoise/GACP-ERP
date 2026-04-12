-- Migration 025: Batch Source Model
-- Adds explicit source traceability to the batches table.
-- Supports GACP chain-of-custody: Plant → Batch → {GRN → PO → Supplier | Mother Batch}

CREATE TYPE batch_source_type AS ENUM (
  'external_purchase',  -- seeds or clones bought from a supplier (source_grn_id required)
  'internal_clone',     -- cut from our own mother plants (source_batch_id required)
  'seed_bank',          -- from own seed bank inventory (no external ref needed)
  'tissue_culture'      -- TC lab — source_grn_id optional if purchased externally
);

ALTER TABLE batches
  ADD COLUMN batch_source_type batch_source_type NOT NULL DEFAULT 'internal_clone',
  ADD COLUMN source_batch_id   UUID REFERENCES batches(id),
  ADD COLUMN source_grn_id     UUID REFERENCES receiving_records(id);

CREATE INDEX idx_batches_source_type  ON batches(batch_source_type);
CREATE INDEX idx_batches_source_grn   ON batches(source_grn_id)   WHERE source_grn_id IS NOT NULL;
CREATE INDEX idx_batches_source_batch ON batches(source_batch_id) WHERE source_batch_id IS NOT NULL;

ALTER TABLE batches ADD CONSTRAINT chk_batch_source CHECK (
  CASE batch_source_type
    WHEN 'external_purchase' THEN source_grn_id IS NOT NULL
    WHEN 'internal_clone'    THEN source_batch_id IS NOT NULL
    ELSE TRUE
  END
);
