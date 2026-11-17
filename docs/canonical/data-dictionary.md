# Canonical Data Dictionary & Relational Standards

## 1. Relational Conventions & Invariants

1. **Identifiers**:
   - Primary key column is always `id uuid` generated as **UUIDv7** by the application (for natural chronological sorting and index locality on PostgreSQL 16).
2. **Mandatory Tenant Scoping**:
   - Every tenant data table MUST contain:
     ```sql
     tenant_id uuid NOT NULL DEFAULT app.current_tenant_id()
               REFERENCES platform.tenant(id) ON DELETE RESTRICT
     ```
   - Every tenant data table MUST define a composite unique constraint:
     ```sql
     UNIQUE (tenant_id, id)
     ```
3. **Composite Intra-Module Foreign Keys**:
   - Because foreign key checks in PostgreSQL bypass Row-Level Security, intra-module parent-child relationships MUST use composite foreign keys:
     ```sql
     FOREIGN KEY (tenant_id, parent_id) REFERENCES <schema>.<parent_table> (tenant_id, id)
     ```
   - This mathematically guarantees a child row can never reference a parent row belonging to another tenant, even under superuser or migration bypass roles.
4. **Optimistic Concurrency**:
   - Mutable rows carry `version integer NOT NULL DEFAULT 1`.
   - Updates increment version and check `WHERE version = $expected_version`. Returns `412 PRECONDITION_FAILED` on mismatch.
5. **Auditing Columns**:
   - `created_at timestamptz NOT NULL DEFAULT now()`
   - `updated_at timestamptz NOT NULL DEFAULT now()`
   - `created_by uuid` (nullable actor user ID)
   - `updated_by uuid` (nullable actor user ID)

---

## 2. Partitioning Standards

Partitioning is an optimization and retention strategy, applied ONLY to append-only high-volume log tables:

- `security.visitor_entry` (Partitioned by `occurred_at`, monthly)
- `platform.notification_log` (Partitioned by `created_at`, monthly; 90-day retention)
- `platform.audit_log` (Partitioned by `occurred_at`, monthly; 1-year hot retention)
- `workforce.attendance` (Partitioned by `check_in_time`, monthly)

**Rule**: Do NOT partition business master entities (`finance.invoice`, `resident.unit`, etc.) without measured query profile justification.

---

## 3. Module Schema Catalog

| PostgreSQL Schema | Owning Module    | Core Entities                                                                                                                                                     |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform`        | Platform Kernel  | `tenant`, `app_user`, `membership`, `role`, `permission`, `outbox_event`, `processed_event`, `idempotency_key`, `compliance_attestation`, `migration_ledger`      |
| `resident`        | Resident (L1)    | `society`, `property_node`, `unit`, `resident`, `unit_resident`, `vehicle`, `pet`, `move_request`, `consent_record`                                               |
| `finance`         | Finance (L2)     | `charge_type`, `billing_rule`, `tax_rule`, `charge`, `invoice`, `invoice_line`, `payment`, `receipt`, `expense`, `vendor_bill`, `ledger_entry`, `tally_sync_item` |
| `workforce`       | Workforce (L3)   | `employee`, `department`, `shift`, `roster_assignment`, `attendance`, `leave_request`, `payroll_run`, `payslip`                                                   |
| `maintenance`     | Maintenance (L4) | `complaint`, `complaint_category`, `task`, `task_checklist_item`, `asset`, `amc_contract`, `vendor`, `purchase_order`, `inventory_item`, `stock_txn`              |
| `security`        | Security (L5)    | `gate`, `guard_assignment`, `visitor`, `visitor_entry`, `parcel`, `domestic_help`, `patrol_checkpoint`, `material_gate_pass`, `parking_slot`, `sos_alert`         |
| `community`       | Community (L5)   | `amenity`, `amenity_slot`, `booking`, `event`, `notice`, `notice_ack`, `poll`, `poll_vote`                                                                        |
