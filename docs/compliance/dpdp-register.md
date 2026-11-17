# Digital Personal Data Protection (DPDP) Compliance Register (Gate G-DPDP)

**Governing Law**: Digital Personal Data Protection Act, 2023 & DPDP Rules, 2025  
**Governing Gate**: `G-DPDP` (Release Gate, Section 5.8)  
**Status**: Pre-Commencement Preparation Baseline

---

## 1. Overview & Data Fiduciary Posture

In accordance with the phased commencement schedule of India's DPDP Rules:

- The platform processes personal data on behalf of housing societies.
- Customer contracts will establish whether the society is the Data Fiduciary and the SaaS provider acts as Data Processor.
- The platform enforces data minimization, consent tracking, purposeful retention, and principal rights fulfillment.

---

## 2. Personal Data Class Inventory & Governance

| Data Class                       | Collected In             | Lawful Basis                | Consent Required? | Retention Period                 | Masking / Encryption                              |
| -------------------------------- | ------------------------ | --------------------------- | ----------------- | -------------------------------- | ------------------------------------------------- |
| Resident Contact (Mobile, Email) | `resident.resident`      | Contractual / Notice        | Operational       | Active Tenancy + 1 Year          | Encrypted at rest                                 |
| Resident KYC Documents           | `resident.kyc_document`  | Society By-laws / Statutory | Explicit Consent  | Active Tenancy + Legal audit     | AES-256 in private S3 bucket, presigned URLs only |
| Visitor Details & Photos         | `security.visitor_entry` | Legitimate Safety Purpose   | Notice at entry   | 365 Days (Hot), Purge thereafter | Scoped to tenant, photos auto-purged              |
| Domestic Help Aadhaar / Govt ID  | `security.domestic_help` | Security Verification       | Explicit Consent  | Employment duration + 90 Days    | Masked display, strictly restricted vault access  |
| Staff Payroll & Bank Details     | `workforce.employee`     | Employment Contract         | Contractual       | 8 Years (Statutory)              | Field-level encryption, role-restricted           |
| CCTV / ANPR Vehicle Scans        | `security.vehicle_log`   | Security / Access Control   | Notice at gate    | 90 Days Hot                      | Scoped to tenant                                  |

---

## 3. Data Principal Rights Workflow

1. **Right to Access & Information**:
   - Automated export of resident profile, vehicles, visitor history, and dues records.
2. **Right to Correction**:
   - In-app profile update flow with verification audit trail.
3. **Right to Erasure (Forget Me)**:
   - Data erasure request queue with SLA tracking.
   - Preserves immutable financial transaction records as required by statutory Indian accounting laws.
