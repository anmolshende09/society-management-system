import { PostingId } from "@society/shared-kernel";

export interface PayrollRunSummary {
  runId: string;
  period: string;
  totalGrossPaise: bigint;
  totalNetPaise: bigint;
  totalDeductionsPaise: bigint;
  employeeCount: number;
}

export const PAYROLL_POSTING_API_TOKEN = Symbol("PayrollPostingApi");

export interface PayrollPostingApi {
  postPayrollRun(
    run: PayrollRunSummary,
    idempotencyKey: string,
  ): Promise<PostingId>;
}
