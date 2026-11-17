-- Migration: 000_platform_bootstrap.sql
-- Description: Platform bootstrap, core schemas, extensions, RLS functions, migration ledger, and identity tables

CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS resident;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS workforce;
CREATE SCHEMA IF NOT EXISTS maintenance;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS community;

-- Functions to retrieve transaction-local context
CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

-- RLS Enforcement Helper Function
CREATE OR REPLACE FUNCTION app.apply_tenant_rls(p_table regclass) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', p_table);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %s', p_table);
  EXECUTE format(
    'CREATE POLICY tenant_isolation ON %s AS PERMISSIVE FOR ALL TO app_runtime
       USING (tenant_id = app.current_tenant_id())
       WITH CHECK (tenant_id = app.current_tenant_id())', p_table);
END $$;

-- Migration Ledger Table (Tracks immutable applied migrations)
CREATE TABLE IF NOT EXISTS platform.migration_ledger (
  id text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  execution_ms integer NOT NULL
);

-- Core Platform Tables
CREATE TABLE IF NOT EXISTS platform.tenant (
  id uuid PRIMARY KEY,
  organization_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  shard_key text NOT NULL DEFAULT 'default',
  financial_year_start_month smallint NOT NULL DEFAULT 4,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Global user table (shared identity across tenants)
CREATE TABLE IF NOT EXISTS platform.app_user (
  id uuid PRIMARY KEY,
  mobile_e164 text UNIQUE,
  email citext UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tenant-scoped membership table
CREATE TABLE IF NOT EXISTS platform.membership (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES platform.tenant(id),
  user_id uuid NOT NULL REFERENCES platform.app_user(id),
  status text NOT NULL DEFAULT 'active',
  membership_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
SELECT app.apply_tenant_rls('platform.membership');

-- Transactional Outbox Event Table
CREATE TABLE IF NOT EXISTS platform.outbox_event (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  event_version integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);
CREATE INDEX IF NOT EXISTS outbox_unpublished_idx
  ON platform.outbox_event (available_at) WHERE published_at IS NULL;

ALTER TABLE platform.outbox_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.outbox_event FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_insert_own_tenant ON platform.outbox_event;
CREATE POLICY outbox_insert_own_tenant ON platform.outbox_event
  FOR INSERT TO app_runtime WITH CHECK (tenant_id = app.current_tenant_id());

-- Idempotency tracking table
CREATE TABLE IF NOT EXISTS platform.idempotency_key (
  tenant_id uuid NOT NULL,
  scope text NOT NULL,
  key text NOT NULL,
  request_hash bytea NOT NULL,
  response_status integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, scope, key)
);
SELECT app.apply_tenant_rls('platform.idempotency_key');

-- Processed events table for idempotent consumers
CREATE TABLE IF NOT EXISTS platform.processed_event (
  consumer_name text NOT NULL,
  event_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (consumer_name, event_id)
);
SELECT app.apply_tenant_rls('platform.processed_event');

-- Compliance attestation table for Gate G-FIN
CREATE TABLE IF NOT EXISTS platform.compliance_attestation (
  id uuid PRIMARY KEY,
  reviewer_name text NOT NULL,
  qualification text NOT NULL,
  scope text NOT NULL,
  version text NOT NULL,
  attestation_date date NOT NULL,
  evidence_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Grants
GRANT USAGE ON SCHEMA app TO app_runtime, app_migrator, app_relay;
GRANT USAGE ON SCHEMA platform TO app_runtime, app_migrator, app_relay;
GRANT USAGE ON SCHEMA resident TO app_runtime, app_migrator;
GRANT USAGE ON SCHEMA finance TO app_runtime, app_migrator;
GRANT USAGE ON SCHEMA workforce TO app_runtime, app_migrator;
GRANT USAGE ON SCHEMA maintenance TO app_runtime, app_migrator;
GRANT USAGE ON SCHEMA security TO app_runtime, app_migrator;
GRANT USAGE ON SCHEMA community TO app_runtime, app_migrator;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO app_runtime, app_migrator, app_relay;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO app_runtime;
GRANT INSERT ON platform.outbox_event TO app_runtime;
GRANT SELECT, UPDATE ON platform.outbox_event TO app_relay;
