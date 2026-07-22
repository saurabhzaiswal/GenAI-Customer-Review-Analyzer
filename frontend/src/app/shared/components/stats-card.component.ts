import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.scss'],
  imports: [CommonModule, MatCardModule, MatIconModule],
})
export class StatsCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() description = '';
  @Input() highlight = false;
  @Input() icon = 'insights';
  @Input() tone: 'blue' | 'green' | 'amber' | 'rose' | 'cyan' = 'blue';
}
