# ADR-008: Pilot Customer Scope (Standalone Society) and Provisional Organization Model

## Status

Accepted

## Context

Question H-03 in `specs.md` required establishing whether the first customer profile is:

1. A standalone housing society (Resident Welfare Association / Co-operative Housing Society);
2. A builder/developer with multiple phased projects; or
3. A commercial property management firm managing a portfolio of societies.

This decision impacts whether multi-tenant organization aggregation, portfolio billing, and corporate management hierarchies must be built in Phase 1 or deferred.

## Decision

The project owner has confirmed: **Standalone housing society pilot**.

1. **Initial Pilot Scope**:
   - The pilot targets a single standalone housing society.
   - Core focus is deep vertical workflows for that society: Property hierarchy (wings, towers, units), Residents, Billing & Invoicing, Maintenance complaints & tasks, and Security gate.
2. **Provisional Organization Model**:
   - The database schema retains `platform.tenant.organization_id uuid NULL` as a provisional reference.
   - Multi-society corporate organization rollups, consolidated portfolio reporting, and cross-society administrative hierarchies are explicitly deferred and out of initial pilot scope.

## Consequences

- **Positive**: Eliminates premature complexity; concentrates engineering effort on single-society resident, security, and financial operations.
- **Negative**: Property management firms managing multiple societies simultaneously cannot use a unified multi-society dashboard until the organization hierarchy is implemented in a future phase.
