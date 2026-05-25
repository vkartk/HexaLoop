import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/states';
import { useCycles, type CycleListFilters } from './use-cycles';
import { CloseCycleDialog } from './close-cycle-dialog';
import { cn, formatPercent, formatRelativeTime } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Cycle = components['schemas']['Cycle'];
type CycleStatus = components['schemas']['CycleStatus'];

const STATUS_TABS: { value: CycleStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Open', label: 'Open' },
  { value: 'Closed', label: 'Closed' },
  { value: 'OverrideClosed', label: 'Override-closed' },
];

const STATUS_TONE: Record<CycleStatus, 'brand' | 'ok' | 'warn'> = {
  Open: 'brand',
  Closed: 'ok',
  OverrideClosed: 'warn',
};

const STATUS_LABEL: Record<CycleStatus, string> = {
  Open: 'Open',
  Closed: 'Closed',
  OverrideClosed: 'Override-closed',
};

export const CyclesListPage = () => {
  const [params, setParams] = useSearchParams();
  const [closing, setClosing] = useState<Cycle | null>(null);

  const status = (params.get('status') ?? 'All') as CycleStatus | 'All';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1');

  const filters: CycleListFilters = useMemo(
    () => ({
      status: status === 'All' ? undefined : status,
      q: q || undefined,
      page,
      pageSize: 20,
    }),
    [status, q, page],
  );

  const query = useCycles(filters);

  const updateParams = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === '' || v === 'All') sp.delete(k);
      else sp.set(k, v);
    }
    setParams(sp, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Cycles"
        description="Open feedback cycles, closed history, and override-close audit trail."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b-hairline border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => {
              const active = (status as string) === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() =>
                    updateParams({ status: tab.value === 'All' ? null : tab.value, page: null })
                  }
                  className={cn(
                    'rounded-md px-3 py-1.5 text-[12px] font-medium focus-ring',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-muted hover:bg-surface-alt hover:text-ink',
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="relative md:w-72">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
            />
            <Input
              type="search"
              defaultValue={q}
              placeholder="Search course or trainer…"
              className="pl-9"
              onChange={(e) => {
                const value = e.target.value;
                window.clearTimeout((window as any).__cyclesSearchT);
                (window as any).__cyclesSearchT = window.setTimeout(() => {
                  updateParams({ q: value || null, page: null });
                }, 250);
              }}
            />
          </div>
        </div>

        <CardContent className="px-0">
          {query.isLoading && <LoadingState label="Loading cycles…" />}
          {query.isError && (
            <ErrorState
              message={query.error instanceof Error ? query.error.message : 'Unknown error'}
              onRetry={() => query.refetch()}
            />
          )}
          {query.data && query.data.data.length === 0 && (
            <EmptyState
              title="No cycles match"
              description="Adjust the filters or clear the search to see more."
            />
          )}
          {query.data && query.data.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-subtle">
                    <th className="px-4 py-2 text-left font-medium">Cycle</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-right font-medium">Completion</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Closes</th>
                    <th className="px-4 py-2 text-right font-medium" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {query.data.data.map((c) => (
                    <CycleRow key={c.id} cycle={c} onCloseClick={() => setClosing(c)} />
                  ))}
                </tbody>
              </table>
            </div>
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
                onClick={() => updateParams({ page: String(query.data!.page - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={query.data.page * query.data.pageSize >= query.data.total}
                onClick={() => updateParams({ page: String(query.data!.page + 1) })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CloseCycleDialog cycle={closing} onClose={() => setClosing(null)} />
    </div>
  );
};

const CycleRow = ({
  cycle,
  onCloseClick,
}: {
  cycle: Cycle;
  onCloseClick: () => void;
}) => {
  const below = cycle.completionRate < cycle.threshold;
  return (
    <tr className="border-t-hairline border-border">
      <td className="px-4 py-3">
        <div className="font-medium text-ink">{cycle.courseName}</div>
        {cycle.trainerName && (
          <div className="text-[12px] text-ink-subtle">{cycle.trainerName}</div>
        )}
      </td>
      <td className="px-4 py-3 text-ink-muted">
        {cycle.type === 'MaverickPostTraining' ? 'Post-training' : 'Effectiveness'}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex flex-col items-end gap-0.5">
          <span className={cn('font-medium', below ? 'text-alert' : 'text-ink')}>
            {formatPercent(cycle.completionRate)}
          </span>
          <span className="text-[11px] text-ink-subtle">
            {cycle.responseCount} / {cycle.expectedCount}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge tone={STATUS_TONE[cycle.status]}>{STATUS_LABEL[cycle.status]}</Badge>
        {cycle.status === 'OverrideClosed' && cycle.overrideReason && (
          <p
            className="mt-1 max-w-xs truncate text-[11px] text-ink-subtle"
            title={cycle.overrideReason}
          >
            {cycle.overrideReason}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-ink-muted">
        {cycle.status === 'Open'
          ? cycle.closesAt
            ? `in ${formatRelativeTime(cycle.closesAt).replace('in ', '')}`
            : 'No deadline'
          : cycle.closedAt
            ? `Closed ${formatRelativeTime(cycle.closedAt)}`
            : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        {cycle.status === 'Open' ? (
          <Button size="sm" variant={below ? 'secondary' : 'primary'} onClick={onCloseClick}>
            Close
          </Button>
        ) : (
          <span className="text-[12px] text-ink-subtle">{cycle.closedByName ?? '—'}</span>
        )}
      </td>
    </tr>
  );
};
