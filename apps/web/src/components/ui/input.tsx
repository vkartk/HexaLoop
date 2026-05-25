import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border-hairline border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle',
        'focus-ring focus-visible:border-brand',
        'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-ink-subtle',
        'aria-[invalid=true]:border-alert',
        className,
      )}
      {...rest}
    />
  );
});
