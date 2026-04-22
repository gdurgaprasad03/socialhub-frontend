import { useEffect, useState } from 'react';
import { Grid3x3, List as ListIcon, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'detailed';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
  /** Which modes to expose, in order. Defaults to all three. */
  modes?: ViewMode[];
}

const META: Record<ViewMode, { icon: React.ElementType; label: string }> = {
  grid: { icon: Grid3x3, label: 'Grid' },
  list: { icon: ListIcon, label: 'List' },
  detailed: { icon: LayoutList, label: 'Detailed' },
};

const ViewToggle = ({
  value,
  onChange,
  className,
  modes = ['grid', 'list', 'detailed'],
}: ViewToggleProps) => (
  <div
    role="tablist"
    aria-label="View mode"
    className={cn(
      'inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm',
      className
    )}
  >
    {modes.map((m) => {
      const Icon = META[m].icon;
      const active = value === m;
      return (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(m)}
          title={META[m].label}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-colors',
            active
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-500/30'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{META[m].label}</span>
        </button>
      );
    })}
  </div>
);

const isMode = (v: unknown): v is ViewMode =>
  v === 'grid' || v === 'list' || v === 'detailed';

/** Persists the chosen view per-page in localStorage. */
export const useViewMode = (
  key: string,
  initial: ViewMode = 'grid'
): [ViewMode, (m: ViewMode) => void] => {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return initial;
    const stored = window.localStorage.getItem(key);
    return isMode(stored) ? stored : initial;
  });

  // Sync with storage changes from other tabs.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && isMode(e.newValue)) setMode(e.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  const set = (m: ViewMode) => {
    setMode(m);
    try {
      window.localStorage.setItem(key, m);
    } catch {
      /* ignore quota / privacy mode errors */
    }
  };
  return [mode, set];
};

export default ViewToggle;
