import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BUDGET_PLAN_ENDPOINTS } from '../../constants/api-endpoints';
import { JAR_TYPES } from '../../models/budget-plan.model';
import { ExpensesPage } from './expenses';

describe('ExpensesPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ExpensesPage>>;
  let http: HttpTestingController;
  let queryParamMap: ParamMap;

  beforeEach(async () => {
    queryParamMap = convertToParamMap({ expenseDate: '2026-11-08', jarType: 'food' });
    await TestBed.configureTestingModule({
      imports: [ExpensesPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { get snapshot() { return { queryParamMap }; } }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ExpensesPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads period from a date query and applies a valid jar only after plan load', () => {
    expect(fixture.componentInstance.form.controls.expenseDate.value).toBe('2026-11-08');
    expect(fixture.componentInstance.form.controls.jarType.value).toBeNull();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(planResponse());
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.jarType.value).toBe('food');
    expect(fixture.nativeElement.textContent).toContain('Expense details');
    expect(fixture.nativeElement.textContent).toContain('Food');
  });

  it('cancels the stale plan request when the expense date changes month', () => {
    const novemberRequest = http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11));
    fixture.componentInstance.form.controls.expenseDate.setValue('2026-12-01');
    expect(novemberRequest.cancelled).toBe(true);

    const decemberRequest = http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 12));
    decemberRequest.flush(planResponse(2026, 12));
    fixture.detectChanges();
    expect(fixture.componentInstance.plan?.month).toBe(12);
  });

  it('normalizes amount and creates one expense without retrying POST', () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(planResponse());
    fixture.componentInstance.form.setValue({
      expenseDate: '2026-11-08',
      jarType: 'food',
      amountVnd: '1.250.000',
      description: ' Groceries '
    });

    fixture.componentInstance.submit();
    fixture.componentInstance.submit();
    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES);
    expect(request.request.body).toEqual({
      expenseDate: '2026-11-08',
      jarType: 'food',
      amountVnd: '1250000',
      description: 'Groceries'
    });
    expect(request.request.body.year).toBeUndefined();
    request.flush(expenseResponse());
    fixture.detectChanges();
    expect(fixture.componentInstance.success?.jarSummary.remainingVnd).toBe('-250000');
    expect(fixture.nativeElement.textContent).toContain('Expense saved successfully');
    expect(fixture.nativeElement.textContent).toContain('View spending by jar');
    http.expectNone(BUDGET_PLAN_ENDPOINTS.EXPENSES);
  });

  it('formats the expense amount input with commas as the user types', () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(planResponse());
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#expenseAmount') as HTMLInputElement;
    input.value = '1250000';
    input.setSelectionRange(7, 7);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(input.value).toBe('1,250,000');
    expect(fixture.componentInstance.form.controls.amountVnd.value).toBe('1,250,000');
  });

  it('preserves form values and does not retry when create fails', () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(planResponse());
    fixture.componentInstance.form.setValue({
      expenseDate: '2026-11-08',
      jarType: 'food',
      amountVnd: '1250000',
      description: 'Groceries'
    });

    fixture.componentInstance.submit();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.EXPENSES).flush({
      code: 'INTERNAL_ERROR',
      message: 'Temporary failure.',
      errors: []
    }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.amountVnd.value).toBe('1250000');
    expect(fixture.componentInstance.form.controls.description.value).toBe('Groceries');
    expect(fixture.componentInstance.submitError?.status).toBe(500);
    expect(fixture.nativeElement.textContent).toContain('Try again.');
    http.expectNone(BUDGET_PLAN_ENDPOINTS.EXPENSES);
  });

  it('ignores a query jar that is not part of the shared JarType union', async () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(planResponse());
    fixture.destroy();
    queryParamMap = convertToParamMap({ expenseDate: '2026-11-08', jarType: 'invalid' });
    fixture = TestBed.createComponent(ExpensesPage);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(planResponse());
    await fixture.whenStable();
    expect(fixture.componentInstance.form.controls.jarType.value).toBeNull();
  });

  it('shows a required-plan state and a link to create the plan', () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush({
      code: 'MONTHLY_PLAN_NOT_FOUND', message: 'Missing.', errors: []
    }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Create a monthly plan before adding an expense');
    expect(fixture.nativeElement.querySelector('a[href="/monthly-planning"]')).not.toBeNull();
  });
});

function planResponse(year = 2026, month = 11) {
  return {
    id: 1, year, month, monthlyIncomeVnd: '10000000', currency: 'VND',
    createdAtUtc: '2026-11-01T00:00:00Z',
    jars: JAR_TYPES.map((jarType, index) => ({
      jarType, name: ['Living Expenses', 'Food', 'Children', 'Emergency Fund', 'Savings', 'Investment', 'Entertainment & Travel'][index],
      percentage: [35, 20, 10, 10, 10, 10, 5][index], budgetVnd: '1000000'
    }))
  };
}

function expenseResponse() {
  return {
    expense: {
      id: 1, expenseDate: '2026-11-08', jarType: 'food', jarName: 'Food',
      amountVnd: '1250000', description: 'Groceries', createdAtUtc: '2026-11-08T00:00:00Z'
    },
    jarSummary: {
      jarType: 'food', jarName: 'Food', percentage: 20,
      budgetVnd: '1000000', spentVnd: '1250000', remainingVnd: '-250000'
    }
  };
}
