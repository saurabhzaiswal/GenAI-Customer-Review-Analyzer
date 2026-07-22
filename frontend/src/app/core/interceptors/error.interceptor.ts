import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

function resolveErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Unable to reach the server. Please make sure the API is running, then try again.';
  }

  const message = error.error?.message ?? error.error?.detail;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (error.status === 401) return 'Your session has expired. Please sign in again.';
  if (error.status === 403) return 'You do not have permission to complete this action.';
  if (error.status === 404) return 'We could not find the requested item.';
  if (error.status === 422) return 'Please check the information you entered and try again.';
  if (error.status >= 500) return 'The server could not complete your request. Please try again shortly.';

  return 'We could not complete your request. Please try again.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = resolveErrorMessage(error);
      snackBar.open(message, 'Close', { duration: 5000, verticalPosition: 'top', panelClass: ['app-snackbar-error'] });
      return throwError(() => new Error(message));
    })
  );
};
