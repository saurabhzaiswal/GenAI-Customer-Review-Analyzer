import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  imports: [CommonModule],
})
export class EmptyStateComponent {
  @Input() title = 'Nothing to show yet';
  @Input() description = 'There is no content available at the moment.';
}
