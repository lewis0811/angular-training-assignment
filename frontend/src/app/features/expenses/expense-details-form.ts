import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ApiFieldError } from '../../shared/api-error';
import { MonthlyPlanJar } from '../../models/budget-plan.model';
import { formatGroupedVndInput } from '../../shared/utils/money-input';
import { ExpenseFormGroup } from './expense-form.model';

@Component({
  selector: 'app-expense-details-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel" aria-labelledby="expense-details-heading">
      <div class="panel-heading">
        <span class="step-badge">01</span>
        <div><p class="eyebrow">Transaction details</p><h2 id="expense-details-heading">Expense details</h2></div>
      </div>
      <form [formGroup]="form()" (ngSubmit)="save.emit()" novalidate>
        <fieldset [disabled]="saving() || loading() || jars().length === 0">
          <legend class="sr-only">Expense details</legend>
          <label for="expenseDate">Expense date <b aria-hidden="true">*</b></label>
          <input id="expenseDate" type="date" formControlName="expenseDate"
            [attr.aria-invalid]="form().controls.expenseDate.touched && form().controls.expenseDate.invalid"
            aria-describedby="expense-date-error">
          @if (form().controls.expenseDate.touched && form().controls.expenseDate.invalid) {
            <small id="expense-date-error" class="field-error">Choose a valid date.</small>
          }

          <label for="expenseJar">Jar <b aria-hidden="true">*</b></label>
          <select id="expenseJar" formControlName="jarType" aria-describedby="jar-error">
            <option [ngValue]="null">Select a jar</option>
            @for (jar of jars(); track jar.jarType) {
              <option [ngValue]="jar.jarType">{{ jar.name }} · {{ jar.percentage }}%</option>
            }
          </select>
          @if (form().controls.jarType.touched && form().controls.jarType.invalid) {
            <small id="jar-error" class="field-error">Choose a jar from this month's plan.</small>
          }
          @for (error of fieldErrorsFor('jarType'); track error.code) {
            <small class="field-error">{{ error.message }}</small>
          }

          <label for="expenseAmount">Amount <b aria-hidden="true">*</b></label>
          <div class="money-input">
            <input id="expenseAmount" type="text" inputmode="numeric" autocomplete="off"
              formControlName="amountVnd" placeholder="e.g. 1,250,000"
              (input)="formatAmountInput($event)"
              [attr.aria-invalid]="form().controls.amountVnd.touched && form().controls.amountVnd.invalid"
              aria-describedby="amount-hint amount-error">
            <span>VND</span>
          </div>
          <small id="amount-hint" class="field-hint">Enter a positive whole-VND amount. Thousands separators are added automatically.</small>
          @if (form().controls.amountVnd.touched && form().controls.amountVnd.invalid) {
            <small id="amount-error" class="field-error">Enter a positive amount using digits and valid thousands separators.</small>
          }
          @for (error of fieldErrorsFor('amountVnd'); track error.code) {
            <small class="field-error">{{ error.message }}</small>
          }

          <label for="expenseDescription">Description <b aria-hidden="true">*</b></label>
          <textarea id="expenseDescription" rows="3" maxlength="500" formControlName="description"
            placeholder="What was this expense for?"
            [attr.aria-invalid]="form().controls.description.touched && form().controls.description.invalid"
            aria-describedby="description-error"></textarea>
          @if (form().controls.description.touched && form().controls.description.invalid) {
            <small id="description-error" class="field-error">Enter a description (up to 500 characters).</small>
          }
          @for (error of fieldErrorsFor('description'); track error.code) {
            <small class="field-error">{{ error.message }}</small>
          }
        </fieldset>

        @if (loading()) {
          <p class="field-hint" role="status">Loading jars for this date…</p>
        }
        @if (formError()) {
          <div class="notice error" role="alert">{{ formError() }}</div>
        }
        <button class="button primary" type="submit" [disabled]="saving() || loading() || jars().length === 0">
          {{ saving() ? 'Saving expense…' : 'Save expense' }}
          @if (!saving()) { <span aria-hidden="true">→</span> }
        </button>
      </form>
    </section>
  `,
  styles: [`
    .panel { padding: 24px; border: 1px solid #e7ebe4; border-radius: 22px; background: #fff; box-shadow: 0 12px 32px rgb(34 61 46 / 4%); }
    .panel-heading { display: flex; align-items: center; gap: 13px; margin-bottom: 20px; }
    .step-badge { display: grid; width: 42px; height: 42px; flex: 0 0 42px; place-items: center; border-radius: 14px; background: #eaf3e5; color: #3a714b; font-size: 13px; font-weight: 900; }
    .eyebrow { margin: 0 0 4px; color: #66836d; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h2 { margin: 0; color: #253e32; font-size: 20px; letter-spacing: -.03em; }
    form, fieldset { display: grid; gap: 9px; }
    fieldset { padding: 0; margin: 0; border: 0; }
    label { margin-top: 8px; color: #354b3f; font-size: 13px; font-weight: 700; }
    label b { color: #c24e37; }
    input, select, textarea { width: 100%; min-height: 46px; padding: 10px 12px; border: 1px solid #dfe5dc; border-radius: 12px; outline: none; background: #fff; color: #293d32; font: inherit; }
    textarea { min-height: 90px; resize: vertical; }
    input:focus, select:focus, textarea:focus { border-color: #6f9b72; box-shadow: 0 0 0 3px #dff0dc; }
    [aria-invalid="true"] { border-color: #c85b49; }
    .money-input { position: relative; }
    .money-input input { padding-right: 58px; font-size: 16px; font-weight: 700; }
    .money-input > span { position: absolute; top: 50%; right: 14px; color: #7c8a7f; font-size: 11px; font-weight: 800; transform: translateY(-50%); }
    .field-hint { color: #819087; font-size: 11px; }
    .field-error { color: #b44736; font-size: 12px; font-weight: 600; }
    .button { display: flex; width: 100%; min-height: 50px; align-items: center; justify-content: center; gap: 10px; margin-top: 12px; padding: 0 17px; border: 0; border-radius: 12px; background: #32734b; color: #fff; cursor: pointer; font: inherit; font-size: 13px; font-weight: 800; }
    .button:disabled { cursor: not-allowed; opacity: .55; }
    .notice { padding: 11px 13px; border-radius: 11px; }
    .notice.error { background: #fff1ed; color: #9c4635; font-size: 13px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; clip-path: inset(50%); }
  `]
})
export class ExpenseDetailsForm {
  readonly form = input.required<ExpenseFormGroup>();
  readonly jars = input.required<MonthlyPlanJar[]>();
  readonly saving = input(false);
  readonly loading = input(false);
  readonly fieldErrors = input<ApiFieldError[]>([]);
  readonly formError = input<string | null>(null);
  readonly save = output<void>();

  formatAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatGroupedVndInput(input.value, input.selectionStart ?? input.value.length);
    if (!formatted) {
      return;
    }

    this.form().controls.amountVnd.setValue(formatted.value);
    input.value = formatted.value;
    queueMicrotask(() => input.setSelectionRange(formatted.selectionStart, formatted.selectionStart));
  }

  fieldErrorsFor(field: string): ApiFieldError[] {
    return this.fieldErrors().filter(error => error.field === field);
  }
}
