import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback/states';
import { useMaverickDashboard } from './use-maverick-dashboard';
import { useAuthStore } from '@/stores/auth-store';
import { formatPercent, formatRelativeTime } from '@/lib/utils';
import { ChevronRight, Star, CheckCircle2 } from 'lucide-react';
import type { components } from '@/lib/api/schema.gen';

type Item = components['schemas']['PendingFeedbackItem'];

const STATUS_TONE: Record<Item['status'], 'warn' | 'brand' | 'ok'> = {
  NotStarted: 'warn',
  Draft: 'brand',
  Submitted: 'ok',
};

const STATUS_LABEL: Record<Item['status'], string> = {
  NotStarted: 'Not started',
  Draft: 'Draft saved',
  Submitted: 'Submitted',
};

export const MaverickDashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const q = useMaverickDashboard();

  if (q.isLoading) return <LoadingState label="Loading your feedback…" />;
  if (q.isError)
    return (
      <ErrorState message={q.error instanceof Error ? q.error.message : 'Unknown error'} onRetry={() => q.refetch()} />
    );
  if (!q.data) return <EmptyState title="Nothing to show yet" />;

  const { pending, completed, streak } = q.data;

  return (
    <div>
      <PageHeader
        title={`Hi ${user?.fullName.split(' ')[0] ?? ''}`}
        description="Your training feedback, in one place. Most of it takes under a minute."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="px-5 py-4">
          <p className="text-[12px] uppercase tracking-wide text-ink-subtle">Pending</p>
          <p className="mt-2 text-2xl font-medium">{pending.length}</p>
          <p className="mt-1 text-[12px] text-ink-muted">Feedback to give</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-[12px] uppercase tracking-wide text-ink-subtle">Submitted</p>
          <p className="mt-2 text-2xl font-medium">{streak.submittedCount}</p>
          <p className="mt-1 text-[12px] text-ink-muted">Lifetime responses</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-[12px] uppercase tracking-wide text-ink-subtle">On-time rate</p>
          <p className="mt-2 text-2xl font-medium">{formatPercent(streak.onTimeRate)}</p>
          <p className="mt-1 text-[12px] text-ink-muted">Across the last 12 cycles</p>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Pending feedback</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">
              Open each one to rate the trainer and share your reflections.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="You're all caught up"
              description="No feedback forms are waiting for you right now."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((item) => (
                <li key={item.cycleId}>
                  <Link
                    to={`/feedback/${item.cycleId}`}
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-alt focus-ring"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                      <Star className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">
                        {item.courseName}
                      </p>
                      <p className="truncate text-[12px] text-ink-muted">
                        {item.trainerName ?? 'Trainer TBA'} · due {formatRelativeTime(item.dueAt)}
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
          <CardTitle>Recent submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <EmptyState title="No submissions yet" />
          ) : (
            <ul className="divide-y divide-border">
              {completed.map((c) => (
                <li
                  key={c.cycleId}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-ok">
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">{c.courseName}</p>
                    <p className="truncate text-[12px] text-ink-muted">
                      Submitted {formatRelativeTime(c.dueAt)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
