# Skill: society-erp-architecture

## Purpose

Guide architectural proposals, new domain modules, and cross-module interactions in the Society ERP modular monolith.

## Activation Conditions

- Creating or restructuring a domain module.
- Introducing a cross-module interaction or public interface.
- Evaluating boundary rules and dependency violations.

## Procedure

1. Verify module layer in the DAG:
   `Kernel (L0) -> Resident (L1) -> Finance (L2) -> Workforce (L3) -> Maintenance (L4) -> Security & Community (L5)`
2. Ensure synchronous calls ONLY go to lower layers via the target module's `api/` directory.
3. For upward or lateral communication, design an asynchronous domain event published via the Transactional Outbox.
4. Validate that no cross-module database foreign keys or direct schema queries are created.
5. If modifying architectural baseline, write an ADR under `docs/adr/`.

## Verification Commands

```bash
pnpm verify:boundaries
```
