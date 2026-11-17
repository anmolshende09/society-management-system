import { GateId } from "@society/shared-kernel";

export interface SubjectRef {
  type:
    | "resident"
    | "visitor"
    | "employee"
    | "domestic_help"
    | "delivery"
    | "vehicle";
  id: string;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  badgeRequired?: boolean;
  escortRequired?: boolean;
}

export const ACCESS_CONTROL_API_TOKEN = Symbol("AccessControlApi");

export interface AccessControlApi {
  isEntryAllowed(req: {
    subject: SubjectRef;
    gateId: GateId;
    at: Date;
  }): Promise<AccessDecision>;
}
