---
name: systematic-debugging
description: 4-phase scientific troubleshooting protocol invoked upon encountering bugs, test failures, or regressions
---

# Skill: systematic-debugging

## Principle: No Guessing

Randomly editing code, adding ad-hoc print statements, or applying speculative fixes without understanding root cause is strictly forbidden. Debugging is a scientific, hypothesis-driven process.

## The 4-Phase Protocol

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. REPRODUCE    │ ──> │ 2. HYPOTHESIZE   │ ──> │ 3. ISOLATE      │ ──> │ 4. MINIMAL FIX  │
│ Failing test    │     │ Cause & effect   │     │ Pinpoint line   │     │ Root cause fix  │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └─────────────────┘
```

### Phase 1: Reproduce

1. Never attempt to fix a bug you cannot reliably reproduce.
2. Capture the exact inputs, parameters, tenant context, and environment.
3. Write a failing automated regression test (`<module>.bugfix.spec.ts`) that triggers the defect 100% of the time.
4. Run the test and confirm red output.

### Phase 2: Hypothesize

1. Inspect the stack trace, error logs, and data flow.
2. Formulate 1 to 3 explicit, testable hypotheses:
   - "Hypothesis A: TenantTransaction connection pooler recycled connection without clearing transaction-local GUC."
   - "Hypothesis B: Money division discarded fractional paise without rounding."
3. Write down which component or line of code is suspected and why.

### Phase 3: Isolate

1. Test hypotheses systematically from most to least likely.
2. Use focused unit tests, breakpoints, or targeted log outputs (`pino`).
3. Binary search the call stack or git history (`git bisect`) if regression was recently introduced.
4. Confirm the exact line(s) causing the failure.

### Phase 4: Minimal Fix & Verification

1. Apply the smallest, cleanest fix that addresses the **root cause** (not a symptom mask or null-check bandage).
2. Run the reproduction test written in Phase 1: verify it is now green.
3. Run the full module test suite and workspace regression suite:
   ```bash
   pnpm test && pnpm typecheck && pnpm verify:boundaries
   ```
4. Document the defect, root cause, and fix in `docs/context/known-issues.md` (or resolve the linked issue).
