import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { SentimentBadgeComponent } from './sentiment-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { Feedback } from '../models/feedback';

@Component({
  standalone: true,
  selector: 'app-review-history',
  templateUrl: './review-history.component.html',
  styleUrls: ['./review-history.component.scss'],
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, SentimentBadgeComponent, EmptyStateComponent, TruncatePipe],
})
export class ReviewHistoryComponent {
  @Input() savedReviews: Feedback[] = [];
  @Output() deleteFeedback = new EventEmitter<string>();

  readonly displayedColumns = ['review', 'sentiment', 'score', 'theme', 'createdAt', 'actions'];
}
