import { MonthlyPeriod } from '../../models/budget-plan.model';

export function parseRoutePeriod(yearValue: string | null, monthValue: string | null): MonthlyPeriod | null {
  if (!yearValue || !monthValue || !/^\d+$/.test(yearValue) || !/^\d+$/.test(monthValue)) {
    return null;
  }

  const year = Number(yearValue);
  const month = Number(monthValue);
  return Number.isInteger(year) && year >= 1 && year <= 9999 &&
    Number.isInteger(month) && month >= 1 && month <= 12
    ? { year, month }
    : null;
}

export function parseExpenseDatePeriod(value: string): MonthlyPeriod | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return null;
  }

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1] ? { year, month } : null;
}
