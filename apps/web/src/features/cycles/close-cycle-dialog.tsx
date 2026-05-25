import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCloseCycle, useOverrideCloseCycle } from './use-cycles';
import { cn, formatPercent } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Cycle = components['schemas']['Cycle'];

type Props = {
  cycle: Cycle | null;
  onClose: () => void;
};

type Mode = 'confirm' | 'override';

const OVERRIDE_MIN = 10;
const OVERRIDE_MAX = 500;

export const CloseCycleDialog = ({ cycle, onClose }: Props) => {
  const close = useCloseCycle();
  const override = useOverrideCloseCycle();
  const [mode, setMode] = useState<Mode>('confirm');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [belowThreshold, setBelowThreshold] = useState<{ current: number; required: number } | null>(
    null,
  );

  // Reset state every time the dialog opens for a new cycle.
  useEffect(() => {
    if (!cycle) return;
    setMode('confirm');
    setReason('');
    setReasonError(null);
    setServerError(null);
    const isBelow = cycle.completionRate < cycle.threshold;
    setBelowThreshold(isBelow ? { current: cycle.completionRate, required: cycle.threshold } : null);
  }, [cycle?.id]);

  if (!cycle) return null;

  const handleClose = () => {
    setServerError(null);
    close.mutate(cycle.id, {
      onSuccess: () => onClose(),
      onError: (err) => {
        if (err.kind === 'belowThreshold') {
          setBelowThreshold({
            current: err.problem.currentRate,
            required: err.problem.requiredRate,
          });
          setMode('override');
        } else {
          setServerError(err.message);
        }
      },
    });
  };

  const handleOverride = () => {
    const trimmed = reason.trim();
    if (trimmed.length < OVERRIDE_MIN) {
      setReasonError(`Please add at least ${OVERRIDE_MIN} characters of justification.`);
      return;
    }
    setReasonError(null);
    setServerError(null);
    override.mutate(
      { cycleId: cycle.id, reason: trimmed },
      {
        onSuccess: () => onClose(),
        onError: (err) => setServerError(err.message),
      },
    );
  };

  const busy = close.isPending || override.isPending;

  const title = mode === 'confirm' ? 'Close this cycle?' : 'Override-close this cycle';
  const description =
    mode === 'confirm'
      ? 'Closing finalises the feedback window. Mavericks can no longer submit responses.'
      : 'You are bypassing the completion threshold. This is recorded to the audit log.';

  return (
    <Dialog
      open={!!cycle}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        mode === 'confirm' ? (
          <ConfirmFooter
            cycle={cycle}
            below={belowThreshold !== null}
            onClose={onClose}
            onConfirm={handleClose}
            busy={busy}
          />
        ) : (
          <OverrideFooter
            onBack={() => setMode('confirm')}
            onConfirm={handleOverride}
            busy={busy}
            disabled={reason.trim().length < OVERRIDE_MIN}
          />
        )
      }
    >
      <CompletionSummary cycle={cycle} below={belowThreshold} />

      {mode === 'confirm' && belowThreshold && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-md border-hairline border-amber-100 bg-amber-50 px-3 py-2 text-[13px] text-amber-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            This cycle is below the {formatPercent(belowThreshold.required)} threshold. A plain close
            will fail — you'll be offered an override-close.
          </p>
        </div>
      )}

      {mode === 'override' && (
        <div className="mt-4 space-y-3">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border-hairline border-red-100 bg-red-50 px-3 py-2 text-[13px] text-red-700"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Override-close bypasses the completion check. The reason below is recorded against your
              account and is visible in the audit log.
            </p>
          </div>
          <div>
            <Label htmlFor="override-reason">Override reason</Label>
            <Textarea
              id="override-reason"
              rows={3}
              maxLength={OVERRIDE_MAX}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              aria-invalid={!!reasonError}
              placeholder="e.g. 3 Mavericks on long-term leave; remaining responses are sufficient to act on findings."
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-ink-subtle">
              <span>
                {reasonError ? (
                  <span className="text-alert">{reasonError}</span>
                ) : (
                  `Minimum ${OVERRIDE_MIN} characters.`
                )}
              </span>
              <span>
                {reason.length} / {OVERRIDE_MAX}
              </span>
            </div>
          </div>
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="mt-3 rounded-md border-hairline border-red-100 bg-red-50 px-3 py-2 text-[13px] text-red-700"
        >
          {serverError}
        </div>
      )}
    </Dialog>
  );
};

const CompletionSummary = ({
  cycle,
  below,
}: {
  cycle: Cycle;
  below: { current: number; required: number } | null;
}) => (
  <div className="rounded-md border-hairline border-border bg-surface-alt p-3">
    <p className="text-[13px] font-medium text-ink">{cycle.courseName}</p>
    <p className="mt-0.5 text-[12px] text-ink-muted">
      {cycle.trainerName ?? 'Trainer TBA'} · {cycle.responseCount} of {cycle.expectedCount} responses
    </p>
    <div className="mt-3">
      <div className="flex items-center justify-between text-[12px] text-ink-muted">
        <span>Completion</span>
        <span className={cn('font-medium', below ? 'text-alert' : 'text-ok')}>
          {formatPercent(cycle.completionRate)}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface">
        <span
          className={cn('block h-full', below ? 'bg-alert' : 'bg-ok')}
          style={{ width: `${Math.min(100, cycle.completionRate * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-ink-subtle">
        Threshold {formatPercent(cycle.threshold)}
      </p>
    </div>
  </div>
);

const ConfirmFooter = ({
  cycle,
  below,
  onClose,
  onConfirm,
  busy,
}: {
  cycle: Cycle;
  below: boolean;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) => (
  <>
    <span className="mr-auto">
      <Badge tone={below ? 'warn' : 'ok'}>
        {below ? 'Below threshold' : 'Meets threshold'}
      </Badge>
    </span>
    <Button variant="secondary" onClick={onClose} disabled={busy}>
      Cancel
    </Button>
    <Button onClick={onConfirm} disabled={busy}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      Close cycle "{shorten(cycle.courseName)}"
    </Button>
  </>
);

const OverrideFooter = ({
  onBack,
  onConfirm,
  busy,
  disabled,
}: {
  onBack: () => void;
  onConfirm: () => void;
  busy: boolean;
  disabled: boolean;
}) => (
  <>
    <Button variant="ghost" onClick={onBack} disabled={busy}>
      Back
    </Button>
    <Button variant="danger" onClick={onConfirm} disabled={busy || disabled}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      Override-close
    </Button>
  </>
);

const shorten = (s: string, max = 24) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
