# Phase 1 Foundation Design — Owner Amendments (v1)

**Date**: 2026-11-17  
**Status**: AWAITING OWNER APPROVAL — Do not advance to `writing-plans` until explicitly approved  
**Author**: Project owner via brainstorming review session  
**Skill**: `brainstorming` — hard design gate active  
**Next action**: Owner confirms approval → activate `writing-plans` skill

> [!IMPORTANT]
> Zero production code or schema changes are permitted until this document is marked
> **APPROVED** by the project owner. This is a brainstorming/design gate document only.

---

## ADR Status Decisions (Confirmed)

### ADR-008 — Pilot Customer Scope

**Status: Accepted** (confirmed by owner, 2026-11-17)

Alignment confirmed:

- Standalone housing society pilot.
- Nullable `organization_id` retained provisionally in `platform.tenant`.
- Portfolio workflows and multi-society corporate hierarchies deferred.

### ADR-007 — Accounting Authority

**Status: Proposed — owner confirmation required** (corrected 2026-11-17)

The earlier session recorded this as "Accepted" without explicit owner confirmation.
That was incorrect. This ADR remains **Proposed** until the owner explicitly says:

> "Society ERP is the authoritative statutory ledger."

**Consequence**: No COA tables, no double-entry journal schema, no period-lock infrastructure
may be built until ADR-007 is formally accepted. G-FIN remains locked independently.

---

## Approach A — Phase 1 Architecture: Accepted with 14 Amendments

The base architecture (modular monolith, Postgres shared-schema RLS, NestJS Fastify API,
Next.js 16 frontend, Drizzle ORM, UUIDv7 PKs) is **accepted** subject to all 14 amendments
below. **All amendments are hard constraints, not suggestions.**

---

### Amendment 1 — RLS Trust Model is Phase 0 Spike #1

The RLS tenant isolation trust model must be the **first** security spike in Phase 0
(Milestone 0.3/0.4), not a later concern.

**What this means**:

- Before any tenant business schema or migration is written, one of the two approved
  trust models (see Amendment 3) must be selected, implemented as a spike, and
  exploit-tested with the negative test suite (see Amendment 8).
- The RLS spike must pass through PgBouncer in transaction mode, not just direct Postgres.
- The spike result must be recorded as an ADR before Milestone 0.4 is marked complete.

---

### Amendment 2 — No Tenant Schema Until Trust Model Exploit-Tested

No `CREATE TABLE` for any tenant-scoped business table (resident, finance, etc.) may appear
in any migration until:

1. The trust model ADR (from Amendment 1) is merged.
2. The exploit-test suite (Amendment 8) is green against the chosen model.
3. The exploit-test suite runs in CI and blocks merges.

This applies to both the `platform` schema and all module schemas
(`resident.*`, `finance.*`, `workforce.*`, `maintenance.*`, `security.*`, `community.*`).

---

### Amendment 3 — Approved Trust Model Options (pick one)

The bare custom GUC approach (`SET app.tenant_id = '<uuid>'`) is **not sufficient** as
the sole tenant authorization mechanism. Only one of the following two models is approved:

#### Option A — Signed Tenant Context Validated by a Restricted Database Function

```
Application sets: SELECT app.set_tenant_context('<signed-jwt-or-hmac-token>');
Restricted DB function: validates signature, extracts tenant_id, writes to GUC
RLS policies: read from app.current_tenant_id() — a SECURITY DEFINER function
              that returns NULL if context was not set via the validated path.
```

- The signing key is NOT accessible to `app_runtime`.
- `app_runtime` can only call `app.set_tenant_context()`, not write the GUC directly.
- A forged `SET LOCAL app.tenant_id = '<attacker-uuid>'` has no effect because
  the RLS policy reads through the validated function, not the raw GUC.

#### Option B — Database-Established Identity Context

```
Per-tenant database role (or Postgres SET ROLE within TenantTransaction):
  - app_runtime assumes a prepared role that carries tenant identity in its attributes.
  - The role itself is the proof of identity — no GUC forgery possible.
RLS policies: read from current_setting('app.tenant_id', true) but only after
              the role-based context is established by the connection setup.
```

**Selection criterion**: Whichever option is chosen must be documented in an ADR,
spike-implemented, and negatively tested before any tenant table is created.

---

### Amendment 4 — Bare app.tenant_id GUC Is Not Sufficient Authorization

> A bare `SET LOCAL app.tenant_id = '<uuid>'` or `SELECT set_config('app.tenant_id', $1, true)`
> set directly by the application layer is **not sufficient** as tenant authorization.

Rationale: If `app_runtime` can directly write the GUC, any compromised query path
(SQL injection, misconfigured parameterization, internal tooling bug) can forge the
tenant context. The trust model (Amendment 3) must eliminate this attack surface.

This does **not** prohibit using the GUC as the propagation mechanism — it prohibits
the application layer from being the sole writer of the authoritative tenant value
without a database-side validation step.

---

### Amendment 5 — Table Classification: Global vs. Tenant-Scoped

Before any Phase 1 table is designed, it must be explicitly classified as:

| Classification            | Definition                                                       | Examples                                                                                  |
| ------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Global**                | Shared across all tenants; no `tenant_id`; no RLS                | `platform.tenant`, `platform.feature`, `platform.plan`, `platform.compliance_attestation` |
| **Tenant-scoped**         | Belongs to one tenant; `tenant_id NOT NULL`; FORCE RLS mandatory | `resident.unit`, `resident.resident`, `finance.invoice`, `platform.identity.session`      |
| **Platform-admin-scoped** | Operated by platform staff; not tenant-visible                   | `platform.support_access_log`, `platform.migration_ledger`                                |

A table classification register must be maintained in `docs/canonical/data-dictionary.md`
and updated for every new table before that table's migration is written.

---

### Amendment 6 — Tenant Table Contract (all 8 fields mandatory)

For every tenant-scoped table, all eight of the following must be explicitly defined
in a design document before any migration SQL is written:

| Field                      | Description                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant_id`                | `uuid NOT NULL REFERENCES platform.tenant(id)` — always present, never nullable                                                              |
| Default context            | How `tenant_id` is populated (e.g., `DEFAULT app.current_tenant_id()` or explicit application-layer pass-through)                            |
| `FORCE ROW LEVEL SECURITY` | Mandatory — table-level declaration                                                                                                          |
| Policy role                | Which role the RLS `USING` clause checks against (e.g., `app_runtime`)                                                                       |
| Composite uniqueness       | Natural uniqueness expressed as `UNIQUE (tenant_id, <business_key>)` — never unique on `id` alone for tenant data                            |
| Ownership                  | Table owned by `app_owner`; never by `app_runtime`                                                                                           |
| Grants                     | `SELECT, INSERT, UPDATE, DELETE` to `app_runtime`; no `TRUNCATE`, `ALTER`, `DROP`                                                            |
| Intra-module composite FKs | Cross-table references within the same module must include `tenant_id` in the foreign key — `(tenant_id, referenced_id)` → `(tenant_id, id)` |

---

### Amendment 7 — TenantTransaction Is the Only Supported Database Access Path

```
TenantTransaction is the sole approved mechanism for executing tenant-scoped database operations.

Rules:
1. All queries against tenant-scoped tables MUST run inside TenantTransaction.
2. TenantTransaction establishes the trust-model-validated tenant context (Amendment 3)
   before any application query runs.
3. TenantTransaction wraps every operation in a database transaction (BEGIN/COMMIT/ROLLBACK).
4. Direct database client calls outside TenantTransaction are forbidden for tenant data.
5. The global database client (outside TenantTransaction) may only be used for:
   - Platform-global tables (platform.tenant, platform.feature, platform.plan).
   - Migration scripts (run as app_migrator, not app_runtime).
   - Health checks and diagnostic read-only queries.
6. Reporting queries (see Amendment 10) run through TenantTransaction with a read-only
   role assumption.
```

This constraint must be enforced by:

- A lint/boundary rule that flags direct `db.query()` calls in module application layers.
- An integration test that proves a query outside TenantTransaction is rejected or returns no rows.

---

### Amendment 8 — Mandatory Negative Test Suite

The following negative tests must be in the test suite **before** any tenant-scoped
table is created, and must remain green in CI permanently:

| Test ID | Test Description                                                                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NEG-001 | **Forged tenant context**: Application directly writes a crafted GUC value; query must return zero rows and/or raise an exception                                        |
| NEG-002 | **Missing context**: Query executes with no tenant context set at all; must return zero rows                                                                             |
| NEG-003 | **Tenant A vs Tenant B**: Tenant A's credential successfully reads/writes Tenant B's row; must be blocked at RLS                                                         |
| NEG-004 | **PgBouncer pooling bleed**: Concurrent requests for Tenant A and Tenant B through the same PgBouncer pool; Tenant B's context must never surface in Tenant A's response |
| NEG-005 | **app_runtime privilege escalation**: `app_runtime` attempts `BYPASSRLS`, table ownership, `TRUNCATE`, schema creation; must all be rejected                             |
| NEG-006 | **Role impersonation**: `app_runtime` attempts `SET ROLE app_owner` or `SET ROLE app_migrator`; must be rejected                                                         |
| NEG-007 | **Migration identity isolation**: Running a migration as `app_runtime` (not `app_migrator`) must fail                                                                    |
| NEG-008 | **Replay attack on signed context** (if Option A chosen): A replay of an expired or revoked signed token must be rejected by `app.set_tenant_context()`                  |

---

### Amendment 9 — Read Contracts and Command Contracts Are Separated

The public API contracts (`modules/<module>/src/api/`) must separate read and write
operations:

```
Read contracts  → <module>.api.ts   (or *.query.api.ts)
                  - Return types only; no mutation side effects
                  - Quota consumption MUST NOT be a side effect of a read contract

Command contracts → <module>.commands.api.ts
                  - Mutations only
                  - Every command that consumes quota must declare:
                    a. Idempotency key type (UUIDv7 from client or server-generated)
                    b. Concurrency rule (optimistic lock version, advisory lock, or queue-serialized)
                    c. Rollback / compensation behavior on partial failure
```

Quota consumption (entitlement decrement, usage counter increment) is a **mutation boundary**:

- It must run inside a serialized transaction with explicit concurrency control.
- Reading a quota balance is a read contract — it must not decrement the quota.
- Double-spending prevention is a mandatory test for every quota-consuming command.

---

### Amendment 10 — Read-Only Reporting Repository and Role

A dedicated reporting data-access layer must be defined and enforced:

```
Database role:   app_reporting (NOINHERIT; member of app_runtime group for RLS;
                                no INSERT, UPDATE, DELETE grants)
Repository type: ReportingRepository<T> — a distinct class/interface from MutationRepository<T>
Access path:     TenantTransaction (read-only mode — BEGIN READ ONLY; SET ROLE app_reporting)
```

**Enforcement rules**:

- Reporting code (any class implementing or using `ReportingRepository`) must have zero
  import edges to `MutationRepository`, command handlers, or domain service classes
  that execute writes.
- `pnpm verify:boundaries` must include a rule that flags these cross-edges.
- Reporting queries run on the read replica (Phase 4+) without code changes by
  swapping the connection string — this requires the read contract separation above.

---

### Amendment 11 — Auth Spike Required Test Coverage

The Phase 0 auth spike (Milestone 0.6) must demonstrate all of the following:

| Test     | Description                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-001 | PKCE: Authorization Code with PKCE flow end-to-end; `code_verifier`/`code_challenge` validated                                        |
| AUTH-002 | BFF cookies: Backend-For-Frontend issues `HttpOnly, Secure, SameSite=Lax` session cookie; JavaScript cannot read session token        |
| AUTH-003 | CSRF: State-mutating endpoints reject requests without valid CSRF proof                                                               |
| AUTH-004 | Refresh rotation: Issuing a new access token rotates the refresh token; the old refresh token is immediately invalidated              |
| AUTH-005 | Refresh reuse detection: Re-use of a rotated (invalidated) refresh token invalidates the entire session family                        |
| AUTH-006 | Session revocation: Explicit logout invalidates all tokens in the session; subsequent refresh attempts are rejected                   |
| AUTH-007 | JWKS rotation: Rotating the signing key pair; previously issued valid JWTs continue to verify until they expire; forged JWTs fail     |
| AUTH-008 | Platform-admin MFA: Platform admin accounts require TOTP/FIDO2 as a second factor; login without MFA is rejected                      |
| AUTH-009 | Tenant switch: A user with memberships in multiple tenants can switch context; the new JWT contains only the switched tenant's claims |
| AUTH-010 | Cross-tenant authorization: A JWT scoped to Tenant A cannot access Tenant B's resources                                               |

---

### Amendment 12 — Vetted OIDC Library for Auth and Token Issuance

The authentication and token issuance implementation **must not** hand-roll JWT signing,
PKCE validation, or OIDC flows.

Approved approach:

- Use a vetted, actively maintained OIDC/OAuth2 server library (e.g., `node-oidc-provider`
  or an equivalent with active CVE response history) for the built-in identity issuer.
- The choice must be recorded in an ADR (Phase 0 Milestone 0.6 prerequisite).
- The library must support: PKCE, JWKS endpoint, refresh rotation, token revocation,
  session management, and MFA/AMR claims.
- The identity issuer sits behind the `IdentityPort` abstraction — it is replaceable
  with an external IdP (e.g., Auth0, Keycloak) without changing the application layer.

---

### Amendment 13 — G-FIN Locked: Full Scope Confirmed

G-FIN remains **locked**. This supersedes any previous session statements. Explicitly:

| Locked Feature                                 | Condition to Unlock                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `finance.gateway.live` (any production tenant) | G-FIN granted by qualified financial controller; recorded in `platform.compliance_attestation`    |
| `finance.tax.enabled` (GST, TDS calculations)  | G-FIN granted; Indian tax rules implemented as versioned `finance.tax_rule` data, never constants |
| Statutory ledger / double-entry journal        | ADR-007 accepted (owner confirmation) **AND** G-FIN granted **AND** legal review                  |
| Payroll statutory components (PF, ESI, PT)     | Controller review record present in `docs/compliance/finance-review-register.md`                  |

---

### Amendment 14 — Gate Before writing-plans

> Do not produce the writing plan or any production code or schema until this document
> receives explicit owner approval.

The gate sequence is:

```
[This document] → Owner says "approved" → writing-plans skill activated → plan written
→ Owner reviews plan → Owner says "proceed" → executing-plans skill activated → TDD begins
```

No step may be skipped or merged.

---

## Open Questions Requiring Owner Resolution Before writing-plans

The following are **not** answerable by engineering inference. Owner input is required:

| ID    | Question                                                                                                                            | Impact                                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| OQ-01 | ADR-007: Do you explicitly confirm "Society ERP is the authoritative statutory ledger"?                                             | Unlocks double-entry schema design; without this, Finance (Phase 2+) is scoped as operational sub-ledger only |
| OQ-02 | Trust model selection: Option A (signed context + restricted DB function) or Option B (database-established identity / role-based)? | Required before Milestone 0.3/0.4 spike can begin                                                             |
| OQ-03 | OIDC library preference: `node-oidc-provider` or another specific vetted library?                                                   | Required for Auth spike ADR (Milestone 0.6)                                                                   |

---

## Summary: What Changes from the Previous Brainstorm

| Area                        | Before                    | After (Amended)                                                                  |
| --------------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| ADR-007 status              | Accepted                  | Proposed — owner confirmation required                                           |
| ADR-008 status              | Accepted                  | Accepted ✅ (no change)                                                          |
| RLS spike timing            | Phase 0, unordered        | **First** spike in Phase 0, blocks all tenant schema work                        |
| Tenant schema creation gate | Could begin with scaffold | Blocked until trust model ADR merged + exploit-tests green                       |
| Trust model                 | Bare GUC acceptable       | Only Option A or Option B; bare GUC insufficient                                 |
| Table design contract       | Informal                  | 8 mandatory fields documented per table before migration                         |
| Read / command separation   | Informal                  | Hard boundary in `src/api/`; quota = mutation with explicit idempotency          |
| Reporting                   | Informal                  | Dedicated `app_reporting` role + `ReportingRepository` with boundary enforcement |
| Auth spike scope            | PKCE + JWT basic          | 10 specific named tests (AUTH-001 through AUTH-010)                              |
| OIDC library                | Unspecified               | Must be vetted library behind `IdentityPort`                                     |
| G-FIN scope                 | Locked                    | Locked — explicit table of what it gates (Amendment 13)                          |
| Path to writing-plans       | After brainstorm          | Only after owner explicitly approves **this document**                           |
