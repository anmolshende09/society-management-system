import { brandId, TenantId, UserId } from "@society/shared-kernel";

export interface TestTenantContext {
  tenantId: TenantId;
  userId: UserId;
  membershipId?: string;
  roles: string[];
}

export function createMockTenantContext(
  overrides?: Partial<TestTenantContext>,
): TestTenantContext {
  return {
    tenantId:
      overrides?.tenantId ??
      brandId<string, "TenantId">("018e0000-0000-7000-8000-000000000001"),
    userId:
      overrides?.userId ??
      brandId<string, "UserId">("018e0000-0000-7000-8000-000000000002"),
    membershipId:
      overrides?.membershipId ?? "018e0000-0000-7000-8000-000000000003",
    roles: overrides?.roles ?? ["resident_owner"],
  };
}
