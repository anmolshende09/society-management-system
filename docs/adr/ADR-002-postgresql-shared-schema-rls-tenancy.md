# ADR-002: PostgreSQL Shared-Schema Multi-Tenancy with Row-Level Security

## Status

Accepted

## Context

Housing societies require rigorous tenant data isolation. We must balance data isolation guarantees with operational simplicity, resource efficiency, and ease of cross-tenant aggregate reporting. Managing separate databases or schemas per tenant at scale (hundreds of societies) causes significant operational overhead, connection exhaustion, and migration drift.

## Decision

We adopt the **Pool Model** (shared database, shared schema) using PostgreSQL Row-Level Security (RLS) keyed on `tenant_id`:

1. **Schema Separation by Domain**: PostgreSQL schemas are organized by business module (`platform`, `resident`, `finance`, etc.), NOT by tenant.
2. **Mandatory Tenant Column & Forced RLS**:
   - Every tenant data table MUST contain a `tenant_id uuid NOT NULL` column referencing `platform.tenant(id)`.
   - Every tenant table MUST have `FORCE ROW LEVEL SECURITY` enabled.
   - The helper function `app.apply_tenant_rls(table_name)` must be invoked in the same migration that creates the table.
3. **Transaction-Local Context**:
   - Tenant context MUST be established using transaction-local configuration: `SELECT set_config('app.tenant_id', $1, true)`.
   - Session-level `SET` is strictly forbidden because connections recycled by connection poolers (PgBouncer in transaction mode) would leak tenant context to subsequent requests.
   - All tenant database operations are wrapped in a single `TenantTransaction` abstraction.
4. **Role Isolation**:
   - `app_owner`: `NOLOGIN` owner of schemas and tables.
   - `app_migrator`: Controlled login role for migrations only; assumes `app_owner` via `SET ROLE`.
   - `app_runtime`: API and worker connections; `NOSUPERUSER`, `NOBYPASSRLS`, DML only.
   - `app_relay`: Narrowly granted role or security definer function for outbox relay.
   - `app_platform_ops`: Time-boxed, ticketed break-glass role.

## Consequences

- **Positive**: Minimal connection overhead, low infrastructure costs, unified schema migrations, robust database-level isolation defense.
- **Negative**: Requires strict query hygiene, defense-in-depth parameterized SQL, and automated verification (catalog checks and pgTAP test suites).
