export interface Worker {
  id: string;
  name: string;
  created_at: string;
  last_active_at: string;
}

export interface Flashcard {
  id: string;
  category: string;
  front: string;
  back: string;
  difficulty: number;
  created_at: string;
}

export type ReviewMode = 'study' | 'quiz';

export interface Review {
  id: string;
  worker_id: string;
  card_id: string;
  correct: boolean;
  mode: ReviewMode;
  reviewed_at: string;
}

export interface CategoryProgress {
  category: string;
  total: number;
  seen: number;
  mastered: number;
}

export type View = 'dashboard' | 'study' | 'quiz';
