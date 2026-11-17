# ADR-006: Financial Safety, Exact Integer Arithmetic, and Release Gate G-FIN

## Status

Accepted

## Context

Housing societies handle millions of rupees in maintenance dues, vendor disbursements, sinking funds, and utility charges. Accounting and tax non-compliance in India (GST thresholds, RWA disputed circulars, TDS on vendor payments) carries serious legal and monetary liabilities.

## Decision

1. **Integer Arithmetic for Currency**:
   - All currency values are stored as integer paise (`bigint`) using a strongly-typed `Money` value object from `@society/shared-kernel`.
   - Floating-point arithmetic (`number`) is strictly forbidden for money, late fees, and tax calculations.
   - In JSON API requests and responses, paise amounts are serialized as decimal base-10 strings (e.g. `"amountPaise": "125000"`) to prevent IEEE 754 precision loss in browser JavaScript.
2. **Immutable Postings**:
   - Posted invoices, payments, expenses, and ledger entries are append-only.
   - Corrections require explicit reversal entries, credit notes, or debit notes; rows are never deleted or updated.
3. **Release Gate G-FIN & REQ-FIN-001**:
   - All payment gateway integrations and tax workflows must be formally reviewed and approved by a qualified financial controller before production deployment.
   - Feature flags `finance.gateway.live` and `finance.tax.enabled` default to `false`. Activating them requires an active entry in `platform.compliance_attestation`.
   - In local and test environments, payment gateways run strictly in mock or sandbox modes.

## Consequences

- **Positive**: Complete audit trail, zero monetary rounding drift or float corruption, rigorous regulatory compliance.
- **Negative**: Requires custom serializers for JSON DTOs and explicit review workflows for finance features.
