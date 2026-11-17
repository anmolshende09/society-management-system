# Canonical Architecture Blueprint & Module Boundary Standards

## 1. Modular Monolith Architecture

The Society ERP SaaS is architected as a **Modular Monolith**:

- Single repository, single deployable codebase.
- Two distinct container process execution types:
  - `api`: Fastify-based NestJS HTTP server serving frontend and integration traffic.
  - `worker`: Standalone NestJS background worker managing BullMQ queues, scheduled repeatable jobs, and the transactional outbox relay.
- High operational simplicity for a small engineering team while maintaining absolute extraction-readiness for future microservices.

---

## 2. Layered Dependency Directed Acyclic Graph (DAG)

Synchronous dependencies between modules MUST strictly follow this acyclic hierarchy:

```
┌────────────────────────────────────────────────────────┐
│ LAYER 0: PLATFORM KERNEL                               │
│ • shared-kernel  • tenancy       • identity            │
│ • notification   • documents     • audit               │
│ • workflow       • search        • reporting-core      │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Synchronous calls permitted
┌──────────────────────────┴─────────────────────────────┐
│ LAYER 1: RESIDENT (Property, Units, Occupants)         │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Synchronous calls permitted
┌──────────────────────────┴─────────────────────────────┐
│ LAYER 2: FINANCE (Dues, Billing, Invoices, Expenses)   │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Synchronous calls permitted
┌──────────────────────────┴─────────────────────────────┐
│ LAYER 3: WORKFORCE (Employees, Shifts, Attendance, HR) │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Synchronous calls permitted
┌──────────────────────────┴─────────────────────────────┐
│ LAYER 4: MAINTENANCE (Complaints, Tasks, AMC, Assets)  │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Synchronous calls permitted
┌──────────────────────────┴─────────────────────────────┐
│ LAYER 5: SECURITY & COMMUNITY                          │
│ • Security (Visitors, Gates, Parcels, Parking, SOS)    │
│ • Community (Amenities, Bookings, Notices, Polls)      │
└────────────────────────────────────────────────────────┘
```

### 2.1 Synchronous Invocation Matrix

Rows depend on columns. `Q` = Read-only Query interface; `C` = Command interface; `none` = Strictly forbidden.

| Module               | Kernel (L0) | Resident (L1) | Finance (L2)       | Workforce (L3)    | Maintenance (L4)   |
| -------------------- | ----------- | ------------- | ------------------ | ----------------- | ------------------ |
| **Resident (L1)**    | Q, C        | —             | none (events only) | none              | none               |
| **Finance (L2)**     | Q, C        | Q             | —                  | none              | none (events only) |
| **Workforce (L3)**   | Q, C        | none          | C (post payroll)   | —                 | none               |
| **Maintenance (L4)** | Q, C        | Q             | C (submit expense) | Q (employee dir)  | —                  |
| **Security (L5)**    | Q, C        | Q             | C (request charge) | Q (guards/shifts) | C (create task)    |
| **Community (L5)**   | Q, C        | Q             | C (request charge) | none              | none               |

---

## 3. Module Boundary Rules & Encapsulation

1. **Public API Contracts Only**:
   - Each module exposes its public contracts via `modules/<domain>/<module>/src/api/`.
   - External callers may **only** import from `modules/<module>/src/api`.
   - Directly importing another module's `domain/`, `application/`, `infrastructure/`, `http/`, or `db/` is strictly prohibited and fails CI via `pnpm verify:boundaries` (`dependency-cruiser`).

2. **Standard Module Internal Layout**:

   ```
   modules/<domain>/<module>/
   ├── src/
   │   ├── api/            # PUBLIC interfaces, DTOs, events, DI tokens
   │   ├── domain/         # Pure entities, value objects, state machines (no I/O)
   │   ├── application/    # Command/Query handlers orchestrating use cases
   │   ├── infrastructure/ # Drizzle repositories, provider adapters
   │   ├── http/           # Fastify controllers, route mappers, guards
   │   ├── db/             # Drizzle schema definitions
   │   └── <module>.module.ts
   └── package.json
   ```

3. **Zero Cross-Module Foreign Keys**:
   - Database schemas mirror module ownership (`resident.*`, `finance.*`, etc.).
   - Tables never establish foreign key constraints across module schemas. Cross-module references are plain `uuid` columns validated at write time through the owning module's facade and checked by a nightly referential integrity job.
   - The only allowed cross-schema foreign key target is `platform.tenant(id)`.

---

## 4. Transactional Outbox Pattern & Domain Events

For all upward and lateral communication across modules:

1. Business entity changes and outbox event insertions occur in the **same database transaction**:
   ```sql
   INSERT INTO platform.outbox_event (id, tenant_id, aggregate_type, aggregate_id, event_type, payload)
   VALUES ($1, $2, $3, $4, $5, $6);
   ```
2. The background worker polls unpublished outbox events using `SELECT ... FOR UPDATE SKIP LOCKED` and publishes to BullMQ.
3. Event consumers are **strictly idempotent**, recording `(consumer_name, event_id)` inside `platform.processed_event` within the consumer's transaction.
