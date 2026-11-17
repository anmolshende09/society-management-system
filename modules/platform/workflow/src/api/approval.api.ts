import { ApprovalRequestId } from "@society/shared-kernel";

export interface EntityRef {
  type: string;
  id: string;
}

export type ApprovalType =
  "expense" | "move_in" | "move_out" | "purchase_order" | "custom";
export type ApprovalStatus = "approved" | "rejected" | "returned" | "pending";

export interface SubmitApprovalRequestCommand {
  requestType: ApprovalType;
  subjectRef: EntityRef;
  amountPaise?: bigint;
  context: Record<string, unknown>;
}

export const APPROVAL_API_TOKEN = Symbol("ApprovalApi");

export interface ApprovalApi {
  submit(req: SubmitApprovalRequestCommand): Promise<ApprovalRequestId>;
  getStatus(id: ApprovalRequestId): Promise<ApprovalStatus>;
}
