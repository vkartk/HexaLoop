import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Download, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/states';
import { useReports, useTriggerReport } from './use-reports';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Report = components['schemas']['Report'];
type ReportRequest = components['schemas']['ReportRequest'];

type FormValues = {
  scope: ReportRequest['scope'];
  format: ReportRequest['format'];
  cycleStatus: '' | NonNullable<ReportRequest['cycleStatus']>;
  dateFrom: string;
  dateTo: string;
};

const STATUS_TONE: Record<Report['status'], 'brand' | 'ok' | 'warn' | 'alert'> = {
  Queued: 'brand',
  Running: 'brand',
  Ready: 'ok',
  Failed: 'alert',
};

export const ReportsPage = () => {
  const reports = useReports();
  const trigger = useTriggerReport();
  const [justGenerated, setJustGenerated] = useState<string | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      scope: 'Cycles',
      format: 'Xlsx',
      cycleStatus: '',
      dateFrom: '',
      dateTo: '',
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    trigger.mutate(
      {
        scope: values.scope,
        format: values.format,
        cycleStatus: values.cycleStatus || undefined,
        dateFrom: values.dateFrom || null,
        dateTo: values.dateTo || null,
      },
      {
        onSuccess: (report) => {
          setJustGenerated(report.id);
          window.setTimeout(() => setJustGenerated(null), 4000);
        },
      },
    );
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Export cycle, trainer, and sentiment data. Generated reports are available for 30 days."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Generate a report</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">
              Pick a scope and format. We'll email you when it's ready.
            </p>
          </CardHeader>
          <CardContent>
            <form noValidate onSubmit={onSubmit} className="space-y-3">
              <div>
                <Label htmlFor="scope">Scope</Label>
                <select
                  id="scope"
                  {...form.register('scope')}
                  className="h-10 w-full rounded-md border-hairline border-border bg-surface px-3 text-sm text-ink focus-ring focus-visible:border-brand"
                >
                  <option value="Cycles">Cycles overview</option>
                  <option value="Trainers">Trainer scorecard</option>
                  <option value="Sentiment">Sentiment by course</option>
                </select>
              </div>

              <div>
                <Label htmlFor="format">Format</Label>
                <select
                  id="format"
                  {...form.register('format')}
                  className="h-10 w-full rounded-md border-hairline border-border bg-surface px-3 text-sm text-ink focus-ring focus-visible:border-brand"
                >
                  <option value="Xlsx">Excel (.xlsx)</option>
                  <option value="Csv">CSV (.csv)</option>
                  <option value="Pdf">PDF (.pdf)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="cycleStatus">Cycle status (optional)</Label>
                <select
                  id="cycleStatus"
                  {...form.register('cycleStatus')}
                  className="h-10 w-full rounded-md border-hairline border-border bg-surface px-3 text-sm text-ink focus-ring focus-visible:border-brand"
                >
                  <option value="">Any</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="OverrideClosed">Override-closed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateFrom">From</Label>
                  <Input id="dateFrom" type="date" {...form.register('dateFrom')} />
                </div>
                <div>
                  <Label htmlFor="dateTo">To</Label>
                  <Input id="dateTo" type="date" {...form.register('dateTo')} />
                </div>
              </div>

              {trigger.isError && (
                <div
                  role="alert"
                  className="rounded-md border-hairline border-red-100 bg-red-50 px-3 py-2 text-[13px] text-red-700"
                >
                  {trigger.error.message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={trigger.isPending}>
                {trigger.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {trigger.isPending ? 'Generating…' : 'Generate report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent reports</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">Newest first. Reports live for 30 days.</p>
          </CardHeader>
          <CardContent className="px-0">
            {reports.isLoading && <LoadingState label="Loading reports…" />}
            {reports.isError && (
              <ErrorState
                message={reports.error instanceof Error ? reports.error.message : 'Unknown error'}
                onRetry={() => reports.refetch()}
              />
            )}
            {reports.data && reports.data.data.length === 0 && (
              <EmptyState
                title="No reports yet"
                description="Generate your first export using the form on the left."
              />
            )}
            {reports.data && reports.data.data.length > 0 && (
              <ul className="divide-y divide-border">
                {reports.data.data.map((r) => (
                  <ReportRow key={r.id} report={r} highlighted={r.id === justGenerated} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SCOPE_LABEL: Record<Report['scope'], string> = {
  Cycles: 'Cycles overview',
  Trainers: 'Trainer scorecard',
  Sentiment: 'Sentiment by course',
};

const ReportRow = ({ report, highlighted }: { report: Report; highlighted: boolean }) => (
  <li
    className={cn(
      'flex flex-col gap-2 px-5 py-3 transition-colors sm:flex-row sm:items-center',
      highlighted && 'bg-emerald-50',
    )}
  >
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate text-[14px] font-medium text-ink">{SCOPE_LABEL[report.scope]}</p>
        <Badge tone={STATUS_TONE[report.status]}>{report.status}</Badge>
        <Badge tone="neutral">{report.format.toUpperCase()}</Badge>
        {report.scope === 'Sentiment' && (
          <Badge tone="ai">
            <Sparkles className="h-3 w-3" aria-hidden />
            AI-assisted
          </Badge>
        )}
      </div>
      <p className="mt-1 text-[12px] text-ink-muted">
        Requested {formatRelativeTime(report.requestedAt)} by {report.requestedByName}
        {report.rowCount != null && <> · {report.rowCount} rows</>}
        {report.cycleStatus && <> · {report.cycleStatus}</>}
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {highlighted && (
        <span className="inline-flex items-center gap-1 text-[12px] text-ok">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Ready
        </span>
      )}
      {report.status === 'Ready' && report.downloadUrl && (
        <a
          href={report.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex h-8 items-center gap-2 rounded-md border-hairline border-border bg-surface px-3 text-[12px] font-medium text-ink hover:bg-surface-alt focus-ring"
        >
          <Download className="h-4 w-4" aria-hidden /> Download
        </a>
      )}
    </div>
  </li>
);
