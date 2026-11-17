## Description

<!-- Briefly describe the purpose of this change, context, and link related issues (e.g. Closes #12). -->

## Type of Change

- [ ] `feat`: New feature or user story
- [ ] `fix`: Bug fix
- [ ] `refactor`: Code refactoring without behavior change
- [ ] `test`: New or updated tests
- [ ] `db`: Schema or migration change
- [ ] `docs`: Documentation or context update
- [ ] `ci` / `chore`: Tooling or dependency maintenance

## Layer & Module Classification

- [ ] `L0: Kernel` (shared-kernel, contracts, identity, tenancy, notification, documents, audit, workflow)
- [ ] `L1: Resident` (units, residents, vehicles, directory)
- [ ] `L2: Finance` (charges, billing, invoices, payments, expenses, ledger, Tally sync)
- [ ] `L3: Workforce` (employees, attendance, shifts, leave, payroll)
- [ ] `L4: Maintenance` (complaints, tasks, assets, AMC, vendors, inventory)
- [ ] `L5: Security / Community` (visitors, gates, amenities, notices, events)
- [ ] `Apps` (api, worker, web, platform-admin)
- [ ] `Infra / DB / Tooling` (docker, migrations, tools, scripts)

## Boundary & Tenant Isolation Checks

- [ ] **DAG Integrity**: Module dependencies strictly respect Section 1.3 DAG.
- [ ] **Encapsulation**: No illegal cross-module internal imports (cross-module access is ONLY via `src/api/` or domain events).
- [ ] **No Cross-Module FKs**: Cross-module entity references are plain `uuid` columns.
- [ ] **Tenant Isolation (RLS)**: Every new tenant table has `tenant_id`, `FORCE ROW LEVEL SECURITY`, and `app.apply_tenant_rls(...)`.
- [ ] **Context Protocol**: Database queries run inside `TenantTransaction` using transaction-local `set_config('app.tenant_id', ..., true)`.
- [ ] **Non-Enumerating**: HTTP endpoints return `404 Not Found` rather than `403 Forbidden` on cross-tenant resource lookup.

## Financial Safety (Gate G-FIN) Checklist

- [ ] Does this PR touch `modules/finance/**`, payment gateways, tax calculation, or payroll?
  - [ ] If yes: Money is strictly handled as integer paise (`bigint`) via `Money` value object (no `number`/floating-point).
  - [ ] If yes: JSON APIs serialize paise as decimal strings (`"amountPaise": "125000"`).
  - [ ] If yes: Posted financial records are immutable (reversal entries, debit/credit notes; no UPDATE/DELETE).
  - [ ] If yes: No live gateway or tax compliance is activated without controller review (REQ-FIN-001).
  - [ ] If yes: Linked entry in `docs/compliance/finance-review-register.md`.

## Data Protection (Gate G-DPDP) Checklist

- [ ] Does this PR touch personal data, KYC documents, or visitor logs?
  - [ ] If yes: Consent records and retention periods are respected.
  - [ ] If yes: Sensitive fields are masked/encrypted and audited.

## Mandatory Local Verification Evidence

<!-- All of the following must pass locally before requesting peer review. -->

- [ ] `pnpm format:check` (Prettier code style verified)
- [ ] `pnpm typecheck` (Strict TypeScript compilation across all packages)
- [ ] `pnpm verify:boundaries` (Dependency-cruiser confirms DAG and boundary integrity)
- [ ] `pnpm test` (Unit tests pass via Vitest)

## Peer Review & Team Sign-off

- [ ] Code has been self-reviewed against `AGENTS.md` and `specs.md`.
- [ ] At least one team member has reviewed and approved this PR.
- [ ] Living documentation in `docs/context/` has been updated with relevant progress.
