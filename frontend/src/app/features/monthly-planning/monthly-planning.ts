import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiFailure } from '../../shared/api-error';
import { DefaultJar } from '../../models/budget-plan.model';
import { BudgetPlanApiService } from '../../services/budget-plan-api.service';
import { DefaultJarList } from '../../shared/components/default-jar-list';
import { formatGroupedVndInput, isPositiveDigitString, parseGroupedVndInput } from '../../shared/utils/money-input';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
].map((label, index) => ({ label, value: index + 1 }));

@Component({
  selector: 'app-monthly-planning-page',
  standalone: true,
  imports: [ReactiveFormsModule, DefaultJarList],
  templateUrl: './monthly-planning.html',
  styleUrl: './monthly-planning.css'
})
export class MonthlyPlanningPage implements OnInit {
  private readonly api = inject(BudgetPlanApiService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly months = MONTHS;
  readonly form = new FormGroup({
    year: new FormControl(new Date().getFullYear(), {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(9999),
        control => Number.isInteger(control.value) ? null : { integer: true }]
    }),
    month: new FormControl(new Date().getMonth() + 1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(12),
        control => Number.isInteger(control.value) ? null : { integer: true }]
    }),
    monthlyIncomeVnd: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, control => {
        const normalized = parseGroupedVndInput(String(control.value));
        return normalized && isPositiveDigitString(normalized) ? null : { positiveWholeVnd: true };
      }]
    })
  });

  jars: DefaultJar[] = [];
  loadingDefaults = true;
  saving = false;
  error: ApiFailure | null = null;
  loadError: ApiFailure | null = null;

  ngOnInit(): void {
    this.loadDefaults();
  }

  formatIncomeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatGroupedVndInput(input.value, input.selectionStart ?? input.value.length);
    if (!formatted) {
      return;
    }

    this.form.controls.monthlyIncomeVnd.setValue(formatted.value);
    input.value = formatted.value;
    queueMicrotask(() => input.setSelectionRange(formatted.selectionStart, formatted.selectionStart));
  }

  loadDefaults(): void {
    this.loadingDefaults = true;
    this.loadError = null;
    this.api.getDefaultJars().subscribe({
      next: response => {
        this.jars = response.jars;
        this.loadingDefaults = false;
        this.changeDetector.markForCheck();
      },
      error: (error: ApiFailure) => {
        this.loadError = error;
        this.loadingDefaults = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  submit(): void {
    if (this.saving || this.loadingDefaults || this.loadError) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error = null;
      return;
    }

    const formValue = this.form.getRawValue();
    const monthlyIncomeVnd = parseGroupedVndInput(formValue.monthlyIncomeVnd);
    if (!monthlyIncomeVnd || !isPositiveDigitString(monthlyIncomeVnd)) {
      this.form.controls.monthlyIncomeVnd.setErrors({ positiveWholeVnd: true });
      return;
    }

    this.saving = true;
    this.error = null;
    this.api.createMonthlyPlan({
      year: formValue.year,
      month: formValue.month,
      monthlyIncomeVnd
    }).subscribe({
      next: plan => {
        this.saving = false;
        this.changeDetector.markForCheck();
        void this.router.navigate(['/monthly-plans', plan.year, plan.month]);
      },
      error: (error: ApiFailure) => {
        this.error = error;
        this.saving = false;
        this.changeDetector.markForCheck();
      }
    });
  }

  retryDefaults(): void {
    this.loadDefaults();
  }
}
