export interface ReportQuery {
  reportKey: string;
  parameters: Record<string, unknown>;
}

export const REPORTING_CORE_API_TOKEN = Symbol("ReportingCoreApi");
