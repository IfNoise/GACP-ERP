-- Migration 020: Add GACP/regulatory fields to strains
-- Breeder traceability, source type, terpene profile, DNA fingerprinting,
-- lineage, acquisition cost, quarantine, stability, registration.

-- 1. Source type enum
DO $$ BEGIN
  CREATE TYPE strain_source_type AS ENUM ('seed', 'clone', 'tissue_culture');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. New columns
ALTER TABLE strains ADD COLUMN breeder varchar(255);
ALTER TABLE strains ADD COLUMN seed_bank varchar(255);
ALTER TABLE strains ADD COLUMN source_type strain_source_type NOT NULL DEFAULT 'seed';
ALTER TABLE strains ADD COLUMN terpene_profile jsonb;
ALTER TABLE strains ADD COLUMN dna_profile_url text;
ALTER TABLE strains ADD COLUMN lineage jsonb;
ALTER TABLE strains ADD COLUMN acquisition_cost decimal(12,2);
ALTER TABLE strains ADD COLUMN currency varchar(3) NOT NULL DEFAULT 'EUR';
ALTER TABLE strains ADD COLUMN cost_per_unit decimal(10,2);
ALTER TABLE strains ADD COLUMN unit_type varchar(20);
ALTER TABLE strains ADD COLUMN quarantine_days integer;
ALTER TABLE strains ADD COLUMN stability_verified boolean NOT NULL DEFAULT false;
ALTER TABLE strains ADD COLUMN registration_number varchar(100);

-- 3. Indexes
CREATE INDEX strains_breeder_idx ON strains(breeder) WHERE breeder IS NOT NULL;
CREATE INDEX strains_source_type_idx ON strains(source_type);
CREATE INDEX strains_registration_idx ON strains(registration_number) WHERE registration_number IS NOT NULL;
