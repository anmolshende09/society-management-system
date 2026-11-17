import {
  UnitId,
  PropertyNodeId,
  VehicleId,
  ResidentId,
  UserId,
  PageRequest,
  Page,
} from "@society/shared-kernel";

export interface UnitSummary {
  id: UnitId;
  propertyNodeId: PropertyNodeId;
  unitNumber: string;
  unitType: string;
  areaSqft?: number;
}

export type OccupantType =
  "owner" | "tenant" | "family" | "authorized_occupant";

export interface OccupantSummary {
  residentId: ResidentId;
  userId?: UserId;
  name: string;
  type: OccupantType;
  mobile: string;
}

export interface BillingParty {
  partyType: "owner" | "tenant";
  residentId: ResidentId;
  name: string;
  email?: string;
  mobile: string;
}

export interface RecipientRef {
  userId?: UserId;
  mobile: string;
  email?: string;
  pushToken?: string;
}

export interface ResidentSummary {
  id: ResidentId;
  userId?: UserId;
  name: string;
  mobile: string;
  email?: string;
}

export interface VehicleSummary {
  id: VehicleId;
  unitId: UnitId;
  registrationNumber: string;
  type: "2w" | "4w" | "other";
  parkingSlot?: string;
}

export interface PropertyNode {
  id: PropertyNodeId;
  parentId?: PropertyNodeId;
  name: string;
  type: "society" | "phase" | "tower" | "wing" | "floor";
  children?: PropertyNode[];
}

export const RESIDENT_DIRECTORY_API_TOKEN = Symbol("ResidentDirectoryApi");

export interface ResidentDirectoryApi {
  getUnit(unitId: UnitId): Promise<UnitSummary | null>;
  listUnits(
    scope: { propertyNodeId?: PropertyNodeId },
    page: PageRequest,
  ): Promise<Page<UnitSummary>>;
  getOccupants(unitId: UnitId, asOf?: Date): Promise<OccupantSummary[]>;
  resolveBillingParty(unitId: UnitId, asOf: Date): Promise<BillingParty>;
  resolveNotificationTargets(
    unitId: UnitId,
    purpose: string,
  ): Promise<RecipientRef[]>;
  findResidentByMobile(mobile: string): Promise<ResidentSummary | null>;
  getVehicle(vehicleId: VehicleId): Promise<VehicleSummary | null>;
  listVehicles(unitId: UnitId): Promise<VehicleSummary[]>;
  getPropertyTree(root?: PropertyNodeId): Promise<PropertyNode>;
}
