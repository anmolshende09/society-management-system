# Skill: testing-tdd

## Purpose

Enforce test-driven development (TDD), regression testing, and verification across unit, integration, and E2E layers.

## Activation Conditions

- Adding or modifying business logic or domain rules.
- Fixing defects and regressions.

## Procedure

1. Write a failing unit or integration test reproducing the desired behavior or defect (`red`).
2. Run test to confirm it fails for the expected reason.
3. Write the minimal code necessary to pass the test (`green`).
4. Refactor while maintaining clean passing tests.
5. Ensure tests run against isolated fixtures, never shared mutable state.

## Verification Commands

```bash
pnpm test
```
