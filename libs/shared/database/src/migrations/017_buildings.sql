-- Migration: Add buildings layer to spatial hierarchy
-- Facility → Building → Room → Zone (4-level hierarchy)

-- 1. Create building_type enum
CREATE TYPE building_type AS ENUM ('indoor', 'greenhouse', 'open_ground');

-- 2. Create buildings table
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  building_code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  building_type building_type NOT NULL DEFAULT 'indoor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  UNIQUE(facility_id, building_code)
);
CREATE INDEX idx_buildings_facility_id ON buildings(facility_id);

-- 3. Backfill: create default "MAIN" building for each facility that has rooms
INSERT INTO buildings (facility_id, building_code, name, building_type, created_by, updated_by)
SELECT DISTINCT f.id, 'MAIN', f.name || ' - Main Building', 'indoor'::building_type, f.created_by, f.updated_by
FROM facilities f
INNER JOIN rooms r ON r.facility_id = f.id;

-- 4. Add building_id column to rooms (nullable temporarily)
ALTER TABLE rooms ADD COLUMN building_id UUID REFERENCES buildings(id);

-- 5. Populate building_id from the backfilled buildings
UPDATE rooms SET building_id = b.id
FROM buildings b WHERE b.facility_id = rooms.facility_id AND b.building_code = 'MAIN';

-- 6. Make building_id NOT NULL
ALTER TABLE rooms ALTER COLUMN building_id SET NOT NULL;

-- 7. Drop old facility_id column and its constraints/indexes from rooms
DROP INDEX IF EXISTS rooms_facility_code_idx;
DROP INDEX IF EXISTS rooms_facility_idx;
ALTER TABLE rooms DROP COLUMN facility_id;

-- 8. Create new indexes for building_id
CREATE UNIQUE INDEX rooms_building_code_idx ON rooms(building_id, room_code);
CREATE INDEX rooms_building_idx ON rooms(building_id);
