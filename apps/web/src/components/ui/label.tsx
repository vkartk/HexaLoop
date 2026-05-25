import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Label = ({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn('mb-1.5 inline-block text-[13px] font-medium text-ink', className)}
    {...rest}
  />
);
