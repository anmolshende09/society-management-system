# Finance Compliance & Controller Review Register (Gate G-FIN)

**Requirement ID**: `REQ-FIN-001`  
**Governing Gate**: `G-FIN` (Release Gate, Section 5.8)  
**Status**: Initial Baseline — Pending Financial Controller Appointment

---

## 1. Scope & Purpose

As mandated by REQ-FIN-001:

> All local payment integrations and tax compliance workflows MUST undergo review by a qualified financial controller before deployment to any production environment. No payment gateway may be switched to live mode, and no tax-bearing invoice flow may be enabled for a production tenant, until the review is recorded and approved.

---

## 2. Review Checklist

| Item | Area                  | Description                                                                         | Status   | Reviewer       | Sign-off Date | Evidence Reference |
| ---- | --------------------- | ----------------------------------------------------------------------------------- | -------- | -------------- | ------------- | ------------------ |
| F-00 | Accounting Authority  | Society ERP confirmed as authoritative statutory ledger (TallyPrime as export sync) | Verified | Project Owner  | 2026-11-17    | `ADR-007`          |
| F-01 | Gateway Settlement    | Verification of direct society account settlement (no pooling/custody)              | Pending  | TBD Controller | —             | —                  |
| F-02 | Webhook Idempotency   | HMAC SHA256 validation, duplicate delivery handling, out-of-order state resilience  | Draft    | TBD Controller | —             | —                  |
| F-03 | GST Tax Rules         | Turnover threshold configuration, disputed RWA tax treatment as configurable data   | Pending  | TBD Controller | —             | —                  |
| F-04 | Money Serialization   | Integer paise (`bigint`) internally, base-10 decimal strings at JSON boundary       | Verified | Engineering    | 2026-11-16    | `ADR-006`          |
| F-05 | Numbering Schemes     | Sequential, gapless-aware invoice/receipt numbering scoped by tenant & FY           | Pending  | TBD Controller | —             | —                  |
| F-06 | Rounding & Late Fees  | Rounding modes, interest calculation, penalty structures                            | Pending  | TBD Controller | —             | —                  |
| F-07 | Immutable Postings    | Reversal and credit/debit note patterns for corrections (no DELETE/UPDATE)          | Verified | Engineering    | 2026-11-16    | `ADR-006`          |
| F-08 | TallyPrime Sync       | Ledger mapping rules, XML voucher formats, conflict resolution queue                | Pending  | TBD Controller | —             | —                  |
| F-09 | Vendor Payments & TDS | TDS deduction rates, GST input credit tracking, vendor bank details vault           | Pending  | TBD Controller | —             | —                  |
| F-10 | Attestation Engine    | Database table `platform.compliance_attestation` enforcement for live flags         | Pending  | Engineering    | —             | —                  |

---

## 3. Approved Attestations Register

| Attestation ID | Tenant ID / Scope                               | Reviewer Name | Professional Qualification (CA/CPA) | Approved Feature Scope | Effective Date | Expiry Date |
| -------------- | ----------------------------------------------- | ------------- | ----------------------------------- | ---------------------- | -------------- | ----------- |
| _None_         | _All live production features currently locked_ | —             | —                                   | —                      | —              | —           |
