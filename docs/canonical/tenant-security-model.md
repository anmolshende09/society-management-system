# Canonical Tenant Data Isolation & Security Model

## 1. Five-Layer Defense-in-Depth Isolation

Multi-tenant data isolation is enforced across five independent layers. A failure in any one layer MUST NOT result in cross-tenant data leakage:

| Layer                  | Enforcement Mechanism                                                                                                      | Failure Prevented                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **1. Authentication**  | JWT signed with ES256 carrying active tenant claim (`tid`). Tenant switching invalidates session and issues a fresh token. | User acting in the wrong society tenant.                |
| **2. Entitlements**    | `EntitlementApi` guards commercial plan limits, quotas, and feature flags before use cases execute.                        | Accessing unpurchased add-ons or exceeding quotas.      |
| **3. Authorization**   | RBAC permissions (`module.resource.action`) plus optional property scopes (society, tower, wing, unit).                    | Acting beyond granted role.                             |
| **4. Database RLS**    | Forced Row-Level Security (`FORCE ROW LEVEL SECURITY`) on all tenant tables evaluated against `app.current_tenant_id()`.   | Forgotten `WHERE tenant_id`, raw query bugs, ORM leaks. |
| **5. Cache & Storage** | Redis keys prefixed with `t:{tenant_id}:`; S3 object keys prefixed with `t/{tenant_id}/`.                                  | Leaks outside the relational database.                  |

---

## 2. PostgreSQL Row-Level Security (RLS) Standards

### 2.1 Table Standard

Every table containing tenant data MUST adhere to this exact specification:

```sql
CREATE TABLE <schema>.<table> (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL DEFAULT app.current_tenant_id()
            REFERENCES platform.tenant(id) ON DELETE RESTRICT,
  -- domain columns --
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  UNIQUE (tenant_id, id) -- Required target for intra-module composite FKs
);

-- Apply forced RLS in the exact same migration:
SELECT app.apply_tenant_rls('<schema>.<table>');
```

### 2.2 Forced RLS Semantics

In PostgreSQL:

- Superusers and roles with `BYPASSRLS` bypass all policies.
- Table owners bypass policies unless `FORCE ROW LEVEL SECURITY` is applied.
- A table with RLS enabled and no policy is default-deny.
- Referential-integrity checks and `TRUNCATE` bypass row security.

**Therefore**:

1. Runtime role (`app_runtime`) MUST NEVER own tables, NEVER have `SUPERUSER`, and NEVER have `BYPASSRLS`.
2. Every tenant table MUST have `FORCE ROW LEVEL SECURITY` enabled.
3. `TRUNCATE` privilege is revoked from `app_runtime`.

---

## 3. Trusted Transaction-Local Context Protocol

### 3.1 Request Flow & PgBouncer Pooling

Connection poolers (PgBouncer) operate in **transaction pooling mode** (`pool_mode = transaction`). In this mode, physical connections are returned to the pool immediately upon `COMMIT` or `ROLLBACK`.

```
Incoming Request
  │
  ▼
AuthGuard (Validates JWT tid)
  │
  ▼
TenantTransaction.run(async (tx) => {
  1. BEGIN;
  2. SELECT set_config('app.tenant_id', $1, true); -- true = transaction-local
  3. SELECT set_config('app.user_id',   $2, true);
  4. ... Execute module queries ...
  5. COMMIT; -- GUC configuration vanishes automatically upon transaction end
});
```

### 3.2 Non-Negotiable Context Invariants

1. **Never use session-level `SET`**: `SET app.tenant_id = '...'` persists on the recycled connection and will bleed to the next tenant request.
2. **Third argument `true` is mandatory**: `set_config(name, value, true)` ensures the setting is strictly scoped to the current transaction.
3. **Fail-Closed by Construction**: With no context set, `app.current_tenant_id()` returns `NULL`, the policy evaluates to `NULL`, and zero rows are readable or writable.
4. **Threat Model (Appendix I.3)**: A custom GUC alone does not defeat arbitrary SQL injection if the runtime role can execute `set_config`. All queries MUST use parameterized SQL via Drizzle repositories; no user-supplied strings are interpolated into SQL.

---

## 4. Database Role Privilege Matrix

| Role               | Login?    | Privileges                                                                                                  | Purpose                                                          |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `app_owner`        | `NOLOGIN` | Owner of schemas, tables, sequences, functions. `NOBYPASSRLS`.                                              | Schema ownership. Never connects directly from applications.     |
| `app_migrator`     | `LOGIN`   | `NOSUPERUSER`, `NOBYPASSRLS`. May `SET ROLE app_owner` within migration transactions.                       | Short-lived migration runner during deployments only.            |
| `app_runtime`      | `LOGIN`   | `NOSUPERUSER`, `NOBYPASSRLS`, `NOCREATEDB`, `NOCREATEROLE`. `SELECT, INSERT, UPDATE, DELETE` grants only.   | API and Worker application runtime connections. Enforced by RLS. |
| `app_relay`        | `LOGIN`   | `NOSUPERUSER`. Narrowly granted access to `platform.outbox_event` and `platform.job_schedule`.              | Background outbox relay only.                                    |
| `app_platform_ops` | `LOGIN`   | `NOSUPERUSER`, `NOBYPASSRLS`. Ticketed, time-boxed break-glass identity with MFA and full session auditing. | Emergency platform operations only.                              |
| `app_readonly`     | `LOGIN`   | `NOSUPERUSER`, `NOBYPASSRLS`. Read-only SELECT grants; still subject to tenant context.                     | Read-replica heavy reporting.                                    |
