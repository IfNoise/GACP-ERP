-- Migration 026: Allow NULL electronic_signature on biological_assets + seed system user
-- Rationale: System-triggered IAS 41 initial recognition (from BATCH_CREATED Kafka event)
-- cannot carry a human electronic signature. Manual revaluations still provide signatures
-- at the application layer; only the DB constraint is relaxed here.
ALTER TABLE biological_assets ALTER COLUMN electronic_signature DROP NOT NULL;

-- Insert well-known system user for Kafka-triggered records.
-- UUID 00000000-0000-0000-0000-000000000001 is the SYSTEM_USER_ID constant.
INSERT INTO users (id, keycloak_id, email, username, first_name, last_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system',
  'system@gacp-erp.internal',
  'system',
  'System',
  'User',
  'SUPER_ADMIN'
) ON CONFLICT (id) DO NOTHING;
