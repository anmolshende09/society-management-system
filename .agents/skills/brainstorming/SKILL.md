---
name: brainstorming
description: Mandatory design-first stage for any feature, architectural change, or component design before code is written
---

# Skill: brainstorming

## Purpose

Enforce disciplined problem definition, requirement discovery, and technical design before any implementation begins. Prevent premature code generation, assumptions, and scope sprawl.

## The Hard Gate

> **CRITICAL RULE**: No production code, package installations, schema alterations, or scaffolding may be written until the design has been presented, reviewed, approved by the user, and persisted to `docs/plans/YYYY-MM-DD-<topic>-design.md`.

There is no exception for "simple" features or small components.

## Step-by-Step Procedure

### 1. Explore Project Context

- Read canonical documents: `specs.md`, relevant `docs/canonical/*.md`, and relevant ADRs in `docs/adr/`.
- Inspect existing module APIs and public interfaces (`modules/<module>/api`).
- Check `docs/context/current-state.md` and `docs/context/active-task.md`.

### 2. Clarify Intent & Requirements

- Ask focused, high-signal questions to eliminate ambiguity.
- Distinguish between:
  - **Owner-confirmed requirements** (explicitly stated).
  - **Technical defaults** (best practices from `specs.md`).
  - **Open decisions** (requiring user input).
- Clarify one topic at a time to avoid overwhelming the conversation.

### 3. Propose 2 to 3 Architectural Approaches

- Present technical alternatives with explicit trade-offs:
  - **Approach A (Recommended)**: Why it is best aligned with modular monolith DAG, RLS, and simplicity.
  - **Approach B (Alternative)**: Trade-offs, complexities, or different performance profiles.
  - **Approach C (Minimal/Pragmatic)**: Fastest path with known limitations.
- Evaluate impacts on:
  - Tenant isolation and RLS policies.
  - Layer DAG (Section 1.3).
  - Financial safety (Gate G-FIN, integer paise).
  - Performance and future service extraction.

### 4. Present Structured Design

Present the proposed design clearly:

- **Scope & Non-Goals**: Explicit boundaries of what will NOT be built.
- **Domain Entities & Value Objects**: Pure TypeScript definitions.
- **Database Schema**: Schema, table names, composite keys, RLS policies.
- **Public API & Event Contracts**: DTOs, Zod schemas, error codes.
- **Security & Authorization**: Permissions, property scopes, audit requirements.
- **Failure Modes & Edge Cases**: Idempotency, rollbacks, validation errors.

### 5. Capture Human Approval & Write Design Document

- Await user feedback and explicit approval.
- Once approved, write the full specification to:
  `docs/plans/YYYY-MM-DD-<feature-name>-design.md`.
- Commit or stage the design doc.

### 6. Seamless Transition

- Upon approval of the design document, immediately activate the `writing-plans` skill. Do not start coding directly.
