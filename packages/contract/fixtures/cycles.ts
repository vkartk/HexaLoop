import type { components } from '../../../apps/web/src/lib/api/schema.gen';

type Cycle = components['schemas']['Cycle'];

const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
};

const seed: Cycle[] = [
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e001',
    sessionId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47f001',
    courseName: 'Cloud Foundations — Q2 cohort',
    trainerName: 'Dr. Anika Rao',
    type: 'MaverickPostTraining',
    status: 'Open',
    threshold: 0.78,
    opensAt: isoDaysFromNow(-7),
    closesAt: isoDaysFromNow(2),
    expectedCount: 24,
    responseCount: 17, // 71% — BELOW threshold (drives the 409 flow)
    completionRate: 17 / 24,
    triggerBasis: 'TrainingCompletion',
    closedAt: null,
    closedByName: null,
    overrideReason: null,
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e002',
    sessionId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47f002',
    courseName: 'Stakeholder Communication',
    trainerName: 'Sara Mendez',
    type: 'MaverickPostTraining',
    status: 'Open',
    threshold: 0.78,
    opensAt: isoDaysFromNow(-5),
    closesAt: isoDaysFromNow(4),
    expectedCount: 18,
    responseCount: 15, // 83% — above threshold
    completionRate: 15 / 18,
    triggerBasis: 'TrainingCompletion',
    closedAt: null,
    closedByName: null,
    overrideReason: null,
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e003',
    sessionId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47f003',
    courseName: 'Agile Delivery Basics',
    trainerName: 'Lukas Bauer',
    type: 'MaverickPostTraining',
    status: 'Closed',
    threshold: 0.78,
    opensAt: isoDaysFromNow(-30),
    closesAt: isoDaysFromNow(-14),
    expectedCount: 22,
    responseCount: 20,
    completionRate: 20 / 22,
    triggerBasis: 'TrainingCompletion',
    closedAt: isoDaysFromNow(-14),
    closedByName: 'Alex Director',
    overrideReason: null,
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e004',
    sessionId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47f004',
    courseName: 'Data Modelling Workshop',
    trainerName: 'Dr. Anika Rao',
    type: 'MaverickPostTraining',
    status: 'OverrideClosed',
    threshold: 0.78,
    opensAt: isoDaysFromNow(-45),
    closesAt: isoDaysFromNow(-30),
    expectedCount: 15,
    responseCount: 9,
    completionRate: 9 / 15,
    triggerBasis: 'TrainingCompletion',
    closedAt: isoDaysFromNow(-29),
    closedByName: 'Alex Director',
    overrideReason: 'Two participants on extended leave; remaining 7 responses were sufficient to act on findings.',
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e005',
    sessionId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47f005',
    courseName: 'Cloud Foundations — Q1 supervisor review',
    trainerName: 'Dr. Anika Rao',
    type: 'SupervisorEffectiveness',
    status: 'Open',
    threshold: 0.78,
    opensAt: isoDaysFromNow(-3),
    closesAt: isoDaysFromNow(6),
    expectedCount: 6,
    responseCount: 4, // 67% — below threshold
    completionRate: 4 / 6,
    triggerBasis: 'Post3MonthProject',
    closedAt: null,
    closedByName: null,
    overrideReason: null,
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e006',
    sessionId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47f006',
    courseName: 'Negotiation Skills',
    trainerName: 'Sara Mendez',
    type: 'MaverickPostTraining',
    status: 'Open',
    threshold: 0.78,
    opensAt: isoDaysFromNow(-2),
    closesAt: isoDaysFromNow(8),
    expectedCount: 12,
    responseCount: 11, // 92% — well above
    completionRate: 11 / 12,
    triggerBasis: 'TrainingCompletion',
    closedAt: null,
    closedByName: null,
    overrideReason: null,
  },
];

export const cycleStore: Map<string, Cycle> = new Map(seed.map((c) => [c.id, { ...c }]));

export type AuditLogEntry = {
  id: string;
  actorName: string;
  action: 'CycleOverrideClose' | 'CycleClose';
  cycleId: string;
  reason: string | null;
  createdAt: string;
};

export const auditLog: AuditLogEntry[] = [
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a48a001',
    actorName: 'Alex Director',
    action: 'CycleOverrideClose',
    cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e004',
    reason: 'Two participants on extended leave; remaining 7 responses were sufficient to act on findings.',
    createdAt: isoDaysFromNow(-29),
  },
];

export const listCycles = (params: {
  status?: string;
  type?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) => {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const all = [...cycleStore.values()].sort(
    (a, b) => new Date(b.opensAt).getTime() - new Date(a.opensAt).getTime(),
  );
  const filtered = all.filter((c) => {
    if (params.status && c.status !== params.status) return false;
    if (params.type && c.type !== params.type) return false;
    if (params.q) {
      const needle = params.q.toLowerCase();
      const hay = `${c.courseName} ${c.trainerName ?? ''}`.toLowerCase();
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

export const closeCycle = (
  cycleId: string,
  actorName: string,
): { ok: true; cycle: Cycle } | { ok: false; status: number; title: string; detail: string; currentRate?: number; requiredRate?: number } => {
  const cycle = cycleStore.get(cycleId);
  if (!cycle) return { ok: false, status: 404, title: 'Not found', detail: 'No such cycle' };
  if (cycle.status !== 'Open') {
    return { ok: false, status: 409, title: 'Already closed', detail: 'This cycle is no longer open.' };
  }
  if (cycle.completionRate < cycle.threshold) {
    return {
      ok: false,
      status: 409,
      title: 'Below threshold',
      detail: `Cycle completion is ${(cycle.completionRate * 100).toFixed(0)}% — at least ${(cycle.threshold * 100).toFixed(0)}% is required to close. Use an Admin override-close to proceed.`,
      currentRate: cycle.completionRate,
      requiredRate: cycle.threshold,
    };
  }
  const next: Cycle = {
    ...cycle,
    status: 'Closed',
    closedAt: new Date().toISOString(),
    closedByName: actorName,
  };
  cycleStore.set(cycleId, next);
  auditLog.unshift({
    id: crypto.randomUUID(),
    actorName,
    action: 'CycleClose',
    cycleId,
    reason: null,
    createdAt: next.closedAt!,
  });
  return { ok: true, cycle: next };
};

export const overrideCloseCycle = (
  cycleId: string,
  actorName: string,
  reason: string,
): { ok: true; cycle: Cycle } | { ok: false; status: number; title: string; detail: string } => {
  const cycle = cycleStore.get(cycleId);
  if (!cycle) return { ok: false, status: 404, title: 'Not found', detail: 'No such cycle' };
  if (cycle.status !== 'Open') {
    return { ok: false, status: 409, title: 'Already closed', detail: 'This cycle is no longer open.' };
  }
  if (!reason || reason.trim().length < 10) {
    return { ok: false, status: 400, title: 'Reason required', detail: 'Override reason must be at least 10 characters.' };
  }
  const closedAt = new Date().toISOString();
  const next: Cycle = {
    ...cycle,
    status: 'OverrideClosed',
    closedAt,
    closedByName: actorName,
    overrideReason: reason.trim(),
  };
  cycleStore.set(cycleId, next);
  auditLog.unshift({
    id: crypto.randomUUID(),
    actorName,
    action: 'CycleOverrideClose',
    cycleId,
    reason: reason.trim(),
    createdAt: closedAt,
  });
  return { ok: true, cycle: next };
};
