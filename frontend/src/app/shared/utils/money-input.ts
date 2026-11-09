const GROUPED_VND_PATTERN = /^(\d{1,3})([.,])\d{3}(?:\2\d{3})+$/;

export interface FormattedVndInput {
  value: string;
  selectionStart: number;
}

export function parseGroupedVndInput(value: string): string | null {
  const input = value.trim();
  if (/^\d+$/.test(input)) {
    return input;
  }

  if (!GROUPED_VND_PATTERN.test(input)) {
    return null;
  }

  return input.replace(/[.,]/g, '');
}

export function formatGroupedVndInput(value: string, selectionStart: number): FormattedVndInput | null {
  let digits: string;
  if (/^\d[\d,]*$/.test(value)) {
    digits = value.replace(/,/g, '');
  } else {
    const normalized = parseGroupedVndInput(value);
    if (!normalized) {
      return null;
    }
    digits = normalized;
  }

  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (selectionStart >= value.length) {
    return { value: formatted, selectionStart: formatted.length };
  }

  const digitsBeforeCaret = value.slice(0, selectionStart).replace(/\D/g, '').length;
  let formattedCaret = 0;
  let formattedDigits = 0;
  while (formattedCaret < formatted.length && formattedDigits < digitsBeforeCaret) {
    if (/\d/.test(formatted[formattedCaret])) {
      formattedDigits++;
    }
    formattedCaret++;
  }

  return { value: formatted, selectionStart: formattedCaret };
}

export function isPositiveDigitString(value: string): boolean {
  return /^\d+$/.test(value) && /[1-9]/.test(value);
}
