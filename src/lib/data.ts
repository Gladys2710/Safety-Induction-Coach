import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { CategoryProgress, Flashcard, Review, ReviewMode, Worker } from './types';

const WORKER_KEY = 'scic_worker_id';
const NAME_KEY = 'scic_worker_name';

export function getStoredWorkerId(): string | null {
  return localStorage.getItem(WORKER_KEY);
}
export function getStoredWorkerName(): string | null {
  return localStorage.getItem(NAME_KEY);
}

export async function findOrCreateWorker(name: string): Promise<Worker> {
  const trimmed = name.trim();
  // try to find an existing worker with this name (case-insensitive)
  const { data: existing } = await supabase
    .from('workers')
    .select('*')
    .ilike('name', trimmed)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('workers')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', existing.id);
    localStorage.setItem(WORKER_KEY, existing.id);
    localStorage.setItem(NAME_KEY, existing.name);
    return { ...existing, last_active_at: new Date().toISOString() };
  }

  const { data, error } = await supabase
    .from('workers')
    .insert({ name: trimmed })
    .select()
    .single();
  if (error || !data) throw new Error('Could not create worker profile.');
  localStorage.setItem(WORKER_KEY, data.id);
  localStorage.setItem(NAME_KEY, data.name);
  return data;
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
    supabase
      .from('workers')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setWorker(data);
          supabase
            .from('workers')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', data.id)
            .then();
        }
        setLoading(false);
      });
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
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .order('category', { ascending: true })
    .order('difficulty', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReviews(workerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('worker_id', workerId)
    .order('reviewed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function recordReview(
  workerId: string,
  cardId: string,
  correct: boolean,
  mode: ReviewMode,
): Promise<void> {
  const { error } = await supabase.from('reviews').insert({
    worker_id: workerId,
    card_id: cardId,
    correct,
    mode,
  });
  if (error) throw error;
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

export function pickQuiz(cards: Flashcard[], count: number): Flashcard[] {
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function buildOptions(card: Flashcard, all: Flashcard[]): string[] {
  const wrong = all
    .filter((c) => c.id !== card.id && c.back !== card.back)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((c) => c.back);
  return [...wrong, card.back].sort(() => Math.random() - 0.5);
}
