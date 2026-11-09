import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { JAR_TYPES, MonthlyPlanResponse } from '../../models/budget-plan.model';
import { AllocationSummary } from './allocation-summary';

describe('AllocationSummary', () => {
  it('renders backend income and seven allocations in returned order', async () => {
    await TestBed.configureTestingModule({ imports: [AllocationSummary] }).compileComponents();
    const fixture = TestBed.createComponent(AllocationSummary);
    fixture.componentRef.setInput('plan', planResponse());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1.250.000');
    expect(fixture.nativeElement.querySelectorAll('.allocation-row')).toHaveLength(7);
    expect(fixture.nativeElement.textContent.indexOf('livingExpenses'))
      .toBeLessThan(fixture.nativeElement.textContent.indexOf('food'));
    expect(fixture.componentInstance.monthName(11)).toBe('November');
    expect(fixture.componentInstance.monthName(13)).toBe('');
  });
});

function planResponse(): MonthlyPlanResponse {
  return {
    id: 1,
    year: 2026,
    month: 11,
    monthlyIncomeVnd: '1250000',
    currency: 'VND',
    createdAtUtc: '2026-11-01T00:00:00Z',
    jars: JAR_TYPES.map((jarType, index) => ({
      jarType,
      name: jarType,
      percentage: [35, 20, 10, 10, 10, 10, 5][index]!,
      budgetVnd: '1000'
    }))
  };
}
