# Security Policy — Society ERP SaaS

## 1. Multi-Tenant Security & Isolation Standards

Society ERP is built with a zero-trust, multi-tenant architecture designed to strictly enforce isolation between housing societies:

- **Row-Level Security (RLS)**: Every tenant table in PostgreSQL is protected by `FORCE ROW LEVEL SECURITY`.
- **Transaction-Local Isolation**: All tenant queries must execute within `TenantTransaction` using transaction-local configuration (`set_config('app.tenant_id', $1, true)`). Session-level `SET` is strictly forbidden to prevent tenant context bleed across PgBouncer connections.
- **Database Role Separation**: Runtime application roles (`app_runtime`) run with non-superuser, non-bypassrls permissions with zero DDL or truncate privileges.
- **Financial Immutability**: All financial entries and money values are stored as integer paise (`bigint`) and remain append-only.
- **Non-Enumerating Responses**: Cross-tenant resource queries return `404 Not Found` rather than `403 Forbidden` to prevent resource existence enumeration.
- **Data Protection (DPDP Act 2023)**: Resident and visitor data are handled under Indian DPDP statutory guidelines, including strict purpose limitation, consent tracking, and unmasked logging prevention.

---

## 2. Supported Versions

Only the active main branch receives security patches:

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| `< 0.1` | :x:                |

---

## 3. Reporting a Vulnerability

We take tenant isolation, cryptographic integrity, and data security extremely seriously. If you discover a vulnerability or potential cross-tenant leak:

1. **Do NOT open a public GitHub issue.**
2. Send an email to the repository owner / security team at `anmolshende09@gmail.com` with:
   - Type of vulnerability (e.g., Tenant context bleed, RLS bypass, Auth token forgery, SQL injection, Paise precision flaw).
   - Exact steps or minimal reproduction script.
   - Affected modules, endpoints, or database tables.
   - Any potential impact on tenant isolation or financial ledgers.
3. You will receive an acknowledgment within 24–48 hours with an assessment and triage timeline.

---

## 4. Secret Hygiene & Contributor Guidelines

- **Never commit secrets**: API keys, private keys (`.pem`, `.key`), database passwords, or `.env` files must NEVER be committed to the repository.
- **Pre-commit scanning**: Ensure `.gitignore` ignores all local credentials and test certificates.
- If a secret is accidentally committed to a branch, notify the team immediately to invalidate and rotate the credential.
