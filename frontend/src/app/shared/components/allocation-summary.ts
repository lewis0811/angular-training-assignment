import { Component, input } from '@angular/core';
import { MonthlyPlanResponse } from '../../models/budget-plan.model';
import { VndFormatPipe } from '../pipes/vnd-format.pipe';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Component({
  selector: 'app-allocation-summary',
  standalone: true,
  imports: [VndFormatPipe],
  template: `
    <section class="summary-card" aria-label="Monthly income">
      <div>
        <p class="eyebrow">Total monthly income</p>
        <p class="income">{{ plan().monthlyIncomeVnd | vndFormat }} <span>VND</span></p>
      </div>
      <p class="period">{{ monthName(plan().month) }} {{ plan().year }}</p>
    </section>
    <section class="allocation-section" aria-labelledby="allocation-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Your plan</p>
          <h2 id="allocation-heading">Income allocation</h2>
        </div>
        <span class="total-pill">100% allocated</span>
      </div>
      <ul class="allocations">
        @for (jar of plan().jars; track jar.jarType) {
          <li class="allocation-row">
            <span class="jar-mark" aria-hidden="true">{{ jar.name.charAt(0) }}</span>
            <span class="jar-name">{{ jar.name }}</span>
            <span class="jar-rate">{{ jar.percentage }}%</span>
            <strong class="jar-budget">{{ jar.budgetVnd | vndFormat }} <small>VND</small></strong>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [`
    .summary-card { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px 30px; border-radius: 22px; background: #244b3a; color: #fff; }
    .eyebrow { margin: 0 0 7px; color: #92a99b; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .income { margin: 0; font-size: clamp(26px, 4vw, 38px); font-weight: 800; letter-spacing: -.04em; }
    .income span { color: #b7c8bc; font-size: 13px; font-weight: 700; letter-spacing: .04em; }
    .period { margin: 0; color: #d6e5d9; font-size: 15px; font-weight: 700; }
    .allocation-section { margin-top: 30px; }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 15px; }
    .section-heading h2 { margin: 0; color: #233b30; font-size: 23px; letter-spacing: -.03em; }
    .total-pill { padding: 8px 12px; border-radius: 999px; background: #e7f2e3; color: #306b47; font-size: 12px; font-weight: 800; white-space: nowrap; }
    .allocations { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
    .allocation-row { display: grid; grid-template-columns: 42px minmax(160px, 1fr) 55px minmax(125px, auto); align-items: center; gap: 12px; padding: 14px 18px; border: 1px solid #e8ece5; border-radius: 15px; background: #fff; }
    .jar-mark { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; background: #f0f5eb; color: #4b7f55; font-weight: 800; }
    .jar-name { color: #34473d; font-size: 14px; font-weight: 700; }
    .jar-rate { color: #718076; font-size: 13px; font-weight: 700; }
    .jar-budget { color: #263d32; font-size: 15px; text-align: right; white-space: nowrap; }
    .jar-budget small { color: #7d8b81; font-size: 10px; }
    @media (max-width: 600px) {
      .summary-card { align-items: flex-start; flex-direction: column; padding: 22px; }
      .allocation-row { grid-template-columns: 38px minmax(0, 1fr) auto; gap: 10px; padding: 12px; }
      .jar-budget { grid-column: 2 / -1; text-align: left; }
      .jar-rate { justify-self: end; }
    }
  `]
})
export class AllocationSummary {
  readonly plan = input.required<MonthlyPlanResponse>();

  monthName(month: number): string {
    return MONTH_NAMES[month - 1] ?? '';
  }
}
