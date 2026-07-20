import { SentimentLabel } from '../../../shared/types';

export interface Feedback {
  id: string;
  review: string;
  label: SentimentLabel;
  score: number;
  theme: string;
  suggestion?: string | null;
  confidence?: number | null;
  createdAt: string;
  updatedAt: string;
}
