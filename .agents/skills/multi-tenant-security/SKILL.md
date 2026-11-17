# Skill: multi-tenant-security

## Purpose

Enforce five-layer defense-in-depth tenant isolation and authorization across the application stack.

## Activation Conditions

- Writing or reviewing database queries and repositories.
- Handling authentication tokens, sessions, or tenant switching.
- Implementing authorization guards, roles, or property-scoped permissions.

## Procedure

1. Verify authentication layer: JWT active tenant claim (`tid`).
2. Ensure repository queries execute inside `TenantTransaction`:
   `SELECT set_config('app.tenant_id', $1, true)` (transaction-local).
3. Validate server-side authorization: `@RequiresFeature(...)` and `@RequiresPermission(...)`.
4. Ensure non-enumerating HTTP response (return 404 rather than 403 on cross-tenant resource lookup).
5. Ensure Redis cache keys, S3 storage paths, BullMQ job payloads, and log tags are prefixed with `tenant_id`.

## Verification Commands

```bash
pnpm db:verify
pnpm test:integration
```
