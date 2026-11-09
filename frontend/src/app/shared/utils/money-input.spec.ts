import { describe, expect, it } from 'vitest';
import { formatGroupedVndInput, isPositiveDigitString, parseGroupedVndInput } from './money-input';

describe('parseGroupedVndInput', () => {
  it.each([
    ['1250000', '1250000'],
    ['1.250.000', '1250000'],
    ['1,250,000', '1250000'],
    [' 000 ', '000']
  ])('normalizes %s', (input, expected) => {
    expect(parseGroupedVndInput(input)).toBe(expected);
  });

  it.each(['1.25.000', '1,250.000', '1 250 000', '1abc', '-100', '1.000,00'])(
    'rejects invalid grouped input %s',
    input => expect(parseGroupedVndInput(input)).toBeNull()
  );
});

describe('isPositiveDigitString', () => {
  it('accepts digit strings containing a non-zero digit', () => {
    expect(isPositiveDigitString('0001')).toBe(true);
  });

  it('rejects zero and non-digit values', () => {
    expect(isPositiveDigitString('000')).toBe(false);
    expect(isPositiveDigitString('1,000')).toBe(false);
  });
});

describe('formatGroupedVndInput', () => {
  it('adds comma separators and keeps the caret at the end', () => {
    expect(formatGroupedVndInput('25000000', 8)).toEqual({
      value: '25,000,000',
      selectionStart: 10
    });
  });

  it('preserves the caret position while editing within the amount', () => {
    expect(formatGroupedVndInput('1250000', 3)).toEqual({
      value: '1,250,000',
      selectionStart: 4
    });
  });

  it('normalizes valid period-separated input to commas', () => {
    expect(formatGroupedVndInput('1.250.000', 9)).toEqual({
      value: '1,250,000',
      selectionStart: 9
    });
  });

  it('leaves invalid characters for validation instead of discarding them', () => {
    expect(formatGroupedVndInput('1,25x,000', 9)).toBeNull();
  });
});
