import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback/states';
import { useEffectivenessQueue } from './use-effectiveness';
import { formatRelativeTime } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Item = components['schemas']['EffectivenessPendingItem'];

const STATUS_LABEL: Record<Item['status'], string> = {
  NotStarted: 'Not started',
  Draft: 'Draft saved',
  Submitted: 'Submitted',
};

const STATUS_TONE: Record<Item['status'], 'warn' | 'brand' | 'ok'> = {
  NotStarted: 'warn',
  Draft: 'brand',
  Submitted: 'ok',
};

const initials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const EffectivenessQueuePage = () => {
  const q = useEffectivenessQueue();

  if (q.isLoading) return <LoadingState label="Loading queue…" />;
  if (q.isError)
    return (
      <ErrorState
        message={q.error instanceof Error ? q.error.message : 'Unknown error'}
        onRetry={() => q.refetch()}
      />
    );
  if (!q.data) return null;

  const { pending, recentlySubmitted } = q.data;

  return (
    <div>
      <PageHeader
        title="Effectiveness queue"
        description="Rate each Maverick across four criteria. Drafts save automatically."
      />

      <Card>
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <p className="mt-1 text-[13px] text-ink-muted">
            {pending.length} {pending.length === 1 ? 'evaluation' : 'evaluations'} waiting on you.
          </p>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="You're all caught up"
              description="No effectiveness forms are waiting for you right now."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((item) => (
                <li key={`${item.cycleId}:${item.maverickId}`}>
                  <Link
                    to={`/supervisor/effectiveness/${item.cycleId}/${item.maverickId}`}
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-alt focus-ring"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-medium text-brand-700">
                      {initials(item.maverickName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {item.maverickName}
                      </p>
                      <p className="truncate text-[12px] text-ink-muted">
                        {item.courseName} · due {formatRelativeTime(item.dueAt)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                    <ChevronRight className="h-4 w-4 text-ink-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recently submitted</CardTitle>
        </CardHeader>
        <CardContent>
          {recentlySubmitted.length === 0 ? (
            <EmptyState title="No recent submissions" />
          ) : (
            <ul className="divide-y divide-border">
              {recentlySubmitted.map((item) => (
                <li
                  key={`${item.cycleId}:${item.maverickId}`}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-ok">
                    <ClipboardCheck className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">
                      {item.maverickName}
                    </p>
                    <p className="truncate text-[12px] text-ink-muted">
                      {item.courseName} · submitted{' '}
                      {item.submittedAt ? formatRelativeTime(item.submittedAt) : 'recently'}
                    </p>
                  </div>
                  <Badge tone="ok">Submitted</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
