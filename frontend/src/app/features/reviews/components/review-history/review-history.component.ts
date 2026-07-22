import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { jsPDF as JsPdfDocument } from 'jspdf';
import { TruncatePipe } from '@app/shared/pipes/truncate.pipe';
import { DayjsFormatPipe } from '@app/shared/pipes/dayjs-format.pipe';
import { SentimentBadgeComponent } from '@app/features/reviews/components/sentiment-badge/sentiment-badge.component';
import { ConfirmDialogComponent } from '@app/shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '@app/shared/components/empty-state/empty-state.component';
import { Feedback } from '@app/features/reviews/models/feedback';
import { SentimentLabel } from '@app/shared/types';
import { ReviewDetailsDialogComponent } from '@app/features/reviews/components/review-details-dialog/review-details-dialog.component';

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
    MatMenuModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    SentimentBadgeComponent,
    EmptyStateComponent,
    TruncatePipe,
    DayjsFormatPipe,
    MatSnackBarModule,
    TranslatePipe,
  ],
})
export class ReviewHistoryComponent implements OnChanges {
  private static readonly pdfFontData = new Map<string, Promise<string>>();
  @Input() savedReviews: Feedback[] = [];
  @Output() deleteFeedback = new EventEmitter<string>();

  private paginator?: MatPaginator;
  private sort?: MatSort;

  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator | undefined) {
    this.paginator = paginator;
    this.dataSource.paginator = paginator ?? null;
  }

  @ViewChild(MatSort) set matSort(sort: MatSort | undefined) {
    this.sort = sort;
    this.dataSource.sort = sort ?? null;
  }

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

  constructor(private readonly dialog: MatDialog, private readonly snackBar: MatSnackBar, private readonly translate: TranslateService) {
    this.dataSource.filterPredicate = this.createFilterPredicate();
    this.dataSource.sortingDataAccessor = (item, property) => {
      if (property === 'created_at') return new Date(item.created_at).getTime();
      const value = item[property as keyof Feedback];
      return typeof value === 'string' ? value.toLowerCase() : (value ?? '');
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['savedReviews']) {
      this.updateReviews();
    }
  }

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
        title: this.translate.instant('history.deleteTitle'),
        message: this.translate.instant('history.deleteMessage'),
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteFeedback.emit(feedbackId);
      }
    });
  }

  protected viewReview(review: Feedback): void {
    this.dialog.open(ReviewDetailsDialogComponent, {
      data: review,
      width: 'min(680px, calc(100vw - 32px))',
      maxWidth: '680px',
      autoFocus: false,
    });
  }

  protected get mobilePageReviews(): Feedback[] {
    const pageSize = this.paginator?.pageSize || 5;
    const pageIndex = this.paginator?.pageIndex || 0;
    const start = pageIndex * pageSize;
    return this.dataSource.filteredData.slice(start, start + pageSize);
  }

  protected async exportExcel(): Promise<void> {
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Review report');
    sheet.columns = [
      { header: 'Review', key: 'review', width: 60 }, { header: 'Sentiment', key: 'sentiment', width: 14 },
      { header: 'Score', key: 'score', width: 10 }, { header: 'Theme', key: 'theme', width: 20 },
      { header: 'Suggestion', key: 'suggestion', width: 60 }, { header: 'Confidence', key: 'confidence', width: 14 },
      { header: 'Created', key: 'created', width: 24 },
    ];
    sheet.addRows(this.dataSource.filteredData.map((item) => ({
      review: item.review, sentiment: item.label, score: item.score, theme: item.theme,
      suggestion: item.suggestion ?? '', confidence: item.confidence ?? 0, created: item.created_at,
    })));
    const blob = new Blob([await workbook.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadBlob(blob, `customer-review-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    this.snackBar.open(this.translate.instant('history.excelExported'), this.translate.instant('common.close'), { duration: 3000 });
  }

  protected async exportPdf(): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const document = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const reviews = this.dataSource.filteredData;
    const logo = await this.loadLogoDataUrl();
    const locale = this.translate.currentLang() || 'en';
    let fontFamily = 'helvetica';
    try {
      fontFamily = await this.loadPdfFont(document, locale);
    } catch {
      this.snackBar.open(this.translate.instant('report.fontLoadError'), this.translate.instant('common.close'), { duration: 5000 });
      return;
    }
    const colors = {
      navy: [30, 64, 175] as [number, number, number], blue: [37, 99, 235] as [number, number, number],
      cyan: [14, 165, 233] as [number, number, number], ink: [15, 23, 42] as [number, number, number],
      muted: [100, 116, 139] as [number, number, number], line: [219, 228, 241] as [number, number, number],
      soft: [239, 246, 255] as [number, number, number], white: [255, 255, 255] as [number, number, number],
      green: [22, 163, 74] as [number, number, number], amber: [217, 119, 6] as [number, number, number], red: [185, 28, 28] as [number, number, number],
    };
    const sentiment = { positive: 0, neutral: 0, negative: 0 };
    const themes = new Map<string, number>();
    let totalScore = 0;
    reviews.forEach((review) => {
      sentiment[review.label] += 1;
      totalScore += review.score;
      themes.set(review.theme || '—', (themes.get(review.theme || '—') ?? 0) + 1);
    });
    const topThemes = [...themes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const t = (key: string): string => this.translate.instant(key);
    const generated = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

    const header = (subtitle: string): number => {
      document.setFillColor(...colors.navy); document.rect(0, 0, 210, 42, 'F');
      document.setFillColor(...colors.blue); document.triangle(96, 0, 210, 0, 210, 42, 'F');
      document.setFillColor(...colors.cyan); document.triangle(166, 0, 210, 0, 210, 42, 'F');
      if (logo) document.addImage(logo, 'PNG', 14, 9, 22, 22);
      document.setTextColor(...colors.white); document.setFont(fontFamily, 'bold'); document.setFontSize(18);
      document.text('GenAI Customer Review Analyzer', 42, 17);
      document.setFont(fontFamily, 'normal'); document.setFontSize(9); document.text(subtitle, 42, 25);
      document.setFontSize(8); document.text(`${t('report.generated')} ${generated}`, 42, 31);
      return 52;
    };
    const metric = (x: number, y: number, width: number, label: string, value: string): void => {
      document.setFillColor(...colors.soft); document.setDrawColor(...colors.line); document.roundedRect(x, y, width, 24, 3, 3, 'FD');
      document.setTextColor(...colors.muted); document.setFont(fontFamily, 'bold'); document.setFontSize(7); document.text(label.toUpperCase(), x + 5, y + 7);
      document.setTextColor(...colors.ink); document.setFontSize(16); document.text(value, x + 5, y + 18);
    };
    const sectionTitle = (title: string, y: number): number => {
      document.setTextColor(...colors.blue); document.setFont(fontFamily, 'bold'); document.setFontSize(8); document.text(t('dashboard.eyebrow').toUpperCase(), 14, y);
      document.setTextColor(...colors.ink); document.setFontSize(15); document.text(title, 14, y + 8);
      return y + 15;
    };

    let y = header(t('report.subtitle'));
    metric(14, y, 42, t('dashboard.reviewsAnalyzed'), String(reviews.length));
    metric(60, y, 42, t('dashboard.averageScore'), reviews.length ? `${(totalScore / reviews.length).toFixed(1)}/5` : '0/5');
    metric(106, y, 42, t('history.positive'), `${reviews.length ? Math.round((sentiment.positive / reviews.length) * 100) : 0}%`);
    metric(152, y, 44, t('reviews.topTheme'), topThemes[0]?.[0] ?? '—');
    y = sectionTitle(t('report.atAGlance'), y + 36);
    const sentimentRows: Array<[string, number, [number, number, number]]> = [
      [t('history.positive'), sentiment.positive, colors.green], [t('history.neutral'), sentiment.neutral, colors.amber], [t('history.negative'), sentiment.negative, colors.red],
    ];
    sentimentRows.forEach(([label, count, color], index) => {
      const rowY = y + index * 10; const ratio = reviews.length ? count / reviews.length : 0;
      document.setTextColor(...colors.ink); document.setFontSize(9); document.setFont(fontFamily, 'bold'); document.text(label, 14, rowY + 4);
      document.setFillColor(...colors.line); document.roundedRect(42, rowY, 112, 5, 2.5, 2.5, 'F');
      if (ratio) { document.setFillColor(...color); document.roundedRect(42, rowY, Math.max(3, 112 * ratio), 5, 2.5, 2.5, 'F'); }
      document.setTextColor(...colors.muted); document.setFont(fontFamily, 'normal'); document.text(`${count} (${Math.round(ratio * 100)}%)`, 160, rowY + 4);
    });
    y = sectionTitle(t('dashboard.talkAbout'), y + 40);
    topThemes.forEach(([theme, count], index) => {
      document.setDrawColor(...colors.line); document.line(14, y + 7, 196, y + 7);
      document.setTextColor(...colors.blue); document.setFont(fontFamily, 'bold'); document.setFontSize(9); document.text(String(index + 1).padStart(2, '0'), 14, y + 4);
      document.setTextColor(...colors.ink); document.text(theme, 27, y + 4);
      document.setTextColor(...colors.muted); document.setFont(fontFamily, 'normal'); document.text(`${count} ${t(count === 1 ? 'dashboard.mention' : 'dashboard.mentions')}`, 196, y + 4, { align: 'right' });
      y += 10;
    });

    document.addPage(); y = header(`${reviews.length} ${t(reviews.length === 1 ? 'charts.review' : 'charts.reviews')}`);
    y = sectionTitle(t('report.reviewDetails'), y);
    reviews.forEach((item, index) => {
      const reviewLines = document.splitTextToSize(item.review, 166) as string[];
      const suggestionLines = document.splitTextToSize(item.suggestion || t('reviews.noSuggestion'), 160) as string[];
      const chunks = Array.from({ length: Math.max(1, Math.ceil(reviewLines.length / 38)) }, (_, chunkIndex) => reviewLines.slice(chunkIndex * 38, (chunkIndex + 1) * 38));
      chunks.forEach((chunk, chunkIndex) => {
        const isLastChunk = chunkIndex === chunks.length - 1;
        const cardHeight = Math.max(32, 22 + chunk.length * 4.2 + (isLastChunk ? 8 + suggestionLines.length * 4.2 : 0));
        if (y + cardHeight > 278) { document.addPage(); y = header(t('report.reviewDetails')); }
        document.setFillColor(255, 255, 255); document.setDrawColor(...colors.line); document.roundedRect(14, y, 182, cardHeight, 3, 3, 'FD');
        const badgeColor = item.label === 'positive' ? colors.green : item.label === 'negative' ? colors.red : colors.amber;
        document.setFillColor(...badgeColor); document.roundedRect(20, y + 6, 30, 7, 3, 3, 'F');
        document.setTextColor(...colors.white); document.setFont(fontFamily, 'bold'); document.setFontSize(7); document.text(t(`history.${item.label}`).toUpperCase(), 35, y + 10.7, { align: 'center' });
        document.setTextColor(...colors.muted); document.setFont(fontFamily, 'normal');
        const continuation = chunkIndex ? `  |  ${chunkIndex + 1}/${chunks.length}` : '';
        document.text(`#${index + 1}  |  ${item.theme || '—'}  |  ${item.score}/5  |  ${Math.round((item.confidence ?? 0) * 100)}% ${t('history.confidence')}${continuation}`, 55, y + 10.7);
        document.setTextColor(...colors.ink); document.setFontSize(9); document.text(chunk, 20, y + 21);
        if (isLastChunk) {
          const suggestionY = y + 23 + chunk.length * 4.2;
          document.setTextColor(...colors.blue); document.setFont(fontFamily, 'bold'); document.setFontSize(7); document.text(t('report.recommendedAction').toUpperCase(), 20, suggestionY);
          document.setTextColor(...colors.muted); document.setFont(fontFamily, 'normal'); document.setFontSize(8); document.text(suggestionLines, 20, suggestionY + 5);
        }
        y += cardHeight + 6;
      });
    });
    const pages = document.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      document.setPage(page); document.setDrawColor(...colors.line); document.line(14, 287, 196, 287);
      document.setTextColor(...colors.muted); document.setFontSize(7); document.text('GenAI Customer Review Analyzer', 14, 292);
      document.text(`${page} / ${pages}`, 196, 292, { align: 'right' });
    }
    document.save(`customer-review-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    this.snackBar.open(this.translate.instant('history.pdfExported'), this.translate.instant('common.close'), { duration: 3000 });
  }

  private async loadPdfFont(document: JsPdfDocument, locale: string): Promise<string> {
    const fonts: Partial<Record<string, { file: string; family: string }>> = {
      hi: { file: 'NotoSansDevanagari.ttf', family: 'NotoSansDevanagari' },
      ja: { file: 'NotoSansJP.ttf', family: 'NotoSansJP' },
      ko: { file: 'NotoSansKR.ttf', family: 'NotoSansKR' },
    };
    const font = fonts[locale];
    if (!font) return 'helvetica';

    let fontData = ReviewHistoryComponent.pdfFontData.get(font.file);
    if (!fontData) {
      fontData = fetch(`/fonts/${font.file}`).then(async (response) => {
        if (!response.ok) throw new Error(`Unable to load PDF font: ${font.file}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
        }
        return btoa(binary);
      });
      ReviewHistoryComponent.pdfFontData.set(font.file, fontData);
    }
    document.addFileToVFS(font.file, await fontData);
    document.addFont(font.file, font.family, 'normal');
    document.addFont(font.file, font.family, 'bold');
    return font.family;
  }

  private async loadLogoDataUrl(): Promise<string | null> {
    try {
      const svg = await (await fetch('/img/logo.svg')).text();
      const image = new Image();
      const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(); image.src = source; });
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
      canvas.getContext('2d')?.drawImage(image, 0, 0, 256, 256); URL.revokeObjectURL(source);
      return canvas.toDataURL('image/png');
    } catch { return null; }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private updateReviews(): void {
    this.availableThemes = Array.from(
      new Set(this.savedReviews.map((item) => item.theme).filter((theme) => !!theme))
    ).sort();

    this.dataSource.data = [...this.savedReviews];
    this.applyFilters();
  }

  private createFilterPredicate(): (data: Feedback, filter: string) => boolean {
    let previousFilter = '';
    let parsed: ReviewFilter = { search: '', sentiment: 'all', theme: 'all', minScore: 0 };

    return (data: Feedback, filter: string) => {
      if (filter !== previousFilter) {
        parsed = JSON.parse(filter) as ReviewFilter;
        previousFilter = filter;
      }
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

  protected trackFeedback(_: number, item: Feedback): string {
    return item.id;
  }

  protected trackTheme(_: number, theme: string): string {
    return theme;
  }
}
