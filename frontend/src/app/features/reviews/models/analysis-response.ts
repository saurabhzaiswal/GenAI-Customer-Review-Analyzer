import { SentimentLabel } from '../../../shared/types';

export interface AnalysisResponse {
  label: SentimentLabel;
  score: number;
  theme: string;
  suggestion?: string | null;
  confidence?: number | null;
}
