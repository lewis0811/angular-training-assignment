import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, Subscription, merge, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { ApiFailure } from '../../shared/api-error';
import { JAR_TYPES, JarType, MonthlyPlanJar, MonthlyPlanResponse } from '../../models/budget-plan.model';
import { CreateExpenseResponse } from '../../models/expense.model';
import { BudgetPlanApiService } from '../../services/budget-plan-api.service';
import { ExpenseDetailsForm } from './expense-details-form';
import { ExpenseFormGroup } from './expense-form.model';
import { SelectedJarSummary } from './selected-jar-summary';
import { isPositiveDigitString, parseGroupedVndInput } from '../../shared/utils/money-input';
import { parseExpenseDatePeriod } from '../../shared/utils/route-period';

interface PlanLoadResult {
  date: string;
  plan: MonthlyPlanResponse | null;
  error: ApiFailure | null;
}

function todayAsLocalDate(): string {
  const today = new Date();
  return `${today.getFullYear().toString().padStart(4, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
}

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ExpenseDetailsForm, SelectedJarSummary],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css'
})
export class ExpensesPage implements OnInit, OnDestroy {
  private readonly api = inject(BudgetPlanApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly retryPlan$ = new Subject<void>();
  private planSubscription?: Subscription;
  private pendingQueryDate: string | null = null;
  private pendingQueryJar: JarType | null = null;

  readonly form: ExpenseFormGroup = new FormGroup({
    expenseDate: new FormControl(todayAsLocalDate(), {
      nonNullable: true,
      validators: [
        Validators.required,
        (control) => (parseExpenseDatePeriod(String(control.value)) ? null : { invalidDate: true })
      ]
    }),
    jarType: new FormControl<JarType | null>(null, Validators.required),
    amountVnd: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        (control) => {
          const normalized = parseGroupedVndInput(String(control.value));
          return normalized && isPositiveDigitString(normalized) ? null : { positiveWholeVnd: true };
        }
      ]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(500),
        (control) => (String(control.value).trim() ? null : { required: true })
      ]
    })
  });

  plan: MonthlyPlanResponse | null = null;
  loadingPlan = true;
  planError: ApiFailure | null = null;
  saving = false;
  submitError: ApiFailure | null = null;
  success: CreateExpenseResponse | null = null;

  get selectedJar(): MonthlyPlanJar | null {
    const jarType = this.form.controls.jarType.value;
    return this.plan?.jars.find((jar) => jar.jarType === jarType) ?? null;
  }

  ngOnInit(): void {
    const queryDate = this.route.snapshot.queryParamMap.get('expenseDate');
    const queryPeriod = queryDate ? parseExpenseDatePeriod(queryDate) : null;
    if (queryDate && queryPeriod) {
      this.pendingQueryDate = queryDate;
      this.form.controls.expenseDate.setValue(queryDate);
    } else if (!queryDate) {
      this.pendingQueryDate = this.form.controls.expenseDate.value;
    }

    const queryJar = this.route.snapshot.queryParamMap.get('jarType');
    const validQueryJar = JAR_TYPES.find((jarType) => jarType === queryJar);
    if (validQueryJar) {
      this.pendingQueryJar = validQueryJar;
    }

    const date$ = this.form.controls.expenseDate.valueChanges.pipe(
      startWith(this.form.controls.expenseDate.value),
      distinctUntilChanged()
    );
    const dateRefresh$ = merge(
      date$,
      this.retryPlan$.pipe(
        withLatestFrom(date$),
        map(([, date]) => date)
      )
    );

    this.planSubscription = dateRefresh$
      .pipe(
        switchMap((date) => {
          this.plan = null;
          this.planError = null;
          this.success = null;
          this.loadingPlan = true;

          const period = parseExpenseDatePeriod(date);
          if (!period) {
            return of<PlanLoadResult>({
              date,
              plan: null,
              error: {
                status: 400,
                code: 'INVALID_EXPENSE_DATE',
                message: 'Choose a valid expense date.',
                errors: [],
                retryable: false
              }
            });
          }

          return this.api.getMonthlyPlan(period.year, period.month).pipe(
            map((plan) => ({ date, plan, error: null })),
            catchError((error: ApiFailure) => of({ date, plan: null, error }))
          );
        })
      )
      .subscribe((result) => {
        this.plan = result.plan;
        this.planError = result.error;
        this.loadingPlan = false;

        if (result.plan) {
          const selected = this.form.controls.jarType.value;
          if (selected && !result.plan.jars.some((jar) => jar.jarType === selected)) {
            this.form.controls.jarType.setValue(null, { emitEvent: false });
          }

          if (
            this.pendingQueryDate === result.date &&
            this.pendingQueryJar &&
            result.plan.jars.some((jar) => jar.jarType === this.pendingQueryJar)
          ) {
            this.form.controls.jarType.setValue(this.pendingQueryJar, { emitEvent: false });
          }
          this.pendingQueryDate = null;
          this.pendingQueryJar = null;
        } else if (result.error?.status === 404) {
          this.form.controls.jarType.setValue(null, { emitEvent: false });
        }
        this.changeDetector.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.planSubscription?.unsubscribe();
  }

  retryPlan(): void {
    this.retryPlan$.next();
  }

  submit(): void {
    if (this.saving || this.loadingPlan || !this.plan) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.submitError = null;
      return;
    }

    const { expenseDate, jarType, amountVnd, description } = this.form.getRawValue();
    const period = parseExpenseDatePeriod(expenseDate);
    const normalizedAmount = parseGroupedVndInput(amountVnd);
    const validJar = this.plan.jars.some((jar) => jar.jarType === jarType);
    const periodMatchesPlan = period?.year === this.plan.year && period?.month === this.plan.month;
    if (!periodMatchesPlan || !jarType || !validJar || !normalizedAmount || !isPositiveDigitString(normalizedAmount)) {
      this.submitError = {
        status: 400,
        code: 'INVALID_EXPENSE',
        message: 'Check the date, jar, and positive whole-VND amount.',
        errors: [],
        retryable: false
      };
      return;
    }

    this.saving = true;
    this.submitError = null;
    this.success = null;
    this.api
      .createExpense({
        expenseDate,
        jarType,
        amountVnd: normalizedAmount,
        description: description.trim()
      })
      .subscribe({
        next: (response) => {
          this.success = response;
          this.saving = false;
          this.changeDetector.markForCheck();
        },
        error: (error: ApiFailure) => {
          this.submitError = error;
          this.saving = false;
          if (error.code === 'JAR_NOT_IN_MONTHLY_PLAN') {
            this.retryPlan();
          }
          this.changeDetector.markForCheck();
        }
      });
  }

  fieldErrors(): ApiFailure['errors'] {
    return this.submitError?.errors ?? [];
  }
}
