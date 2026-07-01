-- Migration 030: IFC space binding for facility zones
-- Links each zone to an IfcSpace entity ID in the loaded XeoKit building model.
-- Enables: clicking a room in the 3D viewer assigns it to the matching zone.

ALTER TABLE facility_zones
  ADD COLUMN IF NOT EXISTS ifc_space_id VARCHAR(255);

COMMENT ON COLUMN facility_zones.ifc_space_id IS
  'XeoKit scene entity ID of the IfcSpace object in the loaded building model.
   Set by the space-mapping tool when the user picks a room on the 3D viewer.';
