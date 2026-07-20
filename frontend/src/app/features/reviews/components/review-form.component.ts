import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';

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
    reviews: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
  });

  protected get reviewsControl() {
    return this.form.get('reviews');
  }

  protected submitReview(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const reviews = (this.reviewsControl?.value ?? '').trim();
    this.analyze.emit(reviews);
  }

  protected submitReviewAndSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const reviews = (this.reviewsControl?.value ?? '').trim();
    this.analyzeAndSave.emit(reviews);
  }
}
