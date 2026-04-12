-- Migration 022: Consolidate supplier contact columns into a single JSONB column
-- The Drizzle schema uses contact_details (jsonb), but migration 010 created
-- separate contact_email, contact_phone, contact_address, contact_person columns.
-- This migration merges them into the JSONB column expected by the application.

-- 1. Add the JSONB column
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_details JSONB NOT NULL DEFAULT '{}';

-- 2. Migrate existing data
UPDATE suppliers SET contact_details = jsonb_build_object(
  'email', contact_email,
  'phone', contact_phone,
  'address', contact_address,
  'contact_person', contact_person
) WHERE contact_email IS NOT NULL
   OR contact_phone IS NOT NULL
   OR contact_address IS NOT NULL
   OR contact_person IS NOT NULL;

-- 3. Drop the old columns
ALTER TABLE suppliers DROP COLUMN IF EXISTS contact_email;
ALTER TABLE suppliers DROP COLUMN IF EXISTS contact_phone;
ALTER TABLE suppliers DROP COLUMN IF EXISTS contact_address;
ALTER TABLE suppliers DROP COLUMN IF EXISTS contact_person;
