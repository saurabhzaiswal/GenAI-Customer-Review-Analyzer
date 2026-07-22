import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { SentimentLabel } from '@app/shared/types';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-sentiment-badge',
  templateUrl: './sentiment-badge.component.html',
  styleUrls: ['./sentiment-badge.component.scss'],
  imports: [CommonModule, MatChipsModule, TranslatePipe],
})
export class SentimentBadgeComponent {
  @Input() label: SentimentLabel = 'neutral';
  @Input() score = 0;

  get displayLabel(): string {
    return this.label.charAt(0).toUpperCase() + this.label.slice(1);
  }

  get chipClass(): string {
    return `sentiment-chip sentiment-chip--${this.label}`;
  }
}
