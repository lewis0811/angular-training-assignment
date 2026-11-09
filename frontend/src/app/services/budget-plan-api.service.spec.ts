import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BUDGET_PLAN_ENDPOINTS } from '../constants/api-endpoints';
import { JAR_TYPES } from '../models/budget-plan.model';
import { BudgetPlanApiService } from './budget-plan-api.service';

describe('BudgetPlanApiService', () => {
  let service: BudgetPlanApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BudgetPlanApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads validated default jars', () => {
    service.getDefaultJars().subscribe(response => expect(response.currency).toBe('VND'));
    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush({
      currency: 'VND',
      totalPercentage: 100,
      jars: JAR_TYPES.map((jarType, index) => ({
        jarType, name: jarType, percentage: [35, 20, 10, 10, 10, 10, 5][index], suggestedLogic: ''
      }))
    });
  });

  it('sends plan create/load requests to documented endpoints', () => {
    service.createMonthlyPlan({ year: 2026, month: 11, monthlyIncomeVnd: '10000' }).subscribe();
    const create = http.expectOne(BUDGET_PLAN_ENDPOINTS.PLANS);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ year: 2026, month: 11, monthlyIncomeVnd: '10000' });
    create.flush(planResponse());

    service.getMonthlyPlan(2026, 11).subscribe();
    const load = http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11));
    expect(load.request.method).toBe('GET');
    load.flush(planResponse());
  });

  it('posts expenses without year/month to the backend expenses route', () => {
    const request = {
      expenseDate: '2026-11-08',
      jarType: JAR_TYPES[0],
      amountVnd: '100',
      description: 'Lunch'
    };
    service.createExpense(request).subscribe();
    const create = http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(request);
    expect(create.request.body.year).toBeUndefined();
    create.flush({
      expense: {
        id: 1, ...request, jarName: 'Living Expenses', createdAtUtc: '2026-11-08T00:00:00Z'
      },
      jarSummary: {
        jarType: JAR_TYPES[0], jarName: 'Living Expenses', percentage: 35,
        budgetVnd: '1000', spentVnd: '100', remainingVnd: '900'
      }
    });
  });

  it('loads one spending summary request', () => {
    service.getSpendingByJars(2026, 11).subscribe(response => expect(response.jars).toHaveLength(7));
    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.SPENDING_BY_JARS(2026, 11));
    expect(request.request.method).toBe('GET');
    request.flush({
      year: 2026, month: 11, currency: 'VND',
      jars: JAR_TYPES.map(jarType => ({
        jarType, jarName: jarType, percentageUsed: 0, plannedBudgetVnd: '1000', spentBudgetVnd: '0'
      }))
    });
  });
});

function planResponse() {
  return {
    id: 1, year: 2026, month: 11, monthlyIncomeVnd: '10000', currency: 'VND',
    createdAtUtc: '2026-11-01T00:00:00Z',
    jars: JAR_TYPES.map((jarType, index) => ({
      jarType, name: jarType, percentage: [35, 20, 10, 10, 10, 10, 5][index], budgetVnd: '1000'
    }))
  };
}
