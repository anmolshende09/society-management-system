# Skill: financial-engineering

## Purpose

Ensure absolute mathematical precision, audit integrity, and regulatory compliance for finance, billing, tax, and payments.

## Activation Conditions

- Touching `modules/finance/**`, invoices, receipts, expenses, late fees, or ledger entries.
- Integrating payment gateways or webhook handlers.
- Configuring tax rules (GST/TDS) or payroll calculations.

## Procedure

1. Verify currency handling: strictly use integer paise (`bigint`) via the `Money` value object. No floating-point math.
2. In JSON API responses, serialize paise amounts as decimal strings (`amountPaise: "10000"`).
3. Ensure immutability: posted records cannot be updated or deleted; use credit notes, debit notes, or reversal journals.
4. Verify idempotency: require `Idempotency-Key` on payment/billing mutations.
5. Gate G-FIN enforcement: verify that live payment gateways (`finance.gateway.live`) and tax rules (`finance.tax.enabled`) are disabled in production until an active attestation is recorded in `platform.compliance_attestation`.
6. Update `docs/compliance/finance-review-register.md`.

## Verification Commands

```bash
pnpm test
```
