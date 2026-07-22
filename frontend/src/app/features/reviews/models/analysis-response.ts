import { SentimentLabel } from '@app/shared/types';

export interface AnalysisResponse {
  review: string;
  label: SentimentLabel;
  score: number;
  theme: string;
  suggestion?: string | null;
  confidence?: number | null;
  hasError?: boolean;
}

export interface ReviewBatchSummary {
  totalReviews: number;
  averageScore: number;
  positivePercent: number;
  topTheme: string;
}
