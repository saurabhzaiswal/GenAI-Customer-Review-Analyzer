import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/core/api/api.service';
import { AnalysisResponse } from '@app/features/reviews/models/analysis-response';
import { Feedback } from '@app/features/reviews/models/feedback';
import { ReviewRequest } from '@app/features/reviews/models/review-request';

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

  deleteFeedback(feedbackId: string): Observable<Feedback> {
    return this.apiService.delete<Feedback>(`/reviews/${feedbackId}`);
  }
}
