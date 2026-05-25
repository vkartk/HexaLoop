import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`dlg-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // Focus the first focusable element in the panel for keyboard users.
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );
    first?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        className={cn(
          'w-full overflow-hidden rounded-t-xl bg-surface shadow-card md:rounded-lg',
          SIZE[size],
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b-hairline border-border px-5 pt-4 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId.current} className="text-[15px] font-medium text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-[13px] text-ink-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 rounded p-1 text-ink-subtle hover:bg-surface-alt focus-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t-hairline border-border bg-surface-alt px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
