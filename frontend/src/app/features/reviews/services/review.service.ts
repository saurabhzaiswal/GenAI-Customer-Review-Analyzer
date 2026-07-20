import { Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ReviewApiService } from '../../../core/services/review-api.service';
import { AnalysisResponse } from '../models/analysis-response';
import { Feedback } from '../models/feedback';
import { ReviewRequest } from '../models/review-request';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  readonly analysisResults = signal<AnalysisResponse[]>([]);
  readonly savedFeedback = signal<Feedback[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly reviewApiService: ReviewApiService) {}

  async analyze(reviewsText: string): Promise<void> {
    const reviews = this.prepareReviewLines(reviewsText);

    if (!reviews.length) {
      this.error.set('Please enter at least one customer review.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const results: AnalysisResponse[] = [];

      for (const review of reviews) {
        const request: ReviewRequest = { text: review };
        const response = await lastValueFrom(this.reviewApiService.analyzeReview(request));
        results.push(response);
      }

      this.analysisResults.set([...results, ...this.analysisResults()]);
    } catch (error) {
      this.error.set(this.parseError(error));
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async analyzeAndSave(reviewsText: string): Promise<void> {
    const reviews = this.prepareReviewLines(reviewsText);

    if (!reviews.length) {
      this.error.set('Please enter at least one customer review.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const saved: Feedback[] = [];
      const analysis: AnalysisResponse[] = [];

      for (const review of reviews) {
        const request: ReviewRequest = { text: review };
        const feedback = await lastValueFrom(this.reviewApiService.analyzeReviewAndSave(request));
        saved.push(feedback);

        analysis.push({
          label: feedback.label,
          score: feedback.score,
          theme: feedback.theme,
          suggestion: feedback.suggestion,
          confidence: feedback.confidence,
        });
      }

      this.savedFeedback.set([...saved, ...this.savedFeedback()]);
      this.analysisResults.set([...analysis, ...this.analysisResults()]);
    } catch (error) {
      this.error.set(this.parseError(error));
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async loadHistory(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const history = await lastValueFrom(this.reviewApiService.getHistory());
      this.savedFeedback.set(history);
    } catch (error) {
      this.error.set(this.parseError(error));
    } finally {
      this.loading.set(false);
    }
  }

  async deleteFeedback(feedbackId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await lastValueFrom(this.reviewApiService.deleteFeedback(feedbackId));
      this.savedFeedback.update((items) => items.filter((item) => item.id !== feedbackId));
    } catch (error) {
      this.error.set(this.parseError(error));
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  private prepareReviewLines(reviewsText: string): string[] {
    return reviewsText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  private parseError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unable to complete the request. Please try again later.';
  }
}
