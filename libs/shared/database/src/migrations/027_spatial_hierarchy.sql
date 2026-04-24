-- ================================================================
-- Migration 027: Spatial Hierarchy Enhancements
-- EPIC 8 — Hierarchical zones, racks, shelves, trays, spatial addressing
-- ================================================================

-- ─── FACILITY_ZONES ENHANCEMENTS ──────────────────────────────────────────────
-- Add vertical dimension support for 3D spatial tracking
ALTER TABLE facility_zones
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS effective_volume NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS environmental_requirements JSONB,
ADD COLUMN IF NOT EXISTS max_nested_zones INTEGER,
ADD COLUMN IF NOT EXISTS max_racks INTEGER;

-- Add NOT NULL constraints with default values if needed
ALTER TABLE facility_zones
ADD CONSTRAINT facility_zones_parent_self_ref
  FOREIGN KEY (parent_zone_id) REFERENCES facility_zones(id);

-- Index for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_facility_zones_parent_hierarchy
  ON facility_zones(parent_zone_id, is_active);

-- ─── RACKS TABLE (Physical multi-shelf structures in zones) ──────────────────
-- Rack type enum: 1-shelf, 2-shelf, 3-shelf, custom
CREATE TYPE rack_type_enum AS ENUM ('1-shelf', '2-shelf', '3-shelf', 'custom');

CREATE TABLE IF NOT EXISTS racks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id          UUID NOT NULL REFERENCES facility_zones(id) ON DELETE RESTRICT,

  rack_code        VARCHAR(20) NOT NULL,
  rack_type        rack_type_enum NOT NULL,
  shelf_count      INTEGER NOT NULL CHECK (shelf_count > 0),

  -- Position in zone (grid coordinates)
  row_position     INTEGER,
  column_position  INTEGER,

  -- 3D coordinates (PostGIS POINT if needed, for now store as JSONB)
  coordinates      JSONB, -- {x: number, y: number, z: number}

  max_tray_capacity INTEGER,
  supported_tray_sizes TEXT[] DEFAULT '{"small", "medium", "large"}',

  qr_code          VARCHAR(255) UNIQUE,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uniq_zone_rack_code UNIQUE (zone_id, rack_code)
);

CREATE INDEX idx_racks_zone ON racks(zone_id);
CREATE INDEX idx_racks_code ON racks(rack_code);
CREATE INDEX IF NOT EXISTS idx_racks_zone_position
  ON racks(zone_id, row_position, column_position);

-- ─── SHELVES TABLE (Levels in a rack) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shelves (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rack_id          UUID NOT NULL REFERENCES racks(id) ON DELETE CASCADE,

  shelf_index      INTEGER NOT NULL CHECK (shelf_index >= 0),
  height_from_floor NUMERIC(8, 2),

  max_trays        INTEGER,
  occupied_positions INTEGER NOT NULL DEFAULT 0 CHECK (occupied_positions >= 0),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uniq_rack_shelf_index UNIQUE (rack_id, shelf_index)
);

CREATE INDEX idx_shelves_rack ON shelves(rack_id);

-- ─── TRAYS TABLE (Containers on shelves) ──────────────────────────────────────
-- Tray size enum
CREATE TYPE tray_size_enum AS ENUM ('small', 'medium', 'large', 'custom');

CREATE TABLE IF NOT EXISTS trays (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rack_id          UUID NOT NULL REFERENCES racks(id) ON DELETE CASCADE,

  shelf_index      INTEGER NOT NULL,
  position_index   INTEGER NOT NULL,

  tray_code        VARCHAR(30) NOT NULL,
  tray_size        tray_size_enum NOT NULL,
  plant_capacity   INTEGER,

  -- Grid layout: {rows: number, cols: number, spacing: number, pattern: string}
  plant_layout     JSONB,

  occupied_slots   INTEGER NOT NULL DEFAULT 0 CHECK (occupied_slots >= 0),
  qr_code          VARCHAR(255) UNIQUE,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uniq_rack_tray_position UNIQUE (rack_id, shelf_index, position_index),
  CONSTRAINT valid_shelf_position FOREIGN KEY (rack_id, shelf_index)
    REFERENCES shelves(rack_id, shelf_index)
);

CREATE INDEX idx_trays_rack ON trays(rack_id);
CREATE INDEX idx_trays_code ON trays(tray_code);
CREATE INDEX IF NOT EXISTS idx_trays_rack_shelf
  ON trays(rack_id, shelf_index);

-- ─── SPATIAL ADDRESSES TABLE (Hierarchical spatial addressing) ───────────────
-- Entity types: facility, zone, rack, shelf, tray, plant
CREATE TYPE spatial_entity_type_enum AS ENUM ('facility', 'zone', 'rack', 'shelf', 'tray', 'plant');

CREATE TABLE IF NOT EXISTS spatial_addresses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id        UUID NOT NULL UNIQUE,
  entity_type      spatial_entity_type_enum NOT NULL,

  -- Hierarchical address components
  spatial_address  VARCHAR(200) UNIQUE, -- Format: FARM01.BUILDING.VEG.R001.S001.T001

  facility_code    VARCHAR(10),
  zone_code        VARCHAR(20),
  subzone_code     VARCHAR(20),
  rack_code        VARCHAR(20),
  shelf_index      INTEGER,
  tray_position    INTEGER,
  plant_slot       INTEGER,

  -- 3D coordinates for spatial queries
  coordinates      JSONB, -- {x: number, y: number, z: number}

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spatial_addresses_entity ON spatial_addresses(entity_type, entity_id);
CREATE INDEX idx_spatial_addresses_hierarchical ON spatial_addresses(facility_code, zone_code, rack_code);

-- ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

-- Function to build spatial address from hierarchy
CREATE OR REPLACE FUNCTION build_spatial_address(
  p_entity_type spatial_entity_type_enum,
  p_facility_code VARCHAR,
  p_zone_code VARCHAR,
  p_subzone_code VARCHAR,
  p_rack_code VARCHAR,
  p_shelf_index INTEGER,
  p_tray_position INTEGER,
  p_plant_slot INTEGER
) RETURNS VARCHAR AS $$
DECLARE
  v_address VARCHAR(200) := '';
BEGIN
  IF p_facility_code IS NOT NULL THEN
    v_address := p_facility_code;
  END IF;

  IF p_zone_code IS NOT NULL THEN
    v_address := CONCAT_WS('.', v_address, p_zone_code);
  END IF;

  IF p_subzone_code IS NOT NULL THEN
    v_address := CONCAT_WS('.', v_address, p_subzone_code);
  END IF;

  IF p_rack_code IS NOT NULL THEN
    v_address := CONCAT_WS('.', v_address, p_rack_code);
  END IF;

  IF p_shelf_index IS NOT NULL THEN
    v_address := CONCAT_WS('.', v_address, 'S' || LPAD(p_shelf_index::TEXT, 3, '0'));
  END IF;

  IF p_tray_position IS NOT NULL THEN
    v_address := CONCAT_WS('.', v_address, 'T' || LPAD(p_tray_position::TEXT, 3, '0'));
  END IF;

  IF p_plant_slot IS NOT NULL THEN
    v_address := CONCAT_WS('.', v_address, 'P' || LPAD(p_plant_slot::TEXT, 3, '0'));
  END IF;

  RETURN v_address;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update facility_zones effective_volume
CREATE OR REPLACE FUNCTION update_zone_effective_volume()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.area_sqm IS NOT NULL AND NEW.height_cm IS NOT NULL THEN
    NEW.effective_volume := (NEW.area_sqm::NUMERIC * NEW.height_cm) / 10000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_zone_effective_volume ON facility_zones;
CREATE TRIGGER trg_update_zone_effective_volume
  BEFORE INSERT OR UPDATE ON facility_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_effective_volume();

-- ─── END MIGRATION ────────────────────────────────────────────────────────────
