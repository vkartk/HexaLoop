import { useMemo, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/states';
import { useFeedbackHistory, type HistoryFilters } from './use-history';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Status = components['schemas']['FeedbackHistoryItem']['status'];

const STATUS_TONE: Record<Status, 'brand' | 'neutral' | 'ok'> = {
  NotStarted: 'neutral',
  Draft: 'brand',
  Submitted: 'ok',
};

const STATUS_LABEL: Record<Status, string> = {
  NotStarted: 'Not started',
  Draft: 'Draft',
  Submitted: 'Submitted',
};

export const HistoryPage = () => {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? '1');

  const filters: HistoryFilters = useMemo(
    () => ({ page, pageSize: 20 }),
    [page],
  );

  const query = useFeedbackHistory(filters);

  const updatePage = (next: number) => {
    const sp = new URLSearchParams(params);
    if (next <= 1) sp.delete('page');
    else sp.set('page', String(next));
    setParams(sp, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Your feedback history"
        description="Every cycle you've answered — and the ones still waiting for you."
      />

      <Card>
        <CardContent className="px-0">
          {query.isLoading && <LoadingState label="Loading history…" />}
          {query.isError && (
            <ErrorState
              message={query.error instanceof Error ? query.error.message : 'Unknown error'}
              onRetry={() => query.refetch()}
            />
          )}
          {query.data && query.data.data.length === 0 && (
            <EmptyState
              title="No feedback yet"
              description="When you finish a course, the cycle will show up here."
            />
          )}
          {query.data && query.data.data.length > 0 && (
            <ul className="divide-y divide-border">
              {query.data.data.map((item) => {
                const actionable = item.status !== 'Submitted' && item.cycleStatus === 'Open';
                return (
                  <li
                    key={item.cycleId}
                    className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[14px] font-medium text-ink">
                          {item.courseName}
                        </p>
                        <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted">
                        {item.trainerName && <span>{item.trainerName}</span>}
                        {item.sessionEndedAt && (
                          <>
                            <span aria-hidden>·</span>
                            <span>Session ended {formatRelativeTime(item.sessionEndedAt)}</span>
                          </>
                        )}
                        {item.submittedAt ? (
                          <>
                            <span aria-hidden>·</span>
                            <span>Submitted {formatRelativeTime(item.submittedAt)}</span>
                          </>
                        ) : (
                          <>
                            <span aria-hidden>·</span>
                            <span>Due {formatRelativeTime(item.dueAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRow rating={item.overallRating} />
                      <LinkButton
                        to={`/feedback/${item.cycleId}`}
                        variant={actionable ? 'primary' : 'secondary'}
                      >
                        {actionable
                          ? item.status === 'Draft'
                            ? 'Continue'
                            : 'Start'
                          : 'View'}
                      </LinkButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>

        {query.data && query.data.total > query.data.pageSize && (
          <div className="flex items-center justify-between border-t-hairline border-border px-4 py-3 text-[12px] text-ink-muted">
            <span>
              Showing {(query.data.page - 1) * query.data.pageSize + 1}–
              {Math.min(query.data.page * query.data.pageSize, query.data.total)} of {query.data.total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={query.data.page <= 1}
                onClick={() => updatePage(query.data!.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={query.data.page * query.data.pageSize >= query.data.total}
                onClick={() => updatePage(query.data!.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

type LinkButtonProps = {
  to: string;
  children: ReactNode;
  variant: 'primary' | 'secondary';
};

const LinkButton = ({ to, children, variant }: LinkButtonProps) => (
  <Link
    to={to}
    className={cn(
      'inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors focus-ring',
      variant === 'primary'
        ? 'bg-brand text-white hover:bg-brand-600'
        : 'border-hairline border-border bg-surface text-ink hover:bg-surface-alt',
    )}
  >
    {children}
  </Link>
);

const StarRow = ({ rating }: { rating: number | null | undefined }) => {
  if (rating == null) {
    return <span className="text-[12px] text-ink-subtle">No rating</span>;
  }
  return (
    <div
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-3.5 w-3.5',
            n <= rating ? 'fill-amber-400 text-amber-400' : 'text-border-strong',
          )}
          aria-hidden
        />
      ))}
    </div>
  );
};
