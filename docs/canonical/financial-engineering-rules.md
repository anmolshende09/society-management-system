# Canonical Financial Engineering & Compliance Rules (Gate G-FIN)

## 1. Statutory Mandate & Gate G-FIN (REQ-FIN-001)

> **PROJECT REQUIREMENT (REQ-FIN-001)**: All local payment integrations and tax compliance workflows MUST undergo review and written approval by a qualified financial controller before deployment to any production environment. No payment gateway may be switched to live mode, and no tax-bearing invoice flow may be enabled for a production tenant, until the review is recorded in `platform.compliance_attestation` (Release Gate **G-FIN**).

### 1.1 Authoritative Statutory Ledger (ADR-007)

Society ERP is the **authoritative statutory general ledger**. It is the sole primary source of truth for the Chart of Accounts, Journal Entries, Cash and Bank Books, Trial Balance, Income & Expense, Balance Sheets, and Financial Period Locks. TallyPrime is an external posting target and export bridge, never the authoritative master books of account. If a dispute or discrepancy occurs between Society ERP and TallyPrime, Society ERP's immutable ledger controls.

---

## 2. Integer Currency Representation & The `Money` Value Object

1. **Integer Arithmetic in Paise**:
   - Currency is stored and computed strictly in integer paise (`1 INR = 100 paise`).
   - Stored in PostgreSQL as `bigint` (e.g. `amount_paise bigint NOT NULL`).
   - Floating-point numbers (`number`, `float`, `double`) are **strictly prohibited** for money, penalties, tax rates, or ledger balances.
   - All arithmetic operations MUST use the immutable `Money` value object from `@society/shared-kernel`.

2. **JSON Serialization Standard**:
   - In all JSON API requests and responses, paise amounts MUST be serialized as **base-10 decimal strings** (e.g. `"amountPaise": "125000"`).
   - This prevents JavaScript IEEE 754 floating-point overflow and JSON parser BigInt crashes in browser clients.

3. **Rounding Rules**:
   - Rounding is performed using **Half-Up Rounding** at explicitly defined financial calculation boundaries.
   - Percentage calculations use integer basis points (`1 bp = 0.01%`, `10000 bp = 100%`).

---

## 3. Financial Immutability & Reversal Patterns

1. **Append-Only Postings**:
   - Posted financial records (invoices, receipts, expenses, journal entries) are **strictly immutable**.
   - `UPDATE` and `DELETE` operations are forbidden on posted financial rows.
2. **Correction via Reversal**:
   - Corrections require explicit reversing entries, credit notes, or debit notes linked to the original document.
   - Audit trail must record the actor, timestamp, original document reference, and explicit business reason.

---

## 4. Indian Statutory Tax Treatment as Versioned Data

1. **No Hard-Coded Tax Logic**:
   - Indian tax rules (GST on maintenance charges, TDS on vendor payouts) are subject to contested legal interpretations (e.g., CBIC Circular 109/28/2019-GST vs Madras High Court rulings on entire amount vs excess over ₹7,500/month threshold).
   - The platform **never hardcodes tax assumptions in source code**.
   - Tax rules are modeled as versioned data (`finance.tax_rule`) with effective date ranges, turnover thresholds, and calculation algorithms approved by each society's controller.
2. **Tax Feature Flag Posture**:
   - `finance.tax.enabled` defaults to `false` in production.
   - Activation requires an active attestation record in `platform.compliance_attestation`.

---

## 5. Non-Custodial Payment Gateway Architecture

1. **No Custody of Funds**:
   - The platform MUST NOT take custody of, pool, or hold society maintenance funds.
   - Payments processed via Razorpay or partner gateways settle directly into the housing society's verified commercial bank account.
2. **Webhook Idempotency & Verification**:
   - Gateway webhooks MUST be verified via HMAC SHA-256 over raw request bytes before parsing.
   - Webhook processing MUST be deduplicated by gateway event ID header.
   - Handlers MUST be resilient to out-of-order delivery (e.g., `payment.captured` received before `payment.authorized`).
3. **Idempotency Keys**:
   - All payment creations, billing runs, and voucher sync mutations REQUIRE an `Idempotency-Key` header.
   - Replays with identical keys return the cached result without duplicate charge.
