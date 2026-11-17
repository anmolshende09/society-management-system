import { AssetId } from "@society/shared-kernel";
import { TaskSummary } from "./work.api.js";

export interface AssetSummary {
  id: AssetId;
  name: string;
  category: string;
  location: string;
  status: "operational" | "breakdown" | "under_maintenance" | "decommissioned";
  lastServiceDate?: Date;
  nextServiceDueDate?: Date;
}

export const ASSET_API_TOKEN = Symbol("AssetApi");

export interface AssetApi {
  getAsset(assetId: AssetId): Promise<AssetSummary | null>;
  getOpenWorkForAsset(assetId: AssetId): Promise<TaskSummary[]>;
}
