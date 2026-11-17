---
name: writing-plans
description: Translates approved design documents into detailed, task-by-task execution plans with exact files and verification gates
---

# Skill: writing-plans

## Purpose

Convert an approved design document into a concrete, step-by-step implementation roadmap. Ensure every step has clear boundaries, exact file paths, explicit test requirements, and deterministic verification criteria.

## Inputs

- Approved design document: `docs/plans/YYYY-MM-DD-<feature>-design.md`.
- Current repository state and existing codebase.

## Plan Quality Standards

A high-signal plan must satisfy:

1. **Granularity**: Tasks should be sized for 10–30 minutes of implementation. Large monolithic tasks must be broken down.
2. **Exact Paths**: Every task must list exact file paths to create or modify.
3. **TDD Bound**: Every behavioral change task must specify the corresponding test file and test cases.
4. **Step Scan & Consistency Check**: Check that all function names, DTO fields, and imports in Step $N$ match Step $N-1$ and Step $N+1$. No ambiguous "implement the rest" steps.
5. **Quality Gates**: Explicit commands to verify each task (`pnpm test`, `pnpm typecheck`, `pnpm verify:boundaries`).

## Plan Document Structure

Write the plan to: `docs/plans/YYYY-MM-DD-<feature>-plan.md` using this format:

```markdown
# Implementation Plan: <Feature Name>

- **Design Document**: `docs/plans/YYYY-MM-DD-<feature>-design.md`
- **Module**: `<module>`
- **Phase**: Phase <N>
- **Target Branch**: `feature/<feature-name>`

## Task 1: <Domain / Entity / Value Object>

- **Goal**: Implement pure domain types and state machine.
- **Files**:
  - `modules/<module>/src/domain/<entity>.ts` (create)
  - `modules/<module>/src/domain/<entity>.spec.ts` (create test)
- **TDD Test**: Test valid and invalid state transitions.
- **Verification**: `pnpm --filter @society/module-<module> test`

## Task 2: <Database Migration & RLS>

- **Goal**: Author SQL migration with tenant_id and apply_tenant_rls.
- **Files**:
  - `db/migrations/NNN_<name>.sql` (create)
  - `modules/<module>/src/db/schema.ts` (create/edit)
- **Verification**: `pnpm db:migrate && pnpm db:verify`

## Task 3: <Application Use Case & Repository>

- **Goal**: Implement use case with TenantTransaction.
- **Files**:
  - `modules/<module>/src/application/<use-case>.ts` (create)
  - `modules/<module>/src/application/<use-case>.spec.ts` (test)
- **Verification**: `pnpm test`

## Task 4: <Public API Contract & Export>

- **Goal**: Expose interface in api/ and verify no DAG violations.
- **Files**:
  - `modules/<module>/src/api/<contract>.ts`
- **Verification**: `pnpm verify:boundaries && pnpm typecheck`

## Task 5: <Verification & Handoff>

- **Goal**: Run complete test suite and update context files.
- **Verification**: `pnpm build && pnpm typecheck && pnpm test && pnpm verify:boundaries`
```

## Transition

Once the plan is written, transition to `executing-plans`.
