import { describe, expect, it } from 'vitest';
import { VndFormatPipe } from './vnd-format.pipe';

describe('VndFormatPipe', () => {
  const pipe = new VndFormatPipe();

  it('formats digit strings as whole VND', () => {
    expect(pipe.transform('1250000')).toBe('1.250.000');
  });

  it('formats large and negative values without floating-point conversion', () => {
    expect(pipe.transform('900719925474099312345')).toBe('900.719.925.474.099.312.345');
    expect(pipe.transform('-1250000')).toBe('-1.250.000');
  });

  it('leaves invalid input visible and handles empty values', () => {
    expect(pipe.transform('12x')).toBe('12x');
    expect(pipe.transform(null)).toBe('');
  });
});
