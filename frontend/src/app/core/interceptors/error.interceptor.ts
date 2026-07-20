import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly snackBar = inject(MatSnackBar);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = error.error?.detail || error.error?.message || error.message || 'An unexpected error occurred.';

        this.snackBar.open(message, 'Close', {
          duration: 5000,
          verticalPosition: 'top',
        });

        return throwError(() => new Error(message));
      })
    );
  }
}
