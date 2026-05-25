import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'alert' | 'ai';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-alt text-ink-muted border-border',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warn: 'bg-amber-50 text-amber-700 border-amber-100',
  alert: 'bg-red-50 text-red-700 border-red-100',
  ai: 'bg-ai-50 text-ai-600 border-ai-100',
};

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

export const Badge = ({ className, tone = 'neutral', children, ...rest }: Props) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full border-hairline px-2 py-0.5 text-[11px] font-medium',
      TONES[tone],
      className,
    )}
    {...rest}
  >
    {children}
  </span>
);

type AiBadgeProps = {
  degraded: boolean;
  className?: string;
};

export const AiBadge = ({ degraded, className }: AiBadgeProps) => (
  <Badge tone="ai" className={className} title={degraded ? 'Basic estimate (stub)' : 'AI'}>
    <Sparkles aria-hidden className="h-3 w-3" />
    {degraded ? 'Basic estimate' : 'AI'}
  </Badge>
);
