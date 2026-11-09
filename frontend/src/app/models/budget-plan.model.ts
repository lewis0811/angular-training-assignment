export const JAR_TYPES = [
  'livingExpenses',
  'food',
  'children',
  'emergencyFund',
  'savings',
  'investment',
  'entertainmentAndTravel'
] as const;

export type JarType = typeof JAR_TYPES[number];

export interface DefaultJar {
  jarType: JarType;
  name: string;
  percentage: number;
  suggestedLogic: string;
}

export interface DefaultJarsResponse {
  currency: 'VND';
  totalPercentage: 100;
  jars: DefaultJar[];
}

export interface CreateMonthlyPlanRequest {
  year: number;
  month: number;
  monthlyIncomeVnd: string;
}

export interface MonthlyPlanJar {
  jarType: JarType;
  name: string;
  percentage: number;
  budgetVnd: string;
}

export interface MonthlyPlanResponse {
  id: number;
  year: number;
  month: number;
  monthlyIncomeVnd: string;
  currency: 'VND';
  createdAtUtc: string;
  jars: MonthlyPlanJar[];
}

export interface MonthlyPeriod {
  year: number;
  month: number;
}
