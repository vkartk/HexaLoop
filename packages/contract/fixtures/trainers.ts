import type { components } from '../../../apps/web/src/lib/api/schema.gen';
import { cycleStore } from './cycles';

type TrainerListRow = components['schemas']['TrainerListRow'];
type TrainerScorecard = components['schemas']['TrainerScorecard'];
type TrainerScorecardCycle = components['schemas']['TrainerScorecardCycle'];

const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
};

const seed: TrainerListRow[] = [
  {
    trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c001',
    name: 'Dr. Anika Rao',
    organization: 'Internal — Cloud Practice',
    engagementType: 'Internal',
    domain: 'Cloud architecture · Kubernetes',
    courses: 4,
    sessions: 12,
    avgRating: 4.6,
    completionRate: 0.92,
  },
  {
    trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c002',
    name: 'Lukas Bauer',
    organization: 'NorthArrow Consulting',
    engagementType: 'External',
    domain: 'Agile delivery · Scrum',
    courses: 2,
    sessions: 7,
    avgRating: 4.1,
    completionRate: 0.78,
  },
  {
    trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c003',
    name: 'Sara Mendez',
    organization: 'Internal — Soft Skills',
    engagementType: 'Internal',
    domain: 'Communication · Negotiation',
    courses: 3,
    sessions: 9,
    avgRating: 3.9,
    completionRate: 0.71,
  },
  {
    trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c004',
    name: 'Helena Park',
    organization: 'BlueShift Labs',
    engagementType: 'External',
    domain: 'Data engineering · SQL',
    courses: 2,
    sessions: 5,
    avgRating: 4.3,
    completionRate: 0.84,
  },
  {
    trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c005',
    name: 'Tomás Vidal',
    organization: 'Internal — Engineering',
    engagementType: 'Internal',
    domain: 'Systems design · APIs',
    courses: 3,
    sessions: 8,
    avgRating: 4.4,
    completionRate: 0.88,
  },
  {
    trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c006',
    name: 'Naledi Khumalo',
    organization: 'Lighthouse Coaching',
    engagementType: 'External',
    domain: 'Leadership · Coaching',
    courses: 1,
    sessions: 3,
    avgRating: 4.7,
    completionRate: 0.95,
  },
];

export const trainerStore: Map<string, TrainerListRow> = new Map(
  seed.map((t) => [t.trainerId, { ...t }]),
);

export const listTrainers = (params: {
  engagementType?: string;
  domain?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) => {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const all = [...trainerStore.values()].sort((a, b) => b.avgRating - a.avgRating);
  const filtered = all.filter((t) => {
    if (params.engagementType && t.engagementType !== params.engagementType) return false;
    if (params.domain) {
      if (!t.domain.toLowerCase().includes(params.domain.toLowerCase())) return false;
    }
    if (params.q) {
      const needle = params.q.toLowerCase();
      const hay = `${t.name} ${t.organization ?? ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  const start = (page - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
  };
};

const recentCyclesFor = (trainerName: string): TrainerScorecardCycle[] => {
  const matches = [...cycleStore.values()]
    .filter((c) => c.trainerName === trainerName)
    .sort((a, b) => new Date(b.opensAt).getTime() - new Date(a.opensAt).getTime());
  return matches.slice(0, 6).map((c) => ({
    cycleId: c.id,
    courseName: c.courseName,
    completionRate: c.completionRate,
    avgRating: c.responseCount > 0 ? Number((3.6 + Math.random() * 1.2).toFixed(1)) : null,
    status: c.status,
    closedAt: c.closedAt ?? null,
  }));
};

export const getTrainerScorecard = (trainerId: string): TrainerScorecard | null => {
  const trainer = trainerStore.get(trainerId);
  if (!trainer) return null;
  const recentCycles = recentCyclesFor(trainer.name);
  const responses = trainer.sessions * 18; // rough average cohort × sessions
  return {
    trainer,
    lifetime: {
      sessions: trainer.sessions,
      responses,
      avgRating: trainer.avgRating,
      completionRate: trainer.completionRate,
    },
    recentCycles,
    sentiment: {
      positive: Math.min(0.92, 0.5 + trainer.avgRating / 10),
      neutral: 0.18,
      negative: Math.max(0.04, 0.4 - trainer.avgRating / 12),
      ai: {
        aiGenerated: true,
        degraded: true,
        sourceCount: responses,
        generatedAt: isoDaysFromNow(0),
      },
    },
  };
};
