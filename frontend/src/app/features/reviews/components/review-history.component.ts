import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { DayjsFormatPipe } from '../../../shared/pipes/dayjs-format.pipe';
import { SentimentBadgeComponent } from './sentiment-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { Feedback } from '../models/feedback';
import { SentimentLabel } from '../../../shared/types';

interface ReviewFilter {
  search: string;
  sentiment: SentimentLabel | 'all';
  theme: string;
  minScore: number;
}

@Component({
  standalone: true,
  selector: 'app-review-history',
  templateUrl: './review-history.component.html',
  styleUrls: ['./review-history.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    SentimentBadgeComponent,
    EmptyStateComponent,
    TruncatePipe,
    DayjsFormatPipe,
  ],
})
export class ReviewHistoryComponent implements AfterViewInit, OnChanges {
  @Input() savedReviews: Feedback[] = [];
  @Output() deleteFeedback = new EventEmitter<string>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  readonly displayedColumns = [
    'review',
    'sentiment',
    'score',
    'theme',
    'confidence',
    'created_at',
    'actions',
  ];
  readonly searchControl = new FormControl('');
  readonly sentimentControl = new FormControl<'all' | SentimentLabel>('all');
  readonly themeControl = new FormControl<string>('all');
  readonly scoreControl = new FormControl<number>(0);

  dataSource = new MatTableDataSource<Feedback>([]);
  availableThemes: string[] = [];

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator ?? null;
    this.dataSource.sort = this.sort ?? null;
    this.dataSource.filterPredicate = this.createFilterPredicate();
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['savedReviews']) {
      this.updateReviews();
    }
  }

  constructor(private readonly dialog: MatDialog) {}

  protected applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      search: this.searchControl.value?.trim().toLowerCase() ?? '',
      sentiment: this.sentimentControl.value ?? 'all',
      theme: this.themeControl.value ?? 'all',
      minScore: this.scoreControl.value ?? 0,
    });

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  protected confirmDelete(feedbackId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete review',
        message: 'Are you sure you want to delete this review from saved history?',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteFeedback.emit(feedbackId);
      }
    });
  }

  private updateReviews(): void {
    this.availableThemes = Array.from(
      new Set(this.savedReviews.map((item) => item.theme).filter((theme) => !!theme))
    ).sort();

    this.dataSource.data = [...this.savedReviews];
    this.applyFilters();
  }

  private createFilterPredicate(): (data: Feedback, filter: string) => boolean {
    return (data: Feedback, filter: string) => {
      const parsed: ReviewFilter = JSON.parse(filter);
      const searchText = parsed.search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        [data.review, data.theme, data.label]
          .filter(Boolean)
          .some((value) => value.toString().toLowerCase().includes(searchText));

      const matchesSentiment =
        parsed.sentiment === 'all' || data.label === parsed.sentiment;
      const matchesTheme = parsed.theme === 'all' || data.theme === parsed.theme;
      const matchesScore = data.score >= parsed.minScore;

      return matchesSearch && matchesSentiment && matchesTheme && matchesScore;
    };
  }
}
