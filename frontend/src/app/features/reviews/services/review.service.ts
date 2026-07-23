import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ReviewApiService } from '@app/core/services/review-api.service';
import { AnalysisResponse, ReviewBatchSummary } from '@app/features/reviews/models/analysis-response';
import { Feedback } from '@app/features/reviews/models/feedback';
import { ReviewRequest } from '@app/features/reviews/models/review-request';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private static readonly batchConcurrency = 3;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private historyLoaded = false;
  private historyRequest?: Promise<void>;
  readonly analysisResults = signal<AnalysisResponse[]>([]);
  readonly savedFeedback = signal<Feedback[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly batchSummary = computed<ReviewBatchSummary>(() => {
    const results = this.analysisResults().filter((item) => !item.hasError);
    const total = results.length;

    if (!total) {
      return {
        totalReviews: 0,
        averageScore: 0,
        positivePercent: 0,
        topTheme: 'N/A',
      };
    }

    const positiveCount = results.filter((item) => item.label === 'positive').length;
    const themeCounts = results.reduce<Record<string, number>>((acc, item) => {
      acc[item.theme] = (acc[item.theme] ?? 0) + 1;
      return acc;
    }, {});

    const topTheme =
      Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    return {
      totalReviews: total,
      averageScore: Number(
        (results.reduce((sum, item) => sum + item.score, 0) / total).toFixed(1)
      ),
      positivePercent: Math.round((positiveCount / total) * 100),
      topTheme,
    };
  });

  constructor(private readonly reviewApiService: ReviewApiService) {}

  async analyze(reviewsText: string): Promise<void> {
    const reviews = this.prepareReviewLines(reviewsText);

    if (!reviews.length) {
      this.error.set('Please paste at least one review.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const results = await this.processBatch(reviews);
      this.analysisResults.set([...results, ...this.analysisResults()]);
    } finally {
      this.loading.set(false);
    }
  }

  async analyzeAndSave(reviewsText: string): Promise<void> {
    const reviews = this.prepareReviewLines(reviewsText);

    if (!reviews.length) {
      this.error.set('Please paste at least one review.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const { analysis, saved } = await this.processBatchWithSave(reviews);
      this.analysisResults.set([...analysis, ...this.analysisResults()]);
      this.savedFeedback.set([...saved, ...this.savedFeedback()]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadHistory(force = false): Promise<void> {
    if (!this.isBrowser) return;
    if (!force && this.historyLoaded) return;
    if (this.historyRequest) return this.historyRequest;

    this.historyRequest = this.fetchHistory();
    try {
      await this.historyRequest;
    } finally {
      this.historyRequest = undefined;
    }
  }

  private async fetchHistory(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const history = await lastValueFrom(this.reviewApiService.getHistory());
      this.savedFeedback.set(history);
      this.historyLoaded = true;
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

  clearSessionResults(): void {
    this.analysisResults.set([]);
    this.error.set(null);
  }

  private async processBatch(reviews: string[]): Promise<AnalysisResponse[]> {
    return this.mapWithConcurrency(reviews, async (review) => {
      try {
        const request: ReviewRequest = { text: review };
        const response = await lastValueFrom(this.reviewApiService.analyzeReview(request));

        return {
          review,
          label: response.label,
          score: response.score,
          theme: response.theme,
          suggestion: response.suggestion,
          confidence: response.confidence,
        };
      } catch {
        return {
          review,
          label: 'neutral' as const,
          score: 0,
          theme: 'Error',
          suggestion: 'This review could not be analyzed. Please try again.',
          confidence: 0,
          hasError: true,
        };
      }
    });
  }

  private async processBatchWithSave(reviews: string[]): Promise<{
    analysis: AnalysisResponse[];
    saved: Feedback[];
  }> {
    const results = await this.mapWithConcurrency(reviews, async (review) => {
      try {
        const request: ReviewRequest = { text: review };
        const feedback = await lastValueFrom(this.reviewApiService.analyzeReviewAndSave(request));

        return {
          feedback,
          analysis: {
            review: feedback.review,
            label: feedback.label,
            score: feedback.score,
            theme: feedback.theme,
            suggestion: feedback.suggestion,
            confidence: feedback.confidence,
          } satisfies AnalysisResponse,
        };
      } catch {
        return {
          analysis: {
            review,
            label: 'neutral' as const,
            score: 0,
            theme: 'Error',
            suggestion: 'This review could not be saved. Please try again.',
            confidence: 0,
            hasError: true,
          },
        };
      }
    });

    return {
      analysis: results.map(({ analysis }) => analysis),
      saved: results.flatMap(({ feedback }) => feedback ? [feedback] : []),
    };
  }

  private async mapWithConcurrency<T, R>(
    items: readonly T[],
    worker: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    const run = async (): Promise<void> => {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        results[index] = await worker(items[index]);
      }
    };
    const workers = Array.from(
      { length: Math.min(ReviewService.batchConcurrency, items.length) },
      () => run(),
    );
    await Promise.all(workers);
    return results;
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
