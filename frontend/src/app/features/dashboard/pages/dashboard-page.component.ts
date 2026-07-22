import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../reviews/services/review.service';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { StatsCardComponent } from '../../../shared/components/stats-card.component';
import { AnalyticsChartsComponent } from '../components/analytics-charts.component';
import { ReviewHistoryComponent } from '../../reviews/components/review-history.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  imports: [
    CommonModule,
    PageHeaderComponent,
    StatsCardComponent,
    AnalyticsChartsComponent,
    ReviewHistoryComponent,
    EmptyStateComponent,
    MatCardModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
})
export class DashboardPageComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);

  readonly savedFeedback = this.reviewService.savedFeedback;
  readonly loading = this.reviewService.loading;

  ngOnInit(): void {
    void this.reviewService.loadHistory();
  }

  protected async onDeleteFeedback(feedbackId: string): Promise<void> {
    await this.reviewService.deleteFeedback(feedbackId);
  }

  protected get statistics() {
    const feedback = this.savedFeedback();
    const total = feedback.length;
    const sentimentCounts = {
      positive: feedback.filter((item) => item.label === 'positive').length,
      neutral: feedback.filter((item) => item.label === 'neutral').length,
      negative: feedback.filter((item) => item.label === 'negative').length,
    };

    const scores = feedback.map((item) => item.score);
    const confidences = feedback.map((item) => item.confidence ?? 0);

    const themeCounts = feedback.reduce<Record<string, number>>((acc, item) => {
      acc[item.theme] = (acc[item.theme] ?? 0) + 1;
      return acc;
    }, {});

    const sortedThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);

    return {
      totalReviews: total,
      positivePercent: total ? Math.round((sentimentCounts.positive / total) * 100) : 0,
      neutralPercent: total ? Math.round((sentimentCounts.neutral / total) * 100) : 0,
      negativePercent: total ? Math.round((sentimentCounts.negative / total) * 100) : 0,
      averageScore: total ? Number((scores.reduce((sum, value) => sum + value, 0) / total).toFixed(1)) : 0,
      averageConfidence: total
        ? Number((confidences.reduce((sum, value) => sum + value, 0) / total).toFixed(2))
        : 0,
      topTheme: sortedThemes[0]?.[0] ?? 'N/A',
      topThemes: sortedThemes.slice(0, 5),
      sentimentCounts,
      themeCounts,
    };
  }
}
