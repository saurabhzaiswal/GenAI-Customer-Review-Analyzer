import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SentimentLabel } from '../../../shared/types';

@Component({
  standalone: true,
  selector: 'app-sentiment-badge',
  templateUrl: './sentiment-badge.component.html',
  styleUrls: ['./sentiment-badge.component.css'],
  imports: [CommonModule],
})
export class SentimentBadgeComponent {
  @Input() label: SentimentLabel = 'neutral';
  @Input() score = 0;

  get displayLabel(): string {
    return this.label.charAt(0).toUpperCase() + this.label.slice(1);
  }

  get badgeClass(): string {
    return `badge badge--${this.label}`;
  }
}
