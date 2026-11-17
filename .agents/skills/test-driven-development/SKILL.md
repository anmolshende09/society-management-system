---
name: test-driven-development
description: Enforces the Iron Law of TDD (Red-Green-Refactor) for all behavioral changes, features, and bug fixes
---

# Skill: test-driven-development

## The Iron Law

> **NO PRODUCTION CODE MAY BE WRITTEN UNLESS A FAILING TEST HAS BEEN WRITTEN AND DEMONSTRATED TO FAIL FIRST.**

Writing code before writing its test is a strict violation of engineering discipline. It leads to confirmation bias, untestable designs, and undetected regressions.

## The Three Laws of TDD

1. You may not write any production code until you have written a failing unit or integration test.
2. You may not write more of a test than is sufficient to fail (and not compiling is a failure).
3. You may not write more production code than is sufficient to pass the currently failing test.

## Red-Green-Refactor Cycle

### Phase 1: RED (Write the Failing Test)

- Create or open `<unit>.spec.ts` located beside the code being developed.
- Write a focused test case that asserts the expected behavior.
- Test description format: `<unit>.<scenario>.<expected_result>`.
  Example: `TenantTransaction.execute.whenContextMissing.throwsTenantContextRequired`.
- Run the test suite:
  ```bash
  pnpm --filter @society/<target> test
  ```
- **VERIFY THE FAILURE**: Confirm that the test fails for the _exact reason expected_ (not due to a typo or syntax error).

### Phase 2: GREEN (Make the Test Pass)

- Write the **minimum** amount of production code required to make the test pass.
- Resist the urge to add speculative logic or features not demanded by the test.
- Re-run the test:
  ```bash
  pnpm --filter @society/<target> test
  ```
- Confirm the test passes cleanly.

### Phase 3: REFACTOR (Clean and Harden)

- Review the code for:
  - DRY (Don't Repeat Yourself) without premature abstraction.
  - Clarity, naming, and TypeScript strict compliance.
  - Performance and memory allocation.
- Re-run tests after refactoring to ensure they remain green.

## Mandatory Edge Cases & Invariants

For Society ERP, every domain test suite must test:

- **Tenant Isolation**: Operation fails closed if tenant context is missing.
- **Financial Exactness**: No floating point, integer paise math, rounding half-up.
- **State Machine Legality**: Valid transitions succeed; illegal transitions return `CONFLICT` (409).
- **Idempotency**: Replay with identical key returns cached result; reused key with different payload returns `409 IDEMPOTENCY_KEY_REUSED`.
