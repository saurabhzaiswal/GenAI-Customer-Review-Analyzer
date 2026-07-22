import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  ChartOptions,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Feedback } from '../../../reviews/models/feedback';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip
);

@Component({
  standalone: true,
  selector: 'app-analytics-charts',
  templateUrl: './analytics-charts.component.html',
  styleUrls: ['./analytics-charts.component.scss'],
  imports: [CommonModule, MatCardModule, TranslatePipe],
})
export class AnalyticsChartsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() reviews: Feedback[] = [];

  @ViewChild('sentimentCanvas', { static: false }) sentimentCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('themeCanvas', { static: false }) themeCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendCanvas', { static: false }) trendCanvas?: ElementRef<HTMLCanvasElement>;

  private sentimentChart?: Chart<'doughnut'>;
  private themeChart?: Chart<'bar'>;
  private trendChart?: Chart<'line'>;

  private viewInitialized = false;
  private readonly translate = inject(TranslateService);
  private readonly languageChange = this.translate.onLangChange.subscribe(() => {
    if (this.viewInitialized) requestAnimationFrame(() => this.renderCharts());
  });

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    requestAnimationFrame(() => this.renderCharts());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewInitialized && changes['reviews']) {
      requestAnimationFrame(() => this.renderCharts());
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.languageChange.unsubscribe();
  }

  private renderCharts(): void {
    this.destroyCharts();

    if (!this.reviews.length) {
      return;
    }

    this.createSentimentChart();
    this.createThemeChart();
    this.createTrendChart();
  }

  private createSentimentChart(): void {
    if (!this.sentimentCanvas) {
      return;
    }

    const sentimentCounts = this.reviews.reduce(
      (acc, review) => {
        acc[review.label] = (acc[review.label] ?? 0) + 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 } as { positive: number; neutral: number; negative: number }
    );

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['history.positive', 'history.neutral', 'history.negative'].map((key) => this.translate.instant(key)),
        datasets: [
          {
            data: [sentimentCounts.positive, sentimentCounts.neutral, sentimentCounts.negative],
            backgroundColor: [this.themeColor('--success-color'), this.themeColor('--neutral-color'), this.themeColor('--danger-color')],
            borderColor: this.themeColor('--inverse-color'),
            borderWidth: 5,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 18, color: this.themeColor('--text-muted'), font: { family: 'Inter', size: 12, weight: 600 } },
          },
          tooltip: {
            backgroundColor: this.themeColor('--surface'), titleColor: this.themeColor('--text-color'), bodyColor: this.themeColor('--text-muted'),
            borderColor: this.themeColor('--border-strong'), borderWidth: 1, cornerRadius: 10, padding: 12, caretPadding: 8,
            displayColors: true, usePointStyle: true, boxPadding: 6,
            titleFont: { family: 'Inter', size: 13, weight: 700 }, bodyFont: { family: 'Inter', size: 12, weight: 600 },
            callbacks: { label: (context) => {
              const value = Number(context.raw ?? 0);
              const total = (context.dataset.data as number[]).reduce((sum, item) => sum + Number(item), 0);
              const percentage = total ? Math.round((value / total) * 100) : 0;
              return ` ${context.label}: ${value} ${this.translate.instant(value === 1 ? 'charts.review' : 'charts.reviews')} (${percentage}%)`;
            } },
          },
        },
        cutout: '68%',
      } as ChartOptions<'doughnut'>,
    };

    this.sentimentChart = new Chart(this.sentimentCanvas.nativeElement, config);
  }

  private createThemeChart(): void {
    if (!this.themeCanvas) {
      return;
    }

    const themeCounts = this.reviews.reduce<Record<string, number>>((acc, review) => {
      acc[review.theme] = (acc[review.theme] ?? 0) + 1;
      return acc;
    }, {});

    const themes = Object.keys(themeCounts);
    const counts = Object.values(themeCounts);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: themes,
        datasets: [
          {
            label: this.translate.instant('charts.themes'),
            data: counts,
            backgroundColor: this.themeColor('--primary-color'),
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: this.themeColor('--surface'), titleColor: this.themeColor('--text-color'), bodyColor: this.themeColor('--text-muted'),
            borderColor: this.themeColor('--border-strong'), borderWidth: 1, cornerRadius: 10, padding: 12, caretPadding: 8, displayColors: false,
            titleFont: { family: 'Inter', size: 13, weight: 700 }, bodyFont: { family: 'Inter', size: 12, weight: 600 },
            callbacks: { label: (context) => `${context.parsed.y} ${this.translate.instant(context.parsed.y === 1 ? 'charts.review' : 'charts.reviews')}` },
          },
        },
        scales: {
          x: {
            ticks: { color: this.themeColor('--text-muted'), font: { family: 'Inter', weight: 600 } },
            grid: { display: false },
          },
          y: {
            ticks: { color: this.themeColor('--text-muted'), precision: 0, font: { family: 'Inter' } },
            grid: { color: this.themeColor('--border') },
            beginAtZero: true,
          },
        },
      } as ChartOptions<'bar'>,
    };

    this.themeChart = new Chart(this.themeCanvas.nativeElement, config);
  }

  private createTrendChart(): void {
    if (!this.trendCanvas) {
      return;
    }

    const groupedByDate = this.reviews.reduce<Record<string, number>>((acc, review) => {
      const date = new Date(review.created_at).toLocaleDateString();
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const counts = labels.map((label) => groupedByDate[label]);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: this.translate.instant('charts.trend'),
            data: counts,
            borderColor: this.themeColor('--primary-color'),
            backgroundColor: this.themeColor('--primary-color-alpha'),
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: this.themeColor('--primary-color'),
            pointBorderColor: this.themeColor('--inverse-color'),
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: this.themeColor('--surface'), titleColor: this.themeColor('--text-color'), bodyColor: this.themeColor('--text-muted'),
            borderColor: this.themeColor('--border-strong'), borderWidth: 1, cornerRadius: 10, padding: 12, caretPadding: 8, displayColors: false,
            titleFont: { family: 'Inter', size: 13, weight: 700 }, bodyFont: { family: 'Inter', size: 12, weight: 600 },
            callbacks: { label: (context) => `${context.parsed.y} ${this.translate.instant(context.parsed.y === 1 ? 'charts.review' : 'charts.reviews')}` },
          },
        },
        scales: {
          x: {
            ticks: { color: this.themeColor('--text-muted'), font: { family: 'Inter', weight: 600 } },
            grid: { display: false },
          },
          y: {
            ticks: { color: this.themeColor('--text-muted'), precision: 0, font: { family: 'Inter' } },
            grid: { color: this.themeColor('--border') },
            beginAtZero: true,
          },
        },
      } as ChartOptions<'line'>,
    };

    this.trendChart = new Chart(this.trendCanvas.nativeElement, config);
  }

  private destroyCharts(): void {
    this.sentimentChart?.destroy();
    this.themeChart?.destroy();
    this.trendChart?.destroy();
  }

  private themeColor(token: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  }
}
