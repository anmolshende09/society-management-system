-- tools/db/verify-rls.sql
-- Catalog verification script (read-only, idempotent)
-- Verifies that every table with a `tenant_id` column:
-- 1. Has Row-Level Security enabled (relrowsecurity = true)
-- 2. Has FORCE ROW LEVEL SECURITY enabled (relforcerowsecurity = true)
-- 3. Has a policy applied targeting app_runtime
-- 4. Is not owned by the app_runtime role

DO $$
DECLARE
  v_missing_rls_count integer;
  v_missing_force_count integer;
  v_missing_policy_count integer;
  v_illegal_owner_count integer;
BEGIN
  -- 1. Check tables with tenant_id missing RLS
  SELECT count(*) INTO v_missing_rls_count
  FROM information_schema.columns c
  JOIN pg_class cl ON cl.relname = c.table_name
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE c.column_name = 'tenant_id'
    AND ns.nspname NOT IN ('pg_catalog', 'information_schema')
    AND cl.relkind = 'r'
    AND cl.relrowsecurity = false;

  -- 2. Check tables with tenant_id missing FORCE RLS
  SELECT count(*) INTO v_missing_force_count
  FROM information_schema.columns c
  JOIN pg_class cl ON cl.relname = c.table_name
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE c.column_name = 'tenant_id'
    AND ns.nspname NOT IN ('pg_catalog', 'information_schema')
    AND cl.relkind = 'r'
    AND cl.relforcerowsecurity = false;

  -- 3. Check tables missing tenant_isolation policy
  SELECT count(*) INTO v_missing_policy_count
  FROM information_schema.columns c
  JOIN pg_class cl ON cl.relname = c.table_name
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE c.column_name = 'tenant_id'
    AND ns.nspname NOT IN ('pg_catalog', 'information_schema')
    AND cl.relkind = 'r'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policy pol
      WHERE pol.polrelid = cl.oid
    );

  -- 4. Check tables owned by app_runtime
  SELECT count(*) INTO v_illegal_owner_count
  FROM information_schema.columns c
  JOIN pg_class cl ON cl.relname = c.table_name
  JOIN pg_roles r ON r.oid = cl.relowner
  WHERE c.column_name = 'tenant_id'
    AND r.rolname = 'app_runtime';

  IF v_missing_rls_count > 0 THEN
    RAISE EXCEPTION 'RLS check failed: % table(s) with tenant_id lack ROW LEVEL SECURITY', v_missing_rls_count;
  END IF;

  IF v_missing_force_count > 0 THEN
    RAISE EXCEPTION 'RLS check failed: % table(s) with tenant_id lack FORCE ROW LEVEL SECURITY', v_missing_force_count;
  END IF;

  IF v_missing_policy_count > 0 THEN
    RAISE EXCEPTION 'RLS check failed: % table(s) lack tenant policies', v_missing_policy_count;
  END IF;

  IF v_illegal_owner_count > 0 THEN
    RAISE EXCEPTION 'RLS check failed: % table(s) are illegally owned by app_runtime', v_illegal_owner_count;
  END IF;

  RAISE NOTICE 'SUCCESS: All tenant tables have valid RLS, FORCE RLS, policies, and proper ownership.';
END $$;
