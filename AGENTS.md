# Agent Operating Constitution — Society ERP

> **STATUS: BINDING GOVERNANCE DOCUMENT.**  
> This file is the primary operating constitution for all AI agents, subagents, and human developers contributing to the Society ERP SaaS platform. Every instruction in this document is mandatory.

---

## 1. Dynamic Source of Truth & Online Research Protocol

### 1.1 Internal Source of Truth Hierarchy

When resolving architectural, domain, or implementation questions, follow this strict precedence:

1. `specs.md` (Technical specification baseline & domain requirements).
2. `docs/canonical/*.md` (Canonical Architecture, Tenant Security, Financial Engineering, and Data Dictionary).
3. `docs/adr/*.md` (Approved, immutable Architecture Decision Records).
4. `modules/<module>/src/api/` (Public interface and event contracts).
5. `AGENTS.md` (This constitution).

If an instruction or requirement is missing, ambiguous, or contradictory, **STOP**. Do not guess or silently decide. Propose an ADR in `docs/adr/` and ask the project owner.

### 1.2 Fast-Changing Knowledge & Dynamic Online Research

Do NOT rely on stale training memory or hallucinate fast-changing external details (such as current LTS runtime lifecycle, library patch APIs, cloud SDK changes, or Indian tax/statutory notifications).

When external research is required, **search online ONLY through credible, primary sources**:

- **Official Documentation**: `postgresql.org`, `nodejs.org`, `nextjs.org`, `orm.drizzle.team`, `redis.io`, `fastify.dev`, `docs.nestjs.com`, `aws.amazon.com`.
- **Official Source Repositories & Release Notes**: Verified GitHub repositories under official organizations (`github.com/nodejs/*`, `github.com/drizzle-team/*`, etc.).
- **Statutory & Legal Portals**: Gazette of India (`egazette.gov.in` for DPDP Rules), Central Board of Indirect Taxes and Customs (`cbic.gov.in` for GST notifications), Income Tax Department (`incometax.gov.in` for TDS).
- **Standards & Specifications**: `rfc-editor.org`, `openapis.org`, `w3.org`.
- **Credible Engineering Publications**: Martin Fowler (`martinfowler.com`), AWS Architecture Blog, Shopify Engineering.

**Strictly Forbidden Sources**: SEO content farms (GeeksforGeeks, TutorialsPoint, Baeldung, random Medium articles, Dev.to listicles, unverified forum snippets).

---

## 2. Superpowers Engineering Lifecycle & Automatic Skill Activation

Development is governed by the **Superpowers Engineering Methodology** (`obra/superpowers`). Agents must automatically invoke the designated skill at each stage of work:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ BRAINSTORMING   │ ──> │ WRITING PLANS    │ ──> │ EXECUTING PLANS │ ──> │ VERIFICATION    │
│ Design gate     │     │ Task breakdown   │     │ TDD Red/Green   │     │ Hard evidence   │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.1 Skill Activation Router

| Situation / Trigger                                  | Mandatory Skill                                  | Enforcement Rule                                                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| New feature, component, API, or architectural change | `.agents/skills/brainstorming/`                  | **HARD DESIGN GATE**: Zero production code or schema changes permitted until design is approved by user and written to `docs/plans/`.               |
| Approved design ready for execution                  | `.agents/skills/writing-plans/`                  | Must produce a granular, task-by-task execution roadmap in `docs/plans/` with exact files and test cases.                                           |
| Executing approved plan tasks                        | `.agents/skills/executing-plans/`                | Implement strictly one task at a time. Never drift or improvise without updating the plan.                                                          |
| Any behavioral change or bug fix                     | `.agents/skills/test-driven-development/`        | **THE IRON LAW OF TDD**: No production code without a failing test written and proven red first.                                                    |
| Bug, failure, unexpected behavior, regression        | `.agents/skills/systematic-debugging/`           | No guessing or trial-and-error edits. Follow 4-phase protocol: Reproduce $\rightarrow$ Hypothesize $\rightarrow$ Isolate $\rightarrow$ Minimal Fix. |
| Separable research, review, or isolated spikes       | `.agents/skills/subagent-driven-development/`    | Delegate to isolated subagent with clear scope and completion definition. Parent agent verifies output.                                             |
| Claiming any task or milestone is complete           | `.agents/skills/verification-before-completion/` | **HARD COMPLETION GATE**: Never claim done without running full check suite and providing exact terminal output evidence.                           |
| Before submitting PR or milestone signoff            | `.agents/skills/requesting-code-review/`         | Request multi-perspective review (correctness, RLS isolation, DAG boundaries, financial exactness).                                                 |
| Processing human or automated review feedback        | `.agents/skills/receiving-code-review/`          | Evaluate feedback technically; no performative agreement; fix root cause or provide evidence-backed counterargument.                                |
| Finishing work on branch; preparing integration      | `.agents/skills/finishing-a-development-branch/` | Verify all CI checks pass, update `docs/context/`, prepare conventional commits.                                                                    |
| Parallel branches or isolated experiments            | `.agents/skills/using-git-worktrees/`            | Create isolated git worktree; never dirty the primary working tree.                                                                                 |

---

## 3. Architecture & Boundary Laws

1. **Modular Monolith Integrity**:
   - Single deployment codebase with two container process types: `api` (HTTP) and `worker` (queues/outbox).
   - **Do not create microservices without an approved ADR**.
2. **Layered Dependency DAG (Section 1.3)**:
   - Module synchronous dependencies form a strict acyclic graph:
     $$\text{Kernel (L0)} \longrightarrow \text{Resident (L1)} \longrightarrow \text{Finance (L2)} \longrightarrow \text{Workforce (L3)} \longrightarrow \text{Maintenance (L4)} \longrightarrow \text{Security \& Community (L5)}$$
   - Upward and lateral communications MUST use asynchronous domain events via the Transactional Outbox.
3. **Encapsulation & Public Contracts**:
   - Cross-module calls use **only** the owning module's `src/api/` contracts or published events.
   - **Never import another module's `domain/`, `application/`, `infrastructure/`, `http/`, or database tables**. Enforced by `pnpm verify:boundaries`.
4. **No Cross-Module Database Foreign Keys**:
   - Tables live in module-owned PostgreSQL schemas (`resident.*`, `finance.*`).
   - Cross-module entity references are plain `uuid` columns. The only allowed cross-schema foreign key target is `platform.tenant(id)`.

---

## 4. Tenant Data Isolation & Security Laws

1. **Mandatory Tenant Column & Forced RLS**:
   - Every table containing tenant data MUST have `tenant_id uuid NOT NULL REFERENCES platform.tenant(id)`.
   - Every tenant table MUST have `FORCE ROW LEVEL SECURITY` enabled.
   - Apply `SELECT app.apply_tenant_rls('<schema>.<table>');` in the same migration that creates the table.
2. **Transaction-Local Context Protocol**:
   - Set tenant context **only** with transaction-local configuration:
     `SELECT set_config('app.tenant_id', $1, true);` (the 3rd parameter `true` is mandatory).
   - **Never use session-level `SET`**. Session-level settings persist on connections recycled by PgBouncer in transaction mode and bleed tenant context.
   - All tenant database operations MUST execute inside `TenantTransaction`. Fail closed: missing context evaluates to `NULL` and yields zero rows.
3. **Database Role Hygiene**:
   - Never grant runtime (`app_runtime`) `BYPASSRLS`, `SUPERUSER`, `TRUNCATE`, schema ownership, or DDL privileges.
   - Migrations authenticate as `app_migrator` and assume `app_owner` via controlled `SET ROLE` within migration jobs only.
4. **Zero-Trust Information Handling**:
   - Never log secrets, passwords, OTPs, bearer tokens, or unmasked personal data.
   - Non-enumerating HTTP response: return `404 Not Found` rather than `403 Forbidden` on cross-tenant resource lookup to avoid existence leaks.

---

## 5. Financial Engineering & Compliance Laws (Gate G-FIN)

1. **Integer Arithmetic in Paise**:
   - Currency is stored and computed strictly as integer paise (`bigint`) via the `Money` value object.
   - **Floating-point arithmetic (`number`, `float`) is strictly forbidden for money, late fees, and taxes**.
2. **JSON Serialization Standard**:
   - In all JSON API requests and responses, paise amounts MUST be serialized as **base-10 decimal strings** (`"amountPaise": "125000"`).
3. **Immutability & Reversals**:
   - Posted financial records are append-only. Corrections MUST use credit notes, debit notes, or reversal journals. Never `UPDATE` or `DELETE` posted financial rows.
4. **Gate G-FIN & Statutory Tax Rules (REQ-FIN-001)**:
   - Live payment gateways (`finance.gateway.live`) and tax compliance calculations (`finance.tax.enabled`) are locked by default.
   - Activation requires an active attestation record in `platform.compliance_attestation` from a qualified financial controller.
   - Indian tax rules (GST thresholds, RWA circular 109/28/2019-GST controversy, TDS) are versioned data (`finance.tax_rule`), never hard-coded in source constants.
5. **Non-Custodial Posture**:
   - The platform MUST NOT take custody of society collections. Settlement flows directly into the housing society's verified commercial bank account.

---

## 6. Documentation & Noise Suppression Standards

1. **Canonical vs. Non-Canonical Governance**:
   - Authoritative baselines (`specs.md`, `docs/canonical/*.md`, `docs/adr/*.md`, `docs/compliance/*.md`) are modified only via approved ADRs.
   - Living documents (`docs/plans/*.md`, `docs/context/*.md`) track active execution and are updated at every step.
2. **Suppress Noise & Emit High Signal**:
   - Do not emit conversational fluff, repetitive explanations, or speculative code.
   - Focus on concrete architectural diagrams, precise type definitions, and terminal verification commands.
3. **Continuous Context Updates**:
   - At the conclusion of any session or task, update `docs/context/current-state.md` and `docs/context/active-task.md` with verified facts.

---

## 7. Mandatory Verification Suite & Definition of Done

A task, branch, or PR is **DONE** only when all of the following pass and terminal outputs are presented:

```bash
pnpm format:check       # Prettier code style verified
pnpm lint               # ESLint clean
pnpm typecheck          # Strict TypeScript compilation across all 23 packages
pnpm test               # Unit tests pass (Vitest)
pnpm verify:boundaries  # Dependency-cruiser confirms DAG and boundary integrity
pnpm build              # Turborepo builds all apps and packages successfully
pnpm db:verify          # Catalog check confirms RLS and forced policies on all tenant tables
```
