# Canonical API Contract Standards & Uniform Response Wrapper

## 1. Uniform JSON Envelope Standard

Every API response emitted across `/api/v1/*` MUST conform to this exact uniform JSON wrapper (enforced by a NestJS global response interceptor and global exception filter):

```json
{
  "data": {},
  "pagination": null,
  "error": null
}
```

### 1.1 Invariants

- Exactly one of `data` or `error` is non-null, except for `204 No Content` responses (empty body).
- `pagination` is populated for list endpoints; `null` for non-list endpoints.

---

## 2. List & Cursor Pagination

```json
{
  "data": [{ "id": "01932f...", "unitNumber": "A-101" }],
  "pagination": {
    "limit": 25,
    "nextCursor": "eyJpZCI6IjAxOTMyZi4uLiJ9",
    "prevCursor": null,
    "hasMore": true,
    "total": null
  },
  "error": null
}
```

- **Cursor-Based by Default**: Prevents performance degradation on large datasets.
- **Total Count**: `total` is omitted/null by default because `COUNT(*)` across large tables is expensive. Returned only when client explicitly passes `?includeTotal=true`.
- **Max Limit**: Hard cap at 100 items per page.

---

## 3. Standard Error Response Taxonomy (specs.md Appendix F)

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
        "hint": "Contact administrator to activate the payroll add-on."
      }
    ],
    "requestId": "01932f...",
    "docUrl": "https://docs.society-erp.internal/errors/FEATURE_NOT_ENTITLED"
  }
}
```

### Stable Machine-Readable Codes

- `VALIDATION_FAILED` (422)
- `UNAUTHENTICATED` (401)
- `FORBIDDEN` (403)
- `FEATURE_NOT_ENTITLED` (403)
- `QUOTA_EXCEEDED` (429)
- `RATE_LIMITED` (429)
- `NOT_FOUND` (404 - preferred over 403 on cross-tenant lookups to avoid existence leaks)
- `CONFLICT` (409)
- `IDEMPOTENCY_KEY_REQUIRED` (400)
- `IDEMPOTENCY_KEY_REUSED` (409)
- `PRECONDITION_FAILED` (412)
- `COMPLIANCE_ATTESTATION_REQUIRED` (409)
- `TENANT_SUSPENDED` (403)
- `PROVIDER_UNAVAILABLE` (503)
- `INTERNAL_ERROR` (500)

---

## 4. HTTP Headers & Transport Invariants

1. `X-Request-Id`: Unique UUIDv7 generated at edge/BFF and propagated across all logs.
2. `Idempotency-Key`: Mandatory on unsafe operations (payments, billing runs, notifications).
3. `ETag` & `If-Match`: Carries entity `version` integer for optimistic concurrency.
4. `Deprecation` & `Sunset`: Mandatory headers for deprecated endpoints.
