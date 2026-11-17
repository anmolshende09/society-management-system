# Skill: api-contract-engineering

## Purpose

Manage code-first Zod schemas, OpenAPI 3.1 specification generation, uniform response wrappers, and client SDKs.

## Activation Conditions

- Defining or changing API DTOs or endpoints.
- Generating or updating OpenAPI 3.1 specifications.
- Managing domain event schemas.

## Procedure

1. Define request and response schemas in Zod.
2. Ensure every endpoint adheres to the uniform response wrapper:
   `{ data: T | null, pagination: PaginationMeta | null, error: ErrorResponse | null }`.
3. Ensure paise amounts are typed as string decimal numbers (`amountPaise`).
4. Generate the OpenAPI 3.1 document and verify compatibility.
5. Generate the typed client SDK for frontend and integration consumers.

## Verification Commands

```bash
pnpm verify:contracts
```
