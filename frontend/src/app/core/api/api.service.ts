import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  get<T>(endpoint: string): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.buildUrl(endpoint))
      .pipe(map((response) => this.unwrap(response)));
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.buildUrl(endpoint), body)
      .pipe(map((response) => this.unwrap(response)));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.buildUrl(endpoint))
      .pipe(map((response) => this.unwrap(response)));
  }

  private buildUrl(endpoint: string): string {
    return endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === null) {
      throw new Error(response.message || 'The request could not be completed. Please try again.');
    }

    return response.data;
  }
}
