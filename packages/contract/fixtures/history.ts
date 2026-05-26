import type { components } from '../../../apps/web/src/lib/api/schema.gen';
import { feedbackCycles, getOrCreateDraft } from './feedback';
import { cycleStore } from './cycles';

type FeedbackHistoryItem = components['schemas']['FeedbackHistoryItem'];
type CycleStatus = components['schemas']['CycleStatus'];

const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
};

/**
 * Past, fully-submitted feedback the user gave before the live cycle store
 * was seeded. Used so the history screen has more than just "today's" data.
 */
const archivedSubmissions: FeedbackHistoryItem[] = [
  {
    cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e0a1',
    courseName: 'Kubernetes for Developers',
    trainerName: 'Dr. Anika Rao',
    sessionEndedAt: isoDaysFromNow(-95),
    dueAt: isoDaysFromNow(-88),
    status: 'Submitted',
    overallRating: 5,
    submittedAt: isoDaysFromNow(-87),
    cycleStatus: 'Closed',
  },
  {
    cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e0a2',
    courseName: 'Effective Code Review',
    trainerName: 'Tomás Vidal',
    sessionEndedAt: isoDaysFromNow(-72),
    dueAt: isoDaysFromNow(-65),
    status: 'Submitted',
    overallRating: 4,
    submittedAt: isoDaysFromNow(-64),
    cycleStatus: 'Closed',
  },
  {
    cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e0a3',
    courseName: 'Design Thinking Intensive',
    trainerName: 'Sara Mendez',
    sessionEndedAt: isoDaysFromNow(-58),
    dueAt: isoDaysFromNow(-51),
    status: 'Submitted',
    overallRating: 3,
    submittedAt: isoDaysFromNow(-50),
    cycleStatus: 'OverrideClosed',
  },
  {
    cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e0a4',
    courseName: 'SQL Performance Deep Dive',
    trainerName: 'Helena Park',
    sessionEndedAt: isoDaysFromNow(-40),
    dueAt: isoDaysFromNow(-33),
    status: 'Submitted',
    overallRating: 5,
    submittedAt: isoDaysFromNow(-32),
    cycleStatus: 'Closed',
  },
];

const cycleStatusFor = (cycleId: string): CycleStatus => {
  const live = cycleStore.get(cycleId);
  if (live) return live.status;
  // Cycles surfaced only via feedbackCycles — mirror their open/closed flag.
  const ctx = feedbackCycles[cycleId];
  if (ctx?.status === 'OverrideClosed') return 'OverrideClosed';
  return ctx?.status === 'Closed' ? 'Closed' : 'Open';
};

export const listFeedbackHistory = (
  userId: string,
  params: { page?: number; pageSize?: number },
) => {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

  const live: FeedbackHistoryItem[] = Object.values(feedbackCycles).map((cycle) => {
    const draft = getOrCreateDraft(userId, cycle.cycleId);
    return {
      cycleId: cycle.cycleId,
      courseName: cycle.courseName,
      trainerName: cycle.trainerName ?? null,
      sessionEndedAt: cycle.sessionEndedAt ?? null,
      dueAt: cycle.dueAt,
      status: draft?.status === 'Submitted' ? 'Submitted' : draft?.overallRating != null || draft?.highlights || draft?.improvements ? 'Draft' : 'NotStarted',
      overallRating: draft?.overallRating ?? null,
      submittedAt: draft?.submittedAt ?? null,
      cycleStatus: cycleStatusFor(cycle.cycleId),
    };
  });

  const all = [...live, ...archivedSubmissions].sort((a, b) => {
    // Newest activity first: prefer submittedAt > dueAt > sessionEndedAt.
    const key = (it: FeedbackHistoryItem): number =>
      new Date(it.submittedAt ?? it.dueAt ?? it.sessionEndedAt ?? 0).getTime();
    return key(b) - key(a);
  });

  const start = (page - 1) * pageSize;
  return {
    data: all.slice(start, start + pageSize),
    page,
    pageSize,
    total: all.length,
  };
};
