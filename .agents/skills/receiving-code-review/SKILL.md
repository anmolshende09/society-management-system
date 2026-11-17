---
name: receiving-code-review
description: Guides how the agent should process review feedback objectively without performative agreement
---

# Skill: receiving-code-review

## Core Posture: Technical Objectivity

When receiving code review feedback or critique:

1. **No Performative Agreement**: Do not say "You're totally right!", "Great catch!", or apologize profusely. Focus purely on technical evaluation and action.
2. **Never Blindly Comply**: If a suggestion weakens security, violates the layer DAG, introduces floating-point currency math, or contradicts `specs.md`, do NOT implement it. Explain the constraint with citations to canonical documents.
3. **Never Weaken Tests to Pass**: Never disable a failing test, loosen an assertion, or delete a security test to make a check pass.

## Review Feedback Processing Flow

### Step 1: Categorize Feedback

For each item in the review:

- **Valid Defect / Gap**: Root cause issue that needs addressing.
- **Style / Nit**: Trivial aesthetic improvement.
- **Clarification / Misunderstanding**: Reviewer lacked context or missed an existing invariant.
- **Conflicting Suggestion**: Conflicts with architectural baseline or security rules.

### Step 2: Implement Fixes via TDD

- For any valid defect, follow `systematic-debugging`:
  1. Add a regression test reproducing the reviewer's finding.
  2. Implement the clean minimal fix.
  3. Verify test passes.

### Step 3: Respond with High-Signal Evidence

Respond to the review with:

- Exact actions taken.
- Code diffs and test additions.
- Terminal verification output.
- Clear, respectful, evidence-based explanations for any items declined.
