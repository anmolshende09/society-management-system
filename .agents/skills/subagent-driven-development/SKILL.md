---
name: subagent-driven-development
description: Manages isolated subagent delegation for focused research, spikes, or parallel review without context bloat
---

# Skill: subagent-driven-development

## Purpose

Prevent context window degradation and loss of focus on complex tasks by delegating well-bounded, separable subtasks to specialized subagents.

## When to Use Subagents

- **Codebase / Library Research**: Surveying large directories, complex documentation, or external libraries.
- **Isolated Spikes**: Proving an API integration, Fastify plugin, or Drizzle query in isolation.
- **Multi-Perspective Code Review**: Running independent security, performance, or tenant-isolation reviews.
- **Independent Task Execution**: Parallel execution of tasks that touch non-overlapping modules.

## When NOT to Use Subagents

- Trivial file edits or simple one-line changes.
- Tasks requiring tight interactive user feedback.
- Coordinating complex cross-module database transactions.

## Subagent Charter Protocol

When invoking a subagent, the prompt must explicitly define:

1. **Role & Title**: E.g., "PostgreSQL RLS Security Reviewer".
2. **Charter & Scope**: Exactly what question to answer or file to inspect.
3. **Boundaries**: Files or directories that MUST NOT be modified.
4. **Completion Definition**: Exact format of expected output (e.g., findings table, passing test, proof-of-concept diff).

## Integration & Review

The primary/coordinating agent remains the sole owner of the conversation and integration:

1. Inspect subagent output objectively; do not accept claims without proof.
2. Verify that any code produced satisfies all workspace quality gates (`pnpm typecheck`, `pnpm lint`, `pnpm test`).
3. Integrate the validated output into the main branch/workspace.
