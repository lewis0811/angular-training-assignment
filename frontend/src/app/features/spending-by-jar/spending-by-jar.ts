import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiFailure } from '../../shared/api-error';
import { MonthlyPeriod } from '../../models/budget-plan.model';
import { SpendingByJar, SpendingByJarsResponse } from '../../models/spending.model';
import { BudgetPlanApiService } from '../../services/budget-plan-api.service';
import { VndFormatPipe } from '../../shared/pipes/vnd-format.pipe';
import { parseRoutePeriod } from '../../shared/utils/route-period';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Component({
  selector: 'app-spending-by-jar-page',
  standalone: true,
  imports: [RouterLink, VndFormatPipe],
  templateUrl: './spending-by-jar.html',
  styleUrl: './spending-by-jar.css'
})
export class SpendingByJarPage implements OnInit, OnDestroy {
  private readonly api = inject(BudgetPlanApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private routeSubscription?: Subscription;
  private requestSubscription?: Subscription;

  period: MonthlyPeriod | null = null;
  response: SpendingByJarsResponse | null = null;
  loading = true;
  invalidRoute = false;
  error: ApiFailure | null = null;

  get periodLabel(): string {
    return this.period ? `${MONTH_NAMES[this.period.month - 1]} ${this.period.year}` : '';
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.requestSubscription?.unsubscribe();
      this.period = parseRoutePeriod(params.get('year'), params.get('month'));
      this.response = null;
      this.error = null;
      this.invalidRoute = this.period === null;
      if (!this.period) {
        this.loading = false;
        this.changeDetector.markForCheck();
        return;
      }
      this.load(this.period);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.requestSubscription?.unsubscribe();
  }

  progressWidth(percentage: number): number {
    return Math.min(percentage, 100);
  }

  percentageLabel(percentage: number): string {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(percentage)}%`;
  }

  accessibleProgressLabel(jar: SpendingByJar): string {
    return `${jar.jarName}: ${jar.spentBudgetVnd} VND spent of ${jar.plannedBudgetVnd} VND planned, ${this.percentageLabel(jar.percentageUsed)} used`;
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
    this.requestSubscription = this.api.getSpendingByJars(period.year, period.month).subscribe({
      next: response => {
        this.response = response;
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
