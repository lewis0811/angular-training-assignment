import { describe, expect, it } from 'vitest';
import { parseExpenseDatePeriod, parseRoutePeriod } from './route-period';

describe('parseRoutePeriod', () => {
  it('parses valid period parameters', () => {
    expect(parseRoutePeriod('2026', '11')).toEqual({ year: 2026, month: 11 });
  });

  it.each([
    [null, '1'],
    ['abc', '1'],
    ['0', '1'],
    ['10000', '1'],
    ['2026', '13'],
    ['2026.5', '2']
  ])('rejects invalid route parameters %s/%s', (year, month) => {
    expect(parseRoutePeriod(year, month)).toBeNull();
  });
});

describe('parseExpenseDatePeriod', () => {
  it('extracts year and month without converting the date through UTC', () => {
    expect(parseExpenseDatePeriod('2026-01-01')).toEqual({ year: 2026, month: 1 });
  });

  it.each(['2026-02-29', '2025-02-29', '2026-13-01', '2026-04-31', '2026-1-01'])(
    'rejects invalid calendar date %s',
    date => expect(parseExpenseDatePeriod(date)).toBeNull()
  );

  it('accepts leap day in a leap year', () => {
    expect(parseExpenseDatePeriod('2024-02-29')).toEqual({ year: 2024, month: 2 });
  });
});
