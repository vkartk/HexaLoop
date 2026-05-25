import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  CloudOff,
  Cloud,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { LoadingState, ErrorState } from '@/components/feedback/states';
import { useAutosaveFeedback, useFeedbackBundle, useSubmitFeedback } from './use-feedback';
import { cn, formatRelativeTime } from '@/lib/utils';

const MAX_TEXT = 2000;
const AUTOSAVE_DEBOUNCE_MS = 800;

const schema = z.object({
  overallRating: z
    .number({ invalid_type_error: 'Please rate this course' })
    .int()
    .min(1)
    .max(5),
  highlights: z
    .string()
    .trim()
    .min(1, 'Share at least one highlight')
    .max(MAX_TEXT, `Keep under ${MAX_TEXT} characters`),
  improvements: z
    .string()
    .trim()
    .min(1, 'Share at least one improvement')
    .max(MAX_TEXT, `Keep under ${MAX_TEXT} characters`),
});

type FormValues = {
  overallRating: number | null;
  highlights: string;
  improvements: string;
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

export const FeedbackFormPage = () => {
  const { cycleId = '' } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();

  const bundle = useFeedbackBundle(cycleId);
  const autosave = useAutosaveFeedback(cycleId);
  const submit = useSubmitFeedback(cycleId);

  const form = useForm<FormValues>({
    defaultValues: { overallRating: null, highlights: '', improvements: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Hydrate the form once the server bundle lands.
  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!bundle.data) return;
    if (hydratedFor.current === bundle.data.draft.updatedAt) return;
    form.reset(
      {
        overallRating: bundle.data.draft.overallRating ?? null,
        highlights: bundle.data.draft.highlights ?? '',
        improvements: bundle.data.draft.improvements ?? '',
      },
      { keepDirty: false },
    );
    hydratedFor.current = bundle.data.draft.updatedAt;
  }, [bundle.data, form]);

  const isSubmitted = bundle.data?.draft.status === 'Submitted';
  const cycleClosed = bundle.data?.cycle.status !== 'Open';
  const readOnly = isSubmitted || cycleClosed;

  // Debounced autosave. Watches values, triggers PUT after the debounce when
  // the form is dirty and the cycle is open. PUT is idempotent so a stray
  // resend during route changes is safe.
  const watched = form.watch();
  const lastSavedSnapshot = useRef<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    if (!bundle.data || readOnly) return;
    const snapshot = JSON.stringify(watched);
    if (snapshot === lastSavedSnapshot.current) return;
    if (lastSavedSnapshot.current === '') {
      // Seed from initial hydration so the very first watch tick is a no-op.
      lastSavedSnapshot.current = snapshot;
      return;
    }
    setSaveStatus('saving');
    const id = window.setTimeout(() => {
      autosave.mutate(
        {
          overallRating: watched.overallRating,
          highlights: watched.highlights,
          improvements: watched.improvements,
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
  }, [watched.overallRating, watched.highlights, watched.improvements, bundle.data, readOnly]);

  // Tick "Ns ago" while idle on the page.
  const now = useNow(10_000, saveStatus === 'saved');
  const relSaved = useMemo(
    () => (lastSavedAt ? formatRelativeTime(lastSavedAt, now) : null),
    [lastSavedAt, now],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.overallRating)
        form.setError('overallRating', { message: fieldErrors.overallRating[0] });
      if (fieldErrors.highlights)
        form.setError('highlights', { message: fieldErrors.highlights[0] });
      if (fieldErrors.improvements)
        form.setError('improvements', { message: fieldErrors.improvements[0] });
      return;
    }
    await submit.mutateAsync(parsed.data, {
      onSuccess: () => {
        // Brief pause so the user sees the "Submitted" state, then return.
        window.setTimeout(() => navigate('/maverick', { replace: true }), 800);
      },
    });
  });

  if (bundle.isLoading) return <LoadingState label="Loading your feedback…" />;
  if (bundle.isError)
    return (
      <ErrorState
        message={bundle.error instanceof Error ? bundle.error.message : 'Unknown error'}
        onRetry={() => bundle.refetch()}
      />
    );
  if (!bundle.data) return null;

  const { cycle, draft } = bundle.data;
  const highlights = watched.highlights ?? '';
  const improvements = watched.improvements ?? '';

  const submittedView = submit.isSuccess || draft.status === 'Submitted';

  return (
    <div className="pb-24 md:pb-0">
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/maverick"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-alt focus-ring"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
        <p className="truncate text-[13px] text-ink-muted">Post-training feedback</p>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-medium tracking-tight text-ink md:text-2xl">{cycle.courseName}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
          {cycle.trainerName && <span>{cycle.trainerName}</span>}
          {cycle.sessionEndedAt && (
            <>
              <span aria-hidden>·</span>
              <span>Session ended {formatRelativeTime(cycle.sessionEndedAt)}</span>
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

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle id="rating-label">How was this course?</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">
              1 means it didn't meet the basics; 5 means it exceeded expectations.
            </p>
          </CardHeader>
          <CardContent>
            <StarRating
              value={watched.overallRating}
              onChange={(v) => {
                form.setValue('overallRating', v, { shouldDirty: true, shouldValidate: true });
                form.clearErrors('overallRating');
              }}
              ariaLabelledBy="rating-label"
              ariaInvalid={!!form.formState.errors.overallRating}
              disabled={readOnly}
            />
            {form.formState.errors.overallRating && (
              <p className="mt-2 text-[12px] text-alert">
                {form.formState.errors.overallRating.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What worked well?</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">
              Highlights — the moments, exercises, or examples worth repeating.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              id="highlights"
              rows={4}
              maxLength={MAX_TEXT}
              disabled={readOnly}
              aria-invalid={form.formState.errors.highlights ? 'true' : 'false'}
              placeholder="Share what stood out…"
              {...form.register('highlights')}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-ink-subtle">
              <span>
                {form.formState.errors.highlights && (
                  <span className="text-alert">{form.formState.errors.highlights.message}</span>
                )}
              </span>
              <span>
                {highlights.length} / {MAX_TEXT}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What could be improved?</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">
              Honest improvements help us choose better trainers and materials.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              id="improvements"
              rows={4}
              maxLength={MAX_TEXT}
              disabled={readOnly}
              aria-invalid={form.formState.errors.improvements ? 'true' : 'false'}
              placeholder="Share what could be sharper next time…"
              {...form.register('improvements')}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-ink-subtle">
              <span>
                {form.formState.errors.improvements && (
                  <span className="text-alert">{form.formState.errors.improvements.message}</span>
                )}
              </span>
              <span>
                {improvements.length} / {MAX_TEXT}
              </span>
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

        {/* Sticky action bar — fixed on mobile, normal flow on desktop. */}
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
                {submit.isPending ? 'Submitting…' : 'Submit feedback'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

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
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Submitted — thanks for your feedback
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
