-- ================================================================
-- Migration 011: Spatial — Facility Zones, Zone Assignments
-- EPIC 8 — GACP-ERP Financial Service
-- ================================================================

CREATE SEQUENCE IF NOT EXISTS facility_zones_seq START 1;

-- ─── FACILITY ZONES ──────────────────────────────────────────────────────────
CREATE TABLE facility_zones (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_code        VARCHAR(20) UNIQUE NOT NULL,  -- ZONE-XXXXXXXX
  zone_name        TEXT NOT NULL,
  zone_type        VARCHAR(20) NOT NULL CHECK (zone_type IN (
    'CULTIVATION', 'PROCESSING', 'STORAGE', 'UTILITY', 'OFFICE', 'QUARANTINE'
  )),
  area_sqm         NUMERIC(10, 2) NOT NULL CHECK (area_sqm > 0),
  capacity         INTEGER NOT NULL CHECK (capacity > 0),
  parent_zone_id   UUID REFERENCES facility_zones(id),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID NOT NULL,
  updated_by       UUID NOT NULL
);
CREATE INDEX idx_facility_zones_type ON facility_zones(zone_type);
CREATE INDEX idx_facility_zones_parent ON facility_zones(parent_zone_id);

-- ─── ZONE ASSIGNMENTS ────────────────────────────────────────────────────────
CREATE TABLE zone_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id      UUID NOT NULL REFERENCES facility_zones(id),
  batch_id     UUID NOT NULL,  -- cross-service ref to plant_batches
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by  UUID NOT NULL,
  released_at  TIMESTAMPTZ,
  released_by  UUID,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   UUID NOT NULL,
  updated_by   UUID NOT NULL,
  -- A batch can only be actively assigned to one zone at a time
  CONSTRAINT uniq_active_batch_assignment UNIQUE NULLS NOT DISTINCT (batch_id, released_at)
);
CREATE INDEX idx_zone_assignments_zone ON zone_assignments(zone_id);
CREATE INDEX idx_zone_assignments_batch ON zone_assignments(batch_id);
CREATE INDEX idx_zone_assignments_active ON zone_assignments(zone_id) WHERE released_at IS NULL;

-- ─── ZONE CAPACITY HISTORY ───────────────────────────────────────────────────
CREATE TABLE zone_capacity_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id    UUID NOT NULL REFERENCES facility_zones(id),
  occupancy  INTEGER NOT NULL CHECK (occupancy >= 0),
  capacity   INTEGER NOT NULL CHECK (capacity > 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_zone_capacity_history_zone ON zone_capacity_history(zone_id, recorded_at);
