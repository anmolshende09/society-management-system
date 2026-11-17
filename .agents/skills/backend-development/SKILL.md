# Skill: backend-development

## Purpose

Build maintainable, testable NestJS use cases, domain entities, controllers, and background workers.

## Activation Conditions

- Creating or editing application use cases, domain entities, or NestJS modules.
- Writing controllers, request/response mappers, or queue consumers.

## Procedure

1. Adhere to module layout:
   - `api/`: Public interfaces and DTOs.
   - `domain/`: Pure business rules, entities, value objects, state machines (no framework/IO).
   - `application/`: Use cases orchestrating domain + ports.
   - `infrastructure/`: Drizzle repositories, provider adapters.
   - `http/`: Fastify controllers, decorators, DTO mappings.
   - `db/`: Schema declarations.
2. Ensure handlers wrap data access in `TenantTransaction`.
3. Wrap all JSON responses in `{ data, pagination, error }`.
4. Ensure critical operations produce audit log entries via `AuditApi`.

## Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
```
