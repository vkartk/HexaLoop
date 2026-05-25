import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, AiBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback/states';
import { MetricCard } from '@/components/dashboards/metric-card';
import { useAdminDashboard } from './use-admin-dashboard';
import { useAuthStore } from '@/stores/auth-store';
import { cn, formatPercent, formatRelativeTime } from '@/lib/utils';
import { Sparkles, Filter, Download } from 'lucide-react';

export const AdminDashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const q = useAdminDashboard();

  if (q.isLoading) return <LoadingState label="Loading dashboard…" />;
  if (q.isError)
    return (
      <ErrorState message={q.error instanceof Error ? q.error.message : 'Unknown error'} onRetry={() => q.refetch()} />
    );
  if (!q.data) return <EmptyState title="No dashboard data yet" />;

  const { metrics, sentiment, trainers, alerts, insight } = q.data;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName.split(' ')[0] ?? ''}`}
        description="Snapshot of cycle health, sentiment, and trainer performance."
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4" aria-hidden /> Filters
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4" aria-hidden /> Export
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>Feedback sentiment</CardTitle>
              <p className="mt-1 text-[13px] text-ink-muted">
                Across {sentiment.ai.sourceCount ?? 0} responses · updated{' '}
                {sentiment.ai.generatedAt ? formatRelativeTime(sentiment.ai.generatedAt) : 'recently'}
              </p>
            </div>
            <AiBadge degraded={sentiment.ai.degraded} />
          </CardHeader>
          <CardContent>
            <SentimentBar
              positive={sentiment.positive}
              neutral={sentiment.neutral}
              negative={sentiment.negative}
            />
            <ul className="mt-4 flex flex-wrap gap-4 text-[12px] text-ink-muted">
              <SentimentLegend swatch="bg-ok" label="Positive" value={sentiment.positive} />
              <SentimentLegend swatch="bg-border-strong" label="Neutral" value={sentiment.neutral} />
              <SentimentLegend swatch="bg-alert" label="Negative" value={sentiment.negative} />
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-start justify-between">
            <div>
              <CardTitle>AI insight</CardTitle>
              <p className="mt-1 text-[13px] text-ink-muted">Synthesised across recent cycles</p>
            </div>
            <AiBadge degraded={insight.ai.degraded} />
          </CardHeader>
          <CardContent>
            <p className="text-[13px] leading-relaxed text-ink">{insight.summary}</p>
            {insight.topThemes && insight.topThemes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {insight.topThemes.map((t) => (
                  <Badge key={t} tone="ai">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            <button
              type="button"
              className="mt-4 text-[12px] font-medium text-ai-600 hover:underline focus-ring rounded"
            >
              View source responses
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trainer scorecard</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">
              Avg rating + completion across the last 90 days
            </p>
          </CardHeader>
          <CardContent>
            {trainers.length === 0 ? (
              <EmptyState title="No trainer data yet" />
            ) : (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[560px] border-separate border-spacing-0 text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-ink-subtle">
                      <th className="px-2 py-2 text-left font-medium">Trainer</th>
                      <th className="px-2 py-2 text-right font-medium">Sessions</th>
                      <th className="px-2 py-2 text-right font-medium">Avg rating</th>
                      <th className="px-2 py-2 text-right font-medium">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainers.map((t) => (
                      <tr key={t.trainerId} className="border-t-hairline border-border">
                        <td className="px-2 py-3">
                          <div className="font-medium text-ink">{t.name}</div>
                          {t.organization && (
                            <div className="text-[12px] text-ink-subtle">{t.organization}</div>
                          )}
                        </td>
                        <td className="px-2 py-3 text-right text-ink-muted">{t.sessions}</td>
                        <td className="px-2 py-3 text-right font-medium text-ink">
                          {t.avgRating.toFixed(1)}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <CompletionPill rate={t.completionRate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">Things that need attention</p>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <EmptyState title="All clear" description="No active alerts right now." />
            ) : (
              <ul className="flex flex-col gap-3">
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        a.severity === 'alert'
                          ? 'bg-alert'
                          : a.severity === 'warn'
                            ? 'bg-warn'
                            : 'bg-brand',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">{a.title}</p>
                      {a.body && (
                        <p className="mt-0.5 text-[12px] text-ink-muted">{a.body}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-subtle">
                        <span>{formatRelativeTime(a.createdAt)}</span>
                        {a.cycleId && (
                          <Link
                            to={`/admin/cycles/${a.cycleId}`}
                            className="font-medium text-brand hover:underline focus-ring rounded"
                          >
                            Open cycle
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SentimentBar = ({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) => {
  const total = positive + neutral + negative || 1;
  return (
    <div
      role="img"
      aria-label={`Positive ${formatPercent(positive)}, neutral ${formatPercent(neutral)}, negative ${formatPercent(negative)}`}
      className="flex h-3 w-full overflow-hidden rounded-full bg-surface-alt"
    >
      <span className="block h-full bg-ok" style={{ width: `${(positive / total) * 100}%` }} />
      <span
        className="block h-full bg-border-strong"
        style={{ width: `${(neutral / total) * 100}%` }}
      />
      <span className="block h-full bg-alert" style={{ width: `${(negative / total) * 100}%` }} />
    </div>
  );
};

const SentimentLegend = ({
  swatch,
  label,
  value,
}: {
  swatch: string;
  label: string;
  value: number;
}) => (
  <li className="flex items-center gap-2">
    <span aria-hidden className={cn('h-2.5 w-2.5 rounded-sm', swatch)} />
    <span className="font-medium text-ink">{formatPercent(value)}</span>
    <span>{label}</span>
  </li>
);

const CompletionPill = ({ rate }: { rate: number }) => {
  const below = rate < 0.78;
  return (
    <Badge tone={below ? 'warn' : 'ok'}>
      {formatPercent(rate)} {below ? '· below threshold' : ''}
    </Badge>
  );
};
