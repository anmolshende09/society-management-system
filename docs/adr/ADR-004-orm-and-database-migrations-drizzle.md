# ADR-004: Database Access via Drizzle ORM and Immutable Migration Ledger

## Status

Accepted

## Context

PostgreSQL Row-Level Security requires explicit transaction management and seamless execution of `SET LOCAL` / `set_config('app.tenant_id', ..., true)` within the same database transaction as business queries. Heavy ORMs with opaque query-generation abstractions often complicate raw RLS transaction management and connection pooling semantics. Furthermore, blanket "idempotent migrations with IF NOT EXISTS" risk silent schema drift across environments.

## Decision

1. **ORM**: Drizzle ORM is selected for TypeScript schema definition and relational query building. Its thin, SQL-like API maps cleanly to PostgreSQL transaction semantics, making `TenantTransaction` wrapping natural and transparent.
2. **Security-Critical DDL**: Core RLS functions (`app.current_tenant_id()`, `app.apply_tenant_rls()`), role privileges, and exclusion constraints are authored in explicit, version-controlled SQL files.
3. **Immutable Migration Ledger**:
   - Migrations are sequential, immutable, checksummed SQL files.
   - A migration ledger table (`platform.migration_ledger`) tracks applied migration IDs, SHA-256 checksums, execution durations, and timestamps.
   - The migration runner executes pending migrations in deterministic order, skips already-applied migrations, and fails closed if any checksum mismatch or schema drift is detected.
   - Applied migrations are never edited in place; fixes are applied as new forward migrations.

## Consequences

- **Positive**: Full visibility over SQL executed against PostgreSQL, high query performance, zero magic around RLS transaction context, deterministic CI and production deployments.
- **Negative**: Requires writing explicit SQL migrations rather than relying on automatic ORM diff synchronization.
