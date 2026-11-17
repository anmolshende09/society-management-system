# Contributing to Society ERP SaaS

Welcome to the **Society ERP SaaS** engineering team! This guide establishes the collaboration workflow, coding standards, and architectural rules for our 4-person development team.

All contributors must adhere to this guide and the binding operating constitution in [`AGENTS.md`](./AGENTS.md).

---

## 1. Quick Onboarding Checklist for Team Members

Follow these steps to get your local environment running from scratch:

### 1.1 Prerequisites

- **Node.js**: `v22.12.0+` (production container uses `Node.js 24 LTS`)
- **pnpm**: `10.5.2` (enable with `corepack enable` or `npm install -g pnpm@10.5.2`)
- **Docker & Docker Compose v2**: Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- **Git**: 2.40+

### 1.2 Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/anmolshende09/society-management-system.git
cd society-management-system

# 2. Install workspace dependencies
pnpm install

# 3. Create local environment configuration
cp .env.example .env

# 4. Start local infrastructure (PostgreSQL, PgBouncer, Redis, MinIO, Mailpit)
docker compose -f infra/docker/compose.yaml up -d

# 5. Bootstrap database roles, schemas, migrations, and development seed data
pnpm db:bootstrap
pnpm db:migrate
pnpm db:seed:dev

# 6. Verify isolation and run checks
pnpm db:verify
pnpm typecheck
pnpm verify:boundaries
pnpm test
pnpm build
```

---

## 2. Team Collaboration & Git Workflow

Our 4-person team works asynchronously on GitHub using short-lived feature branches and peer-reviewed pull requests.

### 2.1 Branch Protection & Naming

Direct pushes to `main` are strictly prohibited. Always create a branch off the latest `main`:

| Branch Prefix              | Purpose                                     | Example                           |
| -------------------------- | ------------------------------------------- | --------------------------------- |
| `feature/<module>-<desc>`  | New feature or capability                   | `feature/resident-occupant-api`   |
| `fix/<module>-<desc>`      | Bug fix or regression patch                 | `fix/finance-rounding-paise`      |
| `refactor/<module>-<desc>` | Code restructuring without behavior changes | `refactor/contracts-zod-schemas`  |
| `test/<module>-<desc>`     | Adding or improving test suites             | `test/maintenance-task-tdd`       |
| `docs/<desc>`              | Documentation, ADR, or context update       | `docs/adr-009-cache-invalidation` |
| `chore/<desc>`             | Dependency, CI, or tool maintenance         | `chore/turborepo-config`          |

### 2.2 Commit Message Standards (Conventional Commits)

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```text
<type>(<scope>): <short description in present tense>

[optional body explaining motivation and architectural rationale]

[optional footer, e.g., Closes #14]
```

**Valid Scopes:** `resident`, `finance`, `maintenance`, `security`, `workforce`, `community`, `kernel`, `identity`, `tenancy`, `contracts`, `api`, `worker`, `web`, `db`, `infra`.

**Examples:**

- `feat(resident): add unit occupant registration use case`
- `fix(security): prevent context bleed in gate check-in transaction`
- `test(finance): add Money rounding property test for paise calculations`
- `docs(adr): record ADR-009 for caching strategy`

### 2.3 Pull Request Lifecycle & Peer Review

1. **Self-Review**: Run the mandatory verification suite locally before opening a PR:
   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm verify:boundaries
   pnpm test
   pnpm build
   ```
2. **Open PR**: Fill out all sections of `.github/pull_request_template.md`.
3. **Automated CI**: GitHub Actions (`ci.yml`) will validate formatting, linting, compilation, DAG boundaries, tests, and build.
4. **Peer Review**: At least one other teammate must review and approve the PR before merging.
5. **Merge**: Squash and merge into `main` with a clean conventional commit title.

---

## 3. Mandatory Architectural Laws

Every pull request must strictly comply with the following four laws (as detailed in [`specs.md`](./specs.md) and [`AGENTS.md`](./AGENTS.md)):

### 3.1 Modular Monolith Integrity & Directed Acyclic Graph (DAG)

Modules live in one deployable codebase but are strictly encapsulated. Synchronous dependencies must strictly flow downwards:

$$\text{Kernel (L0)} \longrightarrow \text{Resident (L1)} \longrightarrow \text{Finance (L2)} \longrightarrow \text{Workforce (L3)} \longrightarrow \text{Maintenance (L4)} \longrightarrow \text{Security \& Community (L5)}$$

- **Import Rule**: Cross-module imports are restricted to the owning module's `src/api/` contract or published domain events. **Never import another module's internal directories (`domain/`, `application/`, `infrastructure/`, `http/`, or database tables)**. Enforced in CI by `pnpm verify:boundaries`.
- **No Cross-Module Database Foreign Keys**: Tables live in module-owned schemas (`resident.*`, `finance.*`). Cross-module references are plain `uuid` columns. The only allowed cross-schema foreign key target is `platform.tenant(id)`.
- **Asynchronous Events**: Upward and lateral cross-module communication must use asynchronous domain events via the Transactional Outbox.

### 3.2 Tenant Isolation & Multi-Tenancy Laws

- **Mandatory Tenant ID**: Every table containing tenant data MUST include `tenant_id uuid NOT NULL REFERENCES platform.tenant(id)`.
- **PostgreSQL Row-Level Security**: Every tenant table MUST have `FORCE ROW LEVEL SECURITY` and apply `SELECT app.apply_tenant_rls('<schema>.<table>');` in its migration.
- **Transaction-Local Context**: Set tenant context **only** with transaction-local configuration:
  ```sql
  SELECT set_config('app.tenant_id', $1, true);
  ```
  _(The 3rd parameter `true` is mandatory)._ **Never use session-level `SET`** to avoid context bleeding across PgBouncer pooled connections.
- **Fail Closed**: Database queries must execute inside `TenantTransaction`. Missing context evaluates to `NULL` and yields zero rows.
- **Non-Enumerating Responses**: Cross-tenant resource lookups must return `404 Not Found` rather than `403 Forbidden` to prevent resource existence enumeration.

### 3.3 Financial Engineering Laws (Gate G-FIN)

- **Integer Arithmetic in Paise**: Currency is stored and computed strictly as integer paise (`bigint`) via the `Money` value object (`@society/shared-kernel`). **Floating-point math (`number`, `float`) is strictly forbidden for money, late fees, and taxes**.
- **JSON Serialization**: Paise amounts in JSON API requests and responses MUST be serialized as base-10 decimal strings (`"amountPaise": "125000"`).
- **Immutability & Reversals**: Posted financial records are append-only. Corrections must use credit notes, debit notes, or reversal journals. Never `UPDATE` or `DELETE` posted financial rows.
- **Gate G-FIN**: Live payment gateways (`finance.gateway.live`) and tax compliance workflows (`finance.tax.enabled`) are locked by default and require formal attestation in `platform.compliance_attestation` from a qualified financial controller before activation (REQ-FIN-001).

### 3.4 Test-Driven Development (TDD)

- For any behavioral change or new capability, write a failing unit/domain test first (Vitest).
- For bug fixes, write a reproduction test that fails before implementing the minimal fix.

---

## 4. Development Commands Reference

| Command                  | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| `pnpm dev`               | Start development servers in parallel (`api`, `web`, `platform-admin`, `worker`) |
| `pnpm build`             | Build all 23 packages and applications via Turborepo                             |
| `pnpm typecheck`         | Strict TypeScript typechecking across all workspace packages                     |
| `pnpm lint`              | Run workspace linter checks                                                      |
| `pnpm format`            | Auto-format codebase with Prettier                                               |
| `pnpm format:check`      | Verify code formatting with Prettier                                             |
| `pnpm test`              | Run unit tests across modules using Vitest                                       |
| `pnpm verify:boundaries` | Verify modular boundary rules and DAG with `dependency-cruiser`                  |
| `pnpm db:bootstrap`      | Initialize local PostgreSQL roles, extensions, and schemas                       |
| `pnpm db:migrate`        | Execute ordered, immutable, checksummed SQL migrations                           |
| `pnpm db:seed:dev`       | Seed synthetic development data                                                  |
| `pnpm db:verify`         | Run RLS catalog check script to verify security policies                         |
| `pnpm db:reset`          | Reset local database (strictly guarded for local development)                    |

---

## 5. Getting Help & Team Communication

- Read [`specs.md`](./specs.md) for the technical specification baseline and domain requirements.
- Review [`docs/canonical/`](./docs/canonical/) for architecture blueprints, tenant security models, and financial engineering rules.
- Check [`docs/adr/`](./docs/adr/) for accepted architectural decisions.
- If you encounter an architectural ambiguity, propose an ADR in `docs/adr/` and discuss with the team.
