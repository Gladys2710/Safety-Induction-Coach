import { useCallback, useEffect, useState } from 'react';
import { Check, RotateCcw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Flashcard } from '@/lib/types';

interface FlashCardProps {
  card: Flashcard;
  index: number;
  total: number;
  onMark: (correct: boolean) => void;
}

export function FlashCard({ card, index, total, onMark }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [marked, setMarked] = useState<null | boolean>(null);

  useEffect(() => {
    setFlipped(false);
    setMarked(null);
  }, [card.id]);

  const handleMark = useCallback(
    (correct: boolean) => {
      if (marked !== null) return;
      setMarked(correct);
      setTimeout(() => onMark(correct), 650);
    },
    [marked, onMark],
  );

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        if (flipped) {
          e.preventDefault();
          handleMark(false);
        }
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        if (flipped) {
          e.preventDefault();
          handleMark(true);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setFlipped(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipped, handleMark]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-steel-600">
        <span>
          Card {index + 1} of {total}
        </span>
        <span className="rounded-full bg-steel-200/70 px-2.5 py-1 text-steel-700">
          {card.category}
        </span>
      </div>

      {/* Screen reader live notification */}
      <div className="sr-only" aria-live="polite">
        {marked !== null
          ? marked
            ? 'Marked as known'
            : 'Marked for review'
          : flipped
          ? `Answer displayed: ${card.back}`
          : `Question displayed: ${card.front}`}
      </div>

      <div
        className={`flip-card ${flipped ? 'flipped' : ''}`}
        style={{ height: '20rem' }}
      >
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="flip-card-inner block h-full w-full rounded-2xl text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-safety-400 focus-visible:ring-offset-2"
          aria-label={flipped ? 'Answer shown. Click or press space to show question' : 'Question shown. Click or press space to reveal answer'}
          aria-expanded={flipped}
        >
          {/* Front — question */}
          <div
            aria-hidden={flipped}
            className="flip-face surface flex h-full flex-col justify-between overflow-hidden p-7 sm:p-8"
          >
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-steel-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-steel-700">
                Question
              </span>
              <span className="text-[11px] font-medium text-steel-500">
                Click or Press Space to flip
              </span>
            </div>
            <p className="mt-5 text-xl font-semibold leading-snug text-steel-900 sm:text-2xl">
              {card.front}
            </p>
            <p className="mt-4 text-xs font-medium text-safety-700">
              Tap or press Space to reveal the answer
            </p>
          </div>

          {/* Back — answer */}
          <div
            aria-hidden={!flipped}
            className="flip-face flip-face-back surface flex h-full flex-col justify-between overflow-hidden border-safety-300 bg-safety-50 p-7 sm:p-8"
          >
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-safety-600 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                Answer
              </span>
              <span className="text-[11px] font-medium text-safety-800">
                Click or Space to flip back
              </span>
            </div>
            <p className="mt-5 text-lg font-semibold leading-snug text-steel-900">
              {card.back}
            </p>
            <p className="mt-4 text-xs font-medium text-steel-600">
              Did you know it? Use the buttons below or keyboard shortcuts [1 / 2].
            </p>
          </div>
        </button>
      </div>

      {/* Mark controls */}
      <div
        className={`mt-5 grid grid-cols-2 gap-3 transition-opacity duration-300 ${
          flipped ? 'opacity-100' : 'pointer-events-none opacity-40'
        }`}
      >
        <button
          type="button"
          onClick={() => handleMark(false)}
          disabled={marked !== null || !flipped}
          aria-label="Need to review (or press 1 or left arrow)"
          className={`btn border focus-visible:ring-2 focus-visible:ring-offset-2 ${
            marked === false
              ? 'animate-shake border-red-300 bg-red-50 text-red-700'
              : 'border-steel-200 bg-white text-steel-800 hover:border-red-200 hover:bg-red-50 hover:text-red-700'
          }`}
        >
          <X className="h-4 w-4" />
          <span>Need to review <kbd className="ml-1 rounded border border-steel-200 bg-steel-50 px-1.5 py-0.5 text-[10px] text-steel-500">[1]</kbd></span>
        </button>
        <button
          type="button"
          onClick={() => handleMark(true)}
          disabled={marked !== null || !flipped}
          aria-label="Got it (or press 2 or right arrow)"
          className={`btn border focus-visible:ring-2 focus-visible:ring-offset-2 ${
            marked === true
              ? 'animate-pop-in border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-steel-200 bg-white text-steel-800 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          <Check className="h-4 w-4" />
          <span>Got it <kbd className="ml-1 rounded border border-steel-200 bg-steel-50 px-1.5 py-0.5 text-[10px] text-steel-500">[2]</kbd></span>
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-steel-500">
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-steel-200 bg-white px-1.5 py-0.5 text-[11px] font-mono text-steel-700 shadow-sm">Space</kbd> flip
        </span>
        <span className="inline-flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> <kbd className="rounded border border-steel-200 bg-white px-1.5 py-0.5 text-[11px] font-mono text-steel-700 shadow-sm">← / 1</kbd> review
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd className="rounded border border-steel-200 bg-white px-1.5 py-0.5 text-[11px] font-mono text-steel-700 shadow-sm">→ / 2</kbd> got it <ChevronRight className="h-3.5 w-3.5" />
        </span>
        <span className="inline-flex items-center gap-1">
          <RotateCcw className="h-3.5 w-3.5" /> <kbd className="rounded border border-steel-200 bg-white px-1.5 py-0.5 text-[11px] font-mono text-steel-700 shadow-sm">R</kbd> reset
        </span>
      </div>
    </div>
  );
}
