-- Migration 029: 3D spatial support
-- Adds bounding-box storage to facility_zones and 3D model reference to buildings.
-- Enables: zone marking on 3D building models (IFC/glTF/XKT).

-- 3D bounding box for zones: [x, y, z, width, height, depth] in metres
ALTER TABLE facility_zones
  ADD COLUMN IF NOT EXISTS bounds_3d JSONB;

COMMENT ON COLUMN facility_zones.bounds_3d IS
  'Axis-aligned bounding box in 3D scene space: {x, y, z, width, height, depth} (metres).
   Set by the zone-marking tool when the user draws the zone on the building model.';

-- 3D model reference for buildings
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS model_url    TEXT,
  ADD COLUMN IF NOT EXISTS model_format TEXT
    CHECK (model_format IN ('ifc', 'gltf', 'xkt'));

COMMENT ON COLUMN buildings.model_url IS
  'URL to the uploaded 3D building model file (served from MinIO/local storage).';
COMMENT ON COLUMN buildings.model_format IS
  'Format of the 3D model file: ifc | gltf | xkt.';
