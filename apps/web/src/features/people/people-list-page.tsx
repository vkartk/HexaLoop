import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/states';
import { usePeople, type PeopleListFilters } from './use-people';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Role = components['schemas']['Role'];
type PersonStatus = components['schemas']['PersonStatus'];

const ROLE_TABS: { value: Role | 'All'; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Maverick', label: 'Mavericks' },
  { value: 'Supervisor', label: 'Supervisors' },
  { value: 'Admin', label: 'Admins' },
];

const ROLE_TONE: Record<Role, 'brand' | 'ok' | 'neutral'> = {
  Admin: 'brand',
  Supervisor: 'ok',
  Maverick: 'neutral',
};

const initials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const PeopleListPage = () => {
  const [params, setParams] = useSearchParams();

  const role = (params.get('role') ?? 'All') as Role | 'All';
  const status = (params.get('status') ?? 'All') as PersonStatus | 'All';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1');

  const filters: PeopleListFilters = useMemo(
    () => ({
      role: role === 'All' ? undefined : role,
      status: status === 'All' ? undefined : status,
      q: q || undefined,
      page,
      pageSize: 25,
    }),
    [role, status, q, page],
  );

  const query = usePeople(filters);

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
        title="People"
        description="Mavericks, supervisors, and admins. Search by name, email, or employee code."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b-hairline border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label="Filter by role" className="flex flex-wrap gap-1">
            {ROLE_TABS.map((tab) => {
              const active = (role as string) === tab.value;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() =>
                    updateParams({ role: tab.value === 'All' ? null : tab.value, page: null })
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
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="people-status">Filter by status</label>
            <select
              id="people-status"
              className="h-9 rounded-md border-hairline border-border bg-surface px-2 text-[13px] text-ink focus-ring"
              value={status}
              onChange={(e) =>
                updateParams({
                  status: e.target.value === 'All' ? null : e.target.value,
                  page: null,
                })
              }
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="relative md:w-64">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              />
              <Input
                type="search"
                defaultValue={q}
                placeholder="Search people…"
                className="pl-9"
                onChange={(e) => {
                  const value = e.target.value;
                  window.clearTimeout(
                    (window as unknown as { __peopleSearchT?: number }).__peopleSearchT,
                  );
                  (window as unknown as { __peopleSearchT?: number }).__peopleSearchT =
                    window.setTimeout(() => {
                      updateParams({ q: value || null, page: null });
                    }, 250);
                }}
              />
            </div>
          </div>
        </div>

        <CardContent className="px-0">
          {query.isLoading && <LoadingState label="Loading people…" />}
          {query.isError && (
            <ErrorState
              message={query.error instanceof Error ? query.error.message : 'Unknown error'}
              onRetry={() => query.refetch()}
            />
          )}
          {query.data && query.data.data.length === 0 && (
            <EmptyState
              title="No people match"
              description="Try a different role, status, or search term."
            />
          )}
          {query.data && query.data.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-subtle">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Role</th>
                    <th className="px-4 py-2 text-left font-medium">Manager</th>
                    <th className="px-4 py-2 text-left font-medium">Employee code</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.data.map((p) => (
                    <tr key={p.id} className="border-t-hairline border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[12px] font-medium text-brand-700">
                            {initials(p.fullName)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink">{p.fullName}</div>
                            <div className="truncate text-[12px] text-ink-subtle">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={ROLE_TONE[p.role]}>{p.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{p.managerName ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-muted">{p.employeeCode ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={p.status === 'Active' ? 'ok' : 'neutral'}>{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {p.lastActiveAt ? formatRelativeTime(p.lastActiveAt) : '—'}
                      </td>
                    </tr>
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
    </div>
  );
};
