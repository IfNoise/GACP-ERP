-- Seed the initial admin user into the users table.
-- The keycloak_id must match the Keycloak admin account's "sub" claim.
-- This INSERT is idempotent (ON CONFLICT DO NOTHING).
INSERT INTO users (keycloak_id, email, username, first_name, last_name, role, is_active)
VALUES (
  '74ab193c-cb2e-44e1-9092-cac5f8b8b91a',
  'admin@gacp-erp.local',
  'admin',
  'System',
  'Administrator',
  'SUPER_ADMIN',
  true
)
ON CONFLICT (keycloak_id) DO NOTHING;
