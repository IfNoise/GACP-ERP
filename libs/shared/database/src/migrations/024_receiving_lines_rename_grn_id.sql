-- Migration 024: Align receiving_lines columns with Drizzle schema
-- Drizzle schema uses different column names than migration 010 created.

-- 1. receiving_record_id → grn_id
ALTER TABLE receiving_lines RENAME COLUMN receiving_record_id TO grn_id;

-- 2. quantity_received → received_quantity
ALTER TABLE receiving_lines RENAME COLUMN quantity_received TO received_quantity;

-- 3. condition_notes → notes
ALTER TABLE receiving_lines RENAME COLUMN condition_notes TO notes;

-- 4. Recreate indexes with new names
DROP INDEX IF EXISTS idx_receiving_lines_record;
CREATE INDEX IF NOT EXISTS rl_grn_idx ON receiving_lines(grn_id);
