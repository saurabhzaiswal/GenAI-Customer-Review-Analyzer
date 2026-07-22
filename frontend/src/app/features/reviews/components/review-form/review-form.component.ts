import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { countReviewLines, reviewLinesValidator } from '../../../../shared/validators/review-lines.validator';

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
    TranslatePipe,
    MatSnackBarModule,
  ],
})
export class ReviewFormComponent {
  @Input() isSubmitting = false;
  @Output() analyze = new EventEmitter<string>();
  @Output() analyzeAndSave = new EventEmitter<string>();

  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

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

  protected async importReviews(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      let values: string[] = [];
      if (file.name.toLowerCase().endsWith('.csv')) {
        values = (await file.text()).split(/\r?\n/).flatMap((line) =>
          line.match(/("(?:[^"]|"")*"|[^,]+)/g)?.map((value) => value.replace(/^"|"$/g, '').replace(/""/g, '"')) ?? []
        );
      } else {
        const { Workbook } = await import('exceljs');
        const workbook = new Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        workbook.worksheets[0]?.eachRow((row) => row.eachCell((cell) => values.push(cell.text)));
      }
      const reviews = values
        .map((value) => value.trim())
        .filter((value) => value.length >= 3 && !/^(review|reviews|text|feedback)$/i.test(value));

      this.form.patchValue({ reviews: reviews.join('\n') });
      this.form.markAsDirty();
      this.snackBar.open(`${reviews.length} ${this.translate.instant(reviews.length === 1 ? 'reviews.importedOne' : 'reviews.importedMany')}`, this.translate.instant('common.close'), { duration: 3500 });
    } catch {
      this.snackBar.open(this.translate.instant('reviews.importError'), this.translate.instant('common.close'), { duration: 5000 });
    } finally {
      input.value = '';
    }
  }
}
