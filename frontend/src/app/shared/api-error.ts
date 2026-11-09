export interface ApiFieldError {
  field: string;
  code: string;
  message: string;
}

export interface ApiFailure {
  status: number;
  code: string;
  message: string;
  errors: ApiFieldError[];
  retryable: boolean;
}

export class DataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataIntegrityError';
  }
}
