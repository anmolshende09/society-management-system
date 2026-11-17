---
name: verification-before-completion
description: Mandatory verification gate requiring concrete terminal evidence before claiming any task or feature is complete
---

# Skill: verification-before-completion

## The Completion Gate

> **CRITICAL RULE**: Never state or imply to the user that a task, feature, or bug fix is finished without executing the full verification suite and providing the exact terminal outputs as evidence.

"It should work", "I've updated the code", or "the logic is complete" are non-claims. Only empirical test results and compiler outputs constitute evidence.

## Mandatory Quality Gate Checklist

Execute every check in order and record its exit status:

```bash
# 1. Typecheck: Verify strict TypeScript compliance across all packages
pnpm typecheck

# 2. Linting & Formatting: Verify zero lint errors and Prettier compliance
pnpm format:check
pnpm lint

# 3. Unit & Integration Tests: Verify all tests pass
pnpm test

# 4. Architectural Boundaries: Verify no illegal cross-module imports (DAG)
pnpm verify:boundaries

# 5. Production Build: Verify all packages and apps build cleanly
pnpm build

# 6. Database Verification (if DB touched): Verify RLS and migration ledger
pnpm db:verify
```

## Evidence Presentation Standard

Present the verification evidence in the final response using this structured format:

| Verification Gate | Command Executed         | Exit Code | Evidence / Output Summary                 |
| ----------------- | ------------------------ | --------- | ----------------------------------------- |
| Typecheck         | `pnpm typecheck`         | 0         | 21/21 packages successful, 0 errors       |
| Lint / Format     | `pnpm format:check`      | 0         | All matched files use Prettier code style |
| Unit Tests        | `pnpm test`              | 0         | X passed, 0 failed                        |
| Boundary Check    | `pnpm verify:boundaries` | 0         | 0 violations across 175 modules           |
| Workspace Build   | `pnpm build`             | 0         | 21/21 packages built successfully         |

## Context Update Requirement

Before concluding:

- Update `docs/context/current-state.md` with current branch, commit, and verified status.
- Update `docs/context/active-task.md` with completed acceptance criteria.
- Update `docs/context/next-steps.md` with the next safe, prioritized action.
