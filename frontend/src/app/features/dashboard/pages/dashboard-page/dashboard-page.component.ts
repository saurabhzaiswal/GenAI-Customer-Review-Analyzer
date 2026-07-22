import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '@app/features/reviews/services/review.service';
import { AnalyticsChartsComponent } from '@app/features/dashboard/components/analytics-charts/analytics-charts.component';
import { ReviewHistoryComponent } from '@app/features/reviews/components/review-history/review-history.component';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  imports: [
    CommonModule,
    AnalyticsChartsComponent,
    ReviewHistoryComponent,
    EmptyStateComponent,
    MatIconModule,
    TranslatePipe,
  ],
})
export class DashboardPageComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);

  readonly savedFeedback = this.reviewService.savedFeedback;

  ngOnInit(): void {
    void this.reviewService.loadHistory();
  }

  protected async onDeleteFeedback(feedbackId: string): Promise<void> {
    await this.reviewService.deleteFeedback(feedbackId);
  }

  protected readonly statistics = computed(() => {
    const feedback = this.savedFeedback();
    const total = feedback.length;
    const aggregate = feedback.reduce(
      (acc, item) => {
        acc.sentimentCounts[item.label] += 1;
        acc.scoreTotal += item.score;
        acc.confidenceTotal += item.confidence ?? 0;
        acc.themeCounts[item.theme] = (acc.themeCounts[item.theme] ?? 0) + 1;
        return acc;
      },
      {
        sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
        scoreTotal: 0,
        confidenceTotal: 0,
        themeCounts: {} as Record<string, number>,
      },
    );

    const sortedThemes = Object.entries(aggregate.themeCounts).sort((a, b) => b[1] - a[1]);

    return {
      totalReviews: total,
      positivePercent: total ? Math.round((aggregate.sentimentCounts.positive / total) * 100) : 0,
      neutralPercent: total ? Math.round((aggregate.sentimentCounts.neutral / total) * 100) : 0,
      negativePercent: total ? Math.round((aggregate.sentimentCounts.negative / total) * 100) : 0,
      averageScore: total ? Number((aggregate.scoreTotal / total).toFixed(1)) : 0,
      averageConfidence: total
        ? Number((aggregate.confidenceTotal / total).toFixed(2))
        : 0,
      topTheme: sortedThemes[0]?.[0] ?? 'N/A',
      topThemes: sortedThemes.slice(0, 5),
      sentimentCounts: aggregate.sentimentCounts,
      themeCounts: aggregate.themeCounts,
    };
  });

  protected trackTheme(_: number, theme: [string, number]): string {
    return theme[0];
  }
}
