import { UnitId, ChargeId } from "@society/shared-kernel";

export interface EntityRef {
  type: string;
  id: string;
}

export interface RequestChargeCommand {
  chargeTypeKey: string;
  unitId: UnitId;
  amountPaise: bigint;
  sourceRef: EntityRef;
  idempotencyKey: string;
  dueDate?: Date;
  description: string;
}

export const CHARGE_API_TOKEN = Symbol("ChargeApi");

export interface ChargeApi {
  requestCharge(req: RequestChargeCommand): Promise<ChargeId>;
  cancelCharge(chargeId: ChargeId, reason: string): Promise<void>;
}
