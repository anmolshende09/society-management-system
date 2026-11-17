---
name: executing-plans
description: Governs the disciplined, task-by-task execution of approved implementation plans
---

# Skill: executing-plans

## Purpose

Ensure rigorous, sequential execution of approved implementation plans. Prevent scope creep, maintain continuous green builds, and enforce verification at every step.

## Execution Rules

1. **One Task at a Time**: Never attempt to implement multiple plan tasks simultaneously.
2. **Strict TDD**: For every behavioral task, invoke `test-driven-development` (write failing test $\rightarrow$ make it pass $\rightarrow$ refactor).
3. **Verify Immediately**: Run the verification command specified in the plan task before marking it complete.
4. **No Drift**: If an unexpected problem arises that requires altering architecture, schemas, or dependencies, **STOP**. Do not improvise. Propose a diff to the plan and get approval.
5. **Update Living Context**: After each completed task, check off the task in the plan file and update `docs/context/active-task.md`.

## Execution Loop

For each Task in `docs/plans/YYYY-MM-DD-<feature>-plan.md`:

1. Read the task requirements and target files.
2. Write the failing test (`red`). Run test to verify failure.
3. Write the minimal code to satisfy the test (`green`).
4. Run task verification commands.
5. Run lint & typecheck (`pnpm typecheck`).
6. Mark task complete in the plan: `[x] Task N`.
7. Proceed to next task.

When all tasks are complete, trigger `verification-before-completion`.
