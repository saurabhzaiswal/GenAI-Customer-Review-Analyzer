import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { SentimentBadgeComponent } from './sentiment-badge.component';
import { AnalysisResponse } from '../models/analysis-response';

@Component({
  standalone: true,
  selector: 'app-review-card',
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.component.scss'],
  imports: [CommonModule, MatCardModule, MatDividerModule, SentimentBadgeComponent],
})
export class ReviewCardComponent {
  @Input() result?: AnalysisResponse;
}
