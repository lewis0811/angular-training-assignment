import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { JAR_TYPES, MonthlyPlanJar } from '../../models/budget-plan.model';
import { JarSpendingSummary } from '../../models/expense.model';
import { SelectedJarSummary } from './selected-jar-summary';

describe('SelectedJarSummary', () => {
  it('renders the selected jar before save', async () => {
    await TestBed.configureTestingModule({ imports: [SelectedJarSummary] }).compileComponents();
    const fixture = TestBed.createComponent(SelectedJarSummary);
    fixture.componentRef.setInput('jar', jar());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Food');
    expect(fixture.nativeElement.textContent).toContain('20% of monthly income');
    expect(fixture.nativeElement.textContent).toContain('1.000 VND');
  });

  it('renders server-returned spent and signed remaining values after save', async () => {
    await TestBed.configureTestingModule({ imports: [SelectedJarSummary] }).compileComponents();
    const fixture = TestBed.createComponent(SelectedJarSummary);
    fixture.componentRef.setInput('summary', summary());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1.250 VND');
    expect(fixture.nativeElement.textContent).toContain('-250 VND');
    expect(fixture.nativeElement.textContent).toContain('Expense saved');
    expect(fixture.nativeElement.querySelector('.negative')).not.toBeNull();
  });

  it('prompts the user when no jar is selected', async () => {
    await TestBed.configureTestingModule({ imports: [SelectedJarSummary] }).compileComponents();
    const fixture = TestBed.createComponent(SelectedJarSummary);
    fixture.componentRef.setInput('jar', null);
    fixture.componentRef.setInput('summary', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Choose a jar');
  });
});

function jar(): MonthlyPlanJar {
  return { jarType: 'food', name: 'Food', percentage: 20, budgetVnd: '1000' };
}

function summary(): JarSpendingSummary {
  return {
    jarType: JAR_TYPES[1],
    jarName: 'Food',
    percentage: 20,
    budgetVnd: '1000',
    spentVnd: '1250',
    remainingVnd: '-250'
  };
}
