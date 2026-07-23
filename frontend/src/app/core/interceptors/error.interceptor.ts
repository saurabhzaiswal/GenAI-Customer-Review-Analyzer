import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

function resolveErrorMessage(error: HttpErrorResponse, translate: TranslateService): string {
  if (error.status === 0) {
    return translate.instant('errors.network');
  }

  const message = error.error?.message ?? error.error?.detail;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (error.status === 401) return translate.instant('errors.unauthorized');
  if (error.status === 403) return translate.instant('errors.forbidden');
  if (error.status === 404) return translate.instant('errors.notFound');
  if (error.status === 422) return translate.instant('errors.validation');
  if (error.status >= 500) return translate.instant('errors.server');

  return translate.instant('errors.generic');
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // Resolve these only after a failed request. Eagerly injecting TranslateService
  // here creates a cycle while TranslateService itself loads its JSON dictionary.
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const snackBar = injector.get(MatSnackBar);
      const translate = injector.get(TranslateService);
      const message = resolveErrorMessage(error, translate);
      snackBar.open(message, translate.instant('common.close'), { duration: 5000, verticalPosition: 'top', panelClass: ['app-snackbar-error'] });
      return throwError(() => new Error(message));
    })
  );
};
