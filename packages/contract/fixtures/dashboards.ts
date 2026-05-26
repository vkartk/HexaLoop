import type { components } from '../../../apps/web/src/lib/api/schema.gen';

type AdminDashboard = components['schemas']['AdminDashboard'];
type MaverickDashboard = components['schemas']['MaverickDashboard'];
type SupervisorDashboard = components['schemas']['SupervisorDashboard'];

export type AdminDashboardWindow = '30d' | '90d' | 'all';

const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
};

const baseAdminDashboard: AdminDashboard = {
  metrics: [
    {
      key: 'completion',
      label: 'Cycle completion',
      value: '82%',
      helper: 'Across 6 open cycles',
      trend: { direction: 'up', deltaPct: 4.1 },
    },
    {
      key: 'avgRating',
      label: 'Avg rating (last 30d)',
      value: '4.2 / 5',
      helper: '418 responses',
      trend: { direction: 'flat', deltaPct: 0.2 },
    },
    {
      key: 'cyclesBelowThreshold',
      label: 'Cycles below 78% threshold',
      value: '2',
      helper: 'Block close until override',
      trend: { direction: 'down', deltaPct: -1 },
    },
    {
      key: 'pendingApprovals',
      label: 'AI recommendations pending approval',
      value: '5',
      helper: 'Trainer follow-ups + low-rating nudges',
    },
  ],
  sentiment: {
    positive: 0.68,
    neutral: 0.21,
    negative: 0.11,
    ai: {
      aiGenerated: true,
      degraded: true,
      sourceCount: 418,
      generatedAt: new Date().toISOString(),
    },
  },
  trainers: [
    {
      trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c001',
      name: 'Dr. Anika Rao',
      organization: 'Internal — Cloud Practice',
      courses: 4,
      sessions: 12,
      avgRating: 4.6,
      completionRate: 0.92,
    },
    {
      trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c002',
      name: 'Lukas Bauer',
      organization: 'NorthArrow Consulting',
      courses: 2,
      sessions: 7,
      avgRating: 4.1,
      completionRate: 0.78,
    },
    {
      trainerId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47c003',
      name: 'Sara Mendez',
      organization: 'Internal — Soft Skills',
      courses: 3,
      sessions: 9,
      avgRating: 3.9,
      completionRate: 0.71,
    },
  ],
  alerts: [
    {
      id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47d001',
      severity: 'alert',
      title: 'Cycle "Q2 Cloud Foundations" 71% — below threshold',
      body: 'Closing this cycle requires an override-close and Admin sign-off.',
      cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e001',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: '0192e9a8-2c1d-7a30-9c91-1f6f3a47d002',
      severity: 'warn',
      title: '3 Mavericks have not started their post-training feedback',
      cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e002',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    },
  ],
  insight: {
    summary:
      'Positive sentiment is up 4 points over the last cycle. The most common improvement request remains "more hands-on labs", concentrated in technical courses delivered by external trainers.',
    topThemes: ['hands-on labs', 'pacing too fast', 'real project examples'],
    ai: {
      aiGenerated: true,
      degraded: true,
      sourceCount: 418,
      generatedAt: new Date().toISOString(),
    },
  },
};

// Window-specific overrides. The 90d view is the baseline. 30d narrows the
// data (fewer responses, fresher trends); `all` aggregates lifetime numbers.
// Trainer scorecard rows scale their session/response volume with the window.
const scaleTrainers = (
  trainers: AdminDashboard['trainers'],
  factor: number,
): AdminDashboard['trainers'] =>
  trainers.map((t) => ({
    ...t,
    sessions: Math.max(1, Math.round(t.sessions * factor)),
  }));

export const getAdminDashboard = (
  window: AdminDashboardWindow = '90d',
): AdminDashboard => {
  if (window === '30d') {
    return {
      ...baseAdminDashboard,
      metrics: [
        {
          key: 'completion',
          label: 'Cycle completion',
          value: '79%',
          helper: 'Across 4 open cycles · last 30 days',
          trend: { direction: 'down', deltaPct: -2.1 },
        },
        {
          key: 'avgRating',
          label: 'Avg rating (last 30d)',
          value: '4.3 / 5',
          helper: '142 responses',
          trend: { direction: 'up', deltaPct: 1.4 },
        },
        {
          key: 'cyclesBelowThreshold',
          label: 'Cycles below 78% threshold',
          value: '1',
          helper: 'Block close until override',
          trend: { direction: 'flat', deltaPct: 0 },
        },
        {
          key: 'pendingApprovals',
          label: 'AI recommendations pending approval',
          value: '2',
          helper: 'Trainer follow-ups + low-rating nudges',
        },
      ],
      sentiment: {
        ...baseAdminDashboard.sentiment,
        positive: 0.72,
        neutral: 0.2,
        negative: 0.08,
        ai: { ...baseAdminDashboard.sentiment.ai, sourceCount: 142 },
      },
      trainers: scaleTrainers(baseAdminDashboard.trainers, 0.35),
      insight: {
        ...baseAdminDashboard.insight,
        summary:
          'Last 30 days: sentiment trending up, driven by the Cloud Foundations cohort. One cycle still sits below threshold — close behaviour requires override.',
        ai: { ...baseAdminDashboard.insight.ai, sourceCount: 142 },
      },
    };
  }
  if (window === 'all') {
    return {
      ...baseAdminDashboard,
      metrics: [
        {
          key: 'completion',
          label: 'Cycle completion',
          value: '84%',
          helper: 'Across 38 closed cycles · lifetime',
          trend: { direction: 'up', deltaPct: 6.5 },
        },
        {
          key: 'avgRating',
          label: 'Avg rating (lifetime)',
          value: '4.1 / 5',
          helper: '2,310 responses',
          trend: { direction: 'up', deltaPct: 1.1 },
        },
        {
          key: 'cyclesBelowThreshold',
          label: 'Cycles below 78% threshold',
          value: '5',
          helper: 'Lifetime — includes overrides',
          trend: { direction: 'down', deltaPct: -3 },
        },
        {
          key: 'pendingApprovals',
          label: 'AI recommendations pending approval',
          value: '5',
          helper: 'Trainer follow-ups + low-rating nudges',
        },
      ],
      sentiment: {
        ...baseAdminDashboard.sentiment,
        positive: 0.66,
        neutral: 0.22,
        negative: 0.12,
        ai: { ...baseAdminDashboard.sentiment.ai, sourceCount: 2310 },
      },
      trainers: scaleTrainers(baseAdminDashboard.trainers, 3.4),
      insight: {
        ...baseAdminDashboard.insight,
        summary:
          'Lifetime view: sentiment has gradually improved, with completion now 6 points above the year-ago baseline. "Hands-on labs" remains the most-requested change across all cohorts.',
        ai: { ...baseAdminDashboard.insight.ai, sourceCount: 2310 },
      },
    };
  }
  return baseAdminDashboard;
};

export const adminDashboard: AdminDashboard = baseAdminDashboard;

export const maverickDashboard: MaverickDashboard = {
  pending: [
    {
      cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e002',
      courseName: 'Cloud Foundations — Module 3',
      trainerName: 'Dr. Anika Rao',
      sessionEndedAt: isoDaysFromNow(-2),
      dueAt: isoDaysFromNow(3),
      status: 'NotStarted',
    },
    {
      cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e003',
      courseName: 'Stakeholder Communication',
      trainerName: 'Sara Mendez',
      sessionEndedAt: isoDaysFromNow(-5),
      dueAt: isoDaysFromNow(1),
      status: 'Draft',
    },
  ],
  completed: [
    {
      cycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e010',
      courseName: 'Agile Delivery Basics',
      trainerName: 'Lukas Bauer',
      sessionEndedAt: isoDaysFromNow(-21),
      dueAt: isoDaysFromNow(-14),
      status: 'Submitted',
    },
  ],
  streak: {
    submittedCount: 7,
    onTimeRate: 0.86,
  },
};

export const supervisorDashboard: SupervisorDashboard = {
  pendingEvaluations: 3,
  team: [
    {
      maverickId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b101',
      maverickName: 'Priya Shah',
      pendingCount: 1,
      lastSubmittedAt: isoDaysFromNow(-9),
    },
    {
      maverickId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b102',
      maverickName: 'Daniel Okeke',
      pendingCount: 2,
      lastSubmittedAt: isoDaysFromNow(-30),
    },
    {
      maverickId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47b103',
      maverickName: 'Yui Tanaka',
      pendingCount: 0,
      lastSubmittedAt: isoDaysFromNow(-3),
    },
  ],
  metrics: [
    {
      key: 'teamEffectiveness',
      label: 'Team avg readiness',
      value: '4.0 / 5',
      helper: 'Across 8 reports',
      trend: { direction: 'up', deltaPct: 2.3 },
    },
    {
      key: 'pendingForms',
      label: 'Forms past due',
      value: '1',
      helper: 'Reminder sent today',
    },
  ],
};
