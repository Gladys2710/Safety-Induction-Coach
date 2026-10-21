import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, XCircle, Brain } from 'lucide-react';
import type { Flashcard } from '@/lib/types';
import { buildOptions, recordReview } from '@/lib/data';

interface QuizSessionProps {
  cards: Flashcard[];
  workerId: string;
  onExit: () => void;
  onDone: () => void;
}

interface QState {
  selected: string | null;
  locked: boolean;
}

export function QuizSession({ cards, workerId, onExit, onDone }: QuizSessionProps) {
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [state, setState] = useState<QState>({ selected: null, locked: false });

  const current = cards[index];

  const options = useMemo(() => {
    if (!current) return [];
    return buildOptions(current, cards);
  }, [current, cards]);

  useEffect(() => {
    setState({ selected: null, locked: false });
  }, [index]);

  const choose = useCallback(
    async (option: string) => {
      if (state.locked || !current) return;
      const correct = option === current.back;
      setState({ selected: option, locked: true });
      try {
        await recordReview(workerId, current.id, correct, 'quiz');
      } catch {
        /* best-effort */
      }
      if (correct) setCorrectCount((c) => c + 1);
    },
    [state.locked, current, workerId],
  );

  const next = useCallback(() => {
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, cards.length]);

  // Keyboard navigation for quiz options (1-4) and Next (Enter/Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (state.locked) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          next();
        }
      } else {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= options.length) {
          e.preventDefault();
          choose(options[num - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.locked, options, choose, next]);

  const pct = useMemo(
    () => (cards.length ? Math.round((correctCount / cards.length) * 100) : 0),
    [correctCount, cards.length],
  );

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <p className="text-base text-steel-700">No cards available for this quiz.</p>
        <button onClick={onExit} className="btn-primary mt-6">
          Back to dashboard
        </button>
      </div>
    );
  }

  if (done) {
    const pass = pct >= 70;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${
            pass ? 'bg-emerald-100 text-emerald-700' : 'bg-safety-100 text-safety-700'
          }`}
        >
          <Brain className="h-10 w-10" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight text-steel-900">
          Quiz complete
        </h2>
        <p className="mt-2 text-base text-steel-700">
          You scored{' '}
          <span className="font-bold text-steel-900">
            {correctCount}/{cards.length}
          </span>{' '}
          ({pct}%).
        </p>
        <p
          className={`mt-3 text-sm font-semibold ${
            pass ? 'text-emerald-700' : 'text-safety-700'
          }`}
        >
          {pass
            ? 'You passed! You hit the 70% induction threshold.'
            : 'Under 70% — review your weak topics and retake the quiz.'}
        </p>
        <button onClick={onDone} className="btn-primary mt-8">
          Back to dashboard
        </button>
      </div>
    );
  }

  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onExit}
          className="btn-ghost !px-3 !py-2 text-sm"
          aria-label="Exit quiz and return to dashboard"
        >
          <ChevronLeft className="h-4 w-4" />
          Exit
        </button>
        <div className="flex items-center gap-2 text-steel-700">
          <Brain className="h-5 w-5 text-safety-600" />
          <span className="font-display text-sm font-bold uppercase tracking-tight">
            Quiz Mode
          </span>
        </div>
        <span className="w-[72px]" />
      </div>

      <div className="mb-8">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-steel-600">
          <span>
            Question {index + 1} of {cards.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-steel-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-safety-500 to-safety-700 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {current && (
        <div className="surface p-6 sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-steel-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-steel-700">
            {current.category}
          </span>
          <h3 className="mt-4 text-xl font-semibold leading-snug text-steel-900">
            {current.front}
          </h3>

          <div className="mt-5 space-y-2.5" role="group" aria-label="Answer options">
            {options.map((opt, optIdx) => {
              const isCorrect = opt === current.back;
              const isSelected = state.selected === opt;
              let cls =
                'border-steel-200 bg-white text-steel-800 hover:border-steel-300 hover:bg-steel-50';
              if (state.locked) {
                if (isCorrect) {
                  cls = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold';
                } else if (isSelected) {
                  cls = 'border-red-400 bg-red-50 text-red-900 line-through';
                } else {
                  cls = 'border-steel-200 bg-steel-50/60 text-steel-400';
                }
              }
              return (
                <button
                  key={`${current.id}-${optIdx}-${opt}`}
                  onClick={() => choose(opt)}
                  disabled={state.locked}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-safety-500 ${cls}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="inline-grid h-5 w-5 shrink-0 place-items-center rounded bg-steel-100 text-[11px] font-mono font-bold text-steel-600">
                      {optIdx + 1}
                    </span>
                    <span>{opt}</span>
                  </span>
                  {state.locked && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                  {state.locked && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                  )}
                </button>
              );
            })}
          </div>

          {state.locked && (
            <div className="mt-5 animate-fade-in" aria-live="polite">
              <div
                className={`rounded-xl border p-4 text-sm ${
                  state.selected === current.back
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-red-300 bg-red-50 text-red-900'
                }`}
              >
                <p className="font-bold">
                  {state.selected === current.back ? '✓ Correct!' : '✗ Not quite.'}
                </p>
                <p className="mt-1 text-steel-800">
                  <span className="font-semibold text-steel-950">Correct Answer: </span>
                  {current.back}
                </p>
              </div>
              <button
                type="button"
                onClick={next}
                className="btn-primary mt-4 w-full focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {index + 1 >= cards.length ? 'See results' : 'Next question'}
                <span className="ml-2 text-xs opacity-80">(Press Enter)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
