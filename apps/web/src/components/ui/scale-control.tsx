import { useEffect, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  value: number | null;
  onChange: (value: number) => void;
  ariaLabelledBy?: string;
  ariaInvalid?: boolean;
  disabled?: boolean;
  className?: string;
};

const VALUES = [1, 2, 3, 4, 5] as const;

const LEVEL_LABEL: Record<number, string> = {
  1: 'Below expectations',
  2: 'Developing',
  3: 'Meets expectations',
  4: 'Strong',
  5: 'Exceptional',
};

export const ScaleControl = ({
  value,
  onChange,
  ariaLabelledBy,
  ariaInvalid,
  disabled,
  className,
}: Props) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const focusable = value && value >= 1 && value <= 5 ? value : 1;

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.querySelectorAll<HTMLButtonElement>('[role="radio"]').forEach((el) => {
      const r = Number(el.dataset.rating);
      el.tabIndex = r === focusable ? 0 : -1;
    });
  }, [focusable]);

  const focusValue = (v: number) => {
    const next = Math.max(1, Math.min(5, v));
    groupRef.current
      ?.querySelector<HTMLButtonElement>(`[role="radio"][data-rating="${next}"]`)
      ?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const current = value ?? 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(5, (current || 0) + 1);
      onChange(n);
      focusValue(n);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const n = Math.max(1, (current || 1) - 1);
      onChange(n);
      focusValue(n);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(1);
      focusValue(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(5);
      focusValue(5);
    } else if (/^[1-5]$/.test(e.key)) {
      e.preventDefault();
      const n = Number(e.key);
      onChange(n);
      focusValue(n);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={ariaLabelledBy}
        aria-invalid={ariaInvalid ? 'true' : undefined}
        onKeyDown={onKey}
        className="inline-flex flex-wrap items-center gap-1"
      >
        {VALUES.map((v) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${v} — ${LEVEL_LABEL[v]}`}
              data-rating={v}
              disabled={disabled}
              onClick={() => onChange(v)}
              className={cn(
                'inline-flex h-10 min-w-[44px] items-center justify-center rounded-md border-hairline px-3 text-sm font-medium focus-ring transition-colors',
                selected
                  ? 'border-brand bg-brand text-white'
                  : 'border-border bg-surface text-ink-muted hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="text-[12px] text-ink-muted">
        {value ? `${value} — ${LEVEL_LABEL[value]}` : 'Not yet rated'}
      </p>
    </div>
  );
};
