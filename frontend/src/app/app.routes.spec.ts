import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';

describe('routes', () => {
  it('redirects the root and unknown routes to monthly planning', () => {
    expect(routes[0]).toMatchObject({ path: '', pathMatch: 'full', redirectTo: 'monthly-planning' });
    expect(routes.at(-1)).toMatchObject({ path: '**', redirectTo: 'monthly-planning' });
  });

  it('lazy-loads all four feature pages', async () => {
    expect(routes.map(route => route.path)).toEqual([
      '',
      'monthly-planning',
      'expenses/new',
      'monthly-plans/:year/:month/spending',
      'monthly-plans/:year/:month',
      '**'
    ]);
    expect(routes[1]?.loadComponent).toBeTypeOf('function');
    expect(routes[2]?.loadComponent).toBeTypeOf('function');
    expect(routes[3]?.loadComponent).toBeTypeOf('function');
    expect(routes[4]?.loadComponent).toBeTypeOf('function');
    const components = await Promise.all(routes
      .filter(route => typeof route.loadComponent === 'function')
      .map(route => route.loadComponent!()));
    expect(components).toHaveLength(4);
  });
});
