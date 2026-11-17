# ADR-001: Modular Monolith Architecture & Module Boundary Enforcement

## Status

Accepted

## Context

The Society ERP SaaS needs to support an extensive domain model covering 7 core domains: Platform Kernel, Resident, Finance, Workforce, Maintenance, Security, and Community. The developer blueprint explicitly warns against premature microservices extraction for a small engineering team (2 to 6 engineers), which would introduce distributed transaction overhead, network latency, and deployment complexity. At the same time, unconstrained monoliths tend to become tangled "spaghetti", making eventual service extraction or boundary changes difficult.

## Decision

We adopt a **Modular Monolith** architecture:

1. **Single Deployment Codebase**: All modules reside in a single monorepo (`modules/<module>`) and are deployed as two process types sharing the same image: `api` (HTTP composition root) and `worker` (BullMQ queues, schedulers, outbox relay).
2. **Encapsulated Boundaries**:
   - Cross-module access is permitted **only** through a module's public `api/` package (interfaces, DTOs, DI tokens) or through domain events.
   - Direct imports of another module's `domain/`, `application/`, `infrastructure/`, `http/`, or database schemas are forbidden.
3. **Directed Acyclic Graph (DAG)**:
   - Module synchronous dependencies must form an acyclic graph:
     `Kernel (L0) -> Resident (L1) -> Finance (L2) -> Workforce (L3) -> Maintenance (L4) -> Security & Community (L5)`
   - Upward and sideways communications must use asynchronous domain events published via the transactional outbox pattern.
4. **No Cross-Module Foreign Keys**:
   - Database tables use plain UUID columns for cross-module entity references. Only `platform.tenant(id)` may be referenced via foreign key across module schemas.
   - Referential integrity is validated at write time through facades and verified by nightly batch jobs.

## Consequences

- **Positive**: Clean encapsulation, fast local development, in-memory function calls without network overhead, simplified deployments, and clear extraction path to microservices if needed later.
- **Negative**: Requires strict discipline and automated tooling (`dependency-cruiser` in CI) to enforce boundaries.
