# Skill: documentation-management

## Purpose

Maintain accurate, synchronised documentation, ADRs, compliance registers, and session continuity files.

## Activation Conditions

- Completing a task or development session.
- Adding architectural decisions or compliance evidence.
- Changing APIs, migrations, or dependencies.

## Procedure

1. Verify that `docs/context/current-state.md` and `docs/context/active-task.md` reflect verified facts.
2. If decisions changed, update `docs/adr/` and `docs/context/architectural-decisions.md`.
3. If finance/payment workflows were altered, record entries in `docs/compliance/finance-review-register.md`.
4. Ensure no secrets, tokens, or personal identifiers are written to documentation files.
