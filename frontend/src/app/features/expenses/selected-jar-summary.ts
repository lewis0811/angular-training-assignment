import { Component, input } from '@angular/core';
import { MonthlyPlanJar } from '../../models/budget-plan.model';
import { JarSpendingSummary } from '../../models/expense.model';
import { VndFormatPipe } from '../../shared/pipes/vnd-format.pipe';

@Component({
  selector: 'app-selected-jar-summary',
  standalone: true,
  imports: [VndFormatPipe],
  template: `
    <aside class="summary-card" aria-labelledby="selected-jar-heading">
      <p class="eyebrow">Your allocation</p>
      <h2 id="selected-jar-heading">Selected jar</h2>
      @if (summary()) {
        <div class="jar-icon" aria-hidden="true">{{ summary()!.jarName.charAt(0) }}</div>
        <strong class="jar-name">{{ summary()!.jarName }}</strong>
        <span class="rate">{{ summary()!.percentage }}% of monthly income</span>
        <dl class="money-summary">
          <div><dt>Jar budget</dt><dd>{{ summary()!.budgetVnd | vndFormat }} <small>VND</small></dd></div>
          <div><dt>Spent</dt><dd>{{ summary()!.spentVnd | vndFormat }} <small>VND</small></dd></div>
          <div><dt>Remaining</dt><dd [class.negative]="summary()!.remainingVnd.startsWith('-')">
            {{ summary()!.remainingVnd | vndFormat }} <small>VND</small>
          </dd></div>
        </dl>
        <p class="success-note" role="status">Expense saved. Totals are from the server.</p>
      } @else if (jar()) {
        <div class="jar-icon" aria-hidden="true">{{ jar()!.name.charAt(0) }}</div>
        <strong class="jar-name">{{ jar()!.name }}</strong>
        <span class="rate">{{ jar()!.percentage }}% of monthly income</span>
        <div class="budget-hint">
          <span>Planned budget</span>
          <strong>{{ jar()!.budgetVnd | vndFormat }} <small>VND</small></strong>
        </div>
        <p class="helper">This jar belongs to the plan for the selected expense date.</p>
      } @else {
        <div class="empty-icon" aria-hidden="true">＋</div>
        <strong class="jar-name">Choose a jar</strong>
        <p class="helper">Your selected jar and budget will appear here.</p>
      }
    </aside>
  `,
  styles: [`
    .summary-card { position: sticky; top: 24px; padding: 24px; border: 1px solid #e7ebe4; border-radius: 22px; background: #f9fbf7; }
    .eyebrow { margin: 0 0 5px; color: #66836d; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h2 { margin: 0 0 22px; color: #253e32; font-size: 20px; letter-spacing: -.03em; }
    .jar-icon, .empty-icon { display: grid; width: 58px; height: 58px; place-items: center; border-radius: 18px; background: #e6f0df; color: #3f774c; font-size: 23px; font-weight: 900; }
    .empty-icon { background: #edf0ea; color: #89978d; }
    .jar-name { display: block; margin-top: 15px; color: #294338; font-size: 18px; }
    .rate { display: block; margin-top: 5px; color: #6e8073; font-size: 12px; }
    .budget-hint { display: flex; flex-direction: column; gap: 6px; padding: 16px 0; margin-top: 18px; border-top: 1px solid #e2e8de; color: #718076; font-size: 12px; }
    .budget-hint strong { color: #2a4737; font-size: 17px; }
    small { color: #7d8b81; font-size: 10px; }
    .helper { color: #7b8b7f; font-size: 12px; line-height: 1.6; }
    .money-summary { display: grid; gap: 0; margin: 22px 0 0; border-top: 1px solid #e2e8de; }
    .money-summary div { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid #e2e8de; }
    dt { color: #6d7f72; font-size: 12px; }
    dd { margin: 0; color: #2a4737; font-size: 12px; font-weight: 800; text-align: right; }
    dd.negative { color: #b44736; }
    .success-note { padding: 11px; margin: 16px 0 0; border-radius: 10px; background: #e8f4e5; color: #326844; font-size: 11px; line-height: 1.5; }
    @media (max-width: 760px) { .summary-card { position: static; } }
  `]
})
export class SelectedJarSummary {
  readonly jar = input<MonthlyPlanJar | null>(null);
  readonly summary = input<JarSpendingSummary | null>(null);
}
