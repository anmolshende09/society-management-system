# Society ERP SaaS: Technical Specification

| Field           | Value                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document        | `specs.md`                                                                                                                                                         |
| Version         | 1.2 (implementation-ready engineering baseline)                                                                                                                    |
| Date            | 2026-11-16                                                                                                                                                         |
| Status          | Implementation-ready engineering baseline; owner approvals, compatibility spikes, and production gates remain pending (see Appendix H, Appendix I, and Appendix J) |
| Source material | Society ERP SaaS Complete Feature List (PDF), Society ERP SaaS Developer Blueprint (PDF)                                                                           |
| Audience        | Developers, architects, QA, DevOps, and AI coding agents working in Antigravity                                                                                    |
| Change history  | v1.2: standardized Node.js 24; clarified ordered, immutable, checksummed, ledger-tracked migrations; aligned earlier security guidance with Appendix I.            |

---

## 0. Front Matter

### 0.1 Product summary

A multi-tenant, India-first Society ERP SaaS platform. Each housing society is a tenant. The platform connects resident and property management, maintenance billing, complaints and tasks, visitor and gate security, HRM, assets and vendors, inventory, finance and accounting, amenities and community features in one auditable workflow.

The core value is traceability across modules, not the length of the module list:

```
Resident -> Complaint -> Task -> Worker/Vendor -> Asset -> Inventory -> Completion -> Expense -> Accounting -> TallyPrime
```

### 0.2 Rules for AI agents and developers working from this file

These rules are binding for every generated change.

1. Sections 1 to 4 are constraints. Section 5 is the work order. Appendices are reference.
2. Cross-module access happens only through a module's `api/` package (section 1.4) or through events (section 1.5). Never import another module's `domain/`, `application/`, `infrastructure/`, or database tables.
3. Every table that contains tenant data MUST have a `tenant_id` column and MUST be registered with `app.apply_tenant_rls(...)` in the same migration that creates it (section 2.4).
4. Money is stored as integer paise (`bigint`) and handled with a `Money` value object. Floating point is forbidden for money and tax.
5. Do not enable, hard-code, or "helpfully complete" live payment or tax compliance behaviour. Those flows are gated (section 1.6, gate G-FIN).
6. Setup scripts, seeders, and operational jobs MUST be idempotent. Database migrations MUST be immutable after application and executed exactly once by a migration ledger with checksums; do not use broad `IF NOT EXISTS` guards to hide schema drift. Migration recovery and retry behaviour must be explicitly tested.
7. Prefer standalone scripts in `tools/` for bulk or setup operations over manual UI steps.
8. When a decision in this file must change, propose the change as a diff against this file plus an ADR in `docs/adr/`, not a rewrite.
9. Permissions, entitlements, and tenant isolation are enforced on the server. Hiding a button is not authorization.
10. No new top-level dependency without an ADR.

### 0.3 Baseline decision register

"Given" means supplied by the project owner. "Default" means chosen by this draft using standard expert defaults and open to change.

| ID   | Decision                                                                                          | Origin                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | Modular monolith, microservices extraction delayed, strict module encapsulation from day one      | Given                                   | Matches Developer Blueprint guidance (no dozens of microservices)                                                                                                                                                                                                                                                                                                                                                                |
| D-02 | Multi-tenancy: shared database, shared schema, PostgreSQL Row-Level Security keyed on `tenant_id` | Given                                   | Section 2                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D-03 | Frontend: Next.js 16, App Router                                                                  | Default correction to obsolete baseline | Next.js 16 is Active LTS as of 2026-11-16. Confirm exact patch version and dependency compatibility in Phase 0; do not scaffold on Next.js 14.                                                                                                                                                                                                                                                                                   |
| D-04 | Backend: NestJS, TypeScript strict, Node.js 24 LTS baseline                                       | Given (NestJS), Default correction      | Node.js 24 is the selected project runtime baseline. Node.js 26 compatibility must be tested during Phase 0 as a future upgrade candidate; do not switch the project baseline automatically. Any later move to Node.js 26 requires a documented, approved ADR after NestJS, native dependencies, build images, CI, and deployment have all been validated. Record an upgrade date before the selected major reaches end of life. |
| D-05 | Primary database: PostgreSQL 16                                                                   | Given                                   | PostgreSQL 16 has no native `uuidv7()`; generate UUIDv7 in the application. PostgreSQL 16 remains supported at the review date; evaluate 17/18 and managed-service/extension compatibility before production.                                                                                                                                                                                                                    |
| D-06 | API: OpenAPI 3.1, uniform JSON wrapper with `data`, `pagination`, `error`                         | Given                                   | Tooling must be verified in the Phase 0 spike (section 3.3)                                                                                                                                                                                                                                                                                                                                                                      |
| D-07 | Auth: OAuth 2.0 with JWT                                                                          | Given                                   | Issuer design in section 3.4                                                                                                                                                                                                                                                                                                                                                                                                     |
| D-08 | Infrastructure: Docker Linux containers defined via Infrastructure as Code                        | Given                                   | Terraform or OpenTofu by default                                                                                                                                                                                                                                                                                                                                                                                                 |
| D-09 | Cloud region: India (AWS Mumbai primary, Hyderabad for DR)                                        | Default                                 | Section 4                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D-10 | Queue and cache: Redis 7 with BullMQ                                                              | Default                                 |                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| D-11 | ORM and migrations: Drizzle ORM with hand-authored SQL migrations                                 | Default                                 | Prisma with its documented RLS client extension is an acceptable alternative                                                                                                                                                                                                                                                                                                                                                     |
| D-12 | Monorepo: pnpm workspaces plus Turborepo                                                          | Default                                 |                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| D-13 | Cross-module database references are soft (no foreign keys across modules)                        | Default                                 | Keeps modules extractable. Section 1.3                                                                                                                                                                                                                                                                                                                                                                                           |
| D-14 | Mobile delivery: PWA first, React Native (Expo) apps later                                        | Default                                 | Assumption A-04                                                                                                                                                                                                                                                                                                                                                                                                                  |

### 0.4 Research basis

Sources were limited to official documentation and established engineering publications. Low-credibility SEO listicles and student-project schemas were set aside.

| Topic                                                                                                                                                            | Source                                                                                                                              | Applied in       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| RLS semantics: table owners and superusers or `BYPASSRLS` roles bypass policies, `FORCE ROW LEVEL SECURITY`, default-deny when no policy exists                  | PostgreSQL documentation, Row Security Policies (postgresql.org/docs/19/ddl-rowsecurity.html)                                       | 2.2, 2.4         |
| Pool, bridge, silo partitioning models; RLS centralises isolation in the database                                                                                | AWS Database Blog, "Multi-tenant data isolation with PostgreSQL Row Level Security"; AWS Prescriptive Guidance, RLS recommendations | 2.1, 2.3         |
| Transaction-local tenant context (`SET LOCAL` or `set_config(..., true)`) is required under transaction-mode poolers                                             | Engineering write-ups on PgBouncer plus RLS                                                                                         | 2.3, 4.2         |
| Modular monolith with enforced boundaries, same deployment unit                                                                                                  | Shopify Engineering: "Deconstructing the Monolith", "Enforcing Modularity in Rails Apps with Packwerk"                              | 1.1 to 1.4       |
| Transactional outbox for reliable event publishing, idempotent consumers                                                                                         | microservices.io pattern as summarised by multiple engineering publications                                                         | 1.5, 3.5         |
| TallyPrime exposes XML over HTTP (default port 9000, ENVELOPE with HEADER and BODY)                                                                              | Tally Solutions developer documentation (help.tallysolutions.com)                                                                   | 4.6              |
| Webhook signature (HMAC SHA256 over raw body) and duplicate delivery handled with the event id header; ordering not guaranteed                                   | Razorpay developer documentation                                                                                                    | 3.6, 1.6         |
| Next.js support lifecycle (16 Active LTS, 15 Maintenance LTS, 14 unsupported as of 2026-11-16)                                                                   | Official Next.js Support Policy                                                                                                     | D-03             |
| DPDP Act commencement schedule as notified in G.S.R. 843(E), 2025-11-13; staged commencement, including provisions commencing after one year and eighteen months | Gazette of India notification                                                                                                       | 2.12, Appendix I |
| GST treatment of RWA maintenance charges is contested (CBIC circular 109/28/2019-GST vs Madras High Court view)                                                  | Tax practitioner summaries                                                                                                          | 1.6              |

Gap noted: there is no authoritative public reference schema for society management platforms. The domain model here is derived from the two supplied PDFs and applied to the established multi-tenant patterns above.

### 0.5 Conventions

- MUST, MUST NOT, SHOULD, MAY are used as in RFC 2119.
- Identifiers: `D-` decisions, `A-` assumptions, `G-` release gates, `REQ-` requirements, `ADR-` architecture decision records.
- INR is the only currency. Financial year defaults to 1 April to 31 March, stored per tenant.
- Timestamps are `timestamptz` in UTC. Display timezone is `Asia/Kolkata` by default and configurable per tenant.

### 0.6 Engineering review precedence

Appendix I records the engineering review performed on 2026-11-16. Where an earlier paragraph conflicts with Appendix I, Appendix I controls until the relevant ADR is approved. The original product scope and module boundaries are preserved; the amendments tighten implementation safety, lifecycle accuracy, and operational feasibility. No claim in this document means code, infrastructure, legal compliance, or a production control has already been implemented or tested.

---

## 1. Domain Boundaries and Domain Modules

### 1.1 Architectural principles

- One deployable codebase, two process types: `api` (HTTP) and `worker` (queues, schedulers, outbox relay). Same image, different command.
- Boundaries are enforced by code structure, lint rules, and database ownership, not by convention.
- Each module owns its data. Only the owning module reads or writes its tables.
- Synchronous dependencies between modules MUST form a directed acyclic graph (section 1.3). Where a reverse flow is needed, use events and a local read projection.
- Shared engines (identity, tenancy and entitlements, notification, documents, audit, approvals, automation) live in the platform kernel. Business modules never rebuild them.
- Extraction readiness: a module can later become a service by replacing its in-process `api/` implementation with a network client, because callers only ever see the interface.

### 1.2 Module map

Four primary domains carry the business. A platform kernel and a few supporting modules complete the blueprint scope.

| Layer     | Module                                                                                                                                                                                             | Blueprint scope covered                                                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L0 Kernel | `shared-kernel` (types only), `identity`, `tenancy` (tenants, plans, entitlements, usage), `notification`, `documents`, `audit`, `workflow` (approvals and automation), `search`, `reporting-core` | SaaS Super Admin, subscriptions, roles and permissions, notifications and channels, document vault, audit and timeline, approval engine, automation engine, global search |
| L1        | **Resident**                                                                                                                                                                                       | Society profile, property hierarchy, units, residents, owners, tenants, family, vehicles registry, pets, move-in and move-out, resident directory and privacy controls    |
| L2        | **Finance**                                                                                                                                                                                        | Charges, billing, invoices, payments, receipts, expenses, vendor payables, reconciliation, optional internal ledger, TallyPrime sync, utility meter billing               |
| L3        | **Workforce** (supporting)                                                                                                                                                                         | Employees, attendance, shifts, leave, payroll, worker performance data                                                                                                    |
| L4        | **Maintenance**                                                                                                                                                                                    | Complaints, SLA and escalation, tasks, work orders, assets, AMC, preventive maintenance, vendors, procurement, inventory                                                  |
| L5        | **Security**                                                                                                                                                                                       | Visitors, pre-approved guests, delivery, parcels, domestic help, guards, gates, patrol, material gate pass, parking and violations, SOS and emergency directory           |
| L5        | **Community** (supporting)                                                                                                                                                                         | Amenities and booking, events, notices, meetings, polls, community feed                                                                                                   |

The dependency rule: a module may call the `api/` of modules in a lower layer only. Same-layer and upward calls are forbidden and must use events.

### 1.3 Allowed synchronous dependencies

Rows depend on columns. `Q` means read-only query interface. `C` means command interface.

| Depends on -> | Kernel | Resident | Finance            | Workforce              | Maintenance        |
| ------------- | ------ | -------- | ------------------ | ---------------------- | ------------------ |
| Resident      | Q, C   | n/a      | none (events only) | none                   | none               |
| Finance       | Q, C   | Q        | n/a                | none                   | none (events only) |
| Workforce     | Q, C   | none     | C (post payroll)   | n/a                    | none               |
| Maintenance   | Q, C   | Q        | C (submit expense) | Q (employee directory) | n/a                |
| Security      | Q, C   | Q        | C (request charge) | Q (guards, shifts)     | C (create task)    |
| Community     | Q, C   | Q        | C (request charge) | none                   | none               |

Consequences worth stating explicitly:

- Resident needs "does this unit have dues?" for move-out clearance. It MUST NOT call Finance. Finance publishes `finance.dues.changed` and Resident keeps a local projection table `resident.unit_dues_status`.
- Finance needs the billing party for a unit. It calls `ResidentDirectory.resolveBillingParty` (allowed, Resident is lower).
- Maintenance needs cost data back from Finance. Finance publishes `finance.expense.approved`; Maintenance stores a cost projection on the task or work order.
- Workforce task productivity metrics are built from Maintenance events (`maintenance.task.completed`), not by calling Maintenance.

Data ownership rules:

- No cross-module foreign keys. A cross-module reference is a plain `uuid` column (for example `maintenance.task.unit_id`) validated at write time through the owning module's facade and checked by a nightly referential-integrity job. The only allowed foreign key target from any module is `platform.tenant(id)`.
- A module may keep a denormalised snapshot of another module's data (for example vendor name on an expense) when history must not change retroactively.
- Reports that join across modules use read models fed by events, or the `reporting-core` module's views built on published projections. Reporting never queries a module's tables directly.

### 1.4 Explicit inter-module interfaces

Interfaces are TypeScript contracts in each module's `api/` folder, bound through NestJS dependency-injection tokens. The tenant, user, and request context are carried implicitly by the request-scoped context (section 2.3), so method signatures omit them. All methods are tenant-scoped by construction.

#### Kernel interfaces

```ts
// platform/tenancy/api/entitlement.api.ts
export interface EntitlementApi {
  isEnabled(featureKey: FeatureKey): Promise<boolean>;
  assertEnabled(featureKey: FeatureKey): Promise<void>; // throws FEATURE_NOT_ENTITLED
  consume(
    featureKey: FeatureKey,
    qty: number,
    idempotencyKey: string,
  ): Promise<UsageResult>; // quotas, credits
  getLimit(featureKey: FeatureKey): Promise<LimitValue>;
}

// platform/identity/api/access.api.ts
export interface AccessApi {
  can(permission: PermissionKey, scope?: PropertyScope): Promise<boolean>;
  assert(permission: PermissionKey, scope?: PropertyScope): Promise<void>;
  currentActor(): ActorContext; // userId, membershipId, roles, impersonation flag
}

// platform/notification/api/notification.api.ts
export interface NotificationApi {
  registerTemplates(moduleKey: string, templates: TemplateDefinition[]): void; // called at module bootstrap
  send(req: {
    templateKey: string;
    recipients: RecipientRef[]; // resolved by Resident/Workforce facades before the call
    data: Record<string, unknown>;
    dedupeKey: string; // idempotent send
    channels?: Channel[]; // limited by entitlements and consent
  }): Promise<NotificationId>;
}

// platform/workflow/api/approval.api.ts
export interface ApprovalApi {
  submit(req: {
    requestType: ApprovalType;
    subjectRef: EntityRef;
    amountPaise?: bigint;
    context: object;
  }): Promise<ApprovalRequestId>;
  getStatus(id: ApprovalRequestId): Promise<ApprovalStatus>; // approved, rejected, returned, pending
}

// platform/audit/api/audit.api.ts
export interface AuditApi {
  record(e: {
    action: string;
    entity: EntityRef;
    before?: unknown;
    after?: unknown;
    reason?: string;
  }): Promise<void>;
}

// platform/documents/api/document.api.ts
export interface DocumentApi {
  createUploadIntent(req: UploadIntentRequest): Promise<UploadIntent>; // presigned URL, object storage
  attach(docId: DocumentId, owner: EntityRef): Promise<void>;
  getDownloadUrl(docId: DocumentId): Promise<SignedUrl>; // permission checked
}
```

#### Resident (L1)

```ts
// resident/api/resident-directory.api.ts
export interface ResidentDirectoryApi {
  getUnit(unitId: UnitId): Promise<UnitSummary | null>;
  listUnits(
    scope: PropertyScope,
    page: PageRequest,
  ): Promise<Page<UnitSummary>>;
  getOccupants(unitId: UnitId, asOf?: Date): Promise<OccupantSummary[]>; // owner, tenant, family, authorized occupant
  resolveBillingParty(unitId: UnitId, asOf: Date): Promise<BillingParty>; // used by Finance
  resolveNotificationTargets(
    unitId: UnitId,
    purpose: NotifyPurpose,
  ): Promise<RecipientRef[]>; // respects privacy and consent
  findResidentByMobile(mobile: E164): Promise<ResidentSummary | null>; // used by Security
  getVehicle(vehicleId: VehicleId): Promise<VehicleSummary | null>;
  listVehicles(unitId: UnitId): Promise<VehicleSummary[]>;
  getPropertyTree(root?: PropertyNodeId): Promise<PropertyNode>;
}
```

Events published: `resident.unit.created`, `resident.occupancy.changed`, `resident.tenant.approved`, `resident.move_in.approved`, `resident.move_out.approved`, `resident.move_out.completed`, `resident.vehicle.registered`.
Events consumed: `finance.dues.changed` (projection), `security.domestic_help.blocked` (profile flag).

#### Finance (L2)

```ts
// finance/api/dues.api.ts
export interface DuesApi {
  getUnitDues(unitId: UnitId, asOf?: Date): Promise<DuesSummary>; // outstanding, advance, overdue buckets
  getDuesForUnits(unitIds: UnitId[]): Promise<Map<UnitId, DuesSummary>>;
}

// finance/api/charge.api.ts
export interface ChargeApi {
  requestCharge(req: {
    chargeTypeKey: string; // amenity, parking, move_in, penalty, repair, special_assessment, custom
    unitId: UnitId;
    amountPaise: bigint; // pre-tax; tax derived from controller-approved TaxRule only
    sourceRef: EntityRef; // booking, parking allocation, move request, task
    idempotencyKey: string; // sourceRef plus purpose
    dueDate?: Date;
    description: string;
  }): Promise<ChargeId>;
  cancelCharge(chargeId: ChargeId, reason: string): Promise<void>; // reversal pattern, never delete
}

// finance/api/expense.api.ts
export interface ExpenseApi {
  submitExpense(req: {
    categoryKey: string;
    vendorRef?: EntityRef; // Maintenance vendor
    amountPaise: bigint;
    taxLines?: TaxLineInput[];
    links: EntityRef[]; // task, work order, asset, purchase order, complaint
    attachments: DocumentId[];
    idempotencyKey: string;
  }): Promise<ExpenseId>;
  getExpenseStatus(id: ExpenseId): Promise<ExpenseStatus>;
}

// finance/api/payroll-posting.api.ts   (called by Workforce)
export interface PayrollPostingApi {
  postPayrollRun(
    run: PayrollRunSummary,
    idempotencyKey: string,
  ): Promise<PostingId>;
}
```

Events published: `finance.invoice.generated`, `finance.invoice.overdue`, `finance.payment.received`, `finance.payment.failed`, `finance.payment.refunded`, `finance.dues.changed`, `finance.expense.approved`, `finance.expense.paid`, `finance.tally_sync.failed`.
Events consumed: `resident.move_out.approved` (final charges), `resident.occupancy.changed` (billing party changes).

#### Workforce (L3)

```ts
// workforce/api/employee-directory.api.ts
export interface EmployeeDirectoryApi {
  getEmployee(employeeId: EmployeeId): Promise<EmployeeSummary | null>;
  listAssignable(filter: AssignableFilter): Promise<EmployeeSummary[]>; // by department, skill, property, on-shift
  getShiftRoster(
    scope: GateOrDepartmentRef,
    window: DateRange,
  ): Promise<ShiftAssignment[]>;
  isOnDuty(employeeId: EmployeeId, at: Date): Promise<boolean>;
}
```

Events published: `workforce.attendance.missed_checkin`, `workforce.attendance.recorded`, `workforce.leave.approved`, `workforce.payroll.approved`.
Events consumed: `maintenance.task.completed` (productivity projection), `security.guard.checked_in` (attendance sync).

#### Maintenance (L4)

```ts
// maintenance/api/work.api.ts   (called by Security, Community, and automation)
export interface WorkApi {
  createTask(req: {
    source: TaskSource; // manual, complaint, asset, amc, preventive, inspection, meeting, hr, security, vendor, inventory, procurement, amenity
    title: string;
    priority: TaskPriority; // Low, Normal, High, Urgent, Critical
    location: LocationRef; // property node or unit
    linkedEntities?: EntityRef[];
    dueAt?: Date;
    idempotencyKey: string;
  }): Promise<TaskId>;
  getTaskSummary(taskId: TaskId): Promise<TaskSummary | null>;
}

// maintenance/api/asset.api.ts
export interface AssetApi {
  getAsset(assetId: AssetId): Promise<AssetSummary | null>;
  getOpenWorkForAsset(assetId: AssetId): Promise<TaskSummary[]>;
}

// maintenance/api/vendor.api.ts   (called by Finance only through events and snapshots, listed for completeness)
export interface VendorApi {
  getVendor(vendorId: VendorId): Promise<VendorSummary | null>; // name, GST, PAN, bank (restricted fields need permission)
}
```

Events published: `maintenance.complaint.created`, `maintenance.complaint.assigned`, `maintenance.complaint.closed`, `maintenance.task.assigned`, `maintenance.task.overdue`, `maintenance.task.completed`, `maintenance.asset.breakdown_reported`, `maintenance.amc.expiring`, `maintenance.inventory.below_minimum`, `maintenance.purchase_order.received`.
Events consumed: `finance.expense.approved` and `finance.expense.paid` (cost projection), `security.incident.raised` (optional auto-task), `workforce.leave.approved` (reassignment).

#### Security (L5)

```ts
// security/api/access-control.api.ts   (consumed by Resident through events, exposed here for Community and kiosk)
export interface AccessControlApi {
  isEntryAllowed(req: {
    subject: SubjectRef;
    gateId: GateId;
    at: Date;
  }): Promise<AccessDecision>;
}
```

Events published: `security.visitor.waiting`, `security.visitor.entered`, `security.visitor.exited`, `security.parcel.received`, `security.domestic_help.blocked`, `security.parking.allocated` (triggers parking charge), `security.parking.violation_recorded`, `security.patrol.missed`, `security.incident.raised`, `security.sos.triggered`.
Events consumed: `resident.move_in.approved` and `resident.move_out.completed` (enable or disable gate access), `resident.occupancy.changed`, `resident.vehicle.registered`.

#### Community (L5)

Events published: `community.booking.confirmed`, `community.booking.cancelled`, `community.notice.published`, `community.event.registration_created`.
Calls: `ChargeApi.requestCharge` for paid bookings and events, `ResidentDirectoryApi` for audience resolution.

### 1.5 Event contract

Events are the only upward and sideways channel. Published through the transactional outbox (section 3.5).

```json
{
  "eventId": "01JD...uuidv7",
  "eventType": "maintenance.task.completed",
  "eventVersion": 1,
  "tenantId": "uuid",
  "occurredAt": "2026-11-16T09:30:00Z",
  "actor": {
    "userId": "uuid",
    "membershipId": "uuid",
    "viaImpersonation": false
  },
  "aggregate": { "type": "task", "id": "uuid" },
  "correlationId": "uuid",
  "causationId": "uuid",
  "payload": {}
}
```

Rules:

- Event names are `<module>.<aggregate>.<past_tense_verb>`. Versions are additive; breaking changes publish a new `eventVersion` and run both for one release.
- Payloads carry ids and the minimum facts consumers need. No PII beyond what the consumer is entitled to.
- Consumers are idempotent. Every consumer records `(consumer, eventId)` in `platform.processed_event` inside its handling transaction.
- Delivery is at least once. Ordering is guaranteed only per aggregate, so consumers MUST tolerate out-of-order and duplicate events.
- Each consumer re-establishes tenant context from `tenantId` before touching data.

### 1.6 Finance and accounting bounds

This module carries legal and monetary risk. Its boundary is deliberately narrow.

> **PROJECT REQUIREMENT (REQ-FIN-001).** All local payment integrations and tax compliance workflows MUST undergo review by a qualified financial controller before deployment to any production environment. No payment gateway may be switched to live mode, and no tax-bearing invoice flow may be enabled for a production tenant, until the review is recorded and approved (gate **G-FIN**, section 5.8).

#### In scope

- Charge catalog and billing rules: fixed, area x rate, unit type, consumption, and a restricted formula expression evaluator (no `eval`, no arbitrary code).
- Invoice lifecycle: Draft, Generated, Sent, Partially Paid, Paid, Overdue, Cancelled. Credit and debit notes. PDF generation.
- Payment recording for UPI, card, net banking, bank transfer, cheque, cash. Receipts, partial payments, advances, refunds, reversals, adjustments.
- Gateway integration behind a `PaymentGatewayPort` adapter (section 3.6). Webhooks verified by HMAC over the raw body, deduplicated by the provider event id, and processed idempotently without assuming event order.
- Expenses, vendor bills, vendor payables, resident receivables, expense approvals through `ApprovalApi`.
- Bank statement import, automatic matching, manual review queue.
- Operational accounting events and an optional internal double-entry ledger (feature-flagged per tenant): chart of accounts, journals, cash and bank books, trial balance, income and expense, balance sheet.
- TallyPrime synchronisation through a queue and an isolated bridge (section 4.6). The SaaS stays the operational source of truth; Tally is a posting target.
- Utility meter readings converted to consumption charges.

#### Out of scope for V1

- Statutory filing of any kind (GST returns, TDS returns, income tax). The platform may export data for a filer.
- Being the statutory books of account where the tenant uses Tally for that purpose.
- Statutory payroll computation (PF, ESI, professional tax, TDS on salary) beyond configurable components. Rules are data, reviewed by the controller, never hard-coded.
- Holding or pooling society funds. The platform MUST NOT take custody of collections. Settlement goes to the society's own account through the gateway arrangement the controller approves. Confirm regulatory position with the controller and counsel before pilot.
- E-invoicing and e-way bill integrations (decision deferred to the controller review).

#### Design rules

1. Money: `bigint` paise, `Money` value object, currency fixed to INR, rounding mode and rounding point defined once in configuration and reviewed under G-FIN.
2. Tax and penalty rules are versioned data (`finance.tax_rule`, `finance.late_fee_rule`) with an effective date range. Nothing tax-related lives in code constants.
3. Posted financial records are immutable. Corrections use reversal entries and credit or debit notes, never update or delete.
4. Every payment, refund, billing run, recurring job, and Tally post carries an idempotency key. Replays return the original result.
5. Every financial action writes an audit record with actor, old and new values, device, IP, and reason where required.
6. Feature flags `finance.gateway.live` and `finance.tax.enabled` default to off in production. Flipping them requires a row in `platform.compliance_attestation` (reviewer name, qualification, scope, adapter or rule version, date, evidence link). The runtime MUST refuse activation without a matching active attestation.
7. Sandbox and test-mode gateways are allowed in non-production environments and for internal demos with no real funds.

#### Rules that must be data, with known controversy

- GST on society maintenance charges depends on a per-member monthly threshold and on aggregate turnover. Whether tax applies to the whole amount or only the excess over the threshold has been disputed: the tax board's circular says the entire amount, while a High Court has taken the opposite view. The platform must not choose. It models the rule as configurable data and ships with tax disabled until the tenant's controller approves a configuration.
- Treatment of corpus funds, sinking funds, late fees, interest, and penalties.
- TDS and GST on vendor bills, input credit eligibility, and registration status per society.

#### Controller review scope (checklist, tracked in `docs/compliance/finance-review-register.md`)

- Payment gateway integrations: flows, settlement model, refund and reversal handling, webhook handling, reconciliation.
- Tax rule configuration model and each default template shipped to tenants.
- Invoice, receipt, credit note, and debit note formats and numbering.
- Late fee, penalty, interest, and rounding rules.
- Chart of accounts templates and default Tally ledger mappings.
- Payroll components and statutory configuration screens.
- Financial year handling and period locking.
- Audit trail and correction patterns.
- Vendor payment, TDS and GST capture fields.

### 1.7 Core cross-module flow (reference)

Owner of each step is in brackets. Cross-module steps are events unless marked as a call.

```
1. Resident raises complaint                         [Maintenance: complaint]
2. Manager reviews and creates or links a task       [Maintenance: task, WorkApi internal]
3. Task assigned to employee or vendor               [Maintenance, call EmployeeDirectoryApi]
4. Worker accepts, works, records time and material  [Maintenance]
5. Material consumed reduces stock                   [Maintenance: inventory]
6. Evidence uploaded, manager verifies               [Maintenance, call DocumentApi]
7. Expense submitted for the work                    [Maintenance -> call ExpenseApi]
8. Expense approved and paid                         [Finance, ApprovalApi]  -> event finance.expense.approved
9. Cost appears on task, asset history               [Maintenance: projection]
10. Accounting event queued and posted to Tally      [Finance: sync queue -> bridge]
11. Resident confirms resolution, complaint closed   [Maintenance]
```

The cross-module trace for any rupee is the chain of `links` stored on the expense (task, work order, asset, vendor, complaint) and surfaced by the optional Finance-to-Operations Trace report.

---

## 2. Tenant Data Isolation

### 2.1 Model and terminology

- **Tenant** = one housing society (or one commercial or mixed property). Every business row belongs to exactly one tenant.
- **Organization** (optional) = a property management company that manages several tenants. It has no data of its own beyond membership and reporting roll-ups.
- **Membership** = a user's role set inside one tenant. One login can hold memberships in many tenants and many units.
- Partitioning model: **pool** (shared database, shared schema). PostgreSQL schemas are used for module ownership (`resident`, `finance`, `maintenance`, ...), NOT for tenant separation. Do not confuse this with the "bridge" model.
- Escape hatch: a `platform.tenant.shard_key` column and a connection router abstraction let a very large or contractually isolated tenant move to a dedicated database (silo) later without code changes in modules.

### 2.2 Defence in depth

Isolation is enforced in five independent layers. A bug in one must not cause a leak.

| Layer                    | Mechanism                                                                                              | Failure it prevents                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1. Authentication        | JWT carries active tenant id (`tid`); tenant switching issues a new token                              | User acting in the wrong tenant                        |
| 2. Entitlements          | `EntitlementApi` guard per feature and quota                                                           | Using modules or limits not purchased                  |
| 3. Authorization         | RBAC permissions `module.resource.action` plus optional property scope, field-level restrictions       | Acting beyond role                                     |
| 4. Database RLS          | Policies on every tenant table, `FORCE ROW LEVEL SECURITY`, non-owner runtime role without `BYPASSRLS` | Forgotten `WHERE tenant_id`, raw queries, ORM mistakes |
| 5. Storage, cache, queue | Tenant-prefixed keys and tenant-carrying job payloads                                                  | Leaks outside the database                             |

Key facts from PostgreSQL documentation that drive the design:

- Superusers and roles with `BYPASSRLS` always bypass policies.
- Table owners bypass policies unless the table is altered with `FORCE ROW LEVEL SECURITY`.
- A table with RLS enabled and no policy is default-deny.
- Referential-integrity checks and `TRUNCATE` are not subject to row security.

Therefore: the runtime role never owns tables, never has `BYPASSRLS`, and every tenant table is forced.

### 2.3 Database roles

Appendix I.4 is the normative clarification for this role model; this section and the SQL examples below must be implemented consistently with it.

| Role               | Purpose                                                | Attributes                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app_owner`        | Non-login owner of application schemas and tables      | `NOLOGIN`; reached only through the approved `app_migrator` migration job using controlled `SET ROLE`; never used as a direct application connection identity                                                                                                                                                   |
| `app_migrator`     | Short-lived CI/deployment migration identity           | `LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT`; may `SET ROLE app_owner` only for the approved migration job; no API/worker use                                                                                                                                                              |
| `app_runtime`      | API and worker connections                             | `LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`; DML grants only; subject to RLS                                                                                                                                                                                                                        |
| `app_relay`        | Restricted outbox relay and scheduler identity         | Prefer narrowly scoped `SECURITY DEFINER` relay functions; if the illustrative direct cross-tenant relay path is selected, `BYPASSRLS` requires an approved ADR, isolated credentials/pool, exact-object grants (for example `platform.outbox_event` and `platform.job_schedule`), and audit of every operation |
| `app_platform_ops` | Just-in-time, ticketed break-glass platform operations | No blanket `BYPASSRLS`; use narrowly scoped, time-bound, audited procedures and separately approved access; never an always-on application credential                                                                                                                                                           |
| `app_readonly`     | Replica reporting                                      | `NOBYPASSRLS`; explicit read-only grants and policies for this role; tenant context still required                                                                                                                                                                                                              |

Migrations MUST NOT run as `app_runtime` or by connecting directly as `app_owner`. The short-lived `app_migrator` identity is used only by the approved migration job and may assume `app_owner` through the controlled role-membership path. The migration identity MUST differ from the runtime identity.

### 2.4 Tenant context and policy standard

#### Request flow

```
HTTP request
 -> AuthGuard validates JWT (signature, exp, aud, sid not revoked)
 -> TenantContextMiddleware reads `tid`, verifies active membership (cached by membership version)
 -> nestjs-cls (AsyncLocalStorage) stores { tenantId, userId, membershipId, requestId, impersonation }
 -> EntitlementGuard, PermissionGuard
 -> Handler -> TenantTransaction.run(fn)
      BEGIN;
      SELECT set_config('app.tenant_id', $1, true);   -- transaction-local
      SELECT set_config('app.user_id',   $2, true);
      ... module queries ...
      COMMIT;                                          -- settings vanish
```

Rules:

- Tenant context is set ONLY with transaction-local settings (`set_config(name, value, true)` or `SET LOCAL`). A session-level `SET` MUST NOT be used. Under a transaction-mode pooler (PgBouncer), a session-level value would survive on the recycled connection and leak to the next client.
- No database access occurs outside `TenantTransaction`. The data access layer exposes no connection that has not been wrapped. A lint rule and a runtime assertion enforce this.
- Fail closed: with no context set, `current_setting('app.tenant_id', true)` is NULL, the policy evaluates to NULL, and no rows are visible or writable.
- Transaction-local GUC settings prevent context from surviving into the next PgBouncer transaction, but a freely settable custom GUC is not itself a security boundary against arbitrary SQL executed as `app_runtime`. The trusted tenant-context design remains a Phase 0 blocker; evaluate and prove one of the trust models in Appendix I.3 before tenant data is used.
- Worker jobs and event consumers rebuild the context from the job or event `tenantId` before any query. A job without `tenantId` is rejected unless explicitly flagged `platformJob`.

#### Standard tenant-context/RLS SQL pattern (migration execution is ledger-controlled)

```sql
-- 000_platform_bootstrap.sql
CREATE SCHEMA app;
CREATE SCHEMA platform;

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.apply_tenant_rls(p_table regclass) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', p_table);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %s', p_table);
  EXECUTE format(
    'CREATE POLICY tenant_isolation ON %s AS PERMISSIVE FOR ALL TO app_runtime
       USING (tenant_id = app.current_tenant_id())
       WITH CHECK (tenant_id = app.current_tenant_id())', p_table);
END $$;
```

```sql
-- Local bootstrap roles (repeatable setup, not application migrations).
-- app_owner owns objects but has no login; app_migrator is the only migration login.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_owner') THEN
    CREATE ROLE app_owner NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_migrator') THEN
    CREATE ROLE app_migrator LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_relay') THEN
    -- This illustrative direct-access relay variant uses BYPASSRLS. Enable it
    -- only after an approved ADR confirms it is necessary; isolate credentials
    -- and pool, and grant only exact relay objects. Otherwise use a narrowly
    -- scoped SECURITY DEFINER relay-function design with NOBYPASSRLS.
    CREATE ROLE app_relay LOGIN NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_platform_ops') THEN
    CREATE ROLE app_platform_ops LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_readonly') THEN
    CREATE ROLE app_readonly LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;
GRANT app_owner TO app_migrator; -- SET ROLE only; confirm membership options in the approved role graph
```

The migration runner authenticates to PostgreSQL as `app_migrator` and executes `SET ROLE app_owner` within the migration connection/transaction before applying the schema, table, policy, and index DDL illustrated below. The examples omit repeated `SET ROLE`/`RESET ROLE` statements for readability; the runner must scope and reset this role transition. API and worker processes never receive either migration credential.

#### Table template (every tenant table)

```sql
CREATE TABLE resident.unit (
  id            uuid        NOT NULL,                 -- UUIDv7 generated in the app
  tenant_id     uuid        NOT NULL DEFAULT app.current_tenant_id()
                            REFERENCES platform.tenant(id) ON DELETE RESTRICT,
  property_node_id uuid     NOT NULL,                 -- same-module reference
  unit_number   text        NOT NULL,
  unit_type     text        NOT NULL,
  area_sqft     numeric(12,2),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid,
  updated_by    uuid,
  version       integer     NOT NULL DEFAULT 1,       -- optimistic concurrency (ETag)
  PRIMARY KEY (id),
  UNIQUE (tenant_id, id),                             -- target for composite FKs inside the module
  UNIQUE (tenant_id, property_node_id, unit_number)
);
SELECT app.apply_tenant_rls('resident.unit');
```

Standards:

- Primary key `id uuid` (UUIDv7 from the application). Every tenant table also has `UNIQUE (tenant_id, id)`.
- Foreign keys inside a module are composite `(tenant_id, parent_id) REFERENCES parent (tenant_id, id)`. This guarantees a child can never point at a parent in another tenant, even for a role that bypasses RLS. This matters because FK checks bypass RLS.
- Every index on a tenant table starts with `tenant_id` unless there is a measured reason.
- Soft delete (`deleted_at`) is allowed for master data only. Financial, audit, security-log and approval tables are append-only; corrections are new rows.
- High-volume tables (`security.visitor_entry`, `platform.notification_log`, `platform.audit_log`, `workforce.attendance`, `finance.ledger_entry`) use declarative range partitioning on a time column (monthly). Policies are applied on the partitioned parent and queries always go through the parent.
- Slot and range conflicts (amenity bookings, parking allocation, shift overlap) use `EXCLUDE USING gist` constraints with `btree_gist`, scoped by `tenant_id`.
- Global (non-tenant) tables (`platform.plan`, `platform.feature`, provider catalogues) carry no RLS, are read-only to `app_runtime`, and are written only by the migration or platform-admin path.

### 2.5 Identity, membership, and platform tables

```sql
CREATE TABLE platform.tenant (
  id uuid PRIMARY KEY,
  organization_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL,              -- trial, active, suspended, closed
  shard_key text NOT NULL DEFAULT 'default',
  financial_year_start_month smallint NOT NULL DEFAULT 4,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Users are global identities. Memberships are tenant-scoped.
CREATE TABLE platform.app_user (
  id uuid PRIMARY KEY,
  mobile_e164 text UNIQUE,
  email citext UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform.membership (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES platform.tenant(id),
  user_id uuid NOT NULL REFERENCES platform.app_user(id),
  status text NOT NULL DEFAULT 'active',
  membership_version integer NOT NULL DEFAULT 1,      -- bump on any role or scope change
  UNIQUE (tenant_id, user_id)
);
SELECT app.apply_tenant_rls('platform.membership');
```

`platform.app_user` is a global table, so it is not row-secured by tenant. Access to it goes only through the `identity` module, which exposes tenant-scoped views of a user (through memberships). No other module reads it.

Other kernel tables (all tenant-scoped with RLS unless noted): `role`, `role_permission`, `membership_role` (with optional `property_scope`), `field_restriction`, `tenant_subscription`, `tenant_entitlement_override`, `usage_counter` (`tenant_id, feature_key, period, used`; atomic increments), `audit_log`, `outbox_event`, `processed_event`, `idempotency_key`, `compliance_attestation`, `document`, `notification`, `notification_log`, `approval_request`, `approval_step`, `automation_rule`.

### 2.6 Outbox, idempotency, audit (reference DDL)

```sql
CREATE TABLE platform.outbox_event (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  event_version integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);
CREATE INDEX outbox_unpublished_idx
  ON platform.outbox_event (available_at) WHERE published_at IS NULL;
-- runtime may only INSERT rows for its own tenant; relay access is a separately isolated, narrowly granted capability
ALTER TABLE platform.outbox_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.outbox_event FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_insert_own_tenant ON platform.outbox_event;
CREATE POLICY outbox_insert_own_tenant ON platform.outbox_event
  FOR INSERT TO app_runtime WITH CHECK (tenant_id = app.current_tenant_id());
GRANT INSERT ON platform.outbox_event TO app_runtime;
GRANT SELECT, UPDATE ON platform.outbox_event TO app_relay; -- only if this direct-access relay design is approved; otherwise expose narrow relay functions

CREATE TABLE platform.idempotency_key (
  tenant_id uuid NOT NULL,
  scope text NOT NULL,                 -- e.g. 'payment.create', 'billing.run', 'tally.post'
  key text NOT NULL,
  request_hash bytea NOT NULL,
  response_status integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, scope, key)
);
SELECT app.apply_tenant_rls('platform.idempotency_key');

CREATE TABLE platform.audit_log (
  id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_membership_id uuid,
  via_impersonation boolean NOT NULL DEFAULT false,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  reason text,
  device text,
  ip inet,
  request_id uuid,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);
SELECT app.apply_tenant_rls('platform.audit_log');
REVOKE UPDATE, DELETE, TRUNCATE ON platform.audit_log FROM app_runtime;   -- append-only
```

An idempotent replay with the same key but a different `request_hash` returns `409 IDEMPOTENCY_KEY_REUSED`.

### 2.7 Platform administration and support access

- The SaaS Super Admin app is a separate application and deployment with its own login, MFA enforced, and its own network exposure (section 4).
- Support staff do not use `BYPASSRLS`. They use time-boxed, reason-required impersonation: a token with `tid` of the target tenant, an `act` claim naming the staff member, a hard expiry (default 30 minutes), and read-only scope unless a second approver grants write. Every request in such a session is audited with `via_impersonation = true`.
- The `app_platform_ops` role is break-glass only: credentials are fetched from the secrets manager for a ticketed session, every statement is logged, and usage raises an alert.
- Cross-tenant analytics for the SaaS owner (MRR, active societies, usage) read from platform-level aggregate tables fed by events, never by scanning tenant tables.

### 2.8 Object storage, cache, queues, search, logs

| Resource                       | Isolation rule                                                                                                                                                                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Object storage (S3-compatible) | Key prefix `t/{tenantId}/{domain}/{yyyy}/{mm}/{uuid}`. Private buckets only. Access through short-lived presigned URLs after a permission check. ACL and metadata in the `document` table. Optional per-tenant data key via KMS envelope encryption for sensitive classes (KYC, payroll). |
| Redis cache                    | Keys prefixed `t:{tenantId}:`. Cache population always goes through tenant-context code. Rate limit keys include tenant and user.                                                                                                                                                         |
| Queues (BullMQ)                | One queue per workload type, not per tenant. Job data carries `tenantId`. Fair scheduling by per-tenant concurrency caps and weighted rate limits so one tenant's billing run cannot starve others.                                                                                       |
| Search                         | PostgreSQL full text (`tsvector`) and `pg_trgm` first, inside RLS. A dedicated search engine (OpenSearch) comes later; every document is indexed with `tenantId` and every query is filtered server-side by the authenticated tenant.                                                     |
| Logs and traces                | Every log line and span carries `tenantId`, `requestId`, `userId` (hashed where needed). No PII or secrets in logs. Metric labels use tenant tier, not tenant id, to limit cardinality.                                                                                                   |

### 2.9 Noisy neighbour and abuse controls

- Per-tenant and per-user API rate limits, driven by entitlements.
- `statement_timeout`, `idle_in_transaction_session_timeout`, and `lock_timeout` set on the runtime role.
- Per-tenant concurrency caps on heavy jobs (billing runs, exports, payroll, media processing).
- Upload size and type limits enforced at the presign step.
- Quotas (SMS, WhatsApp, storage, API calls) enforced by `EntitlementApi.consume`, not by the UI.

### 2.10 Authorization model

- Permission keys are `module.resource.action`, for example `maintenance.complaint.assign`, `finance.payment.refund`, `workforce.payroll.approve`.
- Roles are bundles of permissions. Custom roles per tenant are supported. Roles are not the only layer: permissions can carry a property scope (society, phase, tower, wing, floor, unit) and a field restriction list.
- Sensitive classes (payroll, KYC, bank details, finance) require an additional explicit permission and are masked in lists and exports by default.
- One login with multiple units and relationships is supported. A resident holding an owner relationship on unit A and a tenant relationship on unit B has different effective permissions in each.
- Server-side enforcement only. Every controller method declares `@RequiresFeature(...)` and `@RequiresPermission(...)`; a CI check fails the build if a route lacks both or an explicit `@Public()` marker.

### 2.11 Isolation verification (release gate G-ISO)

Automated and mandatory in CI:

1. **Catalog check script** (`tools/db/verify-rls.sql`, idempotent, read-only): every table with a `tenant_id` column has RLS enabled and forced, has a `tenant_isolation` policy, and its owner is not the runtime role. The build fails otherwise.
2. **pgTAP tests**: for each module, as tenant A: select, update, delete, insert-for-B against tenant B rows must return zero rows or violate the policy. With no context set: zero rows.
3. **API cross-tenant attack suite**: Playwright or supertest scenarios using tenant A tokens against tenant B resource ids, expecting `404` (preferred over `403` to avoid existence leaks).
4. **Pooler test**: run the suite through PgBouncer in transaction mode with parallel clients of different tenants to prove no context bleed.
5. **Worker test**: consumers with events from tenant B must not read tenant A rows.
6. **Storage test**: presigned URLs for one tenant's object cannot be generated by another tenant's actor.
7. **Migration lint**: a new tenant table without `app.apply_tenant_rls` in the same migration fails review.

### 2.12 Privacy, retention, and DPDP readiness

- India's Digital Personal Data Protection Rules were notified in November 2025 with phased commencement; the main data fiduciary obligations (notice, security safeguards, breach intimation, erasure, children's data) take effect in May 2027. The platform is designed to be compliant by then. Confirm exact dates and applicability with counsel.
- Capture consent and purpose per data class (resident directory visibility, promotional versus operational communication, visitor photos, domestic help data). Stored in `resident.consent_record` with version of the notice.
- Encrypt at rest (database, object storage, backups) and in transit (TLS 1.2 or higher). Field-level encryption for KYC and payroll identifiers.
- Government identity numbers are restricted data. Collect only where there is a documented legal basis, store masked references or document images in the restricted vault rather than raw numbers, and confirm treatment with counsel before building KYC flows.
- Retention schedules per data class (visitor logs, CCTV references, KYC documents, financial records, audit logs) are configuration, enforced by scheduled purge or archive jobs that are idempotent and audited.
- Data principal requests (access, correction, erasure) are a first-class workflow with a tenant-visible queue and SLA.
- Breach response runbook with notification templates is part of the operations deliverables (section 4.10).

---

## 3. Frontend and Backend Technology Stacks

### 3.1 Stack summary

| Concern                           | Choice                                                                                      | Status                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Language                          | TypeScript 5.x strict everywhere                                                            | Default                                     |
| Runtime                           | Node.js 24 LTS baseline; validate Node.js 26 compatibility in Phase 0                       | Default correction                          |
| Frontend framework                | Next.js 16, App Router                                                                      | Default correction; Active LTS at spec date |
| UI                                | React, Tailwind CSS, shadcn/ui (Radix primitives)                                           | Default                                     |
| Client data                       | TanStack Query for client state, React Server Components for read-heavy pages               | Default                                     |
| Forms and validation              | react-hook-form with zod                                                                    | Default                                     |
| API client                        | `openapi-typescript` and `openapi-fetch`, generated from the OpenAPI 3.1 document           | Default                                     |
| i18n                              | `next-intl`; English at launch, Hindi and Marathi ready (strings externalised from day one) | Default (A-09)                              |
| Backend framework                 | NestJS on the Fastify adapter                                                               | Given (NestJS), Default (Fastify)           |
| Database access                   | Drizzle ORM plus SQL migrations (D-11)                                                      | Default                                     |
| Validation and contracts          | zod schemas as the single source for DTOs and OpenAPI 3.1                                   | Default                                     |
| Primary database                  | PostgreSQL 16                                                                               | Given                                       |
| Cache, rate limits, locks, queues | Redis 7, BullMQ                                                                             | Default                                     |
| Object storage                    | S3-compatible (AWS S3; MinIO locally)                                                       | Default                                     |
| Auth                              | OAuth 2.0 plus JWT; Identity module as issuer                                               | Given (protocol)                            |
| Observability                     | OpenTelemetry, pino logs, Prometheus and Grafana or managed equivalent, Sentry              | Default                                     |
| Testing                           | Vitest, Testcontainers (PostgreSQL, Redis), pgTAP, Playwright, k6 for load                  | Default                                     |

### 3.2 Monorepo layout (Antigravity scaffold target)

```
society-erp/
├── apps/
│   ├── web/                      # Next.js: marketing, auth, society admin, resident, accountant (route groups)
│   ├── platform-admin/           # Next.js: SaaS Super Admin (separate deployment, separate auth policy)
│   ├── api/                      # NestJS HTTP entrypoint (composition root only)
│   ├── worker/                   # NestJS standalone: queues, schedulers, outbox relay
│   ├── tally-bridge/             # Customer-side Windows service (Node), outbound-only
│   └── mobile/                   # Phase 4+: Expo React Native (resident, guard, worker)
├── packages/
│   ├── contracts/                # OpenAPI 3.1 output, zod schemas, generated clients, event schemas
│   ├── shared-kernel/            # Branded ids, Money, DateRange, Result, error codes (types only, no I/O)
│   ├── ui/                       # Design system components
│   ├── config/                   # eslint, tsconfig, prettier, dependency-cruiser rules
│   └── testing/                  # Test factories, tenant fixtures, RLS test helpers
├── modules/                      # Backend domain modules (see 3.3 for internal layout)
│   ├── platform/
│   │   ├── identity/
│   │   ├── tenancy/              # tenants, plans, entitlements, usage
│   │   ├── notification/
│   │   ├── documents/
│   │   ├── audit/
│   │   ├── workflow/             # approvals and automation
│   │   ├── search/
│   │   └── reporting-core/
│   ├── resident/
│   ├── finance/
│   ├── workforce/
│   ├── maintenance/
│   ├── security/
│   └── community/
├── db/
│   ├── migrations/               # ordered, immutable, checksummed SQL migrations; one folder per module schema
│   ├── seeds/                    # Dev and test seed data (idempotent)
│   └── tests/                    # pgTAP: rls, constraints, partitions
├── infra/
│   ├── terraform/                # Modules and environments (dev, staging, prod)
│   ├── docker/                   # Dockerfiles, compose files for local dev
│   └── runbooks/
├── tools/                        # Standalone idempotent scripts (scaffold, verify-rls, seed, openapi-diff)
├── docs/
│   ├── adr/                      # Architecture decision records
│   ├── compliance/               # finance-review-register.md, dpdp-register.md
│   ├── api/                      # Published OpenAPI artefacts
│   └── specs.md                  # This file
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 3.3 Backend

#### Module internal layout (identical for every module)

```
modules/<domain>/<module>/
├── api/               # PUBLIC. Interfaces, DTO types, event schemas, DI tokens. Only this folder may be imported by other modules.
├── domain/            # Entities, value objects, domain services, state machines. No framework, no I/O.
├── application/       # Use cases (command and query handlers), orchestrates domain plus ports
├── infrastructure/    # Drizzle repositories, provider adapters, outbox writes
├── http/              # Controllers, request and response mappers, guards declarations
├── db/                # Drizzle schema, module-owned migrations references
└── <module>.module.ts
```

#### Boundary enforcement

- `dependency-cruiser` configuration in `packages/config` encodes the layer table of section 1.3. CI fails on any import that crosses a boundary except `<module>/api`.
- Each module is a NestJS dynamic module that exports only its `api` tokens.
- Database ownership: each module's tables live in its own PostgreSQL schema, and `app_runtime` privileges are granted per schema. A module's repository code only references its own schema (checked by a lint rule scanning for foreign schema names).

#### OpenAPI 3.1 contract and response wrapper

- Base path `/api/v1`. Breaking changes require `/api/v2`. Deprecations announced through a `Deprecation` and `Sunset` header.
- Code-first with zod schemas producing an OpenAPI 3.1 document committed to `packages/contracts/openapi/openapi.json`. CI runs a linter (Spectral) and a breaking-change diff against `main`.
- **Verification task (Phase 0 spike):** confirm that the chosen NestJS and zod-to-OpenAPI toolchain emits valid OpenAPI 3.1 (not 3.0). The default `@nestjs/swagger` path has historically targeted 3.0, so do not assume it. If the spike fails, switch to contract-first (hand-authored 3.1 YAML plus generated types and request validation).

Uniform wrapper for every JSON response (success and failure):

```json
{
  "data": {},
  "pagination": null,
  "error": null
}
```

List response:

```json
{
  "data": [{ "id": "01JD...", "unitNumber": "A-101" }],
  "pagination": {
    "limit": 25,
    "nextCursor": "eyJpZCI6IjAxSkQuLi4ifQ",
    "prevCursor": null,
    "hasMore": true,
    "total": null
  },
  "error": null
}
```

Error response:

```json
{
  "data": null,
  "pagination": null,
  "error": {
    "code": "FEATURE_NOT_ENTITLED",
    "message": "The HRM payroll feature is not enabled for this society.",
    "status": 403,
    "details": [
      {
        "field": null,
        "issue": "hrm.payroll",
        "hint": "Contact your administrator to enable the add-on."
      }
    ],
    "requestId": "01JD...",
    "docUrl": "https://docs.example.com/errors/FEATURE_NOT_ENTITLED"
  }
}
```

Conventions:

- `data` is an object, an array, or `null`. `pagination` is `null` for non-list responses. `error` is `null` on success. Exactly one of `data` or `error` is non-null, except on `204` which has an empty body.
- Cursor pagination by default (`limit`, `cursor`). `total` is returned only when explicitly requested (`?includeTotal=true`) because counting is expensive. Maximum `limit` is 100.
- Stable machine-readable `error.code` values (Appendix F). HTTP status is authoritative for transport semantics. A global exception filter and a global response interceptor guarantee the wrapper.
- Money fields are integer paise internally (`bigint`) and use an explicit `Paise` suffix (`amountPaise`). In JSON APIs, serialize paise as a base-10 string (for example `"amountPaise": "125000"`) to avoid JavaScript `Number` precision loss and JSON `bigint` serialization failures. Dates are ISO 8601 UTC. Ids are UUIDv7 strings.
- Unsafe methods that create money movement or send communications REQUIRE an `Idempotency-Key` header. Missing key returns `400 IDEMPOTENCY_KEY_REQUIRED`.
- Optimistic concurrency through `ETag` and `If-Match` using the row `version`. Mismatch returns `412 PRECONDITION_FAILED`.
- Filtering, sorting, and search use documented query conventions: `filter[field]=value`, `sort=-createdAt`, `q=text`.
- Rate-limit headers on every response. Request id returned in `X-Request-Id`.
- Webhooks (enterprise plan, Phase 6): signed with HMAC SHA256, retried with backoff, delivery log visible to the tenant.

### 3.4 Authentication and authorization (OAuth 2.0 with JWT)

Issuer: the `identity` module acts as the OAuth 2.0 authorization server and exposes OIDC-style discovery and JWKS endpoints, implemented with a vetted library (for example `node-oidc-provider`) rather than hand-written crypto. It sits behind an `IdentityProviderPort` so an external IdP can replace it later (A-10).

| Client type                          | Flow                                                                                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web apps (Next.js BFF)               | Authorization Code with PKCE. Tokens stored in `httpOnly`, `Secure`, `SameSite=Lax` cookies managed by the Next.js server. Never in `localStorage`.                     |
| Mobile apps                          | Authorization Code with PKCE through the system browser, refresh token in secure OS storage.                                                                            |
| Tally bridge and server integrations | Client Credentials with a per-installation client, key rotation, and optional mTLS.                                                                                     |
| Login methods                        | Mobile OTP (primary for residents and guards), email and password with optional TOTP 2FA for admins, accountants, and platform staff. MFA mandatory for platform admin. |

Token design:

- Access token: JWT signed with an asymmetric algorithm (ES256 or EdDSA), 10 to 15 minute lifetime. Claims: `iss`, `sub` (user id), `aud`, `exp`, `iat`, `jti`, `sid` (session id), `tid` (active tenant), `mid` (membership id), `mv` (membership version), `amr` (authentication methods), optional `act` (impersonating staff id).
- Permissions are NOT embedded in the token. They are resolved server-side from membership and cached in Redis keyed by `(mid, mv)`. A role change bumps `membership_version`, invalidating caches immediately.
- Refresh tokens: opaque, rotated on every use, reuse detection revokes the whole session family.
- Tenant switching: `POST /api/v1/auth/switch-tenant` issues a new access token for a different `tid` after verifying membership.
- Revocation: session table plus short TTL; an emergency denylist by `jti` or `sid` in Redis.
- Rate limiting and lockout on OTP and login endpoints, with per-mobile and per-IP budgets. OTP delivery goes through the SMS provider port and counts against quotas.

### 3.5 Asynchronous processing

| Component         | Design                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event publication | Transactional outbox (section 2.6). The business write and the outbox insert happen in one transaction. The relay in `worker` polls using `SELECT ... FOR UPDATE SKIP LOCKED`, publishes to BullMQ, marks `published_at`. If the process dies after publishing but before marking, the event is republished, which is why consumers are idempotent. |
| Consumers         | NestJS handlers registered per event type, each guarded by `processed_event` and run inside `TenantTransaction`.                                                                                                                                                                                                                                    |
| Queues            | `notifications`, `billing-run`, `payroll`, `tally-sync`, `media`, `exports`, `automation`, `scheduled`, `integrations`. Retries with exponential backoff and jitter, dead-letter queue with an operator UI.                                                                                                                                         |
| Scheduling        | BullMQ repeatable jobs. Job id is deterministic (for example `invoice-run:{tenantId}:{period}`) so re-registration and replays are idempotent.                                                                                                                                                                                                      |
| Long operations   | Billing runs, payroll, exports, and bulk imports are chunked, resumable, and report progress through a `job_run` record.                                                                                                                                                                                                                            |
| Media             | Images and video are uploaded directly to object storage via presigned URLs. Thumbnails, transcoding, and virus scan run as queue jobs. Large binaries never touch the relational database.                                                                                                                                                         |
| Realtime          | Server-Sent Events or WebSocket gateway for gate approval status and live dashboards (Phase 2). Push through FCM as the reliable channel.                                                                                                                                                                                                           |

### 3.6 Provider adapters (ports)

External systems are always behind a port, called from queue jobs, never deeply coupled to business code.

| Port                 | Default adapter (assumption)                               | Notes                                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PaymentGatewayPort` | Razorpay (primary), second adapter stub (A-02)             | Verify webhook HMAC over the raw body, dedupe by event id header, tolerate out-of-order events (for example captured before authorized), never trust redirect return alone. Reviewed under G-FIN. |
| `SmsPort`            | DLT-registered Indian SMS provider                         | Template registry mirrors DLT templates.                                                                                                                                                          |
| `WhatsAppPort`       | WhatsApp Business Cloud API through a BSP                  | Template approval workflow, consent tracking.                                                                                                                                                     |
| `EmailPort`          | Amazon SES or equivalent                                   |                                                                                                                                                                                                   |
| `PushPort`           | Firebase Cloud Messaging                                   |                                                                                                                                                                                                   |
| `StoragePort`        | S3-compatible                                              |                                                                                                                                                                                                   |
| `TallyBridgePort`    | Queue-based bridge (section 4.6)                           |                                                                                                                                                                                                   |
| `HardwarePort`       | Biometric, RFID, ANPR, boom barrier, smart meter contracts | Contracts only until Phase 5.                                                                                                                                                                     |

Every adapter has a contract test suite and a sandbox implementation used in local and test environments.

### 3.7 Frontend

#### Applications and surfaces

| Surface                                            | Delivery                                             | Phase    |
| -------------------------------------------------- | ---------------------------------------------------- | -------- |
| Public landing website, signup, plan routing       | `apps/web` `(marketing)` route group, static and ISR | 1        |
| Society Admin web (full ERP configuration)         | `apps/web` `(admin)`                                 | 1 onward |
| Society Manager app (committee, facility managers) | Responsive web, installable PWA                      | 2        |
| Resident app                                       | PWA first, native later                              | 1 to 4   |
| Worker and employee app                            | PWA first, native later                              | 2 to 4   |
| Security and gate app                              | PWA first, native later; large-button UX             | 2 to 5   |
| Accountant panel                                   | `apps/web` `(accountant)`                            | 2 onward |
| Vendor portal and reception kiosk                  | `apps/web` `(vendor)`, `(kiosk)`                     | 3 onward |
| SaaS Super Admin                                   | `apps/platform-admin`                                | 1 onward |

#### Frontend rules

- App Router with Server Components by default. Client Components only for interactivity.
- The Next.js server acts as a backend-for-frontend: it owns the OAuth session, attaches the access token to API calls, and keeps tokens out of browser JavaScript.
- Data access only through the generated OpenAPI client. No hand-written URL strings in components.
- Role-specific shells and navigation. A guard, a worker, a resident, and an accountant never see the same UX.
- Feature visibility comes from an entitlements and permissions payload fetched at session start, for UX only. The backend remains the authority.
- Mobile-first, low-bandwidth tolerant: skeletons, optimistic updates with rollback, offline-friendly mutation queue for gate and worker flows, image compression before upload.
- Accessibility target WCAG 2.1 AA. Large touch targets for guard and worker screens.
- Content Security Policy, strict cookie flags, CSRF protection for cookie-authenticated mutations, and output encoding by default.
- Tests: Vitest and Testing Library for components, Playwright for end-to-end flows per role, visual regression optional.

### 3.8 Data platform details

- Extensions: `citext`, `pg_trgm`, `btree_gist`, `pgcrypto`. Partition management through `pg_partman` or a scheduled idempotent script in `tools/db`.
- Time handling: store UTC, compute SLA and overdue timers server-side with explicit tenant timezone, test across DST-free `Asia/Kolkata` and at midnight and financial year boundaries.
- Sequences for human-readable numbers (invoice, receipt, complaint, PO) are per tenant and per financial year, generated in a gapless-aware way for financial documents. Numbering design is part of the G-FIN review.
- Full-text and trigram indexes are scoped and always combined with the tenant predicate.
- Read replica for heavy reports (Phase 4), with the same RLS and context rules.

### 3.9 Quality and engineering process

| Gate        | Check                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pre-commit  | Format, lint, typecheck on staged files                                                                                                                                                                                                    |
| PR          | Unit tests, module-boundary check, OpenAPI lint and breaking-change diff, migration validation from an empty database and from the previous release, migration-ledger replay/no-op check, RLS catalog check, dependency audit, secret scan |
| Integration | Testcontainers PostgreSQL 16 and Redis, pgTAP isolation suite, adapter contract tests                                                                                                                                                      |
| End to end  | Playwright per role against an ephemeral stack                                                                                                                                                                                             |
| Nightly     | Load test with k6 at assumed volumes (Appendix A), restore test on staging, referential-integrity job for soft cross-module references                                                                                                     |
| Release     | Gates G-ISO, G-SEC, G-OPS always; G-FIN for any finance change; G-DPDP for any personal-data change                                                                                                                                        |

Process: trunk-based development, short-lived branches, conventional commits, ADR for every decision that changes a row of the register in 0.3.

---

## 4. Deployment Topology and Hosting Environments

### 4.1 Environments

| Environment | Purpose                                                                                             | Data                                               | Payment and messaging                                      |
| ----------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `local`     | Developer machine via Docker Compose (api, worker, web, postgres, redis, minio, mailpit, pgbouncer) | Synthetic seeds                                    | All sandbox or fakes                                       |
| `ci`        | Ephemeral per pipeline                                                                              | Synthetic                                          | Fakes                                                      |
| `dev`       | Shared integration                                                                                  | Synthetic                                          | Sandbox                                                    |
| `staging`   | Production-like, pre-release, load and restore tests, controller review sessions                    | Anonymised or synthetic, never raw production data | Gateway test mode, SMS and WhatsApp to allowlisted numbers |
| `prod`      | Live tenants                                                                                        | Real                                               | Live providers only after G-FIN                            |
| `dr`        | Warm standby in the secondary region                                                                | Replicated                                         | Off                                                        |

Preview environments per pull request are optional.

### 4.2 Reference production topology (AWS, India region)

```
                          Internet
                             |
                 Route 53 + CloudFront (static, media CDN)
                             |
                        AWS WAF (rate limit, bot, OWASP rules)
                             |
                     Application Load Balancer
          ______________|________________________________
         |              |               |                 |
   ECS: web         ECS: api       ECS: platform-admin   (private, IP allowlist + MFA)
   (Next.js)        (NestJS)        (Next.js)
         |              |
         |        ECS: worker (outbox relay, queues, schedulers)
         |              |
         |______________|
                |                     |                    |
        PgBouncer (transaction mode)  ElastiCache Redis    S3 (private buckets, versioned)
                |                                            + KMS
        RDS PostgreSQL 16 Multi-AZ  ----> read replica (reports, Phase 4)
                |
        Automated backups + PITR + cross-region copy (DR region)

   Outbound only, via NAT with egress allowlist:
   payment gateway, SMS, WhatsApp, email, FCM

   Customer premises (per society using Tally):
   Tally Bridge (Windows service) --HTTPS outbound--> api  ;  Bridge --localhost:9000--> TallyPrime
```

| Component       | Choice                                                                                 | Rationale                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Region          | AWS ap-south-1 (Mumbai) primary, ap-south-2 (Hyderabad) DR                             | Latency for India, data residency posture                                                                                                                                                     |
| Compute         | Containers on ECS Fargate                                                              | Fewer moving parts than Kubernetes for a small team; same Docker images can move to Kubernetes later                                                                                          |
| Database        | Amazon RDS for PostgreSQL 16, Multi-AZ, encrypted, PITR                                | Managed backups, patching                                                                                                                                                                     |
| Pooling         | App-side pool at first; PgBouncer in transaction mode once connection counts demand it | Tenant context is transaction-local, so this is safe from day one. If a managed proxy is considered instead, test whether setting per-transaction config pins connections before adopting it. |
| Cache and queue | ElastiCache Redis 7, with persistence settings suited to BullMQ                        |                                                                                                                                                                                               |
| Storage         | S3 with versioning, lifecycle rules, KMS keys                                          |                                                                                                                                                                                               |
| Secrets         | AWS Secrets Manager with rotation                                                      |                                                                                                                                                                                               |
| Edge            | CloudFront plus WAF                                                                    |                                                                                                                                                                                               |
| Registry        | Amazon ECR with scan on push                                                           |                                                                                                                                                                                               |

Cloud choice is an assumption (A-07). Azure Central India or GCP asia-south1 are equivalent targets because everything is containers plus managed PostgreSQL, Redis, and object storage.

#### Pilot-lite profile (cost-aware starting point, assumption A-08)

For the first pilot societies, a single-region footprint is acceptable: one ECS service per process type with two tasks for `api`, one for `worker`, a single-AZ or small Multi-AZ RDS instance, one Redis node, and no read replica. The same Terraform modules apply with smaller variable sizes. Production-grade features that MUST NOT be skipped even in pilot: PITR backups, WAF, private networking, secrets manager, RLS gates, and restore testing.

### 4.3 Containers and Infrastructure as Code

- One repository image per process: `api`, `worker`, `web`, `platform-admin`. `api` and `worker` share a build and differ by command.
- Multi-stage builds, Node.js 24 slim or distroless base, non-root user, read-only root filesystem, no shell in the final stage, SBOM generated, image signed, vulnerability scan blocks high severity.
- Health endpoints: `/health/live` and `/health/ready` (ready checks database, Redis, and migration version). Graceful shutdown drains HTTP and finishes or requeues in-flight jobs.
- Configuration through environment variables validated at boot (zod). Secrets are injected from the secrets manager, never baked into images or committed.
- IaC: Terraform or OpenTofu with remote state and locking. Layout: reusable modules (`network`, `database`, `redis`, `storage`, `ecs-service`, `waf`, `observability`) and per-environment stacks. Plans run in CI; applies to staging are automatic and to production require approval.
- `docker-compose.yml` provides the full local stack, including PgBouncer in transaction mode so isolation bugs surface locally.

### 4.4 Network and security posture

- VPC with public subnets (ALB, NAT), private application subnets, isolated database subnets. No public database or Redis endpoints.
- Security groups follow least privilege: ALB to services, services to PgBouncer, Redis, and NAT only.
- Super Admin app is not exposed on the public ALB rule set used by tenants. Separate hostname, IP allowlist or VPN, MFA, and stricter WAF.
- TLS 1.2 or higher everywhere, HSTS, secure headers.
- Egress allowlist for outbound calls to approved provider domains.
- Encryption at rest for RDS, S3, EBS, and backups using KMS customer-managed keys.
- Dependency and image scanning in CI, plus an external penetration test before the first production tenant (G-SEC).

### 4.5 CI/CD

```
PR -> lint, typecheck, unit, boundary check, RLS catalog check, migration-upgrade validation, migration-ledger replay/no-op check, OpenAPI diff, build images
main -> deploy staging (automatic) -> migrate (expand step) -> rolling deploy -> smoke + e2e
tag -> manual approval -> prod: migrate (expand) -> rolling or blue/green deploy -> smoke -> contract phase later
```

- GitHub Actions by default (A-11). Build once, promote the same image digest across environments.
- Migrations use the expand-and-contract pattern: add backward-compatible schema first, deploy code, remove old schema in a later release. Applied migration files are immutable and tracked by a checksummed migration ledger; the runner never blindly reapplies a completed migration. Validate both fresh installs and upgrades from the previous supported release. Use the short-lived `app_migrator` identity to assume `app_owner` only within the approved migration job; never connect directly as `app_owner` or run migrations as `app_runtime`. The runner must verify deterministic order and recorded checksums, skip successfully applied migrations, fail closed on checksum drift, and use a documented recovery procedure for interrupted/failed migrations. Because `FORCE ROW LEVEL SECURITY` also subjects table owners to policies, explicitly design and test how controlled data backfills run without weakening runtime isolation.
- Feature flags (OpenFeature-compatible, backed by a table) are separate from entitlements. Entitlements are commercial, flags are rollout controls.
- Changes touching `modules/finance/**`, payment adapters, tax rules, or payroll configuration require the G-FIN checklist item in the PR template and a linked entry in `docs/compliance/finance-review-register.md`.
- Rollback: previous image digest redeploy; database rollbacks are forward-fix only except for the most recent expand step.

### 4.6 Tally bridge deployment

TallyPrime runs on a customer machine, so the SaaS cannot call it directly. A small bridge runs next to it.

- **Direction:** the bridge makes outbound HTTPS connections only (long polling or WebSocket) to the SaaS. No inbound ports are opened on the customer network.
- **Local side:** TallyPrime's HTTP XML server must be enabled (Tally's documentation describes enabling the HTTP server under advanced configuration; the default port is 9000). The bridge posts XML envelopes (`ENVELOPE` with `HEADER` and `BODY`, request type Import or Export) to `http://localhost:9000`.
- **Packaging:** a signed Windows installer that installs a Windows service, with auto-update and an offline-safe local queue.
- **Registration and auth:** one-time pairing code from the Accountant panel, then Client Credentials with rotating secrets. Payloads are signed. Company name, financial year, and ledger mapping are validated at pairing.
- **Sync protocol:** the SaaS holds the `finance.tally_sync_item` queue with statuses Pending, Processing, Synced, Failed, Retrying, Conflict, plus SaaS transaction id, Tally voucher GUID, last sync time, error, and retry count. The bridge leases items, imports vouchers with a stable remote identifier so repeated delivery cannot create duplicates, and reports results.
- **Idempotency:** voucher creation is keyed by the SaaS transaction id. A replay updates or ignores, never duplicates. Conflicts (for example a ledger missing in Tally or a locked period) are surfaced in a resolution queue rather than retried forever.
- **Scope:** operational edits stay in the SaaS. Tally is an accounting posting target.
- Ledger mapping defaults and voucher formats are covered by the G-FIN review.

### 4.7 Observability and SLOs

| Signal          | Tooling                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Metrics         | Prometheus-compatible, RED metrics per route, queue depth and age, outbox lag, DB connections, cache hit rate |
| Logs            | Structured JSON via pino to a central store, retention by class                                               |
| Traces          | OpenTelemetry end to end (web to API to queue to provider)                                                    |
| Errors          | Sentry for web, API, and worker                                                                               |
| Business health | Dashboards for failed notifications, failed payments, Tally sync failures, overdue SLA, gate approval latency |
| Alerting        | On-call rota, paging only on user-impacting symptoms                                                          |

Initial SLO targets (adjustable, A-06):

- API availability 99.9% monthly.
- p95 latency under 300 ms for reads and under 600 ms for writes (excluding report and export endpoints).
- Visitor approval request delivered to the resident device in under 5 seconds at p95.
- Outbox publish lag under 10 seconds at p95.
- Production recovery target: RPO 5 minutes and RTO 1 hour, contingent on a tested cross-region replication/failover design. Daily backup copies alone do not satisfy a five-minute RPO.

### 4.8 Backup, disaster recovery, and capacity

- RDS automated backups with point-in-time recovery, retention at least 14 days (35 for production), plus daily snapshots copied to the DR region.
- S3 versioning and cross-region replication for tenant documents. Object lock considered for financial documents.
- Restore tested quarterly into an isolated environment with a scripted, idempotent runbook; the result is recorded as evidence for G-OPS.
- DR plan: infrastructure for the DR region is defined in the same Terraform modules and can be stood up on demand (warm standby for production-scale tenants, cold for pilot).
- Capacity planning follows Appendix A. Horizontal scale for `api` on CPU and latency, `worker` on queue depth and age. Partition and archive plan for high-volume tables, with a documented threshold for tenant sharding review.

### 4.9 Cost guardrails

- Budgets and alerts per environment. Staging scales to zero or minimal outside working hours.
- Per-tenant cost attribution through tags and usage counters, feeding plan pricing.
- Media lifecycle rules (infrequent access, then archive), notification log retention windows, and compression defaults.

### 4.10 Operations and compliance runbooks (required deliverables)

- Incident response and severity matrix. Personal data breach response with regulator and data principal notification templates (DPDP).
- Tenant onboarding and offboarding (export, retention, deletion proof).
- Break-glass access procedure for `app_platform_ops`.
- Payment incident runbook: duplicate webhook, missing webhook, gateway outage, reconciliation mismatch, refund failure.
- Tally sync incident runbook.
- Secret rotation and key rotation.
- Restore from backup and DR failover.
- Quarterly access review and permission audit.

---

## 5. Development Implementation Phases

Phases follow the Developer Blueprint sequence (foundations first, then operations, facility ERP, HR and finance, integrations, scale) with a Phase 0 added for decisions and spikes. Sizing is relative (S, M, L, XL), not calendar time, because team size is not yet fixed (A-12).

### 5.1 Phase rules

- Do not start a phase's feature modules before the previous phase's exit criteria pass.
- Tenancy, permissions, and entitlements precede feature volume.
- Every phase ships vertical slices: database, API, UI, tests, audit, notifications, entitlements. No "backend only" phases.
- Cross-module behaviour is delivered through the interfaces and events defined in section 1. A module is not done until its `api/` and event contracts are published and tested.
- Money movement stays in sandbox until gate G-FIN passes.

### 5.2 Phase 0: Decisions, spikes, and scaffold (size M)

Objectives: remove the largest technical unknowns and create the repository skeleton.

Deliverables:

1. Resolve D-03 (Next.js version), D-11 (ORM), D-14 (mobile), and the open items in Appendix H. Record each as an ADR.
2. Monorepo scaffold from section 3.2 with CI, lint, typecheck, module boundary rules, Docker Compose local stack including PgBouncer.
3. **RLS spike:** `app_owner`, `app_runtime`, `app.apply_tenant_rls`, `TenantTransaction`, pgTAP suite, run through PgBouncer in transaction mode.
4. **OpenAPI 3.1 spike:** prove the zod-to-OpenAPI 3.1 toolchain, the response wrapper interceptor, generated TypeScript client, and breaking-change diff in CI.
5. **Auth spike:** Authorization Code with PKCE, JWT with JWKS, refresh rotation, tenant switch, Next.js BFF cookie session.
6. **Outbox spike:** outbox write, relay with `SKIP LOCKED`, idempotent consumer, replay test.
7. Terraform baseline for `dev` and `staging` (network, database, Redis, storage, one ECS service) and a deployed hello-world with health checks.
8. Compliance scaffolding: `docs/compliance/finance-review-register.md`, `dpdp-register.md`, PR template with G-FIN and G-DPDP checkboxes.
9. Engage the qualified financial controller and agree the review process and calendar (REQ-FIN-001).

Exit criteria: all spikes green in CI, ADRs merged, staging deploy from `main` works, controller engaged.

### 5.3 Phase 1: Foundation (size XL)

Scope: multi-tenant SaaS core, authentication, subscription engine, roles and permissions, property, unit and resident model, files, audit, notifications.

| Area                       | Deliverables                                                                                                                                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenancy and platform admin | Tenant lifecycle (trial, active, suspended), `platform-admin` app, plans, feature catalog, entitlements, add-ons, usage counters, system announcements                                                                                                                              |
| Identity                   | Mobile OTP and password login, 2FA, sessions and devices, login history, memberships, tenant switching                                                                                                                                                                              |
| Authorization              | Role and permission engine, custom roles, property scope, field restrictions                                                                                                                                                                                                        |
| Resident module            | Society profile, configurable hierarchy (society, phase, tower, wing, floor, unit), unit types, residents (owner, tenant, family, authorized occupant), vehicles registry, pets, KYC document vault, multi-unit logins, tenant lifecycle and move-in and move-out workflow skeleton |
| Kernel                     | Documents (object storage, presigned uploads, versioning), audit log and activity timeline, notification engine (in-app, push, email; templates; channel rules; credit metering), approval engine core, global search v1                                                            |
| Platform                   | Outbox, idempotency, scheduler, feature flags                                                                                                                                                                                                                                       |
| Frontend                   | Admin shell, resident PWA shell, marketing site, signup with plan and trial routing                                                                                                                                                                                                 |

Exit criteria:

- G-ISO passes for every table created.
- Entitlement and permission checks verified at API and UI level.
- All critical actions create audit records.
- Files follow access-controlled storage policies.
- A pilot society can be created, configured, and populated, and a resident can log in and see their unit.

### 5.4 Phase 2: Core operations (size XL)

Scope: complaints, tasks, worker workflows, visitor and gate, notices, billing and payments.

| Area                 | Deliverables                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maintenance (part 1) | Complaint configuration (society, actor, category switches), complaint lifecycle, SLA timers, escalation, comments, timeline; task management with checklists, subtasks, recurring tasks, time tracking; complaint to task flow; worker PWA (attendance placeholder, accept, start, checklist, notes, before and after media, completion request); manager verification and resident confirmation |
| Security (part 1)    | Gates, guard accounts, visitor flow (phone, photo, purpose, unit, approval, OTP or QR, entry, exit), pre-approved guests, delivery handling, parcels, domestic help profiles; online-first guard PWA with retry queue                                                                                                                                                                             |
| Community (part 1)   | Notices with audience targeting and acknowledgment                                                                                                                                                                                                                                                                                                                                                |
| Finance (part 1)     | Charge catalog, billing rules, bulk and recurring invoice generation, invoice states, PDF, credit and debit notes, manual payment recording (cash, cheque, bank transfer, UPI reference), receipts, dues summary, Resident app dues screen. Payment gateway integrated in **sandbox only**. Tax features present as configurable data, **disabled**.                                              |
| Cross-module         | `finance.dues.changed` projection in Resident, `maintenance` to `security` incident task path, notification templates per module                                                                                                                                                                                                                                                                  |

Exit criteria:

- Complaint-to-task linkage preserves history and attachments; SLA and overdue timers are deterministic and timezone-safe; worker completion cannot bypass mandatory checklist or evidence when configured.
- Gate approval latency meets the SLO on a real device test.
- Billing run is idempotent (running it twice for the same period creates no duplicates) and resumable.
- Controller has reviewed the Phase 2 finance design documents (data model, numbering, rounding, tax-as-data model). Live gateway and tax remain off. Gate G-FIN is **not yet** granted.

### 5.5 Phase 3: Facility ERP (size XL)

Scope: assets, AMC, preventive maintenance, vendors, procurement, inventory, parking, amenities, work orders.

| Area                 | Deliverables                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maintenance (part 2) | Asset registry with QR, lifetime history, breakdown flow, AMC contracts and automatic service tasks, preventive checklists with proof of completion, work orders (worker or vendor, material, labor, cost, verification), vendor master and vendor portal v1, procurement (request, approval, RFQ, quotes, comparison, PO, GRN), inventory (stock in and out, issue, return, transfer, adjustment, minimum stock, reorder alerts, task consumption) |
| Security (part 2)    | Parking zones and slots, allocation and waiting list, vehicle linkage, violations, patrol with QR checkpoints and missed-patrol alerts, material gate pass with QR, SOS and emergency directory                                                                                                                                                                                                                                                     |
| Community (part 2)   | Amenities (slots, capacity, deposits, cancellation, blackout dates), booking with `EXCLUDE` constraint against overlaps, events with QR tickets, meetings with action items to tasks, polls                                                                                                                                                                                                                                                         |
| Finance (part 2)     | Charges for parking, amenity, move-in and move-out through `ChargeApi`, utility meter readings to consumption charges, expense request and approval, vendor bill capture (no live payments)                                                                                                                                                                                                                                                         |

Exit criteria: material consumption and expense references retain originating task and work-order ids; double booking is impossible at the database level; AMC schedules generate tasks idempotently; the closed loop from complaint to expense submission works end to end in staging.

### 5.6 Phase 4: HR and finance (size XL)

Scope: HRM, attendance, shifts, leave, payroll, expenses, approvals, bank workflows.

| Area             | Deliverables                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workforce        | Employee master, attendance (mobile, QR, gate, biometric adapter contract, manual), shifts and roster, leave workflow with attendance sync, payroll (components, review, approval, payslips), worker performance reports built from events              |
| Finance (part 3) | Vendor payables and payment workflow, approval chains by amount, resident receivables, bank statement import and reconciliation with manual review queue, internal ledger and reports (feature-flagged), role-based dashboards for accountant and admin |
| Platform         | Conditional approval policies by amount, category, property, requester; read replica for reports; native mobile apps begin (resident and guard) per D-14                                                                                                |

Exit criteria: payroll and payment runs are idempotent and retry-safe; payroll statutory components are configuration only and have a controller review record; reconciliation handles partial matches and reversals; role-specific dashboards load within SLO at Appendix A volumes.

### 5.7 Phase 5: Integrations (size XL)

Scope: Tally bridge, ledger mapping, voucher sync, payment gateway live, WhatsApp and SMS, hardware adapters, offline gate mode.

| Area              | Deliverables                                                                                                                                                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tally             | Bridge installer, pairing, ledger mapping screens, sync queue with all six statuses, conflict queue, idempotent voucher posting, sync dashboard                                                                                                                                  |
| Payments          | Gateway live mode, webhook hardening, settlement and reconciliation reports, refunds and reversals                                                                                                                                                                               |
| Messaging         | WhatsApp and SMS providers with templates, consent, quotas and usage packs                                                                                                                                                                                                       |
| Hardware          | Biometric, RFID, ANPR, boom-barrier, smart-meter adapters (one reference implementation each, behind `HardwarePort`)                                                                                                                                                             |
| Offline gate mode | Encrypted local cache of residents, pre-approved guests, staff, and domestic help; local QR and OTP validation; append-only entry log synced with client-generated UUIDv7 and device id; explicit "offline unverified" flag for entries that could not be approved by a resident |

Exit criteria: **Gate G-FIN granted** by the qualified financial controller for the payment gateway adapters, tax configuration models, reconciliation logic, and default Tally mappings, recorded in `platform.compliance_attestation`; live gateway enabled only for tenants covered by the attestation; Tally sync survives a 24-hour bridge outage with no duplicates or losses; offline gate mode survives a simulated 72-hour outage and re-syncs cleanly.

### 5.8 Release gates

| Gate       | Meaning                                                                                                                                                                      | Owner                                             | Blocks                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **G-ISO**  | Tenant isolation verified (section 2.11)                                                                                                                                     | Engineering lead                                  | Any release                                                                                                     |
| **G-SEC**  | Security review, dependency and image scans clean, external pen test for first production tenant, secrets and access review                                                  | Security owner                                    | First production tenant, then yearly                                                                            |
| **G-FIN**  | **Qualified financial controller has reviewed and approved all local payment integrations and tax compliance workflows** and the approval is recorded with scope and version | Qualified financial controller plus product owner | Enabling `finance.gateway.live` or `finance.tax.enabled` in any production tenant; any change to reviewed scope |
| **G-DPDP** | Data protection review of personal data flows, consent, retention, breach process                                                                                            | Data protection owner with counsel                | Releases that add or change personal data processing; mandatory before May 2027 commencement obligations        |
| **G-OPS**  | Backup restore test passed within the last quarter, runbooks current, on-call in place                                                                                       | Operations owner                                  | First production tenant                                                                                         |

### 5.9 Phase 6: Scale and advanced (size XL, ongoing)

Scope: automation, analytics, API and webhooks, white label, AI features, compliance, IoT, predictive maintenance. All of this is optional and feature-flagged (Appendix G).

- Automation engine (trigger, condition, action) and automation recipes.
- Public API access, API keys, webhooks, developer documentation (enterprise plan).
- White label (branding, domains).
- Advanced analytics, benchmarking, society health dashboard.
- AI summaries and insights only after clean operational data exists; AI never executes financial actions without human approval.
- Extraction candidates if load proves it: notification, billing, Tally, automation, media, reporting.

### 5.10 Dependency order and critical path

```
Phase 0 spikes
   -> Tenancy + Identity + Entitlements + RBAC (Phase 1)
      -> Resident model (Phase 1)
         -> Complaint/Task, Gate, Billing (Phase 2)
            -> Assets/AMC/Vendors/Inventory, Parking, Amenities (Phase 3)
               -> HRM + Payroll + Expenses + Reconciliation (Phase 4)
                  -> Tally, Live Payments (G-FIN), Messaging, Hardware, Offline Gate (Phase 5)
                     -> Automation, API, AI, IoT (Phase 6)
```

Parallelisable work: marketing site, design system, infrastructure hardening, and compliance documentation can run alongside Phases 1 and 2. The controller's calendar (Phase 0 onward) is a schedule risk for Phase 5 and should be booked early.

### 5.11 Top risks and mitigations

| Risk                                                | Mitigation                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Tenant data leak through a missed policy or context | Section 2 layered controls, G-ISO in CI, forced RLS, fail-closed context                                      |
| Scope sprawl across 98 feature areas                | Strict phase gates, vertical slices, optional features behind flags                                           |
| Financial or tax rule errors                        | REQ-FIN-001, rules as versioned data, immutable postings, sandbox-only until G-FIN                            |
| Boundary erosion in the monolith                    | Dependency rules in CI, `api/` only imports, event-based reverse flows                                        |
| Provider lock-in or outage                          | Ports and adapters, queues with retries and dead letters, second provider stub                                |
| Framework and runtime lifecycle drift               | Pin supported Next.js and Node.js majors, run compatibility checks, and maintain an explicit upgrade calendar |
| Connection and context bugs with poolers            | Transaction-local context only, local stack uses PgBouncer, pooler test in CI                                 |
| Controller availability delays Phase 5              | Engage in Phase 0, review design docs in Phase 2                                                              |

---

## Appendix A. Assumptions Register and Capacity Model

These drive sizing, partitioning, and cost. Each is open for correction.

| ID    | Area                   | Assumption                                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A-01  | Data volume per tenant | Typical society 300 units (range 50 to 2,000), about 1,200 residents, 25 staff. Daily: 400 visitor entries, 3,000 notification log rows, 3 complaints, 10 task updates, 1,000 audit rows. Monthly: 300 invoices, 400 payments. Media about 5 GB per tenant per year. Retention: notification log 90 days hot, audit 1 year hot then archive, financial records 8 years, visitor logs 1 year hot. |
| A-01b | Tenant growth          | 25 tenants at month 6, 100 at month 12, 500 at month 24. Design headroom to 1,000 tenants on one primary before a sharding review.                                                                                                                                                                                                                                                               |
| A-02  | Payment gateways       | Razorpay primary. Second adapter (Cashfree or PayU) as a stub. UPI, card, net banking only through the gateway, no direct NPCI or bank API integration. Cash, cheque, bank transfer recorded manually. No custody of funds by the platform. All subject to REQ-FIN-001.                                                                                                                          |
| A-03  | Offline gate           | Online-first through Phase 4 with a retry queue. Full offline gate mode in Phase 5: encrypted local roster and pre-approved guest cache, local QR and OTP checks, 24 to 72 hour outage tolerance, append-only entry sync, no offline payments, no offline resident approvals (entries flagged "offline unverified").                                                                             |
| A-04  | Mobile delivery        | PWA first for resident, worker, and guard in Phases 1 to 3. Native Expo (React Native) apps from Phase 4, Android first, iOS for residents after. Store distribution under an organization account, OTA updates for JavaScript changes, APIs shared through the generated OpenAPI client.                                                                                                        |
| A-05  | Messaging providers    | SMS through a DLT-registered provider, WhatsApp through the Business Cloud API via a BSP, email through SES, push through FCM.                                                                                                                                                                                                                                                                   |
| A-06  | SLOs                   | Targets in section 4.7.                                                                                                                                                                                                                                                                                                                                                                          |
| A-07  | Cloud                  | AWS Mumbai primary, Hyderabad DR.                                                                                                                                                                                                                                                                                                                                                                |
| A-08  | Starting footprint     | Pilot-lite profile first, scale per tenant count.                                                                                                                                                                                                                                                                                                                                                |
| A-09  | Languages              | English at launch, Hindi and Marathi ready.                                                                                                                                                                                                                                                                                                                                                      |
| A-10  | Identity               | Built-in issuer behind a port, external IdP replaceable.                                                                                                                                                                                                                                                                                                                                         |
| A-11  | CI                     | GitHub Actions.                                                                                                                                                                                                                                                                                                                                                                                  |
| A-12  | Team                   | Small team (2 to 6 engineers) with part-time DevOps and QA support.                                                                                                                                                                                                                                                                                                                              |

#### Derived capacity (for planning, recompute when A-01 changes)

| Table (hot window)                    | Rows per tenant | At 100 tenants | At 500 tenants |
| ------------------------------------- | --------------- | -------------- | -------------- |
| `security.visitor_entry` (1 year)     | about 146k      | about 15M      | about 73M      |
| `platform.notification_log` (90 days) | about 270k      | about 27M      | about 135M     |
| `platform.audit_log` (1 year)         | about 365k      | about 37M      | about 183M     |
| `finance.invoice` plus lines (1 year) | about 11k       | about 1.1M     | about 5.5M     |
| `workforce.attendance` (1 year)       | about 9k        | about 0.9M     | about 4.5M     |

Conclusions: use tenant-leading indexes, retention jobs, and load tests from the start. Do not mandate partitioning solely from the illustrative row estimates. Partition high-volume append-only tables only when retention, measured volume, or query performance justifies it and after validating primary-key, unique-key, foreign-key, RLS, and migration implications. The invoice-plus-lines estimate is not by itself a reason to partition invoices. A single PostgreSQL primary may be sufficient at the 500-tenant planning point, but this is a capacity hypothesis to validate with k6 and production telemetry, not a guarantee.

---

## Appendix B. Entity Catalog by Module

| Module                | Core entities                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| platform.tenancy      | Tenant, Organization, Plan, Feature, PlanFeature, TenantSubscription, EntitlementOverride, UsageCounter, AddOn, Coupon                                                                                                                                                                                                                |
| platform.identity     | AppUser, Membership, Role, Permission, RolePermission, MembershipRole, Session, Device, LoginHistory, ConsentRecord                                                                                                                                                                                                                   |
| platform.notification | Template, Notification, NotificationLog, ChannelCredit                                                                                                                                                                                                                                                                                |
| platform.documents    | Document, DocumentVersion, Folder, DocumentAcl                                                                                                                                                                                                                                                                                        |
| platform.audit        | AuditLog, ActivityTimelineEntry                                                                                                                                                                                                                                                                                                       |
| platform.workflow     | ApprovalPolicy, ApprovalRequest, ApprovalStep, AutomationRule, AutomationRun                                                                                                                                                                                                                                                          |
| resident              | Society, PropertyNode (phase, tower, wing, floor), Unit, Resident, UnitResident, Tenancy (lease), FamilyMember, Vehicle, Pet, MoveRequest, MoveChecklistItem, UnitDuesStatus (projection)                                                                                                                                             |
| finance               | ChargeType, BillingRule, TaxRule, LateFeeRule, Charge, Invoice, InvoiceLine, CreditNote, Payment, PaymentAttempt, Receipt, Refund, Expense, VendorBill, VendorPayable, BankAccount, BankStatementLine, ReconciliationMatch, Account, JournalEntry, LedgerEntry, UtilityMeter, MeterReading, TallyLedgerMap, TallySyncItem, PeriodLock |
| workforce             | Employee, Department, Designation, Shift, RosterAssignment, Attendance, LeaveType, LeaveBalance, LeaveRequest, PayrollComponent, PayrollRun, Payslip, EmployeeDocument                                                                                                                                                                |
| maintenance           | Complaint, ComplaintCategory, SlaPolicy, Task, TaskChecklistItem, TaskAssignment, WorkOrder, Asset, AssetServiceHistory, AmcContract, MaintenanceSchedule, Vendor, PurchaseRequest, Rfq, Quote, PurchaseOrder, Grn, InventoryItem, StockTxn, StoreBin                                                                                 |
| security              | Gate, GuardAssignment, Visitor, EntryLog, PreApproval, Delivery, Parcel, DomesticHelp, DomesticHelpUnit, PatrolCheckpoint, PatrolScan, MaterialGatePass, ParkingZone, ParkingSlot, ParkingAllocation, ParkingViolation, SosAlert, EmergencyContact                                                                                    |
| community             | Amenity, AmenitySlot, Booking, Event, EventRegistration, Notice, NoticeAck, Meeting, AgendaItem, ActionItem, Poll, PollVote, CommunityPost                                                                                                                                                                                            |

---

## Appendix C. State Machines (implement explicitly, validate role per transition)

| Entity             | States and primary path                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complaint          | New -> Acknowledged -> Under Review -> Assigned -> Accepted -> In Progress -> Resolved -> Pending Verification -> Closed. Side states: On Hold, Waiting for Resident, Waiting for Material, Waiting for Vendor, Rejected, Reopened, Cancelled |
| Task               | New -> Assigned -> Accepted -> In Progress -> Completed -> Pending Approval -> Closed. Side states: On Hold, Waiting for Material, Waiting for Vendor, Overdue, Cancelled. Priorities: Low, Normal, High, Urgent, Critical                    |
| Invoice            | Draft -> Generated -> Sent -> Partially Paid or Paid or Overdue. Cancelled via credit note path                                                                                                                                               |
| Payment            | Initiated -> Pending -> Success or Failed. After success: Reversed or Refunded                                                                                                                                                                |
| Visitor            | Created or Invited -> Waiting -> Approved or Rejected -> Entered -> Exited                                                                                                                                                                    |
| AMC                | Draft -> Active -> Expiring -> Renewed or Expired or Cancelled                                                                                                                                                                                |
| Procurement        | Request -> Approval -> RFQ -> Quote -> PO -> GRN -> Invoice -> Paid                                                                                                                                                                           |
| Tally sync item    | Pending -> Processing -> Synced. Failed -> Retrying -> Synced. Any -> Conflict (manual resolution)                                                                                                                                            |
| Move request       | Requested -> Verified -> Charges Assessed -> Paid -> Approved -> Gate and Access Updated -> Completed. Move-out adds Dues Check and Clearances                                                                                                |
| Approval           | Submitted -> In Review (per level) -> Approved or Rejected or Returned                                                                                                                                                                        |
| Material gate pass | Requested -> Approved -> Issued (QR) -> Scanned Out -> Returned or Pending Return or Closed                                                                                                                                                   |

Implementation: each machine is a pure function in `domain/` (current state, command, actor) returning a new state and events, with a transition table test that enumerates legal and illegal moves.

---

## Appendix D. Entitlement Keys and Suggested Plans

Feature key pattern `module.feature`, with types Boolean, Quota (per month), Limit (count or size), Add-on, Override.

Examples: `complaint.enabled`, `complaint.resident_create`, `complaint.video_upload`, `complaint.sla`, `task.recurring`, `hrm.enabled`, `hrm.payroll`, `security.visitor`, `security.offline_gate`, `parking.enabled`, `assets.enabled`, `amc.enabled`, `procurement.enabled`, `inventory.enabled`, `amenity.booking`, `finance.gateway`, `finance.internal_ledger`, `tally.voucher_sync`, `notification.whatsapp`, `notification.sms`, `automation.enabled`, `api.access`, `limit.units`, `limit.admins`, `limit.employees`, `limit.storage_gb`, `quota.whatsapp_month`, `quota.sms_month`, `quota.api_calls_month`.

Suggested plan behaviour (from the Blueprint):

- **Starter:** residents, notices, basic complaints, billing, payments, push.
- **Professional:** tasks, security, parking, amenities, assets, AMC, HRM, WhatsApp and SMS.
- **Enterprise:** payroll, procurement, inventory, Tally, automation, API, white label, advanced analytics, custom limits.
- Sell add-ons (HRM pack, Tally pack, extra credits, storage) instead of forcing a full plan upgrade.

All enforcement is server-side through `EntitlementApi`; plan changes take effect without redeploy.

---

## Appendix E. Permission Key Examples

`society.settings.manage`, `resident.unit.manage`, `resident.directory.view`, `maintenance.complaint.create`, `maintenance.complaint.assign`, `maintenance.task.assign`, `maintenance.task.update`, `maintenance.asset.manage`, `security.visitor.create`, `security.gate.entry`, `security.parcel.issue`, `workforce.attendance.self`, `workforce.payroll.view`, `workforce.payroll.approve`, `finance.invoice.generate`, `finance.payment.record`, `finance.payment.refund`, `finance.expense.approve`, `finance.tally.sync`, `finance.period.lock`, `platform.audit.view`, `platform.support.impersonate`.

Default roles: Chairman, Secretary, Treasurer, Committee Member, Facility Manager, Accountant, Security Supervisor, Security Guard, Worker, Resident Owner, Resident Tenant, Family Member, Vendor, Platform Support, Platform Admin.

---

## Appendix F. Error Code Taxonomy

| Code                              | HTTP | Meaning                                                                 |
| --------------------------------- | ---- | ----------------------------------------------------------------------- |
| `VALIDATION_FAILED`               | 422  | Request body or query failed schema validation, `details` lists fields  |
| `UNAUTHENTICATED`                 | 401  | Missing, expired, or invalid token                                      |
| `FORBIDDEN`                       | 403  | Authenticated but lacks permission                                      |
| `FEATURE_NOT_ENTITLED`            | 403  | Feature or limit not part of the tenant's plan                          |
| `QUOTA_EXCEEDED`                  | 429  | Usage quota or credit exhausted                                         |
| `RATE_LIMITED`                    | 429  | Rate limit hit, `Retry-After` set                                       |
| `NOT_FOUND`                       | 404  | Not found or not visible to this tenant (no existence leak)             |
| `CONFLICT`                        | 409  | State conflict or invalid state transition                              |
| `IDEMPOTENCY_KEY_REQUIRED`        | 400  | Header missing on a mutation that requires it                           |
| `IDEMPOTENCY_KEY_REUSED`          | 409  | Same key with a different request body                                  |
| `PRECONDITION_FAILED`             | 412  | `If-Match` version mismatch                                             |
| `COMPLIANCE_ATTESTATION_REQUIRED` | 409  | Live finance feature requested without an active controller attestation |
| `TENANT_SUSPENDED`                | 403  | Tenant is suspended or in grace restrictions                            |
| `PROVIDER_UNAVAILABLE`            | 503  | Downstream provider failed, retry later                                 |
| `INTERNAL_ERROR`                  | 500  | Unexpected failure, correlate with `requestId`                          |

---

## Appendix G. Optional and Future Differentiators (not core V1)

All behind feature flags and premium plans. Validate demand before making any a dependency of the core system.

AI Society COO, Complaint Intelligence, Asset Digital Twin, Repair vs Replace Intelligence, Proof-of-Work, Vendor SLA Intelligence, Committee Handover Mode, Privacy Center, Voice-First Worker App, Offline Gate Mode (planned in Phase 5 baseline, see A-03), Compliance OS, Incident Command Center, Finance-to-Operations Trace, Society Benchmarking, Automation Marketplace, Society Health Dashboard, Shift Handover, Predictive Maintenance, AI Finance Insights, Procurement Intelligence, Daily Society Brief.

Constraint for all AI features: AI may recommend; critical and financial actions require human approval and are audited. Scores must be explainable, never an opaque single number.

---

## Appendix H. Open Decisions and References

### H.1 Decisions needed from the project owner

| ID   | Question                                                                            | Recommendation                                                                                 |
| ---- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| D-03 | Which Next.js major should be used?                                                 | Next.js 16 Active LTS as of 2026-11-16; pin a supported patch and verify package compatibility |
| D-11 | Drizzle or Prisma with RLS extension?                                               | Drizzle (SQL-first, simpler transaction-scoped context)                                        |
| D-14 | PWA first then Expo, or native from the start?                                      | PWA first                                                                                      |
| H-01 | Is internal double-entry accounting a V1 feature or only Tally posting?             | Feature-flagged, off by default                                                                |
| H-02 | Who is the qualified financial controller and when is the first review slot?        | Book in Phase 0                                                                                |
| H-03 | Is the first customer a single society, a multi-society organization, or a builder? | Affects the Organization entity depth                                                          |
| H-04 | Languages beyond English at launch?                                                 | Hindi and Marathi ready                                                                        |

### H.2 References

- PostgreSQL documentation, "Row Security Policies" (`ddl-rowsecurity`): https://www.postgresql.org/docs/19/ddl-rowsecurity.html
- AWS Database Blog, "Multi-tenant data isolation with PostgreSQL Row Level Security": https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security
- AWS Prescriptive Guidance, "Row-level security recommendations": https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/rls.html
- Shopify Engineering, "Deconstructing the Monolith": https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity
- Shopify Engineering, "Enforcing Modularity in Rails Apps with Packwerk": https://shopify.engineering/blogs/engineering/enforcing-modularity-rails-apps-packwerk
- microservices.io, Transactional Outbox: https://microservices.io/patterns/data/transactional-outbox.html
- Tally Solutions, XML integration documentation: https://help.tallysolutions.com/xml-integration/
- Razorpay, "Validate and Test Webhooks": https://razorpay.com/docs/webhooks/validate-test
- Next.js Support Policy: https://nextjs.org/support-policy
- CBIC Circular No. 109/28/2019-GST (GST on RWA maintenance charges), and Notification No. 12/2017-Central Tax (Rate), entry 77
- Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025 (MeitY)

_End of core specification (Appendices I and J extend this baseline)._

---

## Appendix I. Engineering Review, Corrections, and Phase 0 Acceptance Requirements

**Review date:** 2026-11-16  
**Purpose:** resolve contradictions and identify implementation-critical details before Antigravity scaffolding. This appendix is normative where it conflicts with an earlier section. It does not authorize implementation beyond the currently approved phase.

### I.1 Executive review outcome

The architecture is a sound starting point for an India-first, multi-tenant Society ERP: a modular monolith, PostgreSQL shared-schema tenancy with RLS, explicit module ownership, transactional outbox, provider ports, and phased delivery are appropriate for a small engineering team. The specification is not yet a fully executable implementation contract. The following must be addressed in Phase 0 before production-facing work:

1. Harden the trust model behind PostgreSQL tenant context; a freely settable custom PostgreSQL setting is not, by itself, a security boundary against arbitrary SQL execution under the application role.
2. Separate migration, runtime, relay, and break-glass privileges. `BYPASSRLS` identities must not become ordinary application credentials.
3. Correct migration semantics: immutable, checksummed, one-time migrations are safer than the blanket requirement that every migration be safely re-runnable.
4. Define JSON money serialization as decimal strings even though internal arithmetic uses `bigint` paise.
5. Resolve partitioning only after accounting for PostgreSQL partition-key constraints and real query/retention needs; do not partition every high-volume-looking table by assumption.
6. Define the authoritative accounting record and source-of-truth boundaries for internal ledger versus TallyPrime.
7. Make disaster-recovery objectives measurable; daily cross-region backup copies do not prove a five-minute RPO.
8. Treat DPDP, GST, payroll, payment aggregation, and society-specific accounting as counsel/controller-reviewed requirements, not as legal conclusions embedded in code.

The specification can proceed to a controlled Phase 0 scaffold after the project owner approves the remaining decisions in Appendix H and the Phase 0 scope. It should not be treated as authorization to build all product modules.

### I.2 Corrected technology lifecycle baseline

As of 2026-11-16:

- Next.js 16 is listed as Active LTS; Next.js 15 is Maintenance LTS and Next.js 14 is unsupported. Use Next.js 16 for a new build, subject to a Phase 0 compatibility spike and pinned patch version.
- Node.js 24 is the selected project runtime baseline for ecosystem maturity. Test Node.js 26 compatibility during Phase 0 as a future upgrade candidate, but do not switch the project baseline automatically. A move to Node.js 26 requires an approved ADR after the selected NestJS version, native dependencies, build images, CI, and deployment have all passed compatibility validation. Node.js 22 is not a project runtime baseline.
- PostgreSQL 16 remains supported, with upstream support currently scheduled through 2028-11-09. Keep it as the supplied baseline for the Phase 0 spike, but evaluate PostgreSQL 17/18 against the chosen AWS RDS availability, extensions, drivers, migration tooling, and operational support before production. Pin a supported minor and apply security/minor updates routinely.
- Runtime, framework, ORM, queue, and database versions must be pinned in repository tooling and updated through a documented dependency policy. “Latest” must never mean an unpinned floating production dependency.

### I.3 RLS context is a trust boundary, not just a coding convention

The existing pattern uses `set_config('app.tenant_id', ..., true)` and RLS policies that read the setting. Transaction-local scope correctly prevents tenant context leaking across PgBouncer transaction-pooled connections. However, a PostgreSQL custom GUC can ordinarily be set by a session using that database role. Therefore, if arbitrary SQL can execute as `app_runtime`, an attacker may attempt to change the tenant GUC and query another tenant. Parameterized SQL and application-layer authorization remain essential; RLS alone does not neutralize arbitrary SQL injection when the runtime role can forge its own context.

**Phase 0 must evaluate and document one of these trust models:**

- **Signed tenant context:** application signs `{tenantId, userId, membershipId, issuedAt, nonce}` using a secret unavailable to `app_runtime` inside PostgreSQL. A narrowly scoped `SECURITY DEFINER` function validates the signature and installs transaction-local context; RLS helper functions must validate the signed context rather than trusting a bare GUC. Restrict function ownership, `search_path`, execution grants, secret access, and key rotation. Test direct attempts to overwrite GUCs and call the setter with forged signatures.
- **Database-enforced identity context:** use a connection/role strategy where the database can independently establish the tenant identity and the runtime cannot assume another tenant's identity. Prove pooler compatibility and operational feasibility before selecting it.

Do not claim the signed-context design is implemented until a working exploit-oriented test demonstrates that a runtime session cannot impersonate another tenant by setting arbitrary GUC values. A `SECURITY DEFINER` function must set a fixed safe `search_path`, schema-qualify objects, revoke default `PUBLIC` execution where appropriate, and expose only the minimum required operation.

Additional RLS requirements:

- The RLS catalog verifier must inspect policy expressions, command scope, role targets, table owner, `relrowsecurity`, and `relforcerowsecurity`; checking only for a policy named `tenant_isolation` is insufficient.
- Test both permissive and restrictive policy interactions. PostgreSQL permissive policies combine with OR; an accidentally broad permissive policy can weaken isolation.
- Define policies/grants for `app_readonly` explicitly if it is used. Do not assume the `app_runtime` policy grants reporting access.
- Every cross-tenant relationship must be impossible at the database constraint layer where feasible, using composite `(tenant_id, id)` foreign keys inside a module. A plain UUID reference is not sufficient for same-module parent-child relationships.
- Keep global platform tables and tenant tables explicitly classified in a registry. A table with personal, operational, or financial tenant data must not accidentally be classified global.
- RLS does not govern `TRUNCATE`, and referential-integrity checks bypass row security. Runtime roles must not receive `TRUNCATE`, schema ownership, DDL, or broad table-owner privileges.

### I.4 Database role model and migrations

The role model in section 2.3 needs the following clarifications before SQL is finalized. `app_migrator` is the login identity for the approved migration job; `app_owner` remains a non-login ownership role reached only through the controlled role-membership path.

| Identity             | Required posture                                                                                                                                                                                                                                      | Must not do                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `app_runtime`        | No superuser, no `BYPASSRLS`, no ownership, no DDL, no `TRUNCATE`; minimum DML and execute grants                                                                                                                                                     | Run migrations, scan all tenants, assume owner/relay/support roles                 |
| `app_owner`          | Non-login ownership role for application schemas and tables; no routine application credentials                                                                                                                                                       | Connect directly from API/worker or act as a general-purpose cross-tenant operator |
| `app_migrator` (new) | Short-lived CI/deployment identity, available only to approved migration job; can assume `app_owner`; any `BYPASSRLS` capability is isolated to this job and audited                                                                                  | Serve API/worker traffic or be stored in developer `.env` files                    |
| `app_relay`          | Prefer narrow `SECURITY DEFINER` relay functions or a separate queue/outbox design that avoids a broadly privileged role. If `BYPASSRLS` remains necessary, isolate credentials, restrict grants to exact required objects, and audit every operation | Read business schemas or be reused by normal workers                               |
| `app_platform_ops`   | Just-in-time, time-boxed, ticketed break-glass identity with MFA, statement/session audit, alerting, and post-use review                                                                                                                              | Be continuously available to the platform-admin web app or API                     |
| `app_readonly`       | Explicitly scoped reporting access with RLS context and read-only grants                                                                                                                                                                              | Become a cross-tenant analytics bypass                                             |

**Important migration detail:** `FORCE ROW LEVEL SECURITY` also subjects the table owner to RLS. The migration design must explicitly handle backfills and data repair without quietly disabling RLS in production. A controlled migration identity may temporarily assume an approved owner/migration role, but every exception must be narrowly scoped, audited, and unavailable to the runtime process. Test the actual role graph and privileges in PostgreSQL; do not rely on role names or comments.

### I.5 Migration policy replaces blanket idempotency

The original requirement that all migrations be idempotent and re-runnable is replaced by this policy:

- Each migration is an immutable, ordered, checksummed unit recorded in a migration ledger.
- The migration ledger is the source of truth for applied migration IDs, checksums, timestamps and execution metadata. The runner verifies historical checksums, applies only pending migrations in deterministic order, and records successful completion. A repeated deployment sees the ledger and performs a no-op; it does not rerun arbitrary DDL.
- Do not edit an applied migration. Add a forward migration that corrects it.
- Prefer transactional migrations where PostgreSQL supports them. For operations that cannot run transactionally, document restart/recovery behaviour and use an explicit migration state machine.
- Validate a clean install from zero, an upgrade from the previous supported release, interrupted migration recovery, checksum mismatch detection, and repeat deployment.
- Seeders and operational scripts remain idempotent. `CREATE TABLE IF NOT EXISTS` must not be used as a substitute for schema-drift detection.
- Use expand-and-contract for zero-downtime changes. Destructive column/table removal happens only after all deployed code versions no longer depend on it.

### I.6 Money, accounting, and API contract clarifications

- Internal monetary values are integer paise (`bigint`) and all arithmetic is exact. No JavaScript floating-point arithmetic for money, tax, rates, or rounding.
- JSON APIs MUST serialize paise as decimal strings. OpenAPI schemas must declare these as strings with a non-negative or signed integer pattern as appropriate. Generated clients must expose a branded decimal-string type or a safe `bigint` conversion helper. Never serialize JavaScript `bigint` directly with `JSON.stringify`.
- Define `Money` currency, sign, rounding mode, rounding point, tax-inclusive/exclusive semantics, and overflow bounds centrally. INR is the initial currency, but do not infer that every vendor/customer amount is tax-exclusive.
- For `ExpenseApi.submitExpense`, specify whether `amountPaise` is tax-exclusive, tax-inclusive, or a document total, and require line-level tax calculation/validation to reconcile to the payable total. Reject ambiguous combinations.
- Posted financial entries are immutable. Corrections are reversal/adjustment entries linked to the original posting. Maintain a clear distinction between a business document (invoice/expense/payment) and accounting journal posting.
- Resolve H-01 before Phase 4: if an internal double-entry ledger is enabled, define whether it is the operational subledger, the statutory book, or only a reporting projection. If TallyPrime is the statutory accounting system, document which system owns chart of accounts, voucher numbering, period locks, and final balances. Never allow two systems to be silently authoritative for the same ledger.
- “Gapless” invoice/receipt numbering is not a generic database promise. Define the applicable legal/business requirement with the controller. Prefer sequential, tenant- and financial-year-scoped numbering with immutable audit history; if gapless numbering is legally required, design a serialized allocation and void-number register and test rollback/concurrency behaviour.
- Idempotency records need a defined retention window, request-hash algorithm, response replay policy, and behaviour after expiry. Financial idempotency keys must be retained for the full period needed to prevent duplicate financial effects, not purged by a generic short TTL.

### I.7 Partitioning and relational integrity

Partitioning is an optimization and retention strategy, not a blanket prerequisite inferred from projected row counts.

- Begin with tenant-leading indexes, selective queries, retention jobs, and load tests. Partition append-only event/log tables when volume and retention justify the added operational complexity.
- Before partitioning, design primary keys and unique constraints to include the partition key where PostgreSQL requires it. Recheck every foreign key, idempotency constraint, upsert, and cross-module reference.
- Do not partition `finance.invoice` or related financial documents solely because an estimate says 11,000 rows per tenant-year including lines. Financial records have complex uniqueness, references, audit, and retention requirements; measure first.
- Partitioned parent tables must have tested RLS behaviour and child-partition access rules. The verifier must enumerate partitions, including detached/default partitions.
- Partition creation, retention, archival, and detach/drop operations require observable, idempotent operational jobs with alerts for missing future partitions. Never allow an insert to fail silently because the next partition was not created.

### I.8 Event, queue, and worker hardening

- The transactional outbox is written in the same database transaction as the business state change. The relay must claim rows with a lease/claim protocol so multiple workers cannot publish the same row concurrently unnecessarily. At-least-once delivery remains expected; consumers must be idempotent.
- Store event schema version, tenant, aggregate, correlation, causation, actor, and a minimal payload. Do not put secrets, raw identity documents, payment credentials, or unnecessary personal data in events.
- Validate event schemas at producer and consumer boundaries. Unknown major versions must be quarantined/dead-lettered, not guessed.
- A queue payload is untrusted input even when produced internally. Validate tenant id, event id, schema, job type, and allowed operation before setting context. Do not let a user-controlled job payload choose `platformJob` or a privileged execution mode.
- Define retryable versus permanent errors, maximum attempts, exponential backoff with jitter, poison-message handling, replay permissions, and per-tenant fairness. Manual replay must be audited and idempotent.
- Define outbox retention and archival separately from `processed_event` retention. A relay outage must trigger a lag alert before it becomes a tenant-visible incident.

### I.9 Privacy and regulatory governance

- The DPDP Rules, 2025 were notified on 2025-11-13 with staged commencement. The eighteen-month commencement date for the principal operational provisions falls in May 2027; the one-year commencement provisions fall in November 2026. The exact provision-by-provision schedule and applicability must be checked against the Gazette notification and subsequent amendments before launch. Do not reduce this to a blanket statement that all obligations begin on one date.
- Determine contractually whether the society, the SaaS operator, or another party is the Data Fiduciary for each processing purpose and whether the SaaS operator acts as a Data Processor. Document instructions, subprocessors, breach cooperation, retention/deletion, and data return in the customer agreement.
- A consent record is not a universal legal basis for every operation. Maintain a purpose and lawful-basis register; distinguish necessary service processing, consent-based optional processing, statutory retention, and marketing preferences. Withdrawals must stop the relevant optional processing without deleting records that must legally be retained.
- Design rights-request workflows with identity verification, scope discovery, response tracking, legal-retention exceptions, and auditable outcomes. A tenant admin must not be able to erase records outside their lawful authority.
- Define special controls for minors' data, visitor photographs, domestic-help data, CCTV references, KYC documents, payroll, bank data, and emergency contact information. Collect the minimum data needed and define who can access each class.
- Obtain Indian privacy counsel review before production. This specification is engineering guidance, not legal advice or a compliance certification.

### I.10 Disaster recovery and service objectives

- The five-minute RPO is a production target, not something established by daily snapshots. The architecture must specify the replication mechanism, expected lag, failover procedure, data-loss window, DNS/application cutover, and reconciliation of in-flight queue work.
- Measure RPO and RTO in scheduled exercises. Report actual results, not only configured values. Define separate pilot and production objectives if the pilot footprint is single-AZ or lacks cross-region replication.
- Define whether Redis/BullMQ data is durable or reconstructable. Critical business state and outbox events must remain in PostgreSQL; queue jobs should be reproducible from durable state where feasible.
- Define backup encryption/key recovery, restore access, immutable backup protection, and restore testing. A backup is not accepted until a restore test demonstrates usable application data.
- SLOs need an error budget, measurement window, exclusions, and alert thresholds. Treat initial p95 targets as hypotheses to validate with realistic load tests and real-device gate tests.

### I.11 Offline gate security requirements (before Phase 5 implementation)

The offline gate design must specify:

- Device enrollment, user authentication, device-bound keys, encrypted local storage, key rotation, remote revocation, and lost/stolen-device response.
- Exact offline data fields and cache expiry. Do not cache full resident/KYC records if a minimal allowlist/lookup token is sufficient.
- Offline QR/OTP threat model, replay protection, clock drift, device time tampering, screenshot/reuse risk, and what can/cannot be verified without a network.
- Append-only local event records with device identity, monotonic sequence, client-generated event id, local timestamp, server receipt timestamp, and conflict-resolution rules.
- Explicit distinction among online-approved, pre-approved offline, and offline-unverified entries. Offline mode must never imply that a resident approved an entry when no approval was received.
- A maximum offline window, stale-cache warning, safe-mode behaviour, and guard escalation procedure. Do not claim 72-hour resilience until tested on representative low-cost Android devices.

### I.12 Security requirements to add to the engineering backlog

Before the first production tenant, create a threat model and test controls for:

- Authentication/session fixation, OTP abuse, credential stuffing, refresh-token theft/reuse, tenant switching, account recovery, and support impersonation.
- IDOR/BOLA across every tenant-scoped resource and every nested object/document download.
- SQL injection and tenant-context forgery, SSRF in URL/file import features, stored/reflected XSS, CSRF, clickjacking, and unsafe redirects.
- Upload validation, content sniffing, malware scanning, decompression bombs, image metadata stripping, and private-object access.
- Webhook signature verification over raw bytes, replay/duplicate delivery, timestamp policy where supported, secret rotation, and out-of-order event handling.
- Rate limiting by IP, account, tenant, device, and provider cost; OTP/SMS abuse controls and spend caps.
- Secrets management, key rotation, dependency/SBOM scanning, container hardening, least-privilege IAM, and audit log integrity.
- Data export abuse, CSV/formula injection, report permission filtering, and PII leakage through logs/traces/errors.

### I.13 Phase 0 acceptance checklist (must be evidenced, not merely documented)

Phase 0 is complete only when the following evidence exists in the repository/CI or a reviewed ADR:

1. Approved ADRs for Next.js, Node.js, PostgreSQL major, ORM/migrations, PWA/native sequencing, and the database tenant-context trust model.
2. Monorepo skeleton and dependency-boundary rules compile; CI rejects an intentional illegal cross-module import.
3. RLS integration test proves tenant A cannot read/write tenant B through direct SQL, API endpoints, worker jobs, and PgBouncer transaction pooling. Include a forged-GUC/forged-context test.
4. Database role test proves `app_runtime` cannot own tables, alter schema, truncate, bypass RLS, assume relay/owner/support roles, or read another tenant. Migration and relay identities are separately exercised.
5. OpenAPI 3.1 output is validated by an independent OpenAPI 3.1 validator; generated clients preserve paise strings and UUID/date formats.
6. Auth spike proves PKCE, JWKS rotation, refresh rotation/reuse detection, session revocation, tenant switch, BFF cookie handling, CSRF protection, and MFA for platform admins.
7. Outbox spike proves atomic write, concurrent relay claims, duplicate publication, idempotent consumption, replay, dead-letter handling, and tenant context validation.
8. Migration runner proves clean install, supported upgrade, interrupted recovery, checksum mismatch detection, and safe repeat deployment without reapplying completed migrations.
9. Docker Compose local stack starts from a clean checkout and includes PostgreSQL, Redis, PgBouncer transaction mode, object storage, and mail testing. Health checks and documented reset commands work.
10. Staging deployment and restore/failover approach are demonstrated within the approved pilot budget; do not mark RPO/RTO passed without a timed exercise.
11. Finance review register and DPDP processing register exist with named owners or explicitly marked TBD; no live payment or tax feature is enabled.
12. A phase 0 completion report records commands run, outputs, failed checks, unresolved risks, and exact next approval required.

### I.14 Remaining owner decisions that cannot be inferred safely

These are genuine product-owner or specialist decisions, not engineering details to silently guess:

- H-01: internal double-entry ledger scope and accounting source of truth versus TallyPrime.
- H-02: named qualified financial controller, qualification, engagement, and review calendar.
- H-03: first customer profile and whether an Organization can own/manage multiple society tenants in the first release.
- H-04: launch languages and translation ownership.
- Payment gateway commercial/legal arrangement and settlement flow; confirm that the selected arrangement does not create unintended custody/payment-aggregator obligations.
- Society-specific rules for invoice/receipt numbering, late fees, corpus/sinking funds, GST/TDS handling, and retention.
- Pilot service levels, budget, data residency commitments, support hours, and recovery objectives.
- Whether resident/visitor identity verification, KYC, CCTV, biometrics, ANPR, and offline access are actually required for the first pilot.

### I.15 Verified reference updates

The following official references were checked for this review; re-check them at implementation time because support policies and laws can change:

- Next.js Support Policy: https://nextjs.org/support-policy
- Node.js release schedule: https://github.com/nodejs/Release
- PostgreSQL versioning policy: https://www.postgresql.org/support/versioning/
- Gazette of India notification G.S.R. 843(E), 2025-11-13 (DPDP Act commencement schedule): https://egazette.gov.in/WriteReadData/2025/267647.pdf
- TallyPrime XML integration: https://help.tallysolutions.com/xml-integration/
- TallyPrime integration prerequisites and HTTP/XML request format: https://help.tallysolutions.com/pre-requisites-for-integrations/
- Razorpay webhook validation and duplicate-event handling: https://razorpay.com/docs/webhooks/validate-test

_End of engineering-reviewed specification._

---

## Appendix J. Implementation Operating System and Repository Bootstrap

**Status:** Normative implementation addendum. This appendix extends sections 2–5 and does not replace the domain model or authorize production financial functionality. Where an instruction here conflicts with Appendix I, Appendix I controls. Product-owner decisions remain unapproved until explicitly accepted.

### J.1 Coverage audit and disposition of the initial draft

The initial 1,469-line draft already specified product domains, module ownership, inter-module interfaces and events, PostgreSQL RLS, API contracts, authentication design, queues, frontend surfaces, deployment, release gates, phases, entity/state catalogs, permissions, entitlements and open decisions. Those areas are retained rather than duplicated.

The engineering-reviewed baseline (v1.0) corrected the Next.js lifecycle recommendation, migration semantics, database privilege model, RLS trust assumptions, money serialization, partitioning caution, accounting authority boundaries, and measurable disaster-recovery expectations. Appendix I is normative for those corrections.

The implementation gaps addressed here are: a repeatable developer-machine bootstrap; repository and agent operating conventions; concrete local service topology; environment and secret handling; database bootstrap sequence and verification; incremental identity implementation; feature-spec and QA templates; Git and observability procedures; and milestone-level Phase 0 acceptance evidence. Any external compatibility question not proven by a Phase 0 spike remains explicitly open.

### J.2 Mandatory AI-assisted engineering lifecycle

All AI-assisted changes MUST follow this lifecycle. The workflow is inspired by Superpowers-style engineering practices; it is implemented as repository instructions and skill documents. Do not assume Antigravity automatically discovers or executes a third-party skill format. The repository must provide explicit entry points in `AGENTS.md`, `.agents/workflows/`, and `.agents/skills/`.

| Work type           | Required sequence                                                                                                              | Required evidence                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| New feature         | Clarify requirements → inspect code/spec → design → plan → TDD → implement in slices → review → verify → docs/handoff          | Approved feature spec, plan, tests, review report   |
| Bug                 | Reproduce → add failing regression test → diagnose → minimal fix → run focused and regression suites                           | Reproduction steps and before/after test result     |
| Database change     | Data ownership review → schema proposal → migration design → RLS policy → pgTAP → repository integration → migration rehearsal | SQL migration, checksum/ledger result, RLS evidence |
| Architecture change | Impact analysis → ADR → dependency/security review → owner approval → implementation plan → tests                              | Accepted ADR and updated decision register          |
| Refactor            | Capture existing behaviour → tests → small refactor steps → regression suite → boundary check                                  | No unexplained behaviour change; test report        |
| New module          | Module charter → dependencies/contracts/events → data ownership → vertical slice → integration tests                           | Public `api/`, event schema, boundary check         |

Required workflow behaviours:

1. **Brainstorming:** ask focused questions only where requirements are ambiguous; record confirmed requirements separately from assumptions. Do not invent product policy.
2. **Codebase/architecture inspection:** read root `AGENTS.md`, relevant nested instructions, `docs/specs.md`, the target module's public API, relevant ADRs, and current implementation before editing.
3. **Design:** state scope, non-goals, data flow, failure modes, tenant boundary, permissions, audit events, migrations, and test strategy.
4. **Planning:** create `docs/plans/YYYY-MM-DD-<feature>.md` with small independently verifiable tasks, exact files/areas, commands, and acceptance criteria.
5. **TDD:** write a failing test, run it to demonstrate failure, implement the smallest change, rerun the test, then relevant regression tests. Never claim red/green evidence without command output.
6. **Execution:** implement one plan task at a time; keep diffs focused. Use subagents only for separable research/review tasks with explicit boundaries. The coordinating agent owns integration and final verification.
7. **Review:** run a dedicated review pass for correctness, security, tenant isolation, module boundaries, data integrity, performance, and scope creep.
8. **Verification:** execute actual checks and report exact commands, exit status, and skipped checks. A static inspection is not a test run.
9. **Handoff:** update context files, implementation status, known issues, ADRs and runbooks. Summarize files changed, tests run, risks, and next task.

The following named skills may be used when installed in the agent environment: Brainstorming, Writing Plans, Executing Plans, Test-Driven Development, Subagent-Driven Development, Code Review, Verification Before Completion, and Finishing a Development Branch. If a named skill is not installed or callable, follow the equivalent procedure in this appendix; never claim a skill was invoked when it was not.

### J.3 Root `AGENTS.md` constitution

Create this root file during repository bootstrap. Keep it concise and authoritative; detailed procedures belong in this specification and reusable skills.

```markdown
# Agent Operating Constitution — Society ERP

## Source of truth

- Read `docs/specs.md` before implementation and the relevant ADRs, feature spec,
  module API, and nested AGENTS.md files.
- Distinguish owner-confirmed requirements, defaults, assumptions, and open decisions.
- If a requirement is missing or conflicts with this specification, stop and report it;
  propose a diff and ADR rather than silently deciding.

## Architecture

- This is a modular monolith. Do not create microservices without an approved ADR.
- Cross-module calls use only the owning module's `api/` contracts or published events.
- Never import another module's domain, application, infrastructure, HTTP or DB internals.
- Preserve the dependency DAG in specification section 1.3.

## Data and security

- Every tenant-owned table has `tenant_id`, forced RLS and the approved policy.
- Use TenantTransaction; set tenant context transaction-locally in the same transaction.
- Never grant runtime BYPASSRLS, superuser, ownership, or migration privileges.
- Enforce authorization and entitlements on the server. Fail closed on missing context.
- Never log secrets, tokens, credentials, or unnecessary personal information.
- Never disable a security test or weaken a policy to make a build pass.

## Finance

- Store money as integer paise (`bigint`) via Money; never use floating point.
- Do not enable live payments, tax calculation, payroll compliance, or ledger posting
  without the relevant G-FIN/controller approval and documented ADR/review evidence.
- Use idempotency keys and immutable/reversal-based financial records.

## Engineering

- TypeScript strict; validate external input; follow module folder conventions.
- No new dependency or architecture change without approval and ADR.
- Use TDD for behaviour changes. Add regression tests for bugs.
- Run lint, typecheck, relevant tests, boundary checks, migration checks and security
  checks applicable to the change. Report exact commands and results.
- Do not claim tests, builds, deployments, or skills ran unless they actually did.

## Git and scope

- Use short-lived branches and Conventional Commits.
- Do not push, merge, deploy, rotate secrets, or perform destructive operations without
  explicit authorization.
- Do not modify unrelated modules. Explain any necessary cross-module impact.

## Definition of Done

- Acceptance criteria met; tests and applicable quality gates pass.
- Tenant isolation, permissions, audit and idempotency considered and tested.
- API/event contracts and docs updated; migration is reviewed and rehearsed.
- No unresolved high-severity review findings.
- `docs/context/` handoff files updated and final report states evidence and limitations.
```

Nested `AGENTS.md` files are optional and should be added only where a module has genuinely distinct constraints (for example `modules/finance/AGENTS.md`, `modules/security/AGENTS.md`, `infra/AGENTS.md`). They may add rules but MUST NOT weaken root rules or duplicate the full constitution. A module file should state ownership, allowed dependencies, sensitive data, required tests and module-specific Definition of Done.

### J.4 Reusable agent skills

Store skills in `.agents/skills/<skill-name>/SKILL.md`. Keep them procedural and link back to this specification instead of copying global architecture rules.

| Skill                      | Activate when                                        | Required inputs                              | Outputs and verification                                                                    |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `society-erp-architecture` | New domain, cross-module flow, architecture proposal | Requirement, module map, ADRs                | Context/dependency diagram, contract proposal, ADR; dependency-cruiser passes               |
| `database-engineering`     | Schema, migration, query, index, seed                | Entity ownership, access patterns, retention | Drizzle schema/SQL migration, indexes, migration rehearsal; catalog checks                  |
| `multi-tenant-security`    | Tenant context, RLS, auth scope, storage/cache       | Threat model, tenant/resource scope          | Policy and negative tests; pgTAP and cross-tenant API tests pass                            |
| `backend-development`      | NestJS use case, controller, worker                  | Public contract, domain rules                | Domain/application/infra implementation; unit/integration tests                             |
| `frontend-development`     | Next.js page, form, role shell, PWA                  | UX acceptance criteria, API contract         | Accessible UI and generated-client integration; Testing Library/Playwright                  |
| `api-contract-engineering` | HTTP DTO, OpenAPI, event schema                      | Consumer/provider requirements               | Versioned contract, compatibility report, generated client checks                           |
| `financial-engineering`    | Charges, invoice, payment, expense, payroll, ledger  | Controller-approved rules and G-FIN status   | Money-safe domain rules, reconciliation and audit tests; no live activation absent approval |
| `testing-tdd`              | Any behaviour change or regression                   | Acceptance criteria, test fixtures           | Failing test evidence, implementation, regression report                                    |
| `code-review`              | Before PR completion or sensitive changes            | Diff, spec, tests, ADRs                      | Findings ranked critical/high/medium/low; all critical/high resolved                        |
| `devops-deployment`        | Docker, CI/CD, Terraform, release                    | Environment, threat model, rollback plan     | Reproducible config, pipeline/runbook, security and deploy checks                           |
| `documentation-management` | Any spec, API, runbook, context change               | Actual implementation and decision state     | Updated docs with links, no stale claims; cross-reference check                             |

Every `SKILL.md` MUST contain: purpose; activation conditions; inputs; step-by-step procedure; constraints; output format; verification commands; escalation conditions. Skills are instructions, not autonomous permissions. They cannot authorize production access, data deletion, payments, or deployment.

### J.5 Session continuity and context files

Maintain these files under `docs/context/` once implementation begins:

- `current-state.md`: current branch/commit, implemented milestones, service status, known-good commands.
- `active-task.md`: one active task, objective, acceptance criteria, plan link, files touched, test status.
- `pending-work.md`: prioritized backlog with blockers and owners.
- `known-issues.md`: reproducible defects, impact, workaround, linked issue.
- `architectural-decisions.md`: index of accepted/proposed/rejected ADRs; ADR files remain authoritative.
- `next-steps.md`: exact next safe action and prerequisites.

At the end of every AI coding session, update the relevant files with verified facts only. Include date, branch/commit, commands actually run, pass/fail, changed files, migration state, unresolved risks and next step. Do not paste secrets or personal data into context files. If no implementation changed, do not fabricate progress; update only the handoff if it helps continuity.

### J.6 Final repository structure

The following is the target monorepo. Directories are created when their first real file is needed; do not create empty placeholders solely to match the tree.

```text
society-erp/
├── AGENTS.md
├── README.md
├── CONTRIBUTING.md
├── .gitignore
├── .env.example
├── .node-version
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── apps/
│   ├── web/                    # Next.js resident/admin/accountant/vendor surfaces and BFF
│   ├── platform-admin/         # separately authorized SaaS operations UI
│   ├── api/                    # NestJS HTTP composition root
│   ├── worker/                 # queue consumers, schedules and outbox relay
│   ├── tally-bridge/           # later customer-side outbound connector
│   └── mobile/                 # later Expo application; omit until approved phase
├── packages/
│   ├── contracts/              # Zod, OpenAPI, event schemas and generated clients
│   ├── shared-kernel/          # pure types/value objects; no I/O or business ownership
│   ├── ui/                     # shared accessible design system
│   ├── config/                 # TS, ESLint, Prettier, boundary rules
│   └── testing/                # factories, fixtures and test helpers
├── modules/
│   ├── platform/{identity,tenancy,notification,documents,audit,workflow,search,reporting-core}/
│   ├── resident/ finance/ workforce/ maintenance/ security/ community/
│   └── <module>/<module>.module.ts plus api,domain,application,infrastructure,http,db/
├── db/
│   ├── migrations/             # ordered immutable SQL migration files
│   ├── seeds/{platform,dev,test,demo}/
│   └── tests/                  # pgTAP and database verification
├── tools/
│   ├── scaffold/               # deterministic repository/bootstrap helpers
│   ├── db/                     # role, migrate, seed, reset, RLS verification
│   ├── verification/           # contract, boundary and release checks
│   └── scripts/                # documented cross-platform helpers
├── infra/{docker,terraform,runbooks}/
├── docs/
│   ├── specs.md                # canonical specification
│   ├── adr/                    # ADR-NNN-title.md
│   ├── architecture/ api/ plans/ progress/ context/ compliance/ runbooks/
├── .agents/{skills,workflows}/
└── .github/
    ├── workflows/              # CI, security, image build and deploy
    └── pull_request_template.md
```

The compact brace notation above represents real directories, not literal directory names. Keep the `apps/api` and `apps/worker` composition roots thin. Domain modules are imported into both processes; they are not independently deployed services. `platform-admin` may be separately deployed because it is a distinct application/security surface, not a domain microservice. Defer `mobile` and `tally-bridge` scaffolding until their phases require them.

Each module uses the existing section 3.3 internal layout. `api/` is the only cross-module import surface. `domain/` has no framework or I/O dependencies. `application/` coordinates use cases and ports. `infrastructure/` owns Drizzle repositories/adapters. `http/` maps transport concerns. `db/` owns schema declarations and migration references. No module reads another module's tables.

### J.7 Developer workstation and local services

Supported baseline for Phase 0: Windows 11 64-bit with WSL2 and a current Ubuntu LTS distribution; run Node, pnpm, Git and repository commands inside WSL2 to avoid mixed Windows/Linux path and file-watcher issues. Docker Desktop with WSL2 integration supplies containers. Antigravity is the editor/agent host; the repository's command-line workflow must remain usable without it. macOS/Linux contributors may use equivalent native tooling, but CI is the canonical compatibility environment.

Pin exact patch versions in `.node-version`, `package.json` `engines`, `packageManager`, lockfile and CI. Baseline majors: Node.js 24 (test Node.js 26 compatibility before switching), pnpm 10 (pin exact release), Git current supported release, Docker Desktop/Compose v2 current stable, PostgreSQL 16, Redis 7, PgBouncer current supported release, MinIO current pinned release, Mailpit current pinned release. Exact patches are resolved and committed in Milestone 0.1; never use floating `latest` in reproducible builds.

Install Docker Desktop, enable WSL2 integration for the chosen distro, install Git in WSL, install the pinned Node version using the team's approved version manager, then enable Corepack and activate the exact pnpm release from `package.json`. Do not separately install PostgreSQL or Redis on developer machines; Docker Compose owns these services. Local CLI tools may include `git`, `curl`, `jq`, `openssl`, `docker`, `docker compose`, `pnpm`, and `node`.

#### J.7.1 Local Compose service contract

Create `infra/docker/compose.yaml` with these services and internal dependencies. Pin images by explicit version or digest when the file is committed.

| Service     |         Container port | Host binding                             | Persistence/health                                    |
| ----------- | ---------------------: | ---------------------------------------- | ----------------------------------------------------- |
| `postgres`  |                   5432 | loopback only, 127.0.0.1:55432           | named volume; `pg_isready`                            |
| `pgbouncer` |                   6432 | loopback only, 127.0.0.1:56432           | config mounted read-only; waits for Postgres          |
| `redis`     |                   6379 | no host port by default                  | named volume if persistence enabled; `redis-cli ping` |
| `minio`     | 9000 API, 9001 console | loopback only, 127.0.0.1:59000 and 59001 | named volume; MinIO health endpoint                   |
| `mailpit`   |     1025 SMTP, 8025 UI | loopback only, 127.0.0.1:51025 and 58025 | ephemeral by default; HTTP health                     |
| `api`       |                   3001 | loopback only, 127.0.0.1:3001            | health endpoint `/health/ready`; profile `app`        |
| `worker`    |                   none | none                                     | health/heartbeat; profile `app`                       |

All services join a private Compose network. Only loopback host bindings are permitted for developer convenience. Do not publish database or Redis to a LAN/public interface. App services connect to PgBouncer for tenant-scoped runtime queries; migration jobs connect directly to PostgreSQL using a separate migration identity. PgBouncer MUST use transaction pooling for the RLS integration test profile. Use `server_reset_query`/pool reset settings appropriate to transaction pooling, but do not rely on connection reset as a substitute for `SET LOCAL`.

Compose startup ordering uses `depends_on: condition: service_healthy`; this is readiness sequencing, not an application-level retry strategy. API/worker still need bounded reconnect/backoff. Volumes persist Postgres, Redis if configured, and MinIO. `docker compose down` preserves volumes; `docker compose down -v` is destructive and requires explicit developer intent. Set `restart: unless-stopped` for local infrastructure; app containers may use `no` during active development to expose crashes.

The Compose file MUST define a healthcheck for every service that supports one, a non-root application user, resource limits where supported, read-only config mounts, and no committed credentials beyond disposable local-only defaults. A `tools/db/init-roles.sql` bootstrap may run only against a disposable local database and MUST NOT be reused as a production credential-management mechanism.

Expected commands from repository root:

```bash
docker compose -f infra/docker/compose.yaml up -d postgres redis minio mailpit
docker compose -f infra/docker/compose.yaml --profile app up -d pgbouncer api worker
docker compose -f infra/docker/compose.yaml ps
docker compose -f infra/docker/compose.yaml logs -f postgres pgbouncer
# Stop containers; preserve data volumes:
docker compose -f infra/docker/compose.yaml down
```

The compose file and service healthchecks are implementation deliverables in J.14; do not advertise these commands as working until the file exists and they have been executed.

### J.8 Environment and secret configuration

Commit `.env.example` with variable names, safe local placeholders, and comments only. Ignore `.env`, `.env.*.local`, credential files, private keys, certificates, dumps and generated secrets. Validate process environment at startup with Zod; fail fast with a variable name and validation reason, never echo the secret value.

Recommended groups (exact names are finalized with the app bootstrap):

```dotenv
NODE_ENV=development
APP_ENV=local
API_PORT=3001
WEB_ORIGIN=http://localhost:3000
API_BASE_URL=http://localhost:3001
LOG_LEVEL=debug

# Runtime database uses PgBouncer. Migration jobs connect directly to PostgreSQL as app_migrator.
DATABASE_URL=postgresql://app_runtime:LOCAL_ONLY_CHANGE_ME@127.0.0.1:56432/society_erp
# Inject only into the isolated migration-job process from its secret source; never into API/worker runtime env.
MIGRATION_DATABASE_URL=
DATABASE_POOL_MAX=10

REDIS_URL=redis://redis:6379
OBJECT_STORAGE_ENDPOINT=http://minio:9000
OBJECT_STORAGE_REGION=ap-south-1
OBJECT_STORAGE_BUCKET=society-erp-local
OBJECT_STORAGE_ACCESS_KEY=LOCAL_ONLY
OBJECT_STORAGE_SECRET_KEY=LOCAL_ONLY

AUTH_ISSUER=http://localhost:3001
AUTH_AUDIENCE=society-erp-web
AUTH_PRIVATE_KEY_FILE=./.secrets/dev-signing-key.pem
AUTH_PUBLIC_KEY_FILE=./.secrets/dev-signing-public.pem
SESSION_COOKIE_NAME=__Host-society_session

MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_FROM=no-reply@local.test
SENTRY_DSN=
OTEL_EXPORTER_OTLP_ENDPOINT=

PAYMENT_MODE=mock
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
SMS_PROVIDER=mock
WHATSAPP_PROVIDER=mock
```

Do not put actual secrets in `.env.example`. Local developer secrets stay in ignored `.env.local`/`.secrets/` files with restrictive permissions. CI secrets use GitHub Actions encrypted secrets or OIDC federation to cloud secret stores; staging/production use AWS Secrets Manager or an approved secret manager and workload IAM roles. Never bake secrets into Docker images, Terraform state outputs, logs, build arguments, frontend `NEXT_PUBLIC_*` variables or source control. Rotate exposed credentials immediately and record the incident.

Create typed config packages per runtime boundary (`apps/api`, `apps/worker`, `apps/web`) so server-only values cannot be imported into browser bundles. Validate URLs, ports, enum values and required secrets at startup. For local `PAYMENT_MODE=mock`, the adapter must be a deterministic fake and must reject production configuration. Real provider credentials remain unset until approved sandbox integration work.

### J.9 Database bootstrap and migration runbook

Database architecture remains PostgreSQL 16 for the Phase 0 compatibility spike, with production major-version selection re-evaluated as recorded in Appendix I. Drizzle is the default recommendation, pending owner approval/ADR. Use hand-authored SQL for security-critical RLS, roles, extensions, policies and constraints; Drizzle schema declarations remain aligned with SQL.

Bootstrap order on a disposable local database:

1. Start PostgreSQL and wait for `pg_isready`.
2. Create database `society_erp` using a bootstrap administrator available only to local Compose.
3. Create non-login ownership role `app_owner` (`NOLOGIN`, `NOSUPERUSER`, `NOBYPASSRLS`) for application schemas and tables.
4. Create short-lived `app_migrator` (`LOGIN`, `NOSUPERUSER`, `NOBYPASSRLS`, `NOCREATEDB`, `NOCREATEROLE`, `NOINHERIT`); grant only the controlled ability to `SET ROLE app_owner` for the approved migration job. The connection authenticates as `app_migrator`, not `app_owner`. Store its credential only in the approved migration-job secret path (including a separate disposable-local secret for local migration tests); never in developer API/worker runtime `.env` files.
5. Create `app_runtime` (`LOGIN`, `NOSUPERUSER`, `NOBYPASSRLS`, `NOCREATEDB`, `NOCREATEROLE`, `NOINHERIT` as appropriate); grant `CONNECT`, schema `USAGE`, and minimum table/sequence/function privileges. It must not own tenant tables, run migrations, or create/alter schemas.
6. Create `app_relay` only for the approved outbox/relay design. Prefer narrow `SECURITY DEFINER` functions; if `BYPASSRLS` is required, isolate its credentials and pool, grant access only to exact relay objects, and audit every operation. Do not grant business-schema access.
7. Create `app_platform_ops` as a restricted, just-in-time break-glass identity with no blanket `BYPASSRLS`; require ticket, MFA, time limit, statement/session audit, alerting and post-use review.
8. Create `app_readonly` only if reporting is enabled, with explicit read-only grants and its own RLS policies/tenant context; it is not a cross-tenant analytics bypass.
9. Install only approved extensions (initial candidate list in section 3.8); extension availability on the selected managed PostgreSQL service is a Phase 0 spike.
10. Create module schemas (`platform`, `resident`, `finance`, `workforce`, `maintenance`, `security`, `community`) with ownership and grants explicit in SQL.
11. Apply ordered migrations using the migration runner and immutable checksum ledger. Tenant tables are created with `tenant_id`, policy and FORCE RLS in the same migration transaction.
12. Apply platform reference seeds, then deterministic development/demo seeds using a dedicated seed command and test-only identities.
13. Run catalog verification, pgTAP isolation tests, repository integration tests and migration rehearsal from empty and previous-release databases.

`app_owner` is not the runtime role. PostgreSQL table owners normally bypass RLS unless FORCE RLS is enabled; superusers and BYPASSRLS roles bypass it. Runtime must have none of those capabilities. `app_platform_ops` is not a magic bypass account: platform-wide operations must use explicit, audited, narrowly scoped procedures and separately approved access. Do not grant runtime access to migration credentials.

Schema conventions:

- Lowercase `snake_case`; schema names match module ownership; table names are plural nouns only if consistently adopted by the module (choose one convention in ADR-DB-001 and enforce it).
- UUIDv7 primary keys generated by the application for PostgreSQL 16 compatibility; `id` is the primary key.
- Tenant-owned rows contain `tenant_id NOT NULL`, indexed with common filter/order columns; tenant-scoped uniqueness includes `tenant_id`.
- Use `created_at`, `updated_at` as `timestamptz NOT NULL`; `created_by`, `updated_by` nullable actor UUIDs where audit semantics require them; `version` integer for optimistic concurrency.
- Soft deletion only where business retention/recovery requires it (`deleted_at`, `deleted_by`, `deletion_reason`); financial records are immutable/reversed, not deleted.
- FK constraints are allowed within a module and to `platform.tenant(id)` only, subject to Appendix I's relational-integrity decision. Cross-module references remain soft IDs validated through public APIs/events and reconciliation jobs.
- Add check constraints for state/value invariants; use explicit named constraints and indexes. Avoid generic JSON blobs for core relational facts.
- Tenant table migrations register RLS using the approved helper and default-deny policy. No tenant table is considered complete until catalog checks discover it.

#### J.9.1 Drizzle transaction contract

A single `TenantTransaction` abstraction is the only supported path for tenant-scoped repository operations. Its transaction callback must:

1. Acquire a connection from the runtime pool.
2. Begin a database transaction.
3. Validate authenticated actor and active tenant from trusted server context.
4. Set tenant and actor context with transaction-local settings (for example `select set_config('app.tenant_id', $1, true)`); never use session-level `SET` on pooled connections.
5. Execute all tenant-scoped reads/writes through that same transaction object.
6. Commit on success; rollback on error; release connection in all cases.

The third argument `true` makes the setting transaction-local. The application must not permit arbitrary caller-controlled tenant IDs to become trusted context. Appendix I.3 explains that a custom PostgreSQL setting alone is not a security boundary against arbitrary SQL executed as the same role. Use parameterized SQL, strict query construction, least privilege, no user-supplied SQL, and a documented threat model. Phase 0 must test cross-tenant context bleed through PgBouncer transaction pooling and prove fail-closed behaviour when context is absent.

Drizzle config and scripts are version-pinned and committed. The migration runner records migration ID, checksum, applied timestamp and actor. Applied migrations are immutable. A migration rollback is a new forward migration or a documented restore/recovery procedure; do not edit an applied migration or assume arbitrary DDL is reversible. Expand-and-contract: add compatible nullable/new structures; deploy dual-compatible code; backfill in bounded resumable batches; switch reads/writes; remove old structures in a later release after evidence.

Migration verification means: (a) apply all migrations to empty DB; (b) apply pending migrations from previous schema snapshot; (c) run the same migration command again and verify ledger reports no pending changes without re-executing prior SQL; (d) verify checksums; (e) test rollback/recovery procedure in disposable environment. This supersedes the initial blanket requirement that migration SQL itself be safely re-runnable.

#### J.9.2 Seeds

- `platform`: stable permission keys, entitlement keys, built-in roles and system reference values; versioned and repeatable.
- `dev`: synthetic society, towers, wings, floors, units, residents, employees, departments, sample complaints, visitors and invoices with clearly fake names/mobiles/emails.
- `test`: small isolated fixtures created per test; never shared mutable state across parallel workers.
- `demo`: coherent narrative dataset for product walkthroughs, never copied into production.

Seeds use deterministic UUIDs or natural keys, upsert only safe reference/demo rows, and refuse to run when `APP_ENV=production`. No real personal information, actual phone numbers, government IDs, bank details or real payment credentials. Sample invoices are marked synthetic and use no live payment integration.

#### J.9.3 RLS verification

CI must run a catalog script that fails if any tenant-bearing table lacks RLS enabled, FORCE RLS, the standard tenant policy, or correct ownership/grants. pgTAP must test tenant A SELECT/INSERT/UPDATE/DELETE against tenant B, absent context, malformed context, context change in a reused pooled connection, and cross-tenant concurrent requests through PgBouncer. API integration tests must try tenant A tokens with tenant B resource IDs and return the agreed non-enumerating response. Worker tests must establish tenant context from a validated event envelope and reject missing/invalid tenant identity. Cache, object-storage keys, exports, search indexes and logs must also be tenant-scoped; database RLS alone does not protect them.

### J.10 Authentication foundation implementation sequence

Implement identity in vertical slices; the following order is a dependency sequence, not permission to launch every login method at once:

1. Create platform identity tables and constraints: user, credential/identity, session, refresh-token family, tenant membership, membership version and audit records.
2. Implement registration/invitation with verified mobile/email and abuse controls; no public society creation until tenant onboarding rules are approved.
3. Implement login for the approved initial method; store password hashes using a vetted password-hashing library if password auth is enabled. OTPs are short-lived, single-use, rate-limited and never logged.
4. Implement server-side session lifecycle and secure cookies in the Next.js BFF (`httpOnly`, `Secure`, appropriate `SameSite`, CSRF protection). Browser JavaScript never receives refresh tokens or signing keys.
5. Implement asymmetric JWT issuance and JWKS publication/rotation using a vetted OIDC library; test issuer, audience, expiry, key ID, algorithm allowlist and signature verification.
6. Implement refresh-token rotation, family reuse detection, revocation, logout and session listing/revocation.
7. Implement tenant membership and active tenant selection; tenant switching revalidates membership and issues a fresh scoped access token.
8. Resolve permissions server-side from role/permission assignments and membership version; cache invalidation is immediate on version change.
9. Enforce permission checks in guards/use cases, not merely route visibility. Add property/unit scope checks where defined.
10. Emit auditable security events for login success/failure, MFA, session revoke, tenant switch, role change and support impersonation.

Required tests: unauthenticated access; expired/wrong issuer/wrong audience JWT; unknown signing key; refresh replay; logout/revocation; membership removed during active session; tenant switch without membership; permission denied; property-scope denied; CSRF rejection; cookie flags; OTP brute force; account enumeration resistance; and tenant A/B resource access. Platform admin MFA and support impersonation must have stronger controls, reason capture, time limit and audit trail.

### J.11 Feature specification template

Create one file per feature at `docs/plans/features/<module>/<feature-key>.md` before implementation. This is a working template, not a new global requirements catalog.

```markdown
# Feature: <name>

- ID / Module / Phase / Priority:
- Status: proposed | approved | in-progress | verified
- Product owner / engineering owner:
- Dependencies / related ADRs:

## 1. Problem and scope

- User problem and desired outcome:
- In scope:
- Out of scope:
- Assumptions and unresolved questions:

## 2. Actors and functional requirements

- User stories:
- Business rules and state transitions:
- Permissions and entitlements:
- Validation and failure behaviour:

## 3. Technical design

- Domain entities/value objects:
- Module-owned schema and migration:
- Public API/DTO/OpenAPI changes:
- Events published/consumed:
- UI routes/screens and states:
- Background jobs/idempotency/retries:
- Cross-module contracts and read projections:

## 4. Security, privacy and audit

- Tenant isolation/RLS:
- Authorization/property scope:
- Sensitive data and retention:
- Audit events and reason requirements:
- Abuse/rate-limit considerations:

## 5. Operational requirements

- Logs/metrics/traces:
- Performance and pagination:
- Failure recovery and support runbook:
- Feature flag/entitlement and rollout:

## 6. Test plan

- Domain unit tests:
- Repository/integration tests:
- RLS/authorization tests:
- API/event contract tests:
- E2E user journeys:
- Load/accessibility tests where applicable:

## 7. Acceptance criteria

- Given/When/Then criteria:
- Negative/failure criteria:
- Definition of Done:
- Verification commands and evidence:
```

A feature is not complete when only its UI or API works. Its data ownership, authorization, tenant isolation, audit, idempotency, module contract, operational behaviour, and end-to-end acceptance criteria must be satisfied.

### J.12 Testing and quality assurance operating model

Testing follows a risk-weighted pyramid, not a 100% coverage target.

| Layer             | Tool                                   | Scope                                                               | Required on PR?                                         |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| Domain unit       | Vitest                                 | Pure rules, value objects, state machines, edge cases               | Yes                                                     |
| Component         | Vitest + Testing Library               | Forms, state, accessibility, error/loading/empty states             | For UI changes                                          |
| Integration       | Vitest + Testcontainers                | Drizzle repositories, transactions, module interfaces, Redis/outbox | For affected modules                                    |
| Database security | pgTAP + real PostgreSQL                | RLS, constraints, grants, missing context, transaction reuse        | For every DB/RLS change; full suite nightly and release |
| Contract          | OpenAPI lint/diff + event schema tests | Request/response compatibility and event versioning                 | Yes when contracts change                               |
| E2E               | Playwright                             | Critical role journeys through deployed-like stack                  | Smoke suite on PR; full suite nightly/release           |
| Performance       | k6                                     | API throughput, latency, queue and DB load                          | Baseline nightly and before release                     |

Test naming: `<unit>.<scenario>.<expected-result>` in test descriptions; files use `*.spec.ts` for unit/integration and `*.e2e-spec.ts` or `*.e2e.ts` consistently. Keep tests near the owning module or under `tests/<module>/` according to the final test-runner config; select one convention in Milestone 0.2 and enforce it.

Factories create valid synthetic entities. Tests must not depend on production data or run against a developer's default database. Each integration test suite receives an isolated schema/database or transaction strategy that is safe under parallel execution. RLS tests must use the actual runtime role, not a superuser/table owner. Seed only immutable reference data globally; per-test records are created and cleaned up deterministically.

Coverage thresholds are risk-based: require coverage for critical domain branches and changed lines, but do not enforce 100% across the repository. Security-sensitive authorization, financial arithmetic, state transitions, tenant scoping, idempotency and migration logic require explicit branch/negative tests. Any ignored test must have a linked issue, owner and expiry date.

CI order: formatting/lint → typecheck → unit/component → module boundary → OpenAPI/event validation → migration static checks → integration/Testcontainers → pgTAP RLS → E2E smoke → build. Expensive full browser/load/restore suites may run nightly or pre-release, but critical tenant isolation checks cannot be skipped for a release that changes tenancy/data access.

### J.13 Git collaboration and agent permissions

Use trunk-based development with protected `main` and short-lived branches:

```text
feature/resident-directory
feature/visitor-management
fix/tenant-context-leak
refactor/finance-ledger
chore/database-bootstrap
```

Commit format: `type(scope): imperative summary`, using Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `perf`, `revert`). PRs must link feature spec/issue, summarize scope and non-goals, list migration/API/event impact, security and RLS impact, test commands/results, screenshots for UI, rollout/rollback notes, and G-FIN/G-DPDP checkboxes where relevant.

Require at least one human review for protected branches; two reviews for security, tenancy, financial, production infrastructure or destructive migrations. CI must be green. No direct pushes to `main`. Use squash merge unless release engineering selects another strategy. Tag releases with semantic versioning after release gates pass. Migration files are immutable after merge/application.

AI agents may create local branches and commits only when requested by the user/project workflow. They MUST NOT force-push, delete branches, merge PRs, change branch protection, rotate secrets, deploy production, run destructive data operations, or enable live financial providers without explicit authorization. They must present the exact action and impact before a consequential operation.

### J.14 Observability and debugging

Use OpenTelemetry context propagation across Next.js BFF, API, module use case, database spans, outbox relay, BullMQ jobs and provider adapters. Pino emits structured JSON logs. Sentry captures sanitized exceptions. Prometheus-compatible metrics cover API latency/error rate, queue depth/age/retries/dead letters, DB pool saturation/slow queries, worker heartbeat, outbox lag and provider failures.

Every request has `request_id`; cross-service/background work carries `correlation_id` and `trace_id`. Event/job envelopes carry event ID, tenant ID, correlation ID, causation ID, schema version and occurred-at timestamp. Do not trust tenant IDs from arbitrary job payloads: validate event provenance and re-establish tenant context within the worker transaction.

Never log passwords, OTPs, bearer/refresh tokens, cookies, signing keys, payment credentials, full bank details, raw government identifiers, or unnecessary resident/visitor data. Apply field redaction and sampling; audit logs are separate from diagnostic logs and access-controlled. Logs and metrics must not become cross-tenant data-leak channels.

Debugging sequence: capture request/trace ID → inspect sanitized API log → inspect trace spans → inspect module event/outbox row → inspect queue job ID and retry history → inspect provider request metadata without secrets. Use documented runbooks for stuck jobs, outbox lag, DB saturation, failed migrations and provider outages. Never manually edit financial rows or delete failed jobs to hide symptoms; use replay/reconciliation procedures.

### J.15 Phase 0 execution blueprint and exit evidence

Phase 0 is an engineering foundation, not an implementation of every business module. Milestones are sequential where dependencies require it; parallel work is allowed only for independent documentation/CI tasks.

| Milestone                      | Work                                                                                                                  | Exit evidence                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 0.1 Architectural finalization | Resolve blocking choices; pin compatible versions; confirm module tree, DB naming, security threat model; create ADRs | Approved ADRs for Phase 0 blockers; open decisions clearly labelled                               |
| 0.2 Repository initialization  | Git, pnpm workspace, Turborepo, TS strict, ESLint, Prettier, dependency-cruiser, root AGENTS, CI skeleton             | Clean clone installs; lint/typecheck/build baseline green                                         |
| 0.3 Local infrastructure       | Compose Postgres, Redis, PgBouncer, MinIO, Mailpit; healthchecks and volumes                                          | `compose ps` healthy; restart/persistence and PgBouncer transaction pooling tested                |
| 0.4 Database foundation        | Roles, extensions, schemas, Drizzle, migration ledger, TenantTransaction, RLS helper and pgTAP                        | Empty DB migration; checksum/no-op replay; tenant A/B and no-context tests pass through PgBouncer |
| 0.5 API/contracts              | NestJS Fastify adapter, Zod, OpenAPI 3.1, response/error wrapper, generated client, health endpoints                  | Valid OpenAPI 3.1; client generation and breaking-change CI test pass                             |
| 0.6 Identity foundation        | User/session/JWT/JWKS/refresh rotation/membership/tenant switch/permissions                                           | Auth integration tests and cross-tenant authorization suite pass                                  |
| 0.7 CI/CD and staging          | GitHub Actions; build image; IaC baseline; staging hello-world deploy                                                 | Reproducible CI and staging deployment with health check and rollback note                        |
| 0.8 Phase 0 verification       | Run full acceptance checklist; fix blockers; handoff docs                                                             | Signed/evidenced exit report; no unresolved critical/high security findings                       |

Detailed acceptance evidence:

- Repository builds from a clean clone using only documented prerequisites and commands.
- Compose services become healthy; data persistence behaves as documented; no DB/Redis public binding exists.
- Runtime role is not owner, superuser or BYPASSRLS; platform operations are least-privilege; catalog check passes.
- Tenant A cannot read/write Tenant B rows; absent context returns no rows/denies writes; PgBouncer concurrency shows no tenant-context bleed.
- Migration IDs, checksums, timestamps and execution metadata are recorded in the ledger; a second migration command verifies the ledger and performs no reapplication; checksum mismatch, previous-release upgrade and recovery rehearsals pass.
- OpenAPI document validates as 3.1; generated client is reproducible; wrapper and error taxonomy are tested.
- Login/session/refresh/tenant-switch/permission tests pass; browser JavaScript cannot read backend refresh credentials.
- CI runs lint, typecheck, tests, boundary checks, migration checks, RLS tests and build; staging deploy is traceable to a commit.
- Context docs, runbooks, ADR index and known issues are current.

Phase 1 cannot begin until Milestone 0.8 exit evidence is reviewed. Any deferred non-blocking item must have an owner, risk acceptance, and target milestone; a security or tenant-isolation failure cannot be deferred.

### J.16 Developer command reference

The following commands define the intended script contract. Add the corresponding package scripts/CLI entry points during Milestone 0.2/0.4; do not claim they exist until implemented and tested.

```bash
# Initial checkout and toolchain (run inside WSL2/Linux shell)
git clone <repository-url> society-erp
cd society-erp
corepack enable
corepack prepare pnpm@<pinned-version> --activate
pnpm install

# Local infrastructure
docker compose -f infra/docker/compose.yaml up -d postgres redis minio mailpit
docker compose -f infra/docker/compose.yaml --profile app up -d pgbouncer api worker
docker compose -f infra/docker/compose.yaml ps
docker compose -f infra/docker/compose.yaml logs -f api worker

# Database lifecycle — scripts must be added and documented
pnpm db:bootstrap       # create local roles/schemas/extensions using local bootstrap only
pnpm db:migrate         # apply pending immutable migrations and record checksums
pnpm db:seed:dev        # load synthetic development seed data
pnpm db:verify          # catalog, grants, migration ledger and RLS checks
pnpm db:test:rls        # pgTAP isolation suite
pnpm db:reset           # destructive local-only reset; refuse non-local APP_ENV

# Development
pnpm dev               # run web/API/worker according to turbo pipeline
pnpm --filter @society/web dev
pnpm --filter @society/api dev
pnpm --filter @society/worker dev

# Quality and build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
pnpm verify:boundaries
pnpm verify:contracts
```

`<repository-url>` and `<pinned-version>` are placeholders to be replaced with actual project values. `db:reset` must require an explicit confirmation flag and verify the database host/name is local before dropping anything. `db:bootstrap` must not accept production credentials. If a package script is not yet implemented, its command is a planned interface, not an executable instruction.

### J.17 Decisions, assumptions and Phase 0 blockers

Recommendations below are technical defaults, not owner approvals.

| Item                      | Current proposal                                     | Recommendation                                                                                                            | Implementation impact                                   | Blocks Phase 0?                                                        | Configurable later?                              |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| D-03 Next.js              | Initial draft said 14; Appendix I corrects lifecycle | Use Next.js 16 Active LTS, pin patch and run compatibility spike                                                          | Web app scaffold, BFF and tooling                       | Yes, before web scaffold                                               | Major upgrade is possible but costly; decide now |
| D-11 ORM                  | Drizzle preferred; Prisma alternative                | Drizzle + hand-authored SQL for RLS-critical DDL                                                                          | Repository and migration tooling                        | Yes, before DB layer                                                   | Technically possible, expensive to switch        |
| D-14 mobile               | PWA first, Expo later                                | PWA first; defer mobile app scaffold                                                                                      | Avoids premature native build complexity                | No, defer decision if no mobile code                                   | Yes                                              |
| A-01 scale                | Capacity assumptions in Appendix A                   | Retain provisional capacity model; instrument and revise after pilot                                                      | Indexing, pool sizes, partitioning and cost             | No, but validate before production                                     | Yes, within tested limits                        |
| A-02 payments             | Razorpay primary assumption, adapter port            | Mock locally; sandbox only after approval; provider remains replaceable                                                   | Payment adapter and webhook tests                       | No for Phase 0 core; provider choice before sandbox integration        | Yes, behind port                                 |
| A-03 offline gate         | Offline support assumed for gate flows               | Define threat model and offline-safe allowlist; no offline authorization bypass                                           | Local cache, sync conflicts, revocation                 | No, before Security Phase implementation                               | Partly; policy must be approved                  |
| A-04 mobile delivery      | PWA first                                            | Use responsive PWA initially                                                                                              | Web architecture, push/offline constraints              | No                                                                     | Yes, Expo later                                  |
| H-01 internal accounting  | Feature-flagged/off by default                       | Defer double-entry ledger until controller approves accounting model; Tally remains external integration target           | Ledger schema and reconciliation                        | No for Phase 0 scaffold; yes before ledger implementation              | Difficult once transactions exist                |
| H-02 financial controller | Named controller not supplied                        | Engage qualified controller and define review cadence before finance implementation                                       | G-FIN signoff and tax/payroll policy                    | Does not block generic scaffold; blocks finance release                | No, governance prerequisite                      |
| H-03 customer structure   | Society vs multi-society org vs builder unresolved   | Model organization-to-tenant mapping provisionally; obtain owner confirmation before onboarding/product pricing           | Organization hierarchy, tenant provisioning and billing | Yes before production tenant onboarding; not before technical scaffold | Changes are high impact                          |
| H-04 language support     | English launch, Hindi/Marathi ready                  | Externalize strings and locale data from day one; defer translation scope                                                 | i18n infrastructure and content                         | No                                                                     | Yes                                              |
| RLS context trust         | Custom GUC in draft                                  | Apply Appendix I.3 threat model; no claim GUC alone defeats arbitrary SQL                                                 | TenantTransaction, role/query restrictions, tests       | Yes, before tenant data                                                | Not safely configurable away                     |
| Migration semantics       | Initial blanket idempotent SQL                       | Immutable, ordered, checksummed migrations; ledger prevents reapplication of completed units; idempotent setup/seeds only | Migration runner and CI                                 | Yes, before schema implementation                                      | Policy change requires ADR                       |
| DR objectives             | Initial aspirational values                          | Define measurable RPO/RTO and prove restore/failover before production                                                    | Backup cadence, replication and runbooks                | No for local Phase 0; yes before production                            | Yes, by service tier                             |

Smallest set that must be decided before a useful scaffold: (1) Next.js major and Node/pnpm pinned toolchain; (2) Drizzle versus Prisma; (3) module/repository layout and migration ownership; (4) database role/RLS threat model and TenantTransaction contract; (5) OpenAPI generation strategy after the spike. H-03 must be decided before production tenant onboarding. Payment provider, internal ledger, mobile-native choice, translations and offline gate policy can remain deferred with the boundaries above.

### J.18 Consistency and release checklist

Before marking this specification or an implementation milestone complete, verify:

- One modular monolith; no unapproved microservices; dependency DAG is acyclic.
- Cross-module calls use public API or events; no cross-module table access/FKs.
- Every tenant table has tenant_id, forced RLS and policy; runtime cannot bypass.
- Tenant context is transaction-local, trusted, and tested through PgBouncer pooling.
- Money is integer paise internally and decimal-string-safe at JSON boundaries; no floating-point tax/money.
- Migration files are immutable/checksummed; seed/setup scripts are deterministic and safe; no blanket migration `IF NOT EXISTS` masking drift.
- Framework/runtime versions are pinned and compatibility spikes are recorded.
- Server-side authorization, secure BFF sessions, audit, secret redaction and storage/cache tenant scoping are tested.
- AI workflows, AGENTS hierarchy, skill procedures, TDD and verification evidence exist in the repository.
- Compose, environment docs, commands, feature template, CI, observability and Phase 0 exit evidence are current.
- Open decisions remain labelled; recommendations are not represented as owner approvals.

_End of implementation addendum._
