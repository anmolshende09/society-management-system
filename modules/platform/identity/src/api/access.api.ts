import { UserId, MembershipId } from "@society/shared-kernel";

export type PermissionKey = string;

export interface PropertyScope {
  societyId?: string;
  phaseId?: string;
  towerId?: string;
  wingId?: string;
  floorId?: string;
  unitId?: string;
}

export interface ActorContext {
  userId: UserId;
  membershipId: MembershipId;
  roles: string[];
  viaImpersonation: boolean;
  impersonatorId?: string;
}

export const ACCESS_API_TOKEN = Symbol("AccessApi");

export interface AccessApi {
  can(permission: PermissionKey, scope?: PropertyScope): Promise<boolean>;
  assert(permission: PermissionKey, scope?: PropertyScope): Promise<void>;
  currentActor(): ActorContext;
}
