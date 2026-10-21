import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { SEED_FLASHCARDS } from './seed';
import type { CategoryProgress, Flashcard, Review, ReviewMode, Worker } from './types';

const WORKER_KEY = 'scic_worker_id';
const NAME_KEY = 'scic_worker_name';
const LOCAL_WORKERS_KEY = 'scic_local_workers';
const LOCAL_REVIEWS_PREFIX = 'scic_local_reviews_';

function getLocalWorkers(): Worker[] {
  try {
    const raw = localStorage.getItem(LOCAL_WORKERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWorker(w: Worker) {
  const workers = getLocalWorkers().filter((item) => item.id !== w.id);
  workers.push(w);
  localStorage.setItem(LOCAL_WORKERS_KEY, JSON.stringify(workers));
}

function getLocalReviews(workerId: string): Review[] {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_PREFIX + workerId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReview(review: Review) {
  const reviews = getLocalReviews(review.worker_id);
  reviews.unshift(review);
  localStorage.setItem(LOCAL_REVIEWS_PREFIX + review.worker_id, JSON.stringify(reviews));
}

export function getStoredWorkerId(): string | null {
  return localStorage.getItem(WORKER_KEY);
}

export function getStoredWorkerName(): string | null {
  return localStorage.getItem(NAME_KEY);
}

export async function findOrCreateWorker(name: string): Promise<Worker> {
  const trimmed = name.trim();
  const now = new Date().toISOString();

  // If Supabase is available, attempt remote lookup/creation
  if (supabase) {
    try {
      const { data: existing, error: findError } = await supabase
        .from('workers')
        .select('*')
        .ilike('name', trimmed)
        .order('last_active_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!findError && existing) {
        await supabase
          .from('workers')
          .update({ last_active_at: now })
          .eq('id', existing.id);
        localStorage.setItem(WORKER_KEY, existing.id);
        localStorage.setItem(NAME_KEY, existing.name);
        return { ...existing, last_active_at: now };
      }

      const { data, error } = await supabase
        .from('workers')
        .insert({ name: trimmed })
        .select()
        .single();

      if (!error && data) {
        localStorage.setItem(WORKER_KEY, data.id);
        localStorage.setItem(NAME_KEY, data.name);
        return data;
      }
    } catch (err) {
      console.warn('[SitePass] Supabase worker query failed, using local fallback:', err);
    }
  }

  // Local fallback
  const existingLocal = getLocalWorkers().find(
    (w) => w.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existingLocal) {
    const updated = { ...existingLocal, last_active_at: now };
    saveLocalWorker(updated);
    localStorage.setItem(WORKER_KEY, updated.id);
    localStorage.setItem(NAME_KEY, updated.name);
    return updated;
  }

  const newWorker: Worker = {
    id: `local-w-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: trimmed,
    created_at: now,
    last_active_at: now,
  };
  saveLocalWorker(newWorker);
  localStorage.setItem(WORKER_KEY, newWorker.id);
  localStorage.setItem(NAME_KEY, newWorker.name);
  return newWorker;
}

export function useWorker() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = getStoredWorkerId();
    const name = getStoredWorkerName();
    if (!id || !name) {
      setLoading(false);
      return;
    }

    const client = supabase;
    if (client) {
      (async () => {
        try {
          const { data } = await client
            .from('workers')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (data) {
            setWorker(data);
            client
              .from('workers')
              .update({ last_active_at: new Date().toISOString() })
              .eq('id', data.id)
              .then();
          } else {
            const local = getLocalWorkers().find((w) => w.id === id);
            setWorker(local ?? { id, name, created_at: new Date().toISOString(), last_active_at: new Date().toISOString() });
          }
        } catch {
          const local = getLocalWorkers().find((w) => w.id === id);
          setWorker(local ?? { id, name, created_at: new Date().toISOString(), last_active_at: new Date().toISOString() });
        } finally {
          setLoading(false);
        }
      })();
    } else {
      const local = getLocalWorkers().find((w) => w.id === id);
      setWorker(local ?? { id, name, created_at: new Date().toISOString(), last_active_at: new Date().toISOString() });
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (name: string) => {
    const w = await findOrCreateWorker(name);
    setWorker(w);
    return w;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(WORKER_KEY);
    localStorage.removeItem(NAME_KEY);
    setWorker(null);
  }, []);

  return { worker, loading, signIn, signOut };
}

export async function fetchFlashcards(): Promise<Flashcard[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('category', { ascending: true })
        .order('difficulty', { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[SitePass] Supabase flashcards fetch failed, using seed deck:', err);
    }
  }
  return SEED_FLASHCARDS;
}

export async function fetchReviews(workerId: string): Promise<Review[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('worker_id', workerId)
        .order('reviewed_at', { ascending: false });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('[SitePass] Supabase reviews fetch failed, reading local reviews:', err);
    }
  }
  return getLocalReviews(workerId);
}

export async function recordReview(
  workerId: string,
  cardId: string,
  correct: boolean,
  mode: ReviewMode,
): Promise<void> {
  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    worker_id: workerId,
    card_id: cardId,
    correct,
    mode,
    reviewed_at: new Date().toISOString(),
  };

  // Always save locally so progress isn't lost if offline
  saveLocalReview(newReview);

  if (supabase) {
    try {
      await supabase.from('reviews').insert({
        worker_id: workerId,
        card_id: cardId,
        correct,
        mode,
      });
    } catch (err) {
      console.warn('[SitePass] Could not sync review to Supabase:', err);
    }
  }
}

// A card counts as "mastered" when the worker has >=2 correct reviews AND
// no incorrect review since the last correct one.
export function computeMasteredIds(
  cards: Flashcard[],
  reviews: Review[],
): Set<string> {
  const byCard = new Map<string, Review[]>();
  for (const r of reviews) {
    const arr = byCard.get(r.card_id) ?? [];
    arr.push(r);
    byCard.set(r.card_id, arr);
  }
  // reviews from fetchReviews are newest-first; we want chronological
  const mastered = new Set<string>();
  for (const card of cards) {
    const hist = (byCard.get(card.id) ?? []).slice().reverse(); // chronological
    if (hist.length < 2) continue;
    let consecutive = 0;
    for (const r of hist) {
      if (r.correct) consecutive++;
      else consecutive = 0;
    }
    if (consecutive >= 2) mastered.add(card.id);
  }
  return mastered;
}

export function computeCategoryProgress(
  cards: Flashcard[],
  masteredIds: Set<string>,
  seenIds: Set<string>,
): CategoryProgress[] {
  const map = new Map<string, CategoryProgress>();
  for (const c of cards) {
    const p =
      map.get(c.category) ?? {
        category: c.category,
        total: 0,
        seen: 0,
        mastered: 0,
      };
    p.total += 1;
    if (seenIds.has(c.id)) p.seen += 1;
    if (masteredIds.has(c.id)) p.mastered += 1;
    map.set(c.category, p);
  }
  return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category));
}

/**
 * Fisher-Yates unbiased array shuffle
 */
export function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickQuiz(cards: Flashcard[], count: number): Flashcard[] {
  const shuffled = shuffleArray(cards);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Builds 4 unique, unbiased options for a multiple choice question.
 * Guarantees no duplicate options and the correct answer is always included.
 */
export function buildOptions(card: Flashcard, all: Flashcard[]): string[] {
  const correctAnswer = card.back.trim();
  const seenWrong = new Set<string>();

  // Gather unique wrong answers
  for (const c of shuffleArray(all)) {
    const ans = c.back.trim();
    if (c.id !== card.id && ans !== correctAnswer && !seenWrong.has(ans)) {
      seenWrong.add(ans);
      if (seenWrong.size >= 3) break;
    }
  }

  return shuffleArray([...Array.from(seenWrong), correctAnswer]);
}
