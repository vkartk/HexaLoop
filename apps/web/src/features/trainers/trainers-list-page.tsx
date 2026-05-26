import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/states';
import { useTrainers, type TrainerListFilters } from './use-trainers';
import { TrainerScorecardDialog } from './trainer-scorecard-dialog';
import { cn, formatPercent } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Engagement = components['schemas']['TrainerEngagementType'];

const ENGAGEMENT_TABS: { value: Engagement | 'All'; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Internal', label: 'Internal' },
  { value: 'External', label: 'External' },
];

export const TrainersListPage = () => {
  const [params, setParams] = useSearchParams();
  const [openTrainerId, setOpenTrainerId] = useState<string | null>(null);

  const engagement = (params.get('engagement') ?? 'All') as Engagement | 'All';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1');

  const filters: TrainerListFilters = useMemo(
    () => ({
      engagementType: engagement === 'All' ? undefined : engagement,
      q: q || undefined,
      page,
      pageSize: 20,
    }),
    [engagement, q, page],
  );

  const query = useTrainers(filters);

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
        title="Trainers"
        description="Internal and external trainers across the programme, with rolling rating and completion."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b-hairline border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Filter by engagement" className="flex flex-wrap gap-1">
            {ENGAGEMENT_TABS.map((tab) => {
              const active = (engagement as string) === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() =>
                    updateParams({ engagement: tab.value === 'All' ? null : tab.value, page: null })
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
              placeholder="Search name or organisation…"
              className="pl-9"
              onChange={(e) => {
                const value = e.target.value;
                window.clearTimeout((window as unknown as { __trainersSearchT?: number }).__trainersSearchT);
                (window as unknown as { __trainersSearchT?: number }).__trainersSearchT = window.setTimeout(() => {
                  updateParams({ q: value || null, page: null });
                }, 250);
              }}
            />
          </div>
        </div>

        <CardContent className="px-0">
          {query.isLoading && <LoadingState label="Loading trainers…" />}
          {query.isError && (
            <ErrorState
              message={query.error instanceof Error ? query.error.message : 'Unknown error'}
              onRetry={() => query.refetch()}
            />
          )}
          {query.data && query.data.data.length === 0 && (
            <EmptyState
              title="No trainers match"
              description="Adjust the filters or clear the search to see more."
            />
          )}
          {query.data && query.data.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-subtle">
                    <th className="px-4 py-2 text-left font-medium">Trainer</th>
                    <th className="px-4 py-2 text-left font-medium">Engagement</th>
                    <th className="px-4 py-2 text-left font-medium">Domain</th>
                    <th className="px-4 py-2 text-right font-medium">Sessions</th>
                    <th className="px-4 py-2 text-right font-medium">Avg rating</th>
                    <th className="px-4 py-2 text-right font-medium">Completion</th>
                    <th className="px-4 py-2 text-right font-medium" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {query.data.data.map((t) => {
                    const below = t.completionRate < 0.78;
                    return (
                      <tr key={t.trainerId} className="border-t-hairline border-border">
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{t.name}</div>
                          {t.organization && (
                            <div className="text-[12px] text-ink-subtle">{t.organization}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={t.engagementType === 'Internal' ? 'brand' : 'neutral'}>
                            {t.engagementType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{t.domain}</td>
                        <td className="px-4 py-3 text-right text-ink-muted">{t.sessions}</td>
                        <td className="px-4 py-3 text-right font-medium text-ink">
                          {t.avgRating.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge tone={below ? 'warn' : 'ok'}>
                            {formatPercent(t.completionRate)} {below ? '· below threshold' : ''}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setOpenTrainerId(t.trainerId)}
                          >
                            View scorecard
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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

      <TrainerScorecardDialog
        trainerId={openTrainerId}
        onClose={() => setOpenTrainerId(null)}
      />
    </div>
  );
};
