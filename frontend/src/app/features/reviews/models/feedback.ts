import { SentimentLabel } from '@app/shared/types';

export interface Feedback {
  id: string;
  review: string;
  label: SentimentLabel;
  score: number;
  theme: string;
  suggestion?: string | null;
  confidence?: number | null;
  created_at: string;
  updated_at: string;
}
