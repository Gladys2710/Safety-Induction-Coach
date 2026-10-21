import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, GraduationCap, PartyPopper } from 'lucide-react';
import type { Flashcard, ReviewMode } from '@/lib/types';
import { recordReview } from '@/lib/data';
import { FlashCard } from './FlashCard';

interface SessionShellProps {
  title: string;
  subtitle: string;
  cards: Flashcard[];
  workerId: string;
  mode: ReviewMode;
  onExit: () => void;
  onDone: () => void;
}

export function SessionShell({
  title,
  subtitle,
  cards,
  workerId,
  mode,
  onExit,
  onDone,
}: SessionShellProps) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const current = cards[index];

  useEffect(() => {
    if (cards.length === 0) setDone(true);
  }, [cards.length]);

  const handleMark = async (correct: boolean) => {
    if (!current) return;
    try {
      await recordReview(workerId, current.id, correct, mode);
    } catch {
      /* swallow — progress is best-effort in study mode */
    }
    if (correct) setCorrectCount((c) => c + 1);
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const pct = useMemo(
    () => (cards.length ? Math.round((correctCount / cards.length) * 100) : 0),
    [correctCount, cards.length],
  );

  if (done) {
    return (
      <SessionComplete
        title={title}
        total={cards.length}
        correct={correctCount}
        pct={pct}
        onDone={onDone}
      />
    );
  }

  const progress = ((index) / cards.length) * 100;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="btn-ghost !px-3 !py-2 text-sm">
          <ChevronLeft className="h-4 w-4" />
          Exit
        </button>
        <div className="flex items-center gap-2 text-steel-700">
          <GraduationCap className="h-5 w-5 text-safety-500" />
          <span className="font-display text-sm font-bold uppercase tracking-tight">
            {title}
          </span>
        </div>
        <span className="w-[72px]" />
      </div>

      <div className="mb-8">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-steel-500">
          <span>{subtitle}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-steel-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-safety-400 to-safety-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {current && (
        <FlashCard
          card={current}
          index={index}
          total={cards.length}
          onMark={handleMark}
        />
      )}
    </div>
  );
}

function SessionComplete({
  title,
  total,
  correct,
  pct,
  onDone,
}: {
  title: string;
  total: number;
  correct: number;
  pct: number;
  onDone: () => void;
}) {
  const pass = pct >= 70;
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <div
        className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${
          pass ? 'bg-emerald-100 text-emerald-600' : 'bg-safety-100 text-safety-600'
        }`}
      >
        <PartyPopper className="h-10 w-10" />
      </div>
      <h2 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight text-steel-900">
        {title} complete
      </h2>
      <p className="mt-2 text-base text-steel-600">
        You scored{' '}
        <span className="font-bold text-steel-900">
          {correct}/{total}
        </span>{' '}
        ({pct}%).
      </p>
      <p
        className={`mt-3 text-sm font-semibold ${
          pass ? 'text-emerald-600' : 'text-safety-600'
        }`}
      >
        {pass
          ? 'Nice work — you hit the 70% pass mark. Keep it up!'
          : 'Almost there. Review the cards you missed and try again.'}
      </p>
      <button onClick={onDone} className="btn-primary mt-8">
        Back to dashboard
      </button>
    </div>
  );
}
