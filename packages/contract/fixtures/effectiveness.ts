import type { components } from '../../../apps/web/src/lib/api/schema.gen';

type Draft = components['schemas']['EffectivenessDraft'];
type CycleContext = components['schemas']['EffectivenessCycleContext'];
type MaverickContext = components['schemas']['EffectivenessMaverickContext'];
type PendingItem = components['schemas']['EffectivenessPendingItem'];

const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
};

const SUP_MARCO = '0192e9a8-2c1d-7a30-9c91-1f6f3a47b201';
const MAV_PRIYA = '0192e9a8-2c1d-7a30-9c91-1f6f3a47b101';
const MAV_DANIEL = '0192e9a8-2c1d-7a30-9c91-1f6f3a47b102';
const MAV_YUI = '0192e9a8-2c1d-7a30-9c91-1f6f3a47b103';

const CYCLE_CLOUD = '0192e9a8-2c1d-7a30-9c91-1f6f3a47e005';
const CYCLE_STAKEHOLDER = '0192e9a8-2c1d-7a30-9c91-1f6f3a48c001';

export const effectivenessCycles: Record<string, CycleContext> = {
  [CYCLE_CLOUD]: {
    cycleId: CYCLE_CLOUD,
    courseName: 'Cloud Foundations — Q1 effectiveness review',
    trainerName: 'Dr. Anika Rao',
    dueAt: isoDaysFromNow(6),
    status: 'Open',
  },
  [CYCLE_STAKEHOLDER]: {
    cycleId: CYCLE_STAKEHOLDER,
    courseName: 'Stakeholder Communication — Q1 effectiveness review',
    trainerName: 'Sara Mendez',
    dueAt: isoDaysFromNow(2),
    status: 'Open',
  },
};

export const effectivenessMavericks: Record<string, MaverickContext> = {
  [MAV_PRIYA]: {
    id: MAV_PRIYA,
    fullName: 'Priya Shah',
    employeeCode: 'HX-1204',
    sessionEndedAt: isoDaysFromNow(-90),
    avgPostTrainingRating: 4.5,
  },
  [MAV_DANIEL]: {
    id: MAV_DANIEL,
    fullName: 'Daniel Okeke',
    employeeCode: 'HX-1318',
    sessionEndedAt: isoDaysFromNow(-90),
    avgPostTrainingRating: 4.0,
  },
  [MAV_YUI]: {
    id: MAV_YUI,
    fullName: 'Yui Tanaka',
    employeeCode: 'HX-1402',
    sessionEndedAt: isoDaysFromNow(-92),
    avgPostTrainingRating: 4.8,
  },
};

/** Supervisor → list of (cycleId, maverickId) pairs that are on their queue. */
const queueBySupervisor: Record<string, Array<{ cycleId: string; maverickId: string }>> = {
  [SUP_MARCO]: [
    { cycleId: CYCLE_CLOUD, maverickId: MAV_PRIYA },
    { cycleId: CYCLE_CLOUD, maverickId: MAV_DANIEL },
    { cycleId: CYCLE_CLOUD, maverickId: MAV_YUI },
    { cycleId: CYCLE_STAKEHOLDER, maverickId: MAV_DANIEL },
  ],
};

export const effectivenessQueueFor = (supervisorId: string) =>
  queueBySupervisor[supervisorId] ?? [];

/** In-memory drafts keyed by `${supervisorId}:${cycleId}:${maverickId}`. */
export const effectivenessDraftStore = new Map<string, Draft>();

const key = (supId: string, cycleId: string, maverickId: string) =>
  `${supId}:${cycleId}:${maverickId}`;

const seededDrafts: Record<string, Partial<Omit<Draft, 'cycleId' | 'maverickId' | 'updatedAt'>>> = {
  // Marco already finished Yui's evaluation last week.
  [key(SUP_MARCO, CYCLE_CLOUD, MAV_YUI)]: {
    technicalCompetency: 5,
    softSkills: 5,
    projectPerformance: 4,
    overallReadiness: 5,
    comments:
      'Yui consistently raised the level of the cohort. Pairs well across teams; ready for stretch projects.',
    futureTrainingRecommendations: 'Advanced architecture deep-dive next quarter.',
    status: 'Submitted',
    submittedAt: isoDaysFromNow(-7),
  },
  // Marco has Daniel's Stakeholder review partially drafted.
  [key(SUP_MARCO, CYCLE_STAKEHOLDER, MAV_DANIEL)]: {
    technicalCompetency: null,
    softSkills: 4,
    projectPerformance: null,
    overallReadiness: null,
    comments: 'Engaged well in the role-play exercise — clearer on framing now.',
    futureTrainingRecommendations: null,
    status: 'Draft',
  },
};

export const getOrCreateEffectivenessDraft = (
  supervisorId: string,
  cycleId: string,
  maverickId: string,
): Draft | null => {
  if (!effectivenessCycles[cycleId] || !effectivenessMavericks[maverickId]) return null;
  const k = key(supervisorId, cycleId, maverickId);
  const existing = effectivenessDraftStore.get(k);
  if (existing) return existing;
  const seed = seededDrafts[k];
  const draft: Draft = {
    cycleId,
    maverickId,
    technicalCompetency: seed?.technicalCompetency ?? null,
    softSkills: seed?.softSkills ?? null,
    projectPerformance: seed?.projectPerformance ?? null,
    overallReadiness: seed?.overallReadiness ?? null,
    comments: seed?.comments ?? null,
    futureTrainingRecommendations: seed?.futureTrainingRecommendations ?? null,
    status: seed?.status ?? 'Draft',
    submittedAt: seed?.submittedAt ?? null,
    updatedAt: new Date().toISOString(),
  };
  effectivenessDraftStore.set(k, draft);
  return draft;
};

const RATING_FIELDS = [
  'technicalCompetency',
  'softSkills',
  'projectPerformance',
  'overallReadiness',
] as const;

export const upsertEffectivenessDraft = (
  supervisorId: string,
  cycleId: string,
  maverickId: string,
  patch: Partial<Omit<Draft, 'cycleId' | 'maverickId' | 'status' | 'updatedAt' | 'submittedAt'>>,
): Draft | null => {
  const current = getOrCreateEffectivenessDraft(supervisorId, cycleId, maverickId);
  if (!current) return null;
  const next: Draft = { ...current, updatedAt: new Date().toISOString() };
  for (const f of RATING_FIELDS) {
    if (f in patch) next[f] = patch[f] ?? null;
  }
  if ('comments' in patch) next.comments = patch.comments ?? null;
  if ('futureTrainingRecommendations' in patch)
    next.futureTrainingRecommendations = patch.futureTrainingRecommendations ?? null;
  effectivenessDraftStore.set(key(supervisorId, cycleId, maverickId), next);
  return next;
};

export const submitEffectivenessDraft = (
  supervisorId: string,
  cycleId: string,
  maverickId: string,
  body: {
    technicalCompetency: number;
    softSkills: number;
    projectPerformance: number;
    overallReadiness: number;
    comments: string;
    futureTrainingRecommendations?: string | null;
  },
): Draft | null => {
  const current = getOrCreateEffectivenessDraft(supervisorId, cycleId, maverickId);
  if (!current) return null;
  const now = new Date().toISOString();
  const next: Draft = {
    ...current,
    technicalCompetency: body.technicalCompetency,
    softSkills: body.softSkills,
    projectPerformance: body.projectPerformance,
    overallReadiness: body.overallReadiness,
    comments: body.comments,
    futureTrainingRecommendations: body.futureTrainingRecommendations ?? null,
    status: 'Submitted',
    submittedAt: now,
    updatedAt: now,
  };
  effectivenessDraftStore.set(key(supervisorId, cycleId, maverickId), next);
  return next;
};

export const listEffectivenessQueue = (
  supervisorId: string,
): { pending: PendingItem[]; recentlySubmitted: PendingItem[] } => {
  const items = effectivenessQueueFor(supervisorId);
  const pending: PendingItem[] = [];
  const recentlySubmitted: PendingItem[] = [];
  for (const { cycleId, maverickId } of items) {
    const cycle = effectivenessCycles[cycleId];
    const maverick = effectivenessMavericks[maverickId];
    if (!cycle || !maverick) continue;
    const draft = getOrCreateEffectivenessDraft(supervisorId, cycleId, maverickId);
    if (!draft) continue;
    const base = {
      cycleId,
      maverickId,
      maverickName: maverick.fullName,
      courseName: cycle.courseName,
      trainerName: cycle.trainerName ?? null,
      dueAt: cycle.dueAt,
      submittedAt: draft.submittedAt ?? null,
    };
    if (draft.status === 'Submitted') {
      recentlySubmitted.push({ ...base, status: 'Submitted' });
    } else {
      const isDraft =
        draft.technicalCompetency != null ||
        draft.softSkills != null ||
        draft.projectPerformance != null ||
        draft.overallReadiness != null ||
        (draft.comments ?? '').length > 0;
      pending.push({ ...base, status: isDraft ? 'Draft' : 'NotStarted' });
    }
  }
  return { pending, recentlySubmitted };
};
