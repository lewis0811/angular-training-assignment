import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiFailure } from '../../shared/api-error';
import { MonthlyPeriod, MonthlyPlanResponse } from '../../models/budget-plan.model';
import { BudgetPlanApiService } from '../../services/budget-plan-api.service';
import { AllocationSummary } from '../../shared/components/allocation-summary';
import { parseRoutePeriod } from '../../shared/utils/route-period';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
].map((label, index) => ({ label, value: index + 1 }));

@Component({
  selector: 'app-income-allocation-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AllocationSummary],
  templateUrl: './income-allocation.html',
  styleUrl: './income-allocation.css'
})
export class IncomeAllocationPage implements OnInit, OnDestroy {
  private readonly api = inject(BudgetPlanApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private routeSubscription?: Subscription;
  private requestSubscription?: Subscription;

  readonly months = MONTHS;
  readonly periodForm = new FormGroup({
    year: new FormControl(new Date().getFullYear(), {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(9999),
        control => Number.isInteger(control.value) ? null : { integer: true }]
    }),
    month: new FormControl(new Date().getMonth() + 1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(12)]
    })
  });

  period: MonthlyPeriod | null = null;
  plan: MonthlyPlanResponse | null = null;
  loading = true;
  error: ApiFailure | null = null;
  invalidRoute = false;

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.requestSubscription?.unsubscribe();
      const period = parseRoutePeriod(params.get('year'), params.get('month'));
      this.plan = null;
      this.error = null;
      this.period = period;
      this.invalidRoute = period === null;

      if (!period) {
        this.loading = false;
        this.changeDetector.markForCheck();
        return;
      }

      this.periodForm.setValue(period);
      this.load(period);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.requestSubscription?.unsubscribe();
  }

  selectPeriod(): void {
    this.periodForm.markAllAsTouched();
    if (this.periodForm.invalid) {
      return;
    }

    const { year, month } = this.periodForm.getRawValue();
    void this.router.navigate(['/monthly-plans', year, month]);
  }

  retry(): void {
    if (this.period) {
      this.load(this.period);
    }
  }

  private load(period: MonthlyPeriod): void {
    this.requestSubscription?.unsubscribe();
    this.loading = true;
    this.error = null;
    this.requestSubscription = this.api.getMonthlyPlan(period.year, period.month).subscribe({
      next: plan => {
        this.plan = plan;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: ApiFailure) => {
        this.error = error;
        this.loading = false;
        this.changeDetector.markForCheck();
      }
    });
  }
}
