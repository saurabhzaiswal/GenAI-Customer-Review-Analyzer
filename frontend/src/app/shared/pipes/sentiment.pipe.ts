import { Pipe, PipeTransform } from '@angular/core';
import { SentimentLabel } from '../types';

@Pipe({
  name: 'sentiment',
  standalone: true,
})
export class SentimentPipe implements PipeTransform {
  transform(value: SentimentLabel): string {
    switch (value) {
      case 'positive':
        return 'Positive';
      case 'negative':
        return 'Negative';
      default:
        return 'Neutral';
    }
  }
}
