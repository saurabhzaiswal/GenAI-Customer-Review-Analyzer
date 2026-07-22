import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize } from 'rxjs';
import { LoadingService } from '@app/core/services/loading.service';
import { API_BASE_URL } from '@app/core/config/api.config';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Translation dictionaries, icons, analytics, and other static assets should
  // never keep the application API indicator alive.
  if (!req.url.startsWith(API_BASE_URL)) {
    return next(req);
  }

  return defer(() => {
    const requestToken = loadingService.start();
    try {
      return next(req).pipe(finalize(() => loadingService.stop(requestToken)));
    } catch (error) {
      loadingService.stop(requestToken);
      throw error;
    }
  });
};
