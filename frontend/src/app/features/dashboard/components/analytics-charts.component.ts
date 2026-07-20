import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import { Feedback } from '../../reviews/models/feedback';

Chart.register(...registerables);

@Component({
  standalone: true,
  selector: 'app-analytics-charts',
  templateUrl: './analytics-charts.component.html',
  styleUrls: ['./analytics-charts.component.scss'],
  imports: [CommonModule, MatCardModule],
})
export class AnalyticsChartsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() reviews: Feedback[] = [];

  @ViewChild('sentimentCanvas', { static: false }) sentimentCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('themeCanvas', { static: false }) themeCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendCanvas', { static: false }) trendCanvas?: ElementRef<HTMLCanvasElement>;

  private sentimentChart?: Chart<'pie'>;
  private themeChart?: Chart<'bar'>;
  private trendChart?: Chart<'line'>;

  private viewInitialized = false;

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.renderCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewInitialized && changes['reviews']) {
      this.renderCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
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

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [
          {
            data: [sentimentCounts.positive, sentimentCounts.neutral, sentimentCounts.negative],
            backgroundColor: ['#16a34a', '#64748b', '#dc2626'],
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      } as ChartOptions<'pie'>,
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
            label: 'Review Themes',
            data: counts,
            backgroundColor: '#2563eb',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: { color: '#0f172a' },
          },
          y: {
            ticks: { color: '#0f172a' },
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
            label: 'Reviews Over Time',
            data: counts,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#0284c7',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: { color: '#0f172a' },
          },
          y: {
            ticks: { color: '#0f172a' },
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
}
