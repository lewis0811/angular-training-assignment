import { JarType } from './budget-plan.model';

export interface SpendingByJar {
  jarType: JarType;
  jarName: string;
  percentageUsed: number;
  plannedBudgetVnd: string;
  spentBudgetVnd: string;
}

export interface SpendingByJarsResponse {
  year: number;
  month: number;
  currency: 'VND';
  jars: SpendingByJar[];
}
