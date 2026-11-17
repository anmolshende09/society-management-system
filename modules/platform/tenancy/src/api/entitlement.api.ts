export type FeatureKey = string;

export interface UsageResult {
  success: boolean;
  remaining: number;
}

export type LimitValue = number | null;

export const ENTITLEMENT_API_TOKEN = Symbol("EntitlementApi");

export interface EntitlementApi {
  isEnabled(featureKey: FeatureKey): Promise<boolean>;
  assertEnabled(featureKey: FeatureKey): Promise<void>;
  consume(
    featureKey: FeatureKey,
    qty: number,
    idempotencyKey: string,
  ): Promise<UsageResult>;
  getLimit(featureKey: FeatureKey): Promise<LimitValue>;
}
