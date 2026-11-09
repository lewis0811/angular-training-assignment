import { DefaultJarsResponse, JAR_TYPES, JarType, MonthlyPlanResponse } from '../../models/budget-plan.model';
import { CreateExpenseResponse } from '../../models/expense.model';
import { SpendingByJarsResponse } from '../../models/spending.model';
import { DataIntegrityError } from '../api-error';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJarType(value: unknown): value is JarType {
  return typeof value === 'string' && JAR_TYPES.includes(value as JarType);
}

function isMoney(value: unknown): value is string {
  return typeof value === 'string' && /^\d+$/.test(value);
}

function isSignedMoney(value: unknown): value is string {
  return typeof value === 'string' && /^-?\d+$/.test(value);
}

function validateJarSet(jars: unknown, getJarType: (jar: RecordValue) => unknown): jars is RecordValue[] {
  if (!Array.isArray(jars) || jars.length !== JAR_TYPES.length) {
    return false;
  }

  const types = jars.map((jar) => isRecord(jar) ? getJarType(jar) : null);
  return types.every(isJarType) && new Set(types).size === JAR_TYPES.length;
}

function validPercentages(jars: RecordValue[], field: string): boolean {
  return jars.every((jar) => Number.isInteger(jar[field]) &&
    (jar[field] as number) >= 0 && (jar[field] as number) <= 100) &&
    jars.reduce((total, jar) => total + (jar[field] as number), 0) === 100;
}

function requireValid(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new DataIntegrityError(message);
  }
}

export function validateDefaultJarsResponse(value: unknown): DefaultJarsResponse {
  requireValid(isRecord(value), 'Default jars response must be an object.');
  requireValid(value['currency'] === 'VND' && value['totalPercentage'] === 100,
    'Default jars response must use VND and total 100 percent.');
  requireValid(validateJarSet(value['jars'], jar => jar['jarType']),
    'Default jars response must contain exactly seven unique canonical jars.');
  const jars = value['jars'] as RecordValue[];
  requireValid(jars.every(jar => typeof jar['name'] === 'string' &&
    typeof jar['suggestedLogic'] === 'string'), 'Default jar labels are invalid.');
  requireValid(validPercentages(jars, 'percentage'),
    'Default jar percentages must be whole numbers totaling 100.');

  return value as unknown as DefaultJarsResponse;
}

export function validateMonthlyPlanResponse(value: unknown): MonthlyPlanResponse {
  requireValid(isRecord(value), 'Monthly plan response must be an object.');
  requireValid(value['currency'] === 'VND' && Number.isInteger(value['id']) &&
    Number.isInteger(value['year']) && (value['year'] as number) >= 1 && (value['year'] as number) <= 9999 &&
    Number.isInteger(value['month']) && (value['month'] as number) >= 1 && (value['month'] as number) <= 12 &&
    isMoney(value['monthlyIncomeVnd']) && /[1-9]/.test(value['monthlyIncomeVnd'] as string) &&
    typeof value['createdAtUtc'] === 'string',
  'Monthly plan response has invalid period, currency, or income.');
  requireValid(validateJarSet(value['jars'], jar => jar['jarType']),
    'Monthly plan response must contain exactly seven unique canonical jars.');
  const jars = value['jars'] as RecordValue[];
  requireValid(jars.every(jar => typeof jar['name'] === 'string' && isMoney(jar['budgetVnd'])),
    'Monthly plan jars must include names and digit-only budgets.');
  requireValid(validPercentages(jars, 'percentage'),
    'Monthly plan percentages must be whole numbers totaling 100.');

  return value as unknown as MonthlyPlanResponse;
}

export function validateCreateExpenseResponse(value: unknown): CreateExpenseResponse {
  requireValid(isRecord(value) && isRecord(value['expense']) && isRecord(value['jarSummary']),
    'Create expense response must include expense and jar summary.');
  const expense = value['expense'];
  const summary = value['jarSummary'];
  requireValid(Number.isInteger(expense['id']) && typeof expense['expenseDate'] === 'string' &&
    isJarType(expense['jarType']) && typeof expense['jarName'] === 'string' &&
    isMoney(expense['amountVnd']) && typeof expense['description'] === 'string' &&
    typeof expense['createdAtUtc'] === 'string',
  'Created expense fields are invalid.');
  requireValid(isJarType(summary['jarType']) && typeof summary['jarName'] === 'string' &&
    Number.isInteger(summary['percentage']) && isMoney(summary['budgetVnd']) &&
    isMoney(summary['spentVnd']) && isSignedMoney(summary['remainingVnd']),
  'Created expense jar summary fields are invalid.');

  return value as unknown as CreateExpenseResponse;
}

export function validateSpendingByJarsResponse(value: unknown): SpendingByJarsResponse {
  requireValid(isRecord(value) && value['currency'] === 'VND' &&
    Number.isInteger(value['year']) && (value['year'] as number) >= 1 &&
    (value['year'] as number) <= 9999 && Number.isInteger(value['month']) &&
    (value['month'] as number) >= 1 && (value['month'] as number) <= 12,
  'Spending response must include a valid period and VND currency.');
  requireValid(validateJarSet(value['jars'], jar => jar['jarType']),
    'Spending response must contain exactly seven unique canonical jars.');
  const jars = value['jars'] as RecordValue[];
  requireValid(jars.every(jar => typeof jar['jarName'] === 'string' &&
    isMoney(jar['plannedBudgetVnd']) && isMoney(jar['spentBudgetVnd']) &&
    typeof jar['percentageUsed'] === 'number' && Number.isFinite(jar['percentageUsed']) &&
    jar['percentageUsed'] >= 0),
  'Spending jar values are invalid.');

  return value as unknown as SpendingByJarsResponse;
}
