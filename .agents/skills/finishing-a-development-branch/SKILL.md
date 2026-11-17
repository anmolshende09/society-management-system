---
name: finishing-a-development-branch
description: Governs branch cleanup, quality verification, context update, and conventional commit preparation
---

# Skill: finishing-a-development-branch

## Purpose

Ensure that before any branch is merged, pushed, or handed off, it meets the highest standards of production readiness, zero regressions, and full documentation sync.

## Checklist Before Finishing Branch

### 1. Execute Full Quality Gates

Run all checks from repository root and verify exit code 0:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:boundaries
pnpm build
```

### 2. Inspect Working Tree & Secrets Scan

- Run `git status` to ensure no untracked scratch files, `.env` files, private keys, or debug dumps exist.
- Verify no committed credentials or unredacted personal information.

### 3. Update Living Context Documents

- `docs/context/current-state.md`: Update branch, commit hash, verified checks.
- `docs/context/active-task.md`: Mark task complete with evidence links.
- `docs/context/pending-work.md`: Advance backlog and mark blockers resolved.
- `docs/context/next-steps.md`: Set immediate next priority.

### 4. Format Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(<scope>): <description>`
  - `fix(<scope>): <description>`
  - `test(<scope>): <description>`
  - `refactor(<scope>): <description>`
  - `docs(<scope>): <description>`
  - `chore(<scope>): <description>`
- Include references to feature plans or issue IDs.
