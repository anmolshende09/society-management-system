import { ExpenseId, DocumentId } from "@society/shared-kernel";
import { EntityRef } from "./charge.api.js";

export interface TaxLineInput {
  taxType: string;
  rateBasisPoints: bigint;
  amountPaise: bigint;
}

export interface SubmitExpenseCommand {
  categoryKey: string;
  vendorRef?: EntityRef;
  amountPaise: bigint;
  taxLines?: TaxLineInput[];
  links: EntityRef[];
  attachments: DocumentId[];
  idempotencyKey: string;
}

export type ExpenseStatus =
  "draft" | "submitted" | "approved" | "paid" | "rejected";

export const EXPENSE_API_TOKEN = Symbol("ExpenseApi");

export interface ExpenseApi {
  submitExpense(req: SubmitExpenseCommand): Promise<ExpenseId>;
  getExpenseStatus(id: ExpenseId): Promise<ExpenseStatus>;
}
