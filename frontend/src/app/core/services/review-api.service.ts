import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AnalysisResponse } from '../../features/reviews/models/analysis-response';
import { Feedback } from '../../features/reviews/models/feedback';
import { ReviewRequest } from '../../features/reviews/models/review-request';

@Injectable({ providedIn: 'root' })
export class ReviewApiService {
  constructor(private readonly apiService: ApiService) {}

  analyzeReview(request: ReviewRequest): Observable<AnalysisResponse> {
    return this.apiService.post<AnalysisResponse>('/reviews/analyze', request);
  }

  analyzeReviewAndSave(request: ReviewRequest): Observable<Feedback> {
    return this.apiService.post<Feedback>('/reviews/analyze-and-save', request);
  }

  getHistory(): Observable<Feedback[]> {
    return this.apiService.get<Feedback[]>('/reviews/history');
  }

  deleteFeedback(feedbackId: string): Observable<void> {
    return this.apiService.delete<void>(`/reviews/${feedbackId}`);
  }
}
