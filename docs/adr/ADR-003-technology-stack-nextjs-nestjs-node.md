# ADR-003: Technology Stack Baseline (Next.js 16, NestJS Fastify, Node.js 24)

## Status

Accepted

## Context

Choosing modern, supported, long-term support (LTS) runtimes and frameworks is vital for a robust enterprise SaaS platform. Historical draft choices (e.g., Next.js 14, Node.js 20) are obsolete or in maintenance mode as of the late 2026 baseline.

## Decision

1. **Frontend**: Next.js 16 (App Router) using React Server Components (RSC) and Tailwind CSS / Radix primitives (`shadcn/ui`). The Next.js server operates as a Backend-For-Frontend (BFF), managing `httpOnly`, `Secure` session cookies and keeping tokens out of client-side browser JavaScript.
2. **Backend**: NestJS utilizing the Fastify adapter for high HTTP throughput and lower resource footprint. Code-first validation using Zod producing OpenAPI 3.1 contracts.
3. **Runtime**: Node.js 24 LTS pinned as the production and container baseline. Compatibility with Node.js 26 will be tracked and tested without floating versions.
4. **Toolchain**: pnpm workspaces with Turborepo for monorepo task orchestration and caching. Strict TypeScript 5.x across all packages and modules.

## Consequences

- **Positive**: High performance, modern active LTS support, excellent developer experience, unified TypeScript contracts from backend to frontend.
- **Negative**: Careful validation of Fastify vs Express NestJS plugins and zod-to-OpenAPI 3.1 tooling required during Phase 0 spike.
