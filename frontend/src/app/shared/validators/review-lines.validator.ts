import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const MAX_LINE_LENGTH = 5000;
const MIN_LINE_LENGTH = 3;

export function reviewLinesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;

    if (typeof rawValue !== 'string' || !rawValue.trim()) {
      return { required: true };
    }

    const lines = rawValue
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!lines.length) {
      return { required: true };
    }

    if (lines.some((line) => line.length < MIN_LINE_LENGTH)) {
      return { lineTooShort: { minLength: MIN_LINE_LENGTH } };
    }

    if (lines.some((line) => line.length > MAX_LINE_LENGTH)) {
      return { lineTooLong: { maxLength: MAX_LINE_LENGTH } };
    }

    return null;
  };
}

export function countReviewLines(value: string): number {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}
