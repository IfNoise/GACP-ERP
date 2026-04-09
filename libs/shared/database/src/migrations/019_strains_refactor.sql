-- Migration 019: Strains table refactor
-- Aligns DB columns with Zod StrainSchema, adds supplier FK,
-- soft-delete columns, species, yield min/max, certificate_url.

-- 1. Rename columns to match Zod naming
ALTER TABLE strains RENAME COLUMN code TO cultivar_code;
ALTER TABLE strains RENAME COLUMN description TO notes;
DROP INDEX IF EXISTS strains_code_idx;
CREATE UNIQUE INDEX strains_cultivar_code_idx ON strains(cultivar_code);

-- 2. Add missing columns
ALTER TABLE strains ADD COLUMN species varchar(50) NOT NULL DEFAULT 'hybrid';
ALTER TABLE strains ADD COLUMN expected_yield_grams_min decimal(8,2);
ALTER TABLE strains ADD COLUMN expected_yield_grams_max decimal(8,2);
ALTER TABLE strains ADD COLUMN certificate_url text;
ALTER TABLE strains ADD COLUMN supplier_id uuid REFERENCES suppliers(id);

-- Soft-delete (21 CFR Part 11 — no hard deletes)
ALTER TABLE strains ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE strains ADD COLUMN deleted_at timestamptz;
ALTER TABLE strains ADD COLUMN deleted_by uuid;

-- 3. Migrate legacy yield column → expected_yield_grams_max
UPDATE strains
SET expected_yield_grams_max = expected_yield_g_per_plant
WHERE expected_yield_g_per_plant IS NOT NULL;

ALTER TABLE strains DROP COLUMN expected_yield_g_per_plant;

-- 4. Indexes
CREATE INDEX strains_supplier_idx ON strains(supplier_id);
CREATE INDEX strains_species_idx ON strains(species);
CREATE INDEX strains_active_idx ON strains(is_active) WHERE is_active = true;
