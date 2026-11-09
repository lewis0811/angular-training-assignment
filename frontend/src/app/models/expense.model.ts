import { JarType } from './budget-plan.model';

export interface CreateExpenseRequest {
  expenseDate: string;
  jarType: JarType;
  amountVnd: string;
  description: string;
}

export interface CreatedExpense {
  id: number;
  expenseDate: string;
  jarType: JarType;
  jarName: string;
  amountVnd: string;
  description: string;
  createdAtUtc: string;
}

export interface JarSpendingSummary {
  jarType: JarType;
  jarName: string;
  percentage: number;
  budgetVnd: string;
  spentVnd: string;
  remainingVnd: string;
}

export interface CreateExpenseResponse {
  expense: CreatedExpense;
  jarSummary: JarSpendingSummary;
}
