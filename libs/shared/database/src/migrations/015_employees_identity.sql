-- Migration: 015_employees_identity
-- Description: Sync employees table with Drizzle schema — add identity fields
--              (first_name, last_name, email), rename position→job_title, add role,
--              phone, metadata. Allow nullable user_id for staged provisioning.
-- Related: Keycloak employee provisioning saga (workforce-service)

BEGIN;

-- 1. Add new identity columns
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS first_name  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS email       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone       VARCHAR(30),
  ADD COLUMN IF NOT EXISTS metadata    JSONB DEFAULT '{}';

-- 2. Rename position → job_title (Drizzle schema uses job_title)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'position'
  ) THEN
    ALTER TABLE employees RENAME COLUMN position TO job_title;
  END IF;
END $$;

-- 3. Add role column
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS role VARCHAR(100);

-- 4. Backfill: copy job_title into role for existing rows, set names from empty
UPDATE employees
SET
  first_name = COALESCE(first_name, ''),
  last_name  = COALESCE(last_name, ''),
  email      = COALESCE(email, id::text || '@placeholder.local'),
  role       = COALESCE(role, job_title)
WHERE first_name IS NULL OR last_name IS NULL OR email IS NULL OR role IS NULL;

-- 5. Set NOT NULL constraints after backfill
ALTER TABLE employees
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name  SET NOT NULL,
  ALTER COLUMN email      SET NOT NULL,
  ALTER COLUMN job_title  SET NOT NULL,
  ALTER COLUMN role       SET NOT NULL;

-- 6. Allow nullable user_id (for Keycloak saga: user created in same transaction)
ALTER TABLE employees
  ALTER COLUMN user_id DROP NOT NULL;

-- 7. Add unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS emp_email_idx ON employees(email);

COMMIT;
