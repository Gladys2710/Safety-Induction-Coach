import { BookOpen, Brain, CheckCircle2, TrendingUp } from 'lucide-react';
import type { CategoryProgress, Flashcard, Review } from '@/lib/types';

interface DashboardProps {
  cards: Flashcard[];
  reviews: Review[];
  progress: CategoryProgress[];
  masteredCount: number;
  seenCount: number;
  quizAvg: number;
  onStartStudy: () => void;
  onStartQuiz: () => void;
}

export function Dashboard({
  cards,
  progress,
  masteredCount,
  seenCount,
  quizAvg,
  onStartStudy,
  onStartQuiz,
}: DashboardProps) {
  const total = cards.length;
  const masteredPct = total ? Math.round((masteredCount / total) * 100) : 0;
  const seenPct = total ? Math.round((seenCount / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Total cards"
          value={String(total)}
          tone="steel"
        />
        <StatCard
          icon={CheckCircle2}
          label="Mastered"
          value={`${masteredCount}/${total}`}
          sub={`${masteredPct}%`}
          tone="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Cards seen"
          value={`${seenCount}/${total}`}
          sub={`${seenPct}%`}
          tone="amber"
        />
        <StatCard
          icon={Brain}
          label="Quiz accuracy"
          value={quizAvg >= 0 ? `${quizAvg}%` : '—'}
          tone="safety"
        />
      </div>

      {/* Mode selection */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <ModeCard
          title="Study mode"
          description="Flip through cards front-to-back at your own pace. Mark each card as you learn it."
          cta="Start studying"
          onClick={onStartStudy}
          accent="steel"
          icon={BookOpen}
        />
        <ModeCard
          title="Quiz mode"
          description="10 random questions, multiple choice. Get instant feedback and a final score."
          cta="Take a quiz"
          onClick={onStartQuiz}
          accent="safety"
          icon={Brain}
        />
      </div>

      {/* Category breakdown */}
      <div className="mt-8 surface p-6">
        <div className="mb-5 flex items-baseline justify-between">
          <h3 className="font-display text-lg font-bold uppercase tracking-tight text-steel-900">
            Topics
          </h3>
          <p className="text-xs font-medium uppercase tracking-wider text-steel-400">
            {progress.length} categories
          </p>
        </div>
        <ul className="space-y-3">
          {progress.map((p) => {
            const masteredPctCat = p.total ? Math.round((p.mastered / p.total) * 100) : 0;
            return (
              <li key={p.category}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-steel-800">
                    {p.category}
                  </span>
                  <span className="text-xs font-medium text-steel-500">
                    {p.mastered}/{p.total} mastered · {p.seen} seen
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-steel-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-safety-400 to-safety-600 transition-all duration-500"
                    style={{ width: `${masteredPctCat}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

type Tone = 'steel' | 'green' | 'amber' | 'safety';
const toneMap: Record<Tone, { bg: string; text: string }> = {
  steel: { bg: 'bg-steel-100', text: 'text-steel-700' },
  green: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
  safety: { bg: 'bg-safety-100', text: 'text-safety-700' },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone: Tone;
}) {
  const t = toneMap[tone];
  return (
    <div className="surface flex items-center gap-3 p-4">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${t.bg} ${t.text}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-steel-400">
          {label}
        </p>
        <p className="text-xl font-bold text-steel-900">
          {value}
          {sub && <span className="ml-1 text-sm font-semibold text-steel-400">{sub}</span>}
        </p>
      </div>
    </div>
  );
}

function ModeCard({
  title,
  description,
  cta,
  onClick,
  accent,
  icon: Icon,
}: {
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  accent: 'steel' | 'safety';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isSafety = accent === 'safety';
  return (
    <div className="group surface relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div
        aria-hidden
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${
          isSafety ? 'bg-safety-500' : 'bg-steel-900'
        }`}
      />
      <div
        className={`grid h-12 w-12 place-items-center rounded-xl text-white shadow-sm ${
          isSafety ? 'bg-safety-500' : 'bg-steel-900'
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-steel-900">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-steel-600">{description}</p>
      <button
        onClick={onClick}
        className={`mt-5 w-full ${isSafety ? 'btn-primary' : 'btn-dark'}`}
      >
        {cta}
      </button>
    </div>
  );
}
