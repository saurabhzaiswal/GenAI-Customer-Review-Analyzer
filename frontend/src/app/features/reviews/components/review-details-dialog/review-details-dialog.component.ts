import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DayjsFormatPipe } from '@app/shared/pipes/dayjs-format.pipe';
import { Feedback } from '@app/features/reviews/models/feedback';
import { SentimentBadgeComponent } from '@app/features/reviews/components/sentiment-badge/sentiment-badge.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-review-details-dialog',
  templateUrl: './review-details-dialog.component.html',
  styleUrls: ['./review-details-dialog.component.scss'],
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, DayjsFormatPipe, SentimentBadgeComponent, TranslatePipe],
})
export class ReviewDetailsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly review: Feedback,
    private readonly dialogRef: MatDialogRef<ReviewDetailsDialogComponent>
  ) {}

  protected close(): void { this.dialogRef.close(); }
}
