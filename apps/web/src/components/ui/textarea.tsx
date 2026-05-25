import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'block w-full resize-y rounded-md border-hairline border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle',
        'focus-ring focus-visible:border-brand',
        'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-subtle',
        'aria-[invalid=true]:border-alert',
        className,
      )}
      {...rest}
    />
  );
});
