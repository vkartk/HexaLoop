import type { components } from '../../../apps/web/src/lib/api/schema.gen';

type Report = components['schemas']['Report'];
type ReportRequest = components['schemas']['ReportRequest'];

const isoHoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString();

const seed: Report[] = [
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a49a001',
    scope: 'Cycles',
    format: 'Xlsx',
    status: 'Ready',
    cycleStatus: undefined,
    dateFrom: null,
    dateTo: null,
    downloadUrl: '/api/v1/reports/0192e9a8-2c1d-7a30-9c91-1f6f3a49a001/download',
    rowCount: 42,
    requestedAt: isoHoursAgo(48),
    completedAt: isoHoursAgo(48),
    requestedByName: 'Alex Director',
  },
  {
    id: '0192e9a8-2c1d-7a30-9c91-1f6f3a49a002',
    scope: 'Sentiment',
    format: 'Pdf',
    status: 'Ready',
    cycleStatus: undefined,
    dateFrom: '2026-04-01',
    dateTo: '2026-05-01',
    downloadUrl: '/api/v1/reports/0192e9a8-2c1d-7a30-9c91-1f6f3a49a002/download',
    rowCount: null,
    requestedAt: isoHoursAgo(96),
    completedAt: isoHoursAgo(96),
    requestedByName: 'Alex Director',
  },
];

export const reports: Report[] = [...seed];

export const triggerReport = (req: ReportRequest, requestedByName: string): Report => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rowCount =
    req.scope === 'Cycles' ? 18 : req.scope === 'Trainers' ? 12 : null;
  const report: Report = {
    id,
    scope: req.scope,
    format: req.format,
    status: 'Ready', // Stub completes instantly; real backend will go Queued → Running → Ready.
    cycleStatus: req.cycleStatus ?? undefined,
    dateFrom: req.dateFrom ?? null,
    dateTo: req.dateTo ?? null,
    downloadUrl: `/api/v1/reports/${id}/download`,
    rowCount,
    requestedAt: now,
    completedAt: now,
    requestedByName,
  };
  reports.unshift(report);
  return report;
};
