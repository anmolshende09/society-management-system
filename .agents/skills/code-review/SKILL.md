# Skill: code-review

## Purpose

Perform rigorous, multi-layered quality, security, and architectural review before PR finalization.

## Activation Conditions

- Reviewing pull requests or work increments before handoff.
- Checking for tenant isolation, financial correctness, or boundary violations.

## Procedure

1. Check tenant boundaries: no illegal imports outside `api/`.
2. Check database safety: RLS enabled, `tenant_id` present, queries run inside `TenantTransaction`.
3. Check financial safety: integer paise via `Money`, no float arithmetic, no unauthorized live gates.
4. Check error handling: uniform JSON wrapper, standard error codes from Appendix F.
5. Check performance: cursor pagination, indexed `tenant_id` queries.

## Output

Review report with findings classified as:

- Critical (blocks merge)
- High (blocks merge)
- Medium (fix or track in issues)
- Low (informational)
