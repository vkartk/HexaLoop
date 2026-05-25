import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('surface', className)} {...rest} />
);

export const CardHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 pt-5 pb-3', className)} {...rest} />
);

export const CardTitle = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-[15px] font-medium text-ink', className)} {...rest} />
);

export const CardDescription = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('mt-1 text-[13px] text-ink-muted', className)} {...rest} />
);

export const CardContent = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 pb-5', className)} {...rest} />
);

export const CardFooter = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 pb-5 pt-3', className)} {...rest} />
);
