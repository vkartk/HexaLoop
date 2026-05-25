import { http, HttpResponse, delay } from 'msw';
import {
  users,
  credentials,
  adminDashboard,
  maverickDashboard,
  supervisorDashboard,
  feedbackCycles,
  getOrCreateDraft,
  upsertDraft,
  submitDraft,
  listCycles,
  closeCycle,
  overrideCloseCycle,
  effectivenessCycles,
  effectivenessMavericks,
  getOrCreateEffectivenessDraft,
  upsertEffectivenessDraft,
  submitEffectivenessDraft,
  listEffectivenessQueue,
  stubChatReply,
  listNotifications,
  markNotificationRead,
  reports,
  triggerReport,
} from '@hexaloop/contract/fixtures';
import type { components } from '@/lib/api/schema.gen';

type User = components['schemas']['User'];
type AuthSession = components['schemas']['AuthSession'];
type Problem = components['schemas']['Problem'];

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const NETWORK_DELAY_MS = 250;

const issueToken = (kind: 'access' | 'refresh', email: string): string =>
  `${kind === 'access' ? 'at' : 'rt'}_mock_${btoa(email)}_${Date.now()}`;

const tokenIndex = new Map<string, User>();

const sessionForUser = (user: User): AuthSession => {
  const accessToken = issueToken('access', user.email);
  const refreshToken = issueToken('refresh', user.email);
  tokenIndex.set(accessToken, user);
  tokenIndex.set(refreshToken, user);
  return {
    accessToken,
    refreshToken,
    expiresInSeconds: 900,
    user,
  };
};

const problem = (status: number, title: string, detail?: string): Response => {
  const body: Problem = {
    type: 'about:blank',
    title,
    status,
    detail,
    traceId: `mock-${crypto.randomUUID()}`,
  };
  return HttpResponse.json(body, {
    status,
    headers: { 'content-type': 'application/problem+json' },
  });
};

const requireUser = (request: Request): User | Response => {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return problem(401, 'Unauthorized', 'Missing bearer token');
  const token = auth.slice('Bearer '.length);
  const user = tokenIndex.get(token);
  if (!user) return problem(401, 'Unauthorized', 'Token unknown or expired');
  return user;
};

export const handlers = [
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const match = Object.values(credentials).find(
      (c) => c.email.toLowerCase() === email && c.password === password,
    );
    if (!match) {
      return problem(401, 'Unauthorized', 'Invalid email or password');
    }
    const user = users[match.userKey];
    if (!user) return problem(500, 'Server error', 'Fixture user missing');
    return HttpResponse.json(sessionForUser(user));
  }),

  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const body = (await request.json()) as { refreshToken?: string };
    const user = body.refreshToken ? tokenIndex.get(body.refreshToken) : undefined;
    if (!user) return problem(401, 'Unauthorized', 'Refresh token invalid');
    return HttpResponse.json(sessionForUser(user));
  }),

  http.get(`${BASE}/auth/me`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    return HttpResponse.json(result);
  }),

  http.get(`${BASE}/dashboard/admin`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Admin') return problem(403, 'Forbidden', 'Admin role required');
    return HttpResponse.json(adminDashboard);
  }),

  http.get(`${BASE}/dashboard/maverick`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Maverick') return problem(403, 'Forbidden', 'Maverick role required');
    // Reflect the live draft store so submitting a cycle actually clears it from "pending".
    const pending = maverickDashboard.pending
      .map((item) => {
        const draft = getOrCreateDraft(result.id, item.cycleId);
        if (!draft) return item;
        if (draft.status === 'Submitted') return null;
        const status =
          draft.overallRating != null || draft.highlights || draft.improvements
            ? ('Draft' as const)
            : item.status;
        return { ...item, status };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    const submittedNow = maverickDashboard.pending.filter((item) => {
      const d = getOrCreateDraft(result.id, item.cycleId);
      return d?.status === 'Submitted';
    });
    const completed = [...maverickDashboard.completed, ...submittedNow];
    const submittedCount = maverickDashboard.streak.submittedCount + submittedNow.length;
    return HttpResponse.json({
      ...maverickDashboard,
      pending,
      completed,
      streak: { ...maverickDashboard.streak, submittedCount },
    });
  }),

  http.get(`${BASE}/dashboard/supervisor`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Supervisor') return problem(403, 'Forbidden', 'Supervisor role required');
    // Reflect the live effectiveness draft store: per-maverick pending counts + grand total.
    const queue = listEffectivenessQueue(result.id);
    const pendingByMaverick = new Map<string, number>();
    for (const it of queue.pending) {
      pendingByMaverick.set(it.maverickId, (pendingByMaverick.get(it.maverickId) ?? 0) + 1);
    }
    const team = supervisorDashboard.team.map((row) => ({
      ...row,
      pendingCount: pendingByMaverick.get(row.maverickId) ?? 0,
    }));
    return HttpResponse.json({
      ...supervisorDashboard,
      team,
      pendingEvaluations: queue.pending.length,
    });
  }),

  http.get(`${BASE}/effectiveness/pending`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Supervisor') return problem(403, 'Forbidden', 'Supervisor role required');
    return HttpResponse.json(listEffectivenessQueue(result.id));
  }),

  http.get(`${BASE}/effectiveness/:cycleId/:maverickId`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Supervisor') return problem(403, 'Forbidden', 'Supervisor role required');
    const cycleId = String(params.cycleId);
    const maverickId = String(params.maverickId);
    const cycle = effectivenessCycles[cycleId];
    const maverick = effectivenessMavericks[maverickId];
    if (!cycle || !maverick) return problem(404, 'Not found', 'No such cycle or Maverick');
    const draft = getOrCreateEffectivenessDraft(result.id, cycleId, maverickId);
    if (!draft) return problem(404, 'Not found', 'Could not initialise draft');
    return HttpResponse.json({ cycle, maverick, draft });
  }),

  http.put(`${BASE}/effectiveness/:cycleId/:maverickId`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Supervisor') return problem(403, 'Forbidden', 'Supervisor role required');
    const cycleId = String(params.cycleId);
    const maverickId = String(params.maverickId);
    const cycle = effectivenessCycles[cycleId];
    if (!cycle) return problem(404, 'Not found', 'No such cycle');
    const current = getOrCreateEffectivenessDraft(result.id, cycleId, maverickId);
    if (current?.status === 'Submitted') {
      return problem(409, 'Already submitted', 'This evaluation was already submitted.');
    }
    if (cycle.status !== 'Open') {
      return problem(409, 'Cycle closed', 'This cycle is read-only.');
    }
    const body = (await request.json()) as Record<string, unknown>;
    for (const f of [
      'technicalCompetency',
      'softSkills',
      'projectPerformance',
      'overallReadiness',
    ] as const) {
      const v = body[f];
      if (v != null && (typeof v !== 'number' || v < 1 || v > 5)) {
        return problem(400, 'Invalid rating', `${f} must be between 1 and 5.`);
      }
    }
    const next = upsertEffectivenessDraft(result.id, cycleId, maverickId, body);
    if (!next) return problem(500, 'Server error', 'Draft missing');
    return HttpResponse.json(next);
  }),

  http.post(`${BASE}/effectiveness/:cycleId/:maverickId/submit`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Supervisor') return problem(403, 'Forbidden', 'Supervisor role required');
    const cycleId = String(params.cycleId);
    const maverickId = String(params.maverickId);
    const cycle = effectivenessCycles[cycleId];
    if (!cycle) return problem(404, 'Not found', 'No such cycle');
    if (cycle.status !== 'Open') {
      return problem(409, 'Cycle closed', 'This cycle no longer accepts submissions.');
    }
    const current = getOrCreateEffectivenessDraft(result.id, cycleId, maverickId);
    if (current?.status === 'Submitted') {
      return problem(409, 'Already submitted', 'This evaluation was already submitted.');
    }
    const body = (await request.json()) as {
      technicalCompetency?: number;
      softSkills?: number;
      projectPerformance?: number;
      overallReadiness?: number;
      comments?: string;
      futureTrainingRecommendations?: string | null;
    };
    const ratings = [
      body.technicalCompetency,
      body.softSkills,
      body.projectPerformance,
      body.overallReadiness,
    ];
    if (
      ratings.some((v) => v == null || v < 1 || v > 5) ||
      !body.comments?.trim()
    ) {
      return problem(
        409,
        'Incomplete evaluation',
        'All four ratings and the comments field are required to submit.',
      );
    }
    const next = submitEffectivenessDraft(result.id, cycleId, maverickId, {
      technicalCompetency: body.technicalCompetency!,
      softSkills: body.softSkills!,
      projectPerformance: body.projectPerformance!,
      overallReadiness: body.overallReadiness!,
      comments: body.comments!,
      futureTrainingRecommendations: body.futureTrainingRecommendations ?? null,
    });
    if (!next) return problem(500, 'Server error', 'Draft missing');
    return HttpResponse.json(next);
  }),

  http.get(`${BASE}/feedback/:cycleId`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Maverick') return problem(403, 'Forbidden', 'Maverick role required');
    const cycleId = String(params.cycleId);
    const cycle = feedbackCycles[cycleId];
    if (!cycle) return problem(404, 'Not found', 'No such feedback cycle');
    const draft = getOrCreateDraft(result.id, cycleId);
    if (!draft) return problem(404, 'Not found', 'No such feedback cycle');
    return HttpResponse.json({ cycle, draft });
  }),

  http.put(`${BASE}/feedback/:cycleId`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Maverick') return problem(403, 'Forbidden', 'Maverick role required');
    const cycleId = String(params.cycleId);
    const cycle = feedbackCycles[cycleId];
    if (!cycle) return problem(404, 'Not found', 'No such feedback cycle');
    const current = getOrCreateDraft(result.id, cycleId);
    if (current?.status === 'Submitted') {
      return problem(409, 'Already submitted', 'This feedback was already submitted and cannot be edited.');
    }
    if (cycle.status !== 'Open') {
      return problem(409, 'Cycle closed', 'This cycle is closed; drafts are read-only.');
    }
    const body = (await request.json()) as {
      overallRating?: number | null;
      highlights?: string | null;
      improvements?: string | null;
    };
    if (body.overallRating != null && (body.overallRating < 1 || body.overallRating > 5)) {
      return problem(400, 'Invalid rating', 'overallRating must be between 1 and 5.');
    }
    const next = upsertDraft(result.id, cycleId, body);
    if (!next) return problem(500, 'Server error', 'Draft missing');
    return HttpResponse.json(next);
  }),

  http.get(`${BASE}/cycles`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Admin') return problem(403, 'Forbidden', 'Admin role required');
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const pageSize = url.searchParams.get('pageSize');
    const payload = listCycles({
      status: url.searchParams.get('status') ?? undefined,
      type: url.searchParams.get('type') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return HttpResponse.json(payload);
  }),

  http.post(`${BASE}/cycles/:cycleId/close`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Admin') return problem(403, 'Forbidden', 'Admin role required');
    const outcome = closeCycle(String(params.cycleId), result.fullName);
    if (outcome.ok) return HttpResponse.json(outcome.cycle);

    if (outcome.status === 409 && outcome.currentRate != null && outcome.requiredRate != null) {
      // RFC 9457 problem+json with the threshold extension fields.
      return HttpResponse.json(
        {
          type: 'https://hexaloop.dev/problems/below-threshold',
          title: outcome.title,
          status: outcome.status,
          detail: outcome.detail,
          traceId: `mock-${crypto.randomUUID()}`,
          currentRate: outcome.currentRate,
          requiredRate: outcome.requiredRate,
          cycleId: String(params.cycleId),
        },
        {
          status: outcome.status,
          headers: { 'content-type': 'application/problem+json' },
        },
      );
    }
    return problem(outcome.status, outcome.title, outcome.detail);
  }),

  http.post(`${BASE}/cycles/:cycleId/override-close`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Admin') return problem(403, 'Forbidden', 'Admin role required');
    const body = (await request.json()) as { reason?: string };
    const outcome = overrideCloseCycle(
      String(params.cycleId),
      result.fullName,
      body.reason ?? '',
    );
    if (outcome.ok) return HttpResponse.json(outcome.cycle);
    return problem(outcome.status, outcome.title, outcome.detail);
  }),

  http.get(`${BASE}/notifications`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    return HttpResponse.json(listNotifications(result.id, result.role, unreadOnly));
  }),

  http.post(`${BASE}/notifications/:notificationId/read`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    const updated = markNotificationRead(result.id, result.role, String(params.notificationId));
    if (!updated) return problem(404, 'Not found', 'No such notification');
    return HttpResponse.json(updated);
  }),

  http.get(`${BASE}/reports`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Admin') return problem(403, 'Forbidden', 'Admin role required');
    return HttpResponse.json({ data: reports });
  }),

  http.post(`${BASE}/reports`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Admin') return problem(403, 'Forbidden', 'Admin role required');
    const body = (await request.json()) as {
      scope?: 'Cycles' | 'Trainers' | 'Sentiment';
      format?: 'Xlsx' | 'Csv' | 'Pdf';
      cycleStatus?: 'Open' | 'Closed' | 'OverrideClosed';
      dateFrom?: string;
      dateTo?: string;
    };
    if (!body.scope || !body.format) {
      return problem(400, 'Invalid request', 'scope and format are required.');
    }
    const report = triggerReport(
      {
        scope: body.scope,
        format: body.format,
        cycleStatus: body.cycleStatus,
        dateFrom: body.dateFrom ?? null,
        dateTo: body.dateTo ?? null,
      },
      result.fullName,
    );
    return HttpResponse.json(report, { status: 202 });
  }),

  http.post(`${BASE}/chat`, async ({ request }) => {
    await delay(NETWORK_DELAY_MS + 300); // a bit of "thinking" latency
    const result = requireUser(request);
    if (result instanceof Response) return result;
    const body = (await request.json()) as {
      messages?: Array<{ role: string; content: string }>;
      context?: { route?: string | null };
    };
    const lastUser = [...(body.messages ?? [])].reverse().find((m) => m.role === 'user');
    if (!lastUser?.content) {
      return problem(400, 'Empty conversation', 'Provide at least one user message.');
    }
    const reply = stubChatReply(result.role, lastUser.content, body.context);
    return HttpResponse.json(reply);
  }),

  http.post(`${BASE}/feedback/:cycleId/submit`, async ({ request, params }) => {
    await delay(NETWORK_DELAY_MS);
    const result = requireUser(request);
    if (result instanceof Response) return result;
    if (result.role !== 'Maverick') return problem(403, 'Forbidden', 'Maverick role required');
    const cycleId = String(params.cycleId);
    const cycle = feedbackCycles[cycleId];
    if (!cycle) return problem(404, 'Not found', 'No such feedback cycle');
    if (cycle.status !== 'Open') {
      return problem(409, 'Cycle closed', 'This cycle no longer accepts submissions.');
    }
    const current = getOrCreateDraft(result.id, cycleId);
    if (current?.status === 'Submitted') {
      return problem(409, 'Already submitted', 'This feedback was already submitted.');
    }
    const body = (await request.json()) as {
      overallRating?: number;
      highlights?: string;
      improvements?: string;
    };
    if (
      !body.overallRating ||
      body.overallRating < 1 ||
      body.overallRating > 5 ||
      !body.highlights?.trim() ||
      !body.improvements?.trim()
    ) {
      return problem(409, 'Incomplete feedback', 'Rating, highlights, and improvements are all required to submit.');
    }
    const next = submitDraft(result.id, cycleId, {
      overallRating: body.overallRating,
      highlights: body.highlights,
      improvements: body.improvements,
    });
    if (!next) return problem(500, 'Server error', 'Draft missing');
    return HttpResponse.json(next);
  }),
];
