import type { ReactNode } from 'react';
import { AlertTriangle, Loader2, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LoadingProps = {
  label?: string;
  className?: string;
};

export const LoadingState = ({ label = 'Loading…', className }: LoadingProps) => (
  <div
    role="status"
    className={cn('flex items-center justify-center gap-2 py-12 text-[13px] text-ink-muted', className)}
  >
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
    {label}
  </div>
);

type EmptyProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
};

export const EmptyState = ({ title, description, icon }: EmptyProps) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-ink-subtle">
      {icon ?? <Inbox className="h-5 w-5" />}
    </div>
    <p className="text-sm font-medium text-ink">{title}</p>
    {description && <p className="max-w-sm text-[13px] text-ink-muted">{description}</p>}
  </div>
);

type ErrorProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export const ErrorState = ({ title = "We couldn't load this", message, onRetry }: ErrorProps) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center gap-3 py-12 text-center"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-alert">
      <AlertTriangle className="h-5 w-5" />
    </div>
    <div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-md text-[13px] text-ink-muted">{message}</p>
    </div>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);
