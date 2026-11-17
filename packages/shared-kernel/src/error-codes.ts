/**
 * Standard Error Code Taxonomy (specs.md Appendix F)
 */
export const ErrorCode = {
  VALIDATION_FAILED: "VALIDATION_FAILED", // 422
  UNAUTHENTICATED: "UNAUTHENTICATED", // 401
  FORBIDDEN: "FORBIDDEN", // 403
  FEATURE_NOT_ENTITLED: "FEATURE_NOT_ENTITLED", // 403
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED", // 429
  RATE_LIMITED: "RATE_LIMITED", // 429
  NOT_FOUND: "NOT_FOUND", // 404
  CONFLICT: "CONFLICT", // 409
  IDEMPOTENCY_KEY_REQUIRED: "IDEMPOTENCY_KEY_REQUIRED", // 400
  IDEMPOTENCY_KEY_REUSED: "IDEMPOTENCY_KEY_REUSED", // 409
  PRECONDITION_FAILED: "PRECONDITION_FAILED", // 412
  COMPLIANCE_ATTESTATION_REQUIRED: "COMPLIANCE_ATTESTATION_REQUIRED", // 409
  TENANT_SUSPENDED: "TENANT_SUSPENDED", // 403
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE", // 503
  INTERNAL_ERROR: "INTERNAL_ERROR", // 500
} as const;

export type ErrorCodeKey = keyof typeof ErrorCode;

export interface AppErrorDetail {
  field?: string | null;
  issue: string;
  hint?: string;
}

export interface AppErrorPayload {
  code: ErrorCodeKey;
  message: string;
  status: number;
  details?: AppErrorDetail[];
  requestId?: string;
  docUrl?: string;
}
