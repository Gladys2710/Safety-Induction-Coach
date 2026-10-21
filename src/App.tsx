import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Welcome } from '@/components/Welcome';
import { Dashboard } from '@/components/Dashboard';
import { SessionShell } from '@/components/SessionShell';
import { QuizSession } from '@/components/QuizSession';
import {
  computeCategoryProgress,
  computeMasteredIds,
  fetchFlashcards,
  fetchReviews,
  pickQuiz,
  useWorker,
} from '@/lib/data';
import type { Flashcard, Review, View } from '@/lib/types';
import { HardHat } from 'lucide-react';

export default function App() {
  const { worker, loading, signIn, signOut } = useWorker();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [dataLoading, setDataLoading] = useState(true);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);

  // initial card load
  useEffect(() => {
    fetchFlashcards()
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setDataLoading(false));
  }, []);

  // load reviews whenever the worker changes
  useEffect(() => {
    if (!worker) {
      setReviews([]);
      return;
    }
    fetchReviews(worker.id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [worker]);

  const masteredIds = useMemo(
    () => computeMasteredIds(cards, reviews),
    [cards, reviews],
  );
  const seenIds = useMemo(
    () => new Set(reviews.filter((r) => r.mode === 'study').map((r) => r.card_id)),
    [reviews],
  );
  const progress = useMemo(
    () => computeCategoryProgress(cards, masteredIds, seenIds),
    [cards, masteredIds, seenIds],
  );
  const quizReviews = useMemo(
    () => reviews.filter((r) => r.mode === 'quiz'),
    [reviews],
  );
  const quizAvg = useMemo(() => {
    if (quizReviews.length === 0) return -1;
    const correct = quizReviews.filter((r) => r.correct).length;
    return Math.round((correct / quizReviews.length) * 100);
  }, [quizReviews]);

  const startStudy = () => {
    setSessionCards([...cards]);
    setView('study');
  };
  const startQuiz = () => {
    setSessionCards(pickQuiz(cards, 10));
    setView('quiz');
  };

  const refreshAfterSession = () => {
    if (worker) fetchReviews(worker.id).then(setReviews).catch(() => {});
    setView('dashboard');
  };

  if (loading || dataLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-steel-50">
        <div className="flex flex-col items-center gap-3 text-steel-400">
          <div className="grid h-12 w-12 animate-pulse place-items-center rounded-xl bg-safety-500 text-white">
            <HardHat className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium">Loading your induction…</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-steel-50">
        <Header workerName={null} onSignOut={signOut} />
        <Welcome onSignIn={signIn} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-steel-50">
      <Header workerName={worker.name} onSignOut={signOut} />
      {view === 'dashboard' && (
        <Dashboard
          cards={cards}
          reviews={reviews}
          progress={progress}
          masteredCount={masteredIds.size}
          seenCount={seenIds.size}
          quizAvg={quizAvg}
          onStartStudy={startStudy}
          onStartQuiz={startQuiz}
        />
      )}
      {view === 'study' && (
        <SessionShell
          title="Study Mode"
          subtitle="Flip the card, then mark whether you knew it"
          cards={sessionCards}
          workerId={worker.id}
          mode="study"
          onExit={() => setView('dashboard')}
          onDone={refreshAfterSession}
        />
      )}
      {view === 'quiz' && (
        <QuizSession
          cards={sessionCards}
          workerId={worker.id}
          onExit={() => setView('dashboard')}
          onDone={refreshAfterSession}
        />
      )}
    </div>
  );
}
