# Next Steps

1. Scaffold core workspace packages:
   - `packages/shared-kernel` (Money, Branded IDs, Result, Error taxonomy)
   - `packages/config` (TS configs, ESLint, dependency-cruiser boundary rules)
   - `packages/contracts` (Uniform response wrapper, EventEnvelope, Zod schemas)
   - `packages/testing` (Test fixtures, mock context)
2. Create Docker Compose local topology (`infra/docker/compose.yaml`, `pgbouncer.ini`).
3. Scaffold initial DB migration ledger and RLS bootstrap SQL (`db/migrations/000_platform_bootstrap.sql`, `tools/db/verify-rls.sql`).
4. Set up `apps/api`, `apps/worker`, and `apps/web` composition roots.
5. Create `.agents/skills/` definitions as outlined in Appendix J.4.
6. Run `pnpm install` and verify `pnpm typecheck` / `pnpm lint`.
