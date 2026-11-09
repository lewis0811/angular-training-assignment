import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { BUDGET_PLAN_ENDPOINTS } from '../constants/api-endpoints';
import { CreateExpenseRequest, CreateExpenseResponse } from '../models/expense.model';
import { CreateMonthlyPlanRequest, DefaultJarsResponse, MonthlyPlanResponse } from '../models/budget-plan.model';
import { SpendingByJarsResponse } from '../models/spending.model';
import { mapApiError } from '../shared/utils/api-error.mapper';
import {
  validateCreateExpenseResponse,
  validateDefaultJarsResponse,
  validateMonthlyPlanResponse,
  validateSpendingByJarsResponse
} from '../shared/utils/api-response.validators';

@Injectable({ providedIn: 'root' })
export class BudgetPlanApiService {
  private readonly http = inject(HttpClient);

  getDefaultJars(): Observable<DefaultJarsResponse> {
    return this.request(this.http.get<unknown>(BUDGET_PLAN_ENDPOINTS.DEFAULT_JARS), validateDefaultJarsResponse);
  }

  createMonthlyPlan(request: CreateMonthlyPlanRequest): Observable<MonthlyPlanResponse> {
    return this.request(this.http.post<unknown>(BUDGET_PLAN_ENDPOINTS.PLANS, request), validateMonthlyPlanResponse);
  }

  getMonthlyPlan(year: number, month: number): Observable<MonthlyPlanResponse> {
    return this.request(this.http.get<unknown>(BUDGET_PLAN_ENDPOINTS.BY_PERIOD(year, month)), validateMonthlyPlanResponse);
  }

  createExpense(request: CreateExpenseRequest): Observable<CreateExpenseResponse> {
    return this.request(this.http.post<unknown>(BUDGET_PLAN_ENDPOINTS.EXPENSES, request), validateCreateExpenseResponse);
  }

  getSpendingByJars(year: number, month: number): Observable<SpendingByJarsResponse> {
    return this.request(this.http.get<unknown>(BUDGET_PLAN_ENDPOINTS.SPENDING_BY_JARS(year, month)),
      validateSpendingByJarsResponse);
  }

  private request<T>(request: Observable<unknown>, validate: (value: unknown) => T): Observable<T> {
    return request.pipe(
      map(validate),
      catchError((error: unknown) => throwError(() => mapApiError(error)))
    );
  }
}
