import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

function resolveErrorMessage(error: HttpErrorResponse): string {
  const detail = error.error?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => (typeof item?.msg === 'string' ? item.msg : JSON.stringify(item)))
      .join(', ');
  }

  if (typeof error.error?.message === 'string' && error.error.message.trim()) {
    return error.error.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = resolveErrorMessage(error);

      snackBar.open(message, 'Close', {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: ['app-snackbar-error'],
      });

      return throwError(() => new Error(message));
    })
  );
};
