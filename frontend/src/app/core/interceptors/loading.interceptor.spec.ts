import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@app/core/config/api.config';
import { LoadingService } from '@app/core/services/loading.service';
import { loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loadingInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(LoadingService);
  });

  afterEach(() => controller.verify());

  it('does not show the global loader for translation assets', () => {
    http.get('/i18n/en.json').subscribe();
    expect(loading.loading()).toBe(false);
    controller.expectOne('/i18n/en.json').flush({});
    expect(loading.loading()).toBe(false);
  });

  it('tracks an API request until it completes', () => {
    const url = `${API_BASE_URL}/reviews/history`;
    http.get(url).subscribe();
    expect(loading.loading()).toBe(true);
    controller.expectOne(url).flush({ success: true, data: [] });
    expect(loading.loading()).toBe(false);
  });
});
