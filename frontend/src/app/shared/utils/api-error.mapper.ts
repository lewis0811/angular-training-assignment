import { HttpErrorResponse } from '@angular/common/http';
import { ApiFailure, DataIntegrityError } from '../api-error';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapFieldErrors(value: unknown): ApiFailure['errors'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item['field'] !== 'string' || typeof item['message'] !== 'string') {
      return [];
    }

    return [{
      field: item['field'],
      code: typeof item['code'] === 'string' ? item['code'] : 'INVALID_VALUE',
      message: item['message']
    }];
  });
}

export function mapApiError(error: unknown): ApiFailure {
  if (isRecord(error) && typeof error['status'] === 'number' && typeof error['code'] === 'string' &&
      typeof error['message'] === 'string' && Array.isArray(error['errors'])) {
    return {
      status: error['status'],
      code: error['code'],
      message: error['message'],
      errors: mapFieldErrors(error['errors']),
      retryable: error['retryable'] === true
    };
  }

  if (error instanceof DataIntegrityError) {
    return {
      status: 0,
      code: 'INVALID_RESPONSE',
      message: 'The server returned data in an unexpected format.',
      errors: [],
      retryable: true
    };
  }

  if (error instanceof HttpErrorResponse) {
    const body = isRecord(error.error) ? error.error : {};
    const status = error.status;
    const fallbackMessage = status === 404
      ? 'No monthly plan exists for this period.'
      : status === 409
        ? 'A monthly plan already exists for this period.'
        : status >= 500
          ? 'The service is temporarily unavailable. Try again.'
          : status === 0
            ? 'Could not connect to the service. Check the API and try again.'
            : 'The request could not be completed.';

    return {
      status,
      code: typeof body['code'] === 'string' ? body['code'] : `HTTP_${status}`,
      message: status === 0 || status >= 500
        ? fallbackMessage
        : typeof body['message'] === 'string' ? body['message'] : fallbackMessage,
      errors: mapFieldErrors(body['errors']),
      retryable: status === 0 || status >= 500
    };
  }

  return {
    status: 0,
    code: 'UNKNOWN_ERROR',
    message: 'The request could not be completed. Try again.',
    errors: [],
    retryable: true
  };
}
