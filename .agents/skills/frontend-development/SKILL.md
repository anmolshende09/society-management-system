# Skill: frontend-development

## Purpose

Guide the implementation of Next.js 16 App Router pages, Server Components, role shells, and PWA experiences.

## Activation Conditions

- Creating or editing UI pages, components, forms, or layouts.
- Implementing role-specific navigation (Resident, Guard, Admin, Accountant).

## Procedure

1. Use React Server Components (RSC) by default for data fetching; use Client Components only where interactivity is required.
2. The Next.js server acts as a Backend-For-Frontend (BFF), managing `httpOnly`, `Secure` session cookies. Never expose JWT tokens to browser JavaScript.
3. Fetch data via the generated TypeScript OpenAPI client from `@society/contracts`. Avoid hand-written fetch URLs.
4. Implement mobile-friendly, large touch targets for guard and worker screens (WCAG 2.1 AA target).
5. Build forms using `react-hook-form` and `zod`.

## Verification Commands

```bash
pnpm typecheck
pnpm lint
```
