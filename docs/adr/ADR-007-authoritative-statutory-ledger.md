# ADR-007: Society ERP as Authoritative Statutory Double-Entry Ledger

## Status

**Proposed — Awaiting explicit owner confirmation**

> Owner confirmation is required before this ADR can be treated as Accepted.  
> Until confirmed, Society ERP's accounting authority remains undecided.  
> No production schema, ledger tables, or statutory-compliance code may be created on the basis of this ADR until its status is changed to Accepted by explicit owner sign-off.

## Context

Question H-01 in `specs.md` and Appendix I.6 required deciding whether Society ERP operates as:

1. Only an operational sub-ledger that records dues and expenses, leaving TallyPrime as the sole authoritative statutory books of account; or
2. The authoritative statutory double-entry general ledger, where Society ERP is the master system of record for accounting, financial statements, and audit compliance, with TallyPrime serving as an external sync/export destination.

Allowing two systems to be concurrently or ambiguously authoritative causes reconciliation disputes, out-of-sync financial periods, conflicting ledger balances, and audit failures.

## Proposed Decision

The proposed direction is: **Society ERP as the authoritative statutory ledger**.  
This decision is **not yet confirmed by the project owner** and must not be acted on.

1. **System of Record** _(proposed — not yet confirmed)_:
   - Society ERP would be the sole primary authority for the Chart of Accounts (COA), Journal Entries, General Ledger, Cash and Bank Books, Trial Balance, Income & Expense Statements, Balance Sheets, and Period Locking.
   - All financial transactions (invoices, receipts, expenses, vendor bills, payroll runs) would post debit and credit entries directly into the internal ledger within Society ERP.
2. **Role of TallyPrime** _(proposed)_:
   - TallyPrime would be an **external posting target and bridge export**, not the master ledger.
   - Sync vouchers would be generated outward from Society ERP to TallyPrime via the isolated Tally Bridge queue.
   - If a conflict arises between Society ERP and TallyPrime, Society ERP's immutable ledger would be the authoritative legal truth.
3. **Period Locking & Financial Year Governance** _(proposed)_:
   - Financial year boundaries (default 1 April to 31 March) and monthly period locks would be enforced strictly within Society ERP.
   - Posted ledger rows would be immutable (corrections require journal reversal entries).

## Consequences

- **Positive**: Single clear source of financial truth; real-time balance sheet and dues status inside the platform; no reliance on customer premise desktop software for daily financial reports.
- **Negative**: Society ERP carries the full responsibility for double-entry validation, balanced journal transactions, and statutory compliance reporting.

## Owner Confirmation Required

This ADR is **not accepted** until the project owner explicitly confirms the accounting authority decision.  
Reference: H-01 in `specs.md` §Appendix H and §Appendix I.6.  
Until confirmation: implement no statutory ledger schema, no COA tables, no double-entry journal tables, no period-lock infrastructure.
