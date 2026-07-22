import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewFormComponent } from '@app/features/reviews/components/review-form/review-form.component';
import { ReviewHistoryComponent } from '@app/features/reviews/components/review-history/review-history.component';
import { ReviewCardComponent } from '@app/features/reviews/components/review-card/review-card.component';
import { PageHeaderComponent } from '@app/shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { StatsCardComponent } from '@app/shared/components/stats-card/stats-card.component';
import { ReviewService } from '@app/features/reviews/services/review.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

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
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
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
