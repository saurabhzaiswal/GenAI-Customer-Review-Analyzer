import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewFormComponent } from '../components/review-form.component';
import { ReviewHistoryComponent } from '../components/review-history.component';
import { ReviewCardComponent } from '../components/review-card.component';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { StatsCardComponent } from '../../../shared/components/stats-card.component';
import { ReviewService } from '../services/review.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-review-page',
  templateUrl: './review-page.component.html',
  styleUrls: ['./review-page.component.scss'],
  imports: [
    CommonModule,
    ReviewFormComponent,
    ReviewHistoryComponent,
    ReviewCardComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    StatsCardComponent,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class ReviewPageComponent {
  protected readonly reviewService = inject(ReviewService);

  constructor() {
    void this.reviewService.loadHistory();
  }

  protected onAnalyze(reviewsText: string): void {
    void this.reviewService.analyze(reviewsText);
  }

  protected onAnalyzeAndSave(reviewsText: string): void {
    void this.reviewService.analyzeAndSave(reviewsText);
  }

  protected onDeleteFeedback(feedbackId: string): void {
    void this.reviewService.deleteFeedback(feedbackId);
  }

  protected clearResults(): void {
    this.reviewService.clearSessionResults();
  }
}
