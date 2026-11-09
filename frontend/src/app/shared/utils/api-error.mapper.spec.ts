import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { DataIntegrityError } from '../api-error';
import { mapApiError } from './api-error.mapper';

describe('mapApiError', () => {
  it('maps API validation envelopes and field errors', () => {
    const result = mapApiError(new HttpErrorResponse({
      status: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input.',
        errors: [{ field: 'monthlyIncomeVnd', code: 'MUST_BE_POSITIVE', message: 'Must be positive.' }]
      }
    }));

    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.errors[0]?.field).toBe('monthlyIncomeVnd');
    expect(result.retryable).toBe(false);
  });

  it.each([
    [404, 'No monthly plan exists for this period.'],
    [409, 'A monthly plan already exists for this period.'],
    [500, 'The service is temporarily unavailable. Try again.'],
    [0, 'Could not connect to the service. Check the API and try again.']
  ])('maps HTTP %s when there is no server envelope', (status, message) => {
    const result = mapApiError(new HttpErrorResponse({ status }));
    expect(result.message).toBe(message);
    expect(result.retryable).toBe(status === 0 || status >= 500);
  });

  it('maps data-integrity and unknown errors safely', () => {
    expect(mapApiError(new DataIntegrityError('bad data')).code).toBe('INVALID_RESPONSE');
    expect(mapApiError(new Error('secret')).message).toContain('Try again');
  });
});
