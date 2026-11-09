import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'monthly-planning' },
  {
    path: 'monthly-planning',
    loadComponent: () => import('./features/monthly-planning/monthly-planning').then(module => module.MonthlyPlanningPage)
  },
  {
    path: 'expenses/new',
    loadComponent: () => import('./features/expenses/expenses').then(module => module.ExpensesPage)
  },
  {
    path: 'monthly-plans/:year/:month/spending',
    loadComponent: () => import('./features/spending-by-jar/spending-by-jar').then(module => module.SpendingByJarPage)
  },
  {
    path: 'monthly-plans/:year/:month',
    loadComponent: () => import('./features/income-allocation/income-allocation').then(module => module.IncomeAllocationPage)
  },
  { path: '**', redirectTo: 'monthly-planning' }
];
