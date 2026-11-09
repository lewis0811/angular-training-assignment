import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUDGET_PLAN_ENDPOINTS } from '../../constants/api-endpoints';
import { JAR_TYPES } from '../../models/budget-plan.model';
import { MonthlyPlanningPage } from './monthly-planning';

describe('MonthlyPlanningPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<MonthlyPlanningPage>>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyPlanningPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(MonthlyPlanningPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush(defaultJars());
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('normalizes grouped income and navigates to the created plan', () => {
    fixture.componentInstance.form.setValue({ year: 2026, month: 11, monthlyIncomeVnd: '1,250,000' });
    fixture.detectChanges();
    fixture.componentInstance.submit();
    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.PLANS);
    expect(request.request.body).toEqual({ year: 2026, month: 11, monthlyIncomeVnd: '1250000' });
    request.flush(planResponse());
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/monthly-plans', 2026, 11]);
  });

  it('formats the income input with commas as the user types', () => {
    const input = fixture.nativeElement.querySelector('#monthlyIncome') as HTMLInputElement;
    input.value = '25000000';
    input.setSelectionRange(8, 8);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(input.value).toBe('25,000,000');
    expect(fixture.componentInstance.form.controls.monthlyIncomeVnd.value).toBe('25,000,000');
  });

  it('keeps form input after a duplicate-plan response and ignores repeat submits', () => {
    fixture.componentInstance.form.setValue({ year: 2026, month: 11, monthlyIncomeVnd: '25.000.000' });
    fixture.componentInstance.submit();
    fixture.componentInstance.submit();
    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.PLANS);
    expect(request.request.body.monthlyIncomeVnd).toBe('25000000');
    request.flush({
      code: 'MONTHLY_PLAN_ALREADY_EXISTS',
      message: 'A monthly plan already exists for this month.',
      errors: []
    }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.monthlyIncomeVnd.value).toBe('25.000.000');
    expect(fixture.componentInstance.error?.status).toBe(409);
    expect(http.match(BUDGET_PLAN_ENDPOINTS.PLANS)).toHaveLength(0);
  });

  it('blocks invalid amounts without issuing a POST', () => {
    fixture.componentInstance.form.setValue({ year: 2026, month: 11, monthlyIncomeVnd: '1,25x,000' });
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.form.controls.monthlyIncomeVnd.invalid).toBe(true);
    http.expectNone(BUDGET_PLAN_ENDPOINTS.PLANS);
  });

  it('shows a recoverable error when default jars cannot be loaded', () => {
    fixture.componentInstance.loadDefaults();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS).flush({
      code: 'INTERNAL_ERROR', message: 'Unavailable.', errors: []
    }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not load your jar plan');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});

function defaultJars() {
  return {
    currency: 'VND',
    totalPercentage: 100,
    jars: JAR_TYPES.map((jarType, index) => ({
      jarType, name: jarType, percentage: [35, 20, 10, 10, 10, 10, 5][index], suggestedLogic: 'Family needs'
    }))
  };
}

function planResponse() {
  return {
    id: 1, year: 2026, month: 11, monthlyIncomeVnd: '1250000', currency: 'VND',
    createdAtUtc: '2026-11-01T00:00:00Z',
    jars: JAR_TYPES.map((jarType, index) => ({
      jarType, name: jarType, percentage: [35, 20, 10, 10, 10, 10, 5][index], budgetVnd: '1000'
    }))
  };
}
