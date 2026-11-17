---
name: requesting-code-review
description: Prepares and structures code states or pull requests for thorough, multi-perspective reviews
---

# Skill: requesting-code-review

## Purpose

Structure code changes for rigorous technical evaluation before merging into protected branches or completing major milestones.

## Review Perspectives Matrix

Every pull request or milestone review must examine the code through six specific lenses:

1. **Correctness & Contract Fulfillment**:
   - Does the implementation satisfy all acceptance criteria in the feature spec?
   - Are edge cases (null context, empty lists, boundary values) handled?
2. **Tenant Isolation & RLS Security**:
   - Does every tenant table have `tenant_id` and `FORCE ROW LEVEL SECURITY`?
   - Is all database access wrapped in `TenantTransaction` using transaction-local settings?
   - Is there any risk of cross-tenant context bleed across PgBouncer connections?
3. **Architectural DAG & Encapsulation**:
   - Are cross-module dependencies strictly downward along the layer DAG?
   - Are all cross-module imports restricted to `<module>/api`?
   - Are there zero cross-module database foreign keys?
4. **Financial Safety (Gate G-FIN)**:
   - Is all monetary math performed in integer paise (`bigint`) via `Money`?
   - Are JSON money fields serialized as decimal strings?
   - Are live payment gateways or tax rules disabled unless covered by an attestation?
5. **Operational Resilience & Performance**:
   - Are database queries indexed with `tenant_id` leading?
   - Is pagination cursor-based?
   - Are idempotency keys used on all state-mutating commands?
6. **Simplicity & Maintainability**:
   - Does the code adhere to YAGNI and DRY without over-engineering?
   - Are domain entities and state machines pure TypeScript without framework baggage?

## Review Request Deliverable

Provide a concise summary:

- **Scope & Context**: Feature plan link and user problem solved.
- **Key Files Changed**: Breakdown by module and layer.
- **Verification Evidence**: Commands run and test outputs.
- **Specific Areas for Scrutiny**: Explicitly highlight any complex algorithms or concurrency points.
