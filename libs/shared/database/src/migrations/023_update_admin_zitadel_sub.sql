-- Migration 023: Update admin user keycloak_id to Zitadel numeric sub
-- After Keycloak → Zitadel migration, the "sub" claim is a numeric ID.
-- The keycloak_id column stores the external IdP subject identifier.

-- Widen keycloak_id to accommodate Zitadel numeric IDs (was varchar(36) for UUIDs)
ALTER TABLE users ALTER COLUMN keycloak_id TYPE VARCHAR(64);

-- Upsert: update existing admin or insert if not found
INSERT INTO users (keycloak_id, email, username, first_name, last_name, role, is_active)
VALUES (
  '367889330900828166',
  'admin@gacp-erp.local',
  'admin',
  'System',
  'Administrator',
  'SUPER_ADMIN',
  true
)
ON CONFLICT (keycloak_id) DO NOTHING;

-- Also update the old keycloak admin record if it exists
UPDATE users SET keycloak_id = '367889330900828166'
WHERE keycloak_id = '74ab193c-cb2e-44e1-9092-cac5f8b8b91a';
