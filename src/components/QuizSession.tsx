import { useEffect, useMemo, useState } from 'react';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    setState({ selected: null, locked: false });
  }, [index]);

  const choose = async (option: string) => {
    if (state.locked || !current) return;
    const correct = option === current.back;
    setState({ selected: option, locked: true });
    try {
      await recordReview(workerId, current.id, correct, 'quiz');
    } catch {
      /* best-effort */
    }
    if (correct) setCorrectCount((c) => c + 1);
  };

  const next = () => {
    if (index + 1 >= cards.length) setDone(true);
    else setIndex((i) => i + 1);
  };

  const pct = useMemo(
    () => (cards.length ? Math.round((correctCount / cards.length) * 100) : 0),
    [correctCount, cards.length],
  );

  if (done) {
    const pass = pct >= 70;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${
            pass ? 'bg-emerald-100 text-emerald-600' : 'bg-safety-100 text-safety-600'
          }`}
        >
          <Brain className="h-10 w-10" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-bold uppercase tracking-tight text-steel-900">
          Quiz complete
        </h2>
        <p className="mt-2 text-base text-steel-600">
          You scored{' '}
          <span className="font-bold text-steel-900">
            {correctCount}/{cards.length}
          </span>{' '}
          ({pct}%).
        </p>
        <p
          className={`mt-3 text-sm font-semibold ${
            pass ? 'text-emerald-600' : 'text-safety-600'
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

  const progress = (index / cards.length) * 100;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="btn-ghost !px-3 !py-2 text-sm">
          <ChevronLeft className="h-4 w-4" />
          Exit
        </button>
        <div className="flex items-center gap-2 text-steel-700">
          <Brain className="h-5 w-5 text-safety-500" />
          <span className="font-display text-sm font-bold uppercase tracking-tight">
            Quiz Mode
          </span>
        </div>
        <span className="w-[72px]" />
      </div>

      <div className="mb-8">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-steel-500">
          <span>
            Question {index + 1} of {cards.length}
          </span>
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
        <div className="surface p-6 sm:p-7">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-steel-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-steel-500">
            {current.category}
          </span>
          <h3 className="mt-4 text-xl font-semibold leading-snug text-steel-900">
            {current.front}
          </h3>

          <div className="mt-5 space-y-2.5">
            {options.map((opt) => {
              const isCorrect = opt === current.back;
              const isSelected = state.selected === opt;
              let cls =
                'border-steel-200 bg-white text-steel-800 hover:border-steel-300 hover:bg-steel-50';
              if (state.locked) {
                if (isCorrect)
                  cls = 'border-emerald-300 bg-emerald-50 text-emerald-800';
                else if (isSelected)
                  cls = 'border-red-300 bg-red-50 text-red-700';
                else cls = 'border-steel-200 bg-white text-steel-400';
              }
              return (
                <button
                  key={opt}
                  onClick={() => choose(opt)}
                  disabled={state.locked}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 ${cls}`}
                >
                  <span>{opt}</span>
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
            <div className="mt-5 animate-fade-in">
              <div
                className={`rounded-xl border p-4 text-sm ${
                  state.selected === current.back
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                <p className="font-semibold">
                  {state.selected === current.back ? 'Correct!' : 'Not quite.'}
                </p>
                <p className="mt-1 text-steel-700">
                  <span className="font-semibold text-steel-900">Answer: </span>
                  {current.back}
                </p>
              </div>
              <button onClick={next} className="btn-primary mt-4 w-full">
                {index + 1 >= cards.length ? 'See results' : 'Next question'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
