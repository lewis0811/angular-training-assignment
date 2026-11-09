import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { BUDGET_PLAN_ENDPOINTS } from '../../constants/api-endpoints';
import { JAR_TYPES } from '../../models/budget-plan.model';
import { IncomeAllocationPage } from './income-allocation';

describe('IncomeAllocationPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<IncomeAllocationPage>>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    navigate = vi.fn().mockResolvedValue(true);
    await TestBed.configureTestingModule({
      imports: [IncomeAllocationPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ year: '2026', month: '11' })) }
        },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(IncomeAllocationPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads the plan from the route and lets the user choose another period', () => {
    const request = http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11));
    request.flush(planResponse());
    fixture.detectChanges();
    expect(fixture.componentInstance.plan?.jars).toHaveLength(7);
    expect(fixture.nativeElement.querySelectorAll('.allocation-row')).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('View spending by jar');

    fixture.componentInstance.periodForm.setValue({ year: 2025, month: 4 });
    fixture.detectChanges();
    fixture.componentInstance.selectPeriod();
    expect(navigate).toHaveBeenCalledWith(['/monthly-plans', 2025, 4]);
  });

  it('shows a not-found state without placeholder allocation values', async () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush({
      code: 'MONTHLY_PLAN_NOT_FOUND',
      message: 'No monthly plan exists for this month.',
      errors: []
    }, { status: 404, statusText: 'Not Found' });

    expect(fixture.componentInstance.loading).toBe(false);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.error?.status).toBe(404);
    expect(fixture.nativeElement.textContent).toContain('No plan found for this month');
  });

  it('renders a retry action for service failures', () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush({
      code: 'INTERNAL_ERROR', message: 'Unavailable.', errors: []
    }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Could not load this monthly plan');

    fixture.componentInstance.retry();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(2026, 11)).flush(planResponse());
    fixture.detectChanges();
    expect(fixture.componentInstance.plan?.year).toBe(2026);
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
