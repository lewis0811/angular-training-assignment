import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { BUDGET_PLAN_ENDPOINTS } from '../../constants/api-endpoints';
import { JAR_TYPES } from '../../models/budget-plan.model';
import { SpendingByJarPage } from './spending-by-jar';

describe('SpendingByJarPage', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SpendingByJarPage>>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingByJarPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ year: '2026', month: '11' })) }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(SpendingByJarPage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('requests one F4 summary and renders all jars in backend order', () => {
    const response = spendingResponse();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.SPENDING_BY_JARS(2026, 11)).flush(response);
    fixture.detectChanges();

    expect(fixture.componentInstance.response?.jars.map((jar) => jar.jarType)).toEqual(
      response.jars.map((jar) => jar.jarType)
    );
    expect(fixture.nativeElement.querySelectorAll('.spending-card')).toHaveLength(7);
    expect(fixture.componentInstance.progressWidth(102.86)).toBe(100);
    expect(fixture.componentInstance.percentageLabel(102.86)).toBe('102.86%');
    const rows = fixture.nativeElement.querySelectorAll('.spending-card') as NodeListOf<HTMLElement>;
    const zeroSpendRow = [...rows].find((row) => row.textContent?.includes('0%'));
    expect(zeroSpendRow?.querySelector('progress')?.value).toBe(0);
  });

  it('marks over-budget rows and describes progress accessibly', () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.SPENDING_BY_JARS(2026, 11)).flush(spendingResponse());
    fixture.detectChanges();

    const overBudget = fixture.nativeElement.querySelector('.spending-card.over-budget');
    expect(overBudget?.textContent).toContain('Over budget');
    const progress = overBudget?.querySelector('progress');
    expect(progress?.getAttribute('aria-label')).toContain('102.86% used');
    expect(progress?.value).toBe(100);
  });

  it('shows a missing-plan state and retryable server error', () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.SPENDING_BY_JARS(2026, 11)).flush(
      {
        code: 'MONTHLY_PLAN_NOT_FOUND',
        message: 'Missing.',
        errors: []
      },
      { status: 404, statusText: 'Not Found' }
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.error?.status).toBe(404);
    expect(fixture.componentInstance.response).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No plan found for November 2026');
  });

  it('renders an invalid-route and retryable server error state', () => {
    http.expectOne(BUDGET_PLAN_ENDPOINTS.SPENDING_BY_JARS(2026, 11)).flush(
      {
        code: 'INTERNAL_ERROR',
        message: 'Unavailable.',
        errors: []
      },
      { status: 500, statusText: 'Server Error' }
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Could not load spending');

    fixture.componentInstance.retry();
    http.expectOne(BUDGET_PLAN_ENDPOINTS.SPENDING_BY_JARS(2026, 11)).flush(spendingResponse());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.spending-card')).toHaveLength(7);
  });
});

function spendingResponse() {
  const jars = [...JAR_TYPES].reverse().map((jarType, index) => ({
    jarType,
    jarName: jarType,
    percentageUsed: index === 0 ? 102.86 : 0,
    plannedBudgetVnd: '1000000',
    spentBudgetVnd: index === 0 ? '1028600' : '0'
  }));
  return { year: 2026, month: 11, currency: 'VND', jars };
}
