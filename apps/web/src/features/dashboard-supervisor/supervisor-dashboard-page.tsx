import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback/states';
import { MetricCard } from '@/components/dashboards/metric-card';
import { useSupervisorDashboard } from './use-supervisor-dashboard';
import { useAuthStore } from '@/stores/auth-store';
import { formatRelativeTime } from '@/lib/utils';
import { Users, ChevronRight } from 'lucide-react';

export const SupervisorDashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const q = useSupervisorDashboard();

  if (q.isLoading) return <LoadingState label="Loading your team…" />;
  if (q.isError)
    return (
      <ErrorState message={q.error instanceof Error ? q.error.message : 'Unknown error'} onRetry={() => q.refetch()} />
    );
  if (!q.data) return <EmptyState title="Nothing to show yet" />;

  const { team, metrics, pendingEvaluations } = q.data;

  return (
    <div>
      <PageHeader
        title={`Team overview, ${user?.fullName.split(' ')[0] ?? ''}`}
        description={`${pendingEvaluations} effectiveness ${pendingEvaluations === 1 ? 'form' : 'forms'} waiting on you.`}
        actions={
          <Link
            to="/supervisor/evaluations"
            className="inline-flex h-8 items-center gap-2 rounded-md bg-brand px-3 text-[13px] font-medium text-white hover:bg-brand-600 focus-ring"
          >
            <Users className="h-4 w-4" aria-hidden />
            Open effectiveness queue
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
        <Card className="px-5 py-4">
          <p className="text-[12px] uppercase tracking-wide text-ink-subtle">Pending evaluations</p>
          <p className="mt-2 text-2xl font-medium">{pendingEvaluations}</p>
          <p className="mt-1 text-[12px] text-ink-muted">Across your direct reports</p>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your team</CardTitle>
          <p className="mt-1 text-[13px] text-ink-muted">
            Outstanding effectiveness forms by Maverick.
          </p>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <EmptyState title="No reports assigned" />
          ) : (
            <ul className="divide-y divide-border">
              {team.map((row) => (
                <li key={row.maverickId}>
                  <Link
                    to="/supervisor/evaluations"
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-alt focus-ring"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-medium text-brand-700">
                      {row.maverickName
                        .split(' ')
                        .map((p) => p[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">{row.maverickName}</p>
                      <p className="truncate text-[12px] text-ink-muted">
                        Last submission{' '}
                        {row.lastSubmittedAt ? formatRelativeTime(row.lastSubmittedAt) : 'never'}
                      </p>
                    </div>
                    {row.pendingCount > 0 ? (
                      <Badge tone="warn">
                        {row.pendingCount} pending
                      </Badge>
                    ) : (
                      <Badge tone="ok">Up to date</Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-ink-subtle" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
