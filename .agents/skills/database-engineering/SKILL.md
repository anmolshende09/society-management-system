# Skill: database-engineering

## Purpose

Manage schema design, SQL migrations, indexes, Drizzle definitions, and data integrity for Society ERP.

## Activation Conditions

- Creating or altering database tables.
- Adding migrations, indexes, or soft-delete policies.
- Designing partition or retention strategies.

## Procedure

1. Confirm module ownership. Tables must reside in the module's PostgreSQL schema (`resident.*`, `finance.*`, etc.).
2. Every tenant table MUST include `tenant_id uuid NOT NULL REFERENCES platform.tenant(id)`.
3. In the same migration, apply `SELECT app.apply_tenant_rls('<schema>.<table>');`.
4. Ensure composite unique constraints: `UNIQUE (tenant_id, id)` and composite foreign keys within the module.
5. Create an immutable SQL migration file with deterministic numbering (`db/migrations/NNN_<name>.sql`).
6. Update the Drizzle ORM schema in `modules/<module>/db/schema.ts`.
7. Rehearse migration with the ledger runner.

## Verification Commands

```bash
pnpm db:migrate
pnpm db:verify
```
