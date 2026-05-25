import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  name?: string;
  disabled?: boolean;
  ariaLabelledBy?: string;
  ariaInvalid?: boolean;
  className?: string;
};

const RATINGS = [1, 2, 3, 4, 5] as const;

const RATING_LABEL: Record<number, string> = {
  1: 'Poor',
  2: 'Below expectations',
  3: 'Met expectations',
  4: 'Strong',
  5: 'Excellent',
};

export const StarRating = ({
  value,
  onChange,
  name,
  disabled,
  ariaLabelledBy,
  ariaInvalid,
  className,
}: Props) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const focusable = value && value >= 1 && value <= 5 ? value : 1;
  const liveLabel = value ? `${value} of 5 — ${RATING_LABEL[value]}` : 'No rating selected';

  // Keep DOM tab-index aligned with current value so Tab lands on the active star.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.querySelectorAll<HTMLButtonElement>('[role="radio"]').forEach((el) => {
      const r = Number(el.dataset.rating);
      el.tabIndex = r === focusable ? 0 : -1;
    });
  }, [focusable]);

  const focusStar = (rating: number) => {
    const next = Math.max(1, Math.min(5, rating));
    const el = groupRef.current?.querySelector<HTMLButtonElement>(
      `[role="radio"][data-rating="${next}"]`,
    );
    el?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const current = value ?? 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(5, (current || 0) + 1);
      onChange(next);
      focusStar(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(1, (current || 1) - 1);
      onChange(next);
      focusStar(next);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(1);
      focusStar(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(5);
      focusStar(5);
    } else if (/^[1-5]$/.test(e.key)) {
      e.preventDefault();
      const rating = Number(e.key);
      onChange(rating);
      focusStar(rating);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={ariaLabelledBy}
        aria-invalid={ariaInvalid ? 'true' : undefined}
        onKeyDown={handleKey}
        className="flex items-center gap-1"
      >
        {RATINGS.map((r) => {
          const selected = value === r;
          const filled = value != null && r <= value;
          return (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${r} ${r === 1 ? 'star' : 'stars'} — ${RATING_LABEL[r]}`}
              data-rating={r}
              disabled={disabled}
              onClick={() => onChange(r)}
              className={cn(
                'inline-flex h-12 w-12 items-center justify-center rounded-md focus-ring transition-colors',
                'hover:bg-amber-50 disabled:cursor-not-allowed',
                filled ? 'text-amber-500' : 'text-border-strong',
              )}
            >
              <Star
                aria-hidden
                className={cn('h-7 w-7', filled && 'fill-amber-500')}
                strokeWidth={1.75}
              />
              {name && (
                <input
                  type="hidden"
                  name={name}
                  value={selected ? r : ''}
                  readOnly
                  tabIndex={-1}
                />
              )}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="text-[13px] text-ink-muted">
        {liveLabel}
      </p>
    </div>
  );
};
