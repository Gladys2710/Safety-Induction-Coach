import { HardHat } from 'lucide-react';

interface HeaderProps {
  workerName: string | null;
  onSignOut: () => void;
}

export function Header({ workerName, onSignOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-steel-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-safety-500 text-white shadow-sm">
            <HardHat className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-bold uppercase tracking-tight text-steel-900">
              SitePass
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-steel-500">
              Safety Induction Coach
            </p>
          </div>
        </div>
        {workerName && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[11px] font-medium uppercase tracking-wider text-steel-400">
                Signed in
              </p>
              <p className="text-sm font-semibold text-steel-800">{workerName}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-steel-900 text-sm font-bold text-white">
              {workerName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onSignOut}
              className="btn-ghost !px-3 !py-1.5 text-xs"
              aria-label="Switch worker"
              title="Switch worker"
            >
              Switch
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
