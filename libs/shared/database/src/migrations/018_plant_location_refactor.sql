-- Migration: Plant location refactor
-- Plants now use zone_id as sole spatial reference (facility/room/building derivable via hierarchy)
-- Batches lose zone_id (they are logical/regulatory, not spatial)

-- 1. Remove zone_id from batches (no longer spatial)
ALTER TABLE batches DROP COLUMN IF EXISTS zone_id;

-- 2. Make plants.zone_id NOT NULL (was nullable before)
-- First backfill any plants that don't have a zone_id
-- (If there are plants without zone_id, they need manual assignment)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM plants WHERE zone_id IS NULL LIMIT 1) THEN
    RAISE NOTICE 'WARNING: Found plants with NULL zone_id. These must be manually assigned to zones before enforcing NOT NULL.';
  END IF;
END $$;

-- Set NOT NULL constraint (will fail if any plants have NULL zone_id)
ALTER TABLE plants ALTER COLUMN zone_id SET NOT NULL;

-- 3. Drop facility_id and room_id from plants (derivable through zone → room → building → facility)
ALTER TABLE plants DROP COLUMN IF EXISTS facility_id;
ALTER TABLE plants DROP COLUMN IF EXISTS room_id;

-- 4. Drop old indexes that referenced removed columns
DROP INDEX IF EXISTS plants_facility_zone_idx;

-- 5. Create new index on zone_id
CREATE INDEX IF NOT EXISTS plants_zone_idx ON plants(zone_id);
