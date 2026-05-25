import type { components } from '../../../apps/web/src/lib/api/schema.gen';

type Cycle = components['schemas']['FeedbackCycleContext'];
type Draft = components['schemas']['FeedbackDraft'];

const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
};

export const feedbackCycles: Record<string, Cycle> = {
  '0192e9a8-2c1d-7a30-9c91-1f6f3a47e002': {
    cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e002',
    courseName: 'Cloud Foundations — Module 3',
    trainerName: 'Dr. Anika Rao',
    sessionEndedAt: isoDaysFromNow(-2),
    dueAt: isoDaysFromNow(3),
    status: 'Open',
  },
  '0192e9a8-2c1d-7a30-9c91-1f6f3a47e003': {
    cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e003',
    courseName: 'Stakeholder Communication',
    trainerName: 'Sara Mendez',
    sessionEndedAt: isoDaysFromNow(-5),
    dueAt: isoDaysFromNow(1),
    status: 'Open',
  },
  '0192e9a8-2c1d-7a30-9c91-1f6f3a47e010': {
    cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e010',
    courseName: 'Agile Delivery Basics',
    trainerName: 'Lukas Bauer',
    sessionEndedAt: isoDaysFromNow(-21),
    dueAt: isoDaysFromNow(-14),
    status: 'Closed',
  },
};

/** In-memory drafts keyed by `${userId}:${cycleId}`. Mutates across MSW calls. */
export const draftStore = new Map<string, Draft>();

const draftKey = (userId: string, cycleId: string) => `${userId}:${cycleId}`;

const seededDrafts: Record<string, Partial<Omit<Draft, 'cycleId' | 'updatedAt'>>> = {
  // The Stakeholder Comms cycle already had a saved draft on the dashboard.
  '0192e9a8-2c1d-7a30-9c91-1f6f3a47e003': {
    overallRating: 4,
    highlights: 'Loved the role-play exercise — felt very close to real-world stakeholder pushback.',
    improvements: '',
    status: 'Draft',
  },
  // The Agile cycle is already submitted historically.
  '0192e9a8-2c1d-7a30-9c91-1f6f3a47e010': {
    overallRating: 5,
    highlights: 'Best training in months. Lukas knows how to keep a room engaged.',
    improvements: 'A handout PDF would have been useful afterwards.',
    status: 'Submitted',
    submittedAt: isoDaysFromNow(-14),
  },
};

export const getOrCreateDraft = (userId: string, cycleId: string): Draft | null => {
  const cycle = feedbackCycles[cycleId];
  if (!cycle) return null;

  const key = draftKey(userId, cycleId);
  const existing = draftStore.get(key);
  if (existing) return existing;

  const seed = seededDrafts[cycleId];
  const draft: Draft = {
    cycleId,
    overallRating: seed?.overallRating ?? null,
    highlights: seed?.highlights ?? null,
    improvements: seed?.improvements ?? null,
    status: seed?.status ?? 'Draft',
    submittedAt: seed?.submittedAt ?? null,
    updatedAt: new Date().toISOString(),
  };
  draftStore.set(key, draft);
  return draft;
};

export const upsertDraft = (
  userId: string,
  cycleId: string,
  patch: Partial<Pick<Draft, 'overallRating' | 'highlights' | 'improvements'>>,
): Draft | null => {
  const current = getOrCreateDraft(userId, cycleId);
  if (!current) return null;
  const next: Draft = {
    ...current,
    ...('overallRating' in patch ? { overallRating: patch.overallRating ?? null } : {}),
    ...('highlights' in patch ? { highlights: patch.highlights ?? null } : {}),
    ...('improvements' in patch ? { improvements: patch.improvements ?? null } : {}),
    updatedAt: new Date().toISOString(),
  };
  draftStore.set(draftKey(userId, cycleId), next);
  return next;
};

export const submitDraft = (
  userId: string,
  cycleId: string,
  body: { overallRating: number; highlights: string; improvements: string },
): Draft | null => {
  const current = getOrCreateDraft(userId, cycleId);
  if (!current) return null;
  const next: Draft = {
    ...current,
    overallRating: body.overallRating,
    highlights: body.highlights,
    improvements: body.improvements,
    status: 'Submitted',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  draftStore.set(draftKey(userId, cycleId), next);
  return next;
};
