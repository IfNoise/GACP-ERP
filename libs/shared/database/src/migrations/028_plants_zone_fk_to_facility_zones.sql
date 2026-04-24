-- Migration 028: Re-target plants.zone_id FK from zones → facility_zones
-- Reason: intake wizard now uses spatial facility zones (financial-service)
-- for plant placement. The old FK pointed to the cultivation-era zones table.

-- Drop any existing FK constraint on plants.zone_id (regardless of its name)
DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  WHERE c.conrelid = 'plants'::regclass
    AND c.contype = 'f'
    AND a.attname = 'zone_id'
  LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE plants DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

-- Add new FK to facility_zones
ALTER TABLE plants
  ADD CONSTRAINT plants_zone_id_facility_zones_id_fk
  FOREIGN KEY (zone_id) REFERENCES facility_zones (id);
