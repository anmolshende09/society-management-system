import { UnitId, Money } from "@society/shared-kernel";

export interface DuesSummary {
  unitId: UnitId;
  totalOutstanding: Money;
  advanceBalance: Money;
  currentCycleDue: Money;
  overdue30Days: Money;
  overdue60Days: Money;
  overdue90DaysPlus: Money;
}

export const DUES_API_TOKEN = Symbol("DuesApi");

export interface DuesApi {
  getUnitDues(unitId: UnitId, asOf?: Date): Promise<DuesSummary>;
  getDuesForUnits(unitIds: UnitId[]): Promise<Map<UnitId, DuesSummary>>;
}
