import { useEffect, useState } from 'react';
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

  const handleMark = (correct: boolean) => {
    if (marked !== null) return;
    setMarked(correct);
    setTimeout(() => onMark(correct), 650);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-steel-500">
        <span>
          Card {index + 1} of {total}
        </span>
        <span className="rounded-full bg-steel-100 px-2.5 py-1 text-steel-600">
          {card.category}
        </span>
      </div>

      <div
        className={`flip-card ${flipped ? 'flipped' : ''}`}
        style={{ height: '20rem' }}
      >
        <button
          onClick={() => setFlipped((f) => !f)}
          className="flip-card-inner block h-full w-full text-left focus:outline-none"
          aria-label={flipped ? 'Show question' : 'Reveal answer'}
        >
          {/* Front — question */}
          <div className="flip-face surface flex h-full flex-col justify-between overflow-hidden p-7 sm:p-8">
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-steel-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-steel-500">
                Question
              </span>
              <span className="text-[11px] font-medium text-steel-400">
                Tap to flip
              </span>
            </div>
            <p className="mt-5 text-xl font-semibold leading-snug text-steel-900 sm:text-2xl">
              {card.front}
            </p>
            <p className="mt-4 text-xs font-medium text-safety-600">
              Tap the card to reveal the answer
            </p>
          </div>

          {/* Back — answer */}
          <div className="flip-face flip-face-back surface flex h-full flex-col justify-between overflow-hidden border-safety-200 bg-safety-50 p-7 sm:p-8">
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-safety-500 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                Answer
              </span>
              <span className="text-[11px] font-medium text-safety-600">
                Tap to flip back
              </span>
            </div>
            <p className="mt-5 text-lg font-semibold leading-snug text-steel-900">
              {card.back}
            </p>
            <p className="mt-4 text-xs font-medium text-steel-500">
              Did you know it?
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
          onClick={() => handleMark(false)}
          disabled={marked !== null}
          className={`btn border ${
            marked === false
              ? 'animate-shake border-red-300 bg-red-50 text-red-700'
              : 'border-steel-200 bg-white text-steel-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700'
          }`}
        >
          <X className="h-4 w-4" />
          Need to review
        </button>
        <button
          onClick={() => handleMark(true)}
          disabled={marked !== null}
          className={`btn border ${
            marked === true
              ? 'animate-pop-in border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-steel-200 bg-white text-steel-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
          }`}
        >
          <Check className="h-4 w-4" />
          Got it
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4 text-steel-400">
        <span className="inline-flex items-center gap-1 text-xs">
          <ChevronLeft className="h-3.5 w-3.5" /> flip back
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          flip forward <ChevronRight className="h-3.5 w-3.5" />
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <RotateCcw className="h-3.5 w-3.5" /> reset
        </span>
      </div>
    </div>
  );
}
