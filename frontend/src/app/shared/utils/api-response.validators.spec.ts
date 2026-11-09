import { describe, expect, it } from 'vitest';
import { DataIntegrityError } from '../api-error';
import {
  validateCreateExpenseResponse,
  validateDefaultJarsResponse,
  validateMonthlyPlanResponse,
  validateSpendingByJarsResponse
} from './api-response.validators';
import { JAR_TYPES } from '../../models/budget-plan.model';

const jars = JAR_TYPES.map((jarType, index) => ({
  jarType,
  name: jarType,
  percentage: [35, 20, 10, 10, 10, 10, 5][index]!,
  budgetVnd: '1000'
}));

describe('API response validators', () => {
  it('validates default jars and monthly plans', () => {
    expect(validateDefaultJarsResponse({
      currency: 'VND',
      totalPercentage: 100,
      jars: jars.map(({ jarType, name, percentage }) => ({ jarType, name, percentage, suggestedLogic: '' }))
    }).jars).toHaveLength(7);

    expect(validateMonthlyPlanResponse({
      id: 1,
      year: 2026,
      month: 11,
      monthlyIncomeVnd: '10000',
      currency: 'VND',
      createdAtUtc: '2026-11-01T00:00:00Z',
      jars
    }).jars).toHaveLength(7);
  });

  it('rejects invalid period, incomplete or duplicated jars and malformed money', () => {
    const validPlan = {
      id: 1, year: 2026, month: 11, monthlyIncomeVnd: '10000', currency: 'VND',
      createdAtUtc: '2026-11-01T00:00:00Z', jars
    };

    expect(() => validateMonthlyPlanResponse({ ...validPlan, month: 13 })).toThrow(DataIntegrityError);
    expect(() => validateMonthlyPlanResponse({ ...validPlan, jars: jars.slice(1) })).toThrow(DataIntegrityError);
    expect(() => validateMonthlyPlanResponse({
      ...validPlan,
      jars: [{ ...jars[0]!, budgetVnd: '1,000' }, ...jars.slice(1)]
    })).toThrow(DataIntegrityError);
    expect(() => validateDefaultJarsResponse({ currency: 'USD', totalPercentage: 100, jars: [] }))
      .toThrow(DataIntegrityError);
  });

  it('validates expense data and allows negative remaining VND', () => {
    expect(validateCreateExpenseResponse({
      expense: {
        id: 1, expenseDate: '2026-11-08', jarType: JAR_TYPES[0], jarName: 'Living Expenses',
        amountVnd: '100', description: 'Food', createdAtUtc: '2026-11-08T00:00:00Z'
      },
      jarSummary: {
        jarType: JAR_TYPES[0], jarName: 'Living Expenses', percentage: 35,
        budgetVnd: '1000', spentVnd: '1200', remainingVnd: '-200'
      }
    }).jarSummary.remainingVnd).toBe('-200');
  });

  it('accepts F4 decimal percentages above 100 and keeps backend order', () => {
    const response = {
      year: 2026,
      month: 11,
      currency: 'VND',
      jars: [...JAR_TYPES].reverse().map(jarType => ({
        jarType,
        jarName: jarType,
        percentageUsed: 102.86,
        plannedBudgetVnd: '1000',
        spentBudgetVnd: '1029'
      }))
    };

    expect(validateSpendingByJarsResponse(response).jars[0]?.jarType).toBe(JAR_TYPES[6]);
    expect(() => validateSpendingByJarsResponse({
      ...response,
      jars: response.jars.slice(1)
    })).toThrow(DataIntegrityError);
    expect(() => validateSpendingByJarsResponse({
      ...response,
      jars: response.jars.map((jar, index) => index ? jar : { ...jar, spentBudgetVnd: '-1' })
    })).toThrow(DataIntegrityError);
  });
});
