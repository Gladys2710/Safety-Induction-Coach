import { useState } from 'react';
import { ChevronRight, HardHat, ShieldCheck, Sparkles } from 'lucide-react';

interface WelcomeProps {
  onSignIn: (name: string) => Promise<unknown>;
}

export function Welcome({ onSignIn }: WelcomeProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Enter your full name to begin.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSignIn(trimmed);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* hazard stripe accent */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-2"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #facc15 0 16px, #18181b 16px 32px)',
        }}
      />
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-safety-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-safety-700">
              <Sparkles className="h-3.5 w-3.5" />
              Construction Safety Induction
            </div>
            <h2 className="mt-5 font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-steel-900 sm:text-5xl">
              Train your crew.
              <br />
              <span className="text-safety-600">Send everyone home safe.</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-steel-600">
              A focused flashcard coach that drills the essentials of construction site
              safety — PPE, fall protection, excavation, electrical and more. Study at
              your pace, then test yourself with short quizzes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {[
                { icon: HardHat, label: '35 induction cards' },
                { icon: ShieldCheck, label: '10 safety topics' },
              ].map((f) => (
                <div
                  key={f.label}
                  className="inline-flex items-center gap-2 rounded-lg border border-steel-200 bg-white px-3 py-2 text-sm font-medium text-steel-700"
                >
                  <f.icon className="h-4 w-4 text-safety-500" />
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          <div className="animate-pop-in">
            <form onSubmit={submit} className="surface p-7 sm:p-8">
              <h3 className="font-display text-xl font-bold text-steel-900">
                Start your induction
              </h3>
              <p className="mt-1.5 text-sm text-steel-500">
                Enter your name so we can save your progress across sessions.
              </p>
              <div className="mt-6">
                <label
                  htmlFor="worker-name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-steel-500"
                >
                  Full name
                </label>
                <input
                  id="worker-name"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Rivera"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'worker-name-error' : undefined}
                  className="w-full rounded-xl border border-steel-200 bg-steel-50 px-4 py-3 text-base text-steel-900 placeholder-steel-400 outline-none transition focus:border-safety-500 focus:bg-white focus:ring-2 focus:ring-safety-200"
                />
                {error && (
                  <p id="worker-name-error" className="mt-2 text-sm font-semibold text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary mt-5 w-full"
              >
                {submitting ? 'Setting up…' : 'Begin training'}
                <ChevronRight className="h-4 w-4" />
              </button>
              <p className="mt-4 text-center text-xs text-steel-400">
                No account needed. Your name is used only to track your progress.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
