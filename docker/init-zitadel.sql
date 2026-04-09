-- Create zitadel user if it doesn't exist
DO $$ BEGIN
  CREATE USER zitadel WITH PASSWORD 'zitadel_secret_2026' CREATEDB;
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  -- User already exists, do nothing
END $$;

-- Create zitadel database
DO $$ BEGIN
  CREATE DATABASE zitadel OWNER zitadel;
EXCEPTION WHEN DUPLICATE_DATABASE THEN
  -- Database already exists, do nothing
END $$;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE zitadel TO zitadel;
