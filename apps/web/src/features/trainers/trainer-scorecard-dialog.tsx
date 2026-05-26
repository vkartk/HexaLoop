import { Dialog } from '@/components/ui/dialog';
import { Badge, AiBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState } from '@/components/feedback/states';
import { useTrainerScorecard } from './use-trainers';
import { cn, formatPercent, formatRelativeTime } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type CycleStatus = components['schemas']['CycleStatus'];

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

type Props = {
  trainerId: string | null;
  onClose: () => void;
};

export const TrainerScorecardDialog = ({ trainerId, onClose }: Props) => {
  const q = useTrainerScorecard(trainerId);
  const open = !!trainerId;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={q.data?.trainer.name ?? 'Trainer scorecard'}
      description={
        q.data
          ? `${q.data.trainer.engagementType} · ${q.data.trainer.domain}`
          : 'Lifetime stats, sentiment, and recent cycles.'
      }
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {q.isLoading && <LoadingState label="Loading scorecard…" />}
      {q.isError && (
        <ErrorState
          message={q.error instanceof Error ? q.error.message : 'Unknown error'}
          onRetry={() => q.refetch()}
        />
      )}
      {q.data && (
        <div className="space-y-5">
          <section aria-label="Lifetime stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Sessions" value={String(q.data.lifetime.sessions)} />
            <Stat label="Responses" value={String(q.data.lifetime.responses)} />
            <Stat label="Avg rating" value={q.data.lifetime.avgRating.toFixed(1)} />
            <Stat label="Completion" value={formatPercent(q.data.lifetime.completionRate)} />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-ink">Sentiment</h3>
              <AiBadge degraded={q.data.sentiment.ai.degraded} />
            </div>
            <SentimentBar
              positive={q.data.sentiment.positive}
              neutral={q.data.sentiment.neutral}
              negative={q.data.sentiment.negative}
            />
            <ul className="mt-3 flex flex-wrap gap-4 text-[12px] text-ink-muted">
              <Legend swatch="bg-ok" label="Positive" value={q.data.sentiment.positive} />
              <Legend
                swatch="bg-border-strong"
                label="Neutral"
                value={q.data.sentiment.neutral}
              />
              <Legend swatch="bg-alert" label="Negative" value={q.data.sentiment.negative} />
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-[13px] font-medium text-ink">Recent cycles</h3>
            {q.data.recentCycles.length === 0 ? (
              <p className="text-[13px] text-ink-muted">No cycles yet for this trainer.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {q.data.recentCycles.map((c) => (
                  <li
                    key={c.cycleId}
                    className="flex items-center justify-between rounded-md border-hairline border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {c.courseName}
                      </p>
                      <p className="text-[11px] text-ink-subtle">
                        {c.closedAt ? `Closed ${formatRelativeTime(c.closedAt)}` : 'Open'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[12px]">
                      <span className="text-ink-muted">
                        {c.avgRating != null ? `${c.avgRating.toFixed(1)} ★` : '—'}
                      </span>
                      <span
                        className={cn(
                          'font-medium',
                          c.completionRate < 0.78 ? 'text-alert' : 'text-ink',
                        )}
                      >
                        {formatPercent(c.completionRate)}
                      </span>
                      <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border-hairline border-border bg-surface px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-ink-subtle">{label}</p>
    <p className="mt-0.5 text-[15px] font-medium text-ink">{value}</p>
  </div>
);

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

const Legend = ({
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
