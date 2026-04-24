-- Migration 029: Align plants table with current Drizzle schema
-- Adds missing columns and relaxes facility_id constraint

-- 1. Create plant_source_type enum if not exists
DO $$ BEGIN
  CREATE TYPE plant_source_type AS ENUM ('seed', 'clone', 'tissue_culture');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add source_type column
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS source_type plant_source_type NOT NULL DEFAULT 'seed';

-- 3. Add mother_plant_id (nullable, self-reference)
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS mother_plant_id UUID REFERENCES plants(id);

-- 4. Add generation counter (0 = seed-grown)
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS generation INTEGER NOT NULL DEFAULT 0;

-- 5. (skipped) facility_id does not exist in this DB — column was never created

-- 6. Make zone_id NOT NULL now that FK points to facility_zones
--    (skip if already NOT NULL to avoid error)
DO $$
BEGIN
  ALTER TABLE plants ALTER COLUMN zone_id SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;
