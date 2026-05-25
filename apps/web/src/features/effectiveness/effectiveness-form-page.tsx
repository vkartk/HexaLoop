import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Cloud, CloudOff, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScaleControl } from '@/components/ui/scale-control';
import { LoadingState, ErrorState } from '@/components/feedback/states';
import {
  useAutosaveEffectiveness,
  useEffectivenessBundle,
  useSubmitEffectiveness,
} from './use-effectiveness';
import { cn, formatRelativeTime } from '@/lib/utils';

const MAX_TEXT = 2000;
const AUTOSAVE_DEBOUNCE_MS = 800;

const CRITERIA = [
  {
    name: 'technicalCompetency',
    label: 'Technical competency',
    helper: 'Hands-on skill, tooling, and understanding of fundamentals.',
  },
  {
    name: 'softSkills',
    label: 'Soft skills',
    helper: 'Communication, collaboration, conflict handling.',
  },
  {
    name: 'projectPerformance',
    label: 'Project performance',
    helper: 'Delivery, ownership, and quality on the current engagement.',
  },
  {
    name: 'overallReadiness',
    label: 'Overall readiness',
    helper: 'Readiness for the next stretch assignment.',
  },
] as const;

type CriterionName = (typeof CRITERIA)[number]['name'];

const schema = z.object({
  technicalCompetency: z.number().int().min(1).max(5),
  softSkills: z.number().int().min(1).max(5),
  projectPerformance: z.number().int().min(1).max(5),
  overallReadiness: z.number().int().min(1).max(5),
  comments: z
    .string()
    .trim()
    .min(1, 'Comments are required to submit')
    .max(MAX_TEXT, `Keep under ${MAX_TEXT} characters`),
  futureTrainingRecommendations: z.string().trim().max(MAX_TEXT).optional(),
});

type FormValues = {
  technicalCompetency: number | null;
  softSkills: number | null;
  projectPerformance: number | null;
  overallReadiness: number | null;
  comments: string;
  futureTrainingRecommendations: string;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const useNow = (intervalMs: number, enabled: boolean) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
};

export const EffectivenessFormPage = () => {
  const { cycleId = '', maverickId = '' } = useParams<{ cycleId: string; maverickId: string }>();
  const navigate = useNavigate();

  const bundle = useEffectivenessBundle(cycleId, maverickId);
  const autosave = useAutosaveEffectiveness(cycleId, maverickId);
  const submit = useSubmitEffectiveness(cycleId, maverickId);

  const form = useForm<FormValues>({
    defaultValues: {
      technicalCompetency: null,
      softSkills: null,
      projectPerformance: null,
      overallReadiness: null,
      comments: '',
      futureTrainingRecommendations: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!bundle.data) return;
    if (hydratedFor.current === bundle.data.draft.updatedAt) return;
    const d = bundle.data.draft;
    form.reset(
      {
        technicalCompetency: d.technicalCompetency ?? null,
        softSkills: d.softSkills ?? null,
        projectPerformance: d.projectPerformance ?? null,
        overallReadiness: d.overallReadiness ?? null,
        comments: d.comments ?? '',
        futureTrainingRecommendations: d.futureTrainingRecommendations ?? '',
      },
      { keepDirty: false },
    );
    hydratedFor.current = d.updatedAt;
  }, [bundle.data, form]);

  const isSubmitted = bundle.data?.draft.status === 'Submitted';
  const cycleClosed = bundle.data?.cycle.status !== 'Open';
  const readOnly = isSubmitted || cycleClosed;

  const watched = form.watch();
  const lastSavedSnapshot = useRef<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    if (!bundle.data || readOnly) return;
    const snapshot = JSON.stringify(watched);
    if (snapshot === lastSavedSnapshot.current) return;
    if (lastSavedSnapshot.current === '') {
      lastSavedSnapshot.current = snapshot;
      return;
    }
    setSaveStatus('saving');
    const id = window.setTimeout(() => {
      autosave.mutate(
        {
          technicalCompetency: watched.technicalCompetency,
          softSkills: watched.softSkills,
          projectPerformance: watched.projectPerformance,
          overallReadiness: watched.overallReadiness,
          comments: watched.comments,
          futureTrainingRecommendations: watched.futureTrainingRecommendations,
        },
        {
          onSuccess: (saved) => {
            lastSavedSnapshot.current = snapshot;
            setLastSavedAt(saved.updatedAt);
            setSaveStatus('saved');
          },
          onError: () => setSaveStatus('error'),
        },
      );
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watched.technicalCompetency,
    watched.softSkills,
    watched.projectPerformance,
    watched.overallReadiness,
    watched.comments,
    watched.futureTrainingRecommendations,
    bundle.data,
    readOnly,
  ]);

  const now = useNow(10_000, saveStatus === 'saved');
  const relSaved = useMemo(
    () => (lastSavedAt ? formatRelativeTime(lastSavedAt, now) : null),
    [lastSavedAt, now],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      for (const name of ['technicalCompetency', 'softSkills', 'projectPerformance', 'overallReadiness'] as const) {
        if (f[name]) form.setError(name, { message: f[name]![0] });
      }
      if (f.comments) form.setError('comments', { message: f.comments[0] });
      return;
    }
    await submit.mutateAsync(
      {
        ...parsed.data,
        futureTrainingRecommendations: parsed.data.futureTrainingRecommendations || null,
      },
      {
        onSuccess: () => {
          window.setTimeout(() => navigate('/supervisor/evaluations', { replace: true }), 800);
        },
      },
    );
  });

  if (bundle.isLoading) return <LoadingState label="Loading evaluation…" />;
  if (bundle.isError)
    return (
      <ErrorState
        message={bundle.error instanceof Error ? bundle.error.message : 'Unknown error'}
        onRetry={() => bundle.refetch()}
      />
    );
  if (!bundle.data) return null;

  const { cycle, maverick, draft } = bundle.data;
  const submittedView = submit.isSuccess || draft.status === 'Submitted';

  const setRating = (name: CriterionName, v: number) => {
    form.setValue(name, v, { shouldDirty: true, shouldValidate: false });
    form.clearErrors(name);
  };

  return (
    <div className="pb-24 md:pb-0">
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/supervisor/evaluations"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-alt focus-ring"
          aria-label="Back to queue"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <p className="truncate text-[13px] text-ink-muted">Effectiveness evaluation</p>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-medium tracking-tight text-ink md:text-2xl">
          {maverick.fullName}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
          <span>{cycle.courseName}</span>
          {cycle.trainerName && (
            <>
              <span aria-hidden>·</span>
              <span>Trainer {cycle.trainerName}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>Due {formatRelativeTime(cycle.dueAt)}</span>
          {readOnly && (
            <Badge tone={isSubmitted ? 'ok' : 'neutral'}>
              {isSubmitted ? 'Submitted' : 'Read-only — cycle closed'}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Maverick context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-[13px] font-medium text-brand-700">
                  {maverick.fullName
                    .split(' ')
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{maverick.fullName}</p>
                  {maverick.employeeCode && (
                    <p className="text-[12px] text-ink-subtle">{maverick.employeeCode}</p>
                  )}
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-[13px]">
                {maverick.sessionEndedAt && (
                  <Row label="Session ended" value={formatRelativeTime(maverick.sessionEndedAt)} />
                )}
                {maverick.avgPostTrainingRating != null && (
                  <Row
                    label="Their post-training rating"
                    value={`${maverick.avgPostTrainingRating.toFixed(1)} / 5`}
                  />
                )}
              </dl>

              {maverick.avgPostTrainingRating != null && (
                <div className="mt-4 flex items-start gap-2 rounded-md border-hairline border-ai-100 bg-ai-50 px-3 py-2 text-[12px] text-ai-600">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <p>
                    Their own rating for this course was{' '}
                    {maverick.avgPostTrainingRating.toFixed(1)} / 5. Worth comparing to your
                    project-performance read.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          {CRITERIA.map((c) => {
            const labelId = `${c.name}-label`;
            const error = form.formState.errors[c.name];
            return (
              <Card key={c.name}>
                <CardHeader>
                  <CardTitle id={labelId}>{c.label}</CardTitle>
                  <p className="mt-1 text-[13px] text-ink-muted">{c.helper}</p>
                </CardHeader>
                <CardContent>
                  <ScaleControl
                    value={watched[c.name]}
                    onChange={(v) => setRating(c.name, v)}
                    ariaLabelledBy={labelId}
                    ariaInvalid={!!error}
                    disabled={readOnly}
                  />
                  {error && (
                    <p className="mt-2 text-[12px] text-alert">{error.message ?? 'Required'}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <p className="mt-1 text-[13px] text-ink-muted">
                Required. Concrete observations carry more weight than generalities.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                id="comments"
                rows={4}
                maxLength={MAX_TEXT}
                disabled={readOnly}
                aria-invalid={form.formState.errors.comments ? 'true' : 'false'}
                placeholder="What did this Maverick do, and what is the impact?"
                {...form.register('comments')}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-subtle">
                <span>
                  {form.formState.errors.comments && (
                    <span className="text-alert">{form.formState.errors.comments.message}</span>
                  )}
                </span>
                <span>
                  {(watched.comments ?? '').length} / {MAX_TEXT}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Future training recommendations</CardTitle>
              <p className="mt-1 text-[13px] text-ink-muted">
                Optional. Suggestions here route through L&amp;D for approval before becoming nudges.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                id="futureTrainingRecommendations"
                rows={3}
                maxLength={MAX_TEXT}
                disabled={readOnly}
                placeholder="e.g. Advanced architecture deep-dive; mentoring track."
                {...form.register('futureTrainingRecommendations')}
              />
              <div className="mt-1 text-right text-[11px] text-ink-subtle">
                {(watched.futureTrainingRecommendations ?? '').length} / {MAX_TEXT}
              </div>
            </CardContent>
          </Card>

          {submit.isError && (
            <div
              role="alert"
              className="rounded-md border-hairline border-red-100 bg-red-50 px-3 py-2 text-[13px] text-red-700"
            >
              {submit.error.message}
            </div>
          )}

          <div
            className={cn(
              'fixed inset-x-0 bottom-0 z-10 border-t-hairline border-border bg-surface px-4 py-3',
              'md:static md:flex md:items-center md:justify-between md:border-0 md:bg-transparent md:px-0 md:py-0',
            )}
          >
            <SaveStatusLabel
              status={saveStatus}
              relSaved={relSaved}
              readOnly={readOnly}
              isSubmitted={isSubmitted}
            />
            <div className="mt-2 flex justify-end md:mt-0">
              {submittedView ? (
                <Button variant="secondary" size="lg" disabled>
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Submitted
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  disabled={readOnly || submit.isPending}
                  className="w-full md:w-auto"
                >
                  {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {submit.isPending ? 'Submitting…' : 'Submit evaluation'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3">
    <dt className="text-ink-subtle">{label}</dt>
    <dd className="font-medium text-ink">{value}</dd>
  </div>
);

const SaveStatusLabel = ({
  status,
  relSaved,
  readOnly,
  isSubmitted,
}: {
  status: SaveStatus;
  relSaved: string | null;
  readOnly: boolean;
  isSubmitted: boolean;
}) => {
  if (isSubmitted) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-ok">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Submitted — recorded against this cycle
      </p>
    );
  }
  if (readOnly) {
    return <p className="text-[12px] text-ink-subtle">Cycle is closed — read-only.</p>;
  }
  if (status === 'saving') {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-ink-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…
      </p>
    );
  }
  if (status === 'error') {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-alert">
        <CloudOff className="h-3.5 w-3.5" aria-hidden /> Couldn't save — we'll retry on next change
      </p>
    );
  }
  if (status === 'saved' && relSaved) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-ink-muted">
        <Cloud className="h-3.5 w-3.5 text-ok" aria-hidden /> Saved {relSaved}
      </p>
    );
  }
  return <p className="text-[12px] text-ink-subtle">Your draft saves automatically.</p>;
};
