import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';
import { countReviewLines, reviewLinesValidator } from '../../../shared/validators/review-lines.validator';

@Component({
  standalone: true,
  selector: 'app-review-form',
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AutofocusDirective,
  ],
})
export class ReviewFormComponent {
  @Input() isSubmitting = false;
  @Output() analyze = new EventEmitter<string>();
  @Output() analyzeAndSave = new EventEmitter<string>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    reviews: ['', [reviewLinesValidator()]],
  });

  protected get reviewsControl() {
    return this.form.get('reviews');
  }

  protected get reviewLineCount(): number {
    return countReviewLines(this.reviewsControl?.value ?? '');
  }

  protected submitReview(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.analyze.emit((this.reviewsControl?.value ?? '').trim());
  }

  protected submitReviewAndSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.analyzeAndSave.emit((this.reviewsControl?.value ?? '').trim());
  }
}
