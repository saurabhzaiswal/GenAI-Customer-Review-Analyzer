import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly loading = signal(false);
  private readonly activeRequests = new Set<symbol>();

  start(): symbol {
    const requestToken = Symbol('http-request');
    this.activeRequests.add(requestToken);
    this.loading.set(true);
    return requestToken;
  }

  stop(requestToken: symbol): void {
    this.activeRequests.delete(requestToken);
    this.loading.set(this.activeRequests.size > 0);
  }
}
