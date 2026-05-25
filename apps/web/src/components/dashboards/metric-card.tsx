import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { components } from '@/lib/api/schema.gen';
import { cn } from '@/lib/utils';

type Props = {
  metric: components['schemas']['MetricCard'];
};

export const MetricCard = ({ metric }: Props) => {
  const dir = metric.trend?.direction;
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  const trendClass =
    dir === 'up'
      ? 'text-ok'
      : dir === 'down'
        ? 'text-alert'
        : 'text-ink-subtle';

  return (
    <Card className="flex flex-col gap-3 px-5 py-4">
      <p className="text-[12px] uppercase tracking-wide text-ink-subtle">{metric.label}</p>
      <p className="text-2xl font-medium tracking-tight text-ink">{metric.value}</p>
      <div className="flex items-center justify-between">
        <p className="truncate text-[12px] text-ink-muted">{metric.helper ?? ''}</p>
        {metric.trend && (
          <span className={cn('inline-flex items-center gap-1 text-[12px] font-medium', trendClass)}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {Math.abs(metric.trend.deltaPct).toFixed(1)}%
          </span>
        )}
      </div>
    </Card>
  );
};
