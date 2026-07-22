import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  it('stays active until every tracked request token finishes', () => {
    const service = TestBed.inject(LoadingService);
    const first = service.start();
    const second = service.start();

    service.stop(first);
    expect(service.loading()).toBe(true);

    service.stop(second);
    expect(service.loading()).toBe(false);
  });

  it('ignores duplicate completion for the same request', () => {
    const service = TestBed.inject(LoadingService);
    const request = service.start();
    service.stop(request);
    service.stop(request);

    expect(service.loading()).toBe(false);
  });
});
