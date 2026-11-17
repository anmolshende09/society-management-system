-- tools/db/init-roles.sql
-- Local bootstrap roles for development (repeatable setup, not an application migration).
DO $$
BEGIN
  -- 1. app_owner: Non-login owner of schemas and tables
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;

  -- 2. app_migrator: Short-lived login role for running migrations
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_migrator') THEN
    CREATE ROLE app_migrator LOGIN PASSWORD 'LOCAL_MIGRATOR_PASSWORD' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;

  -- 3. app_runtime: Normal runtime connection for API and Worker processes
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN PASSWORD 'LOCAL_DEV_PASSWORD' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;

  -- 4. app_relay: Specialized role for Transactional Outbox relay
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_relay') THEN
    CREATE ROLE app_relay LOGIN PASSWORD 'LOCAL_RELAY_PASSWORD' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;

  -- 5. app_platform_ops: Ticketed, break-glass identity
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_platform_ops') THEN
    CREATE ROLE app_platform_ops LOGIN PASSWORD 'LOCAL_OPS_PASSWORD' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;

  -- 6. app_readonly: Replica reporting identity
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_readonly') THEN
    CREATE ROLE app_readonly LOGIN PASSWORD 'LOCAL_RO_PASSWORD' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;

-- Allow app_migrator to assume app_owner via SET ROLE
GRANT app_owner TO app_migrator;
