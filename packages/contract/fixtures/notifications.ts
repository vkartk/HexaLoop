import type { components } from '../../../apps/web/src/lib/api/schema.gen';

type Notification = components['schemas']['Notification'];
type Role = components['schemas']['Role'];

const hoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString();

const SEED_BY_ROLE: Record<Role, Omit<Notification, 'id'>[]> = {
  Admin: [
    {
      channel: 'Portal',
      subject: 'Cycle "Cloud Foundations — Q2 cohort" below threshold',
      body: 'Completion is 71%. The cycle cannot be closed without an Admin override-close.',
      status: 'Sent',
      severity: 'alert',
      relatedCycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e001',
      href: '/admin/cycles?status=Open',
      createdAt: hoursAgo(6),
      sentAt: hoursAgo(6),
      readAt: null,
    },
    {
      channel: 'Email',
      subject: '5 AI recommendations awaiting your approval',
      body: 'Trainer follow-ups and low-rating nudges are queued. Review before they go out.',
      status: 'Sent',
      severity: 'warn',
      relatedCycleId: null,
      href: null,
      createdAt: hoursAgo(22),
      sentAt: hoursAgo(22),
      readAt: null,
    },
    {
      channel: 'Email',
      subject: 'Weekly sentiment digest is ready',
      body: 'Positive sentiment up 4 points week-over-week (418 responses).',
      status: 'Read',
      severity: 'info',
      relatedCycleId: null,
      href: '/admin',
      createdAt: hoursAgo(72),
      sentAt: hoursAgo(72),
      readAt: hoursAgo(70),
    },
  ],
  Maverick: [
    {
      channel: 'Portal',
      subject: 'Reminder: Stakeholder Communication feedback due in 1 day',
      body: "We've saved your draft — just need a couple more lines and a submit.",
      status: 'Sent',
      severity: 'warn',
      relatedCycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e003',
      href: '/feedback/0192e9a8-2c1d-7a30-9c91-1f6f3a47e003',
      createdAt: hoursAgo(4),
      sentAt: hoursAgo(4),
      readAt: null,
    },
    {
      channel: 'Email',
      subject: 'New: Cloud Foundations — Module 3 feedback opened',
      body: 'A new feedback form is available. Most people finish in under a minute.',
      status: 'Sent',
      severity: 'info',
      relatedCycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e002',
      href: '/feedback/0192e9a8-2c1d-7a30-9c91-1f6f3a47e002',
      createdAt: hoursAgo(28),
      sentAt: hoursAgo(28),
      readAt: null,
    },
    {
      channel: 'Email',
      subject: 'Thanks — your Agile Delivery feedback is submitted',
      body: 'A summary will be shared with you once the cycle closes.',
      status: 'Read',
      severity: 'info',
      relatedCycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a47e010',
      href: null,
      createdAt: hoursAgo(14 * 24),
      sentAt: hoursAgo(14 * 24),
      readAt: hoursAgo(13 * 24),
    },
  ],
  Supervisor: [
    {
      channel: 'Portal',
      subject: '3 effectiveness evaluations due this week',
      body: "Open the queue to see who's waiting and which Maverick has the soonest deadline.",
      status: 'Sent',
      severity: 'warn',
      relatedCycleId: null,
      href: '/supervisor/evaluations',
      createdAt: hoursAgo(3),
      sentAt: hoursAgo(3),
      readAt: null,
    },
    {
      channel: 'Email',
      subject: "Daniel Okeke's Stakeholder review is overdue tomorrow",
      body: 'You have a partial draft. A few sentences in comments and you can submit.',
      status: 'Sent',
      severity: 'alert',
      relatedCycleId: '0192e9a8-2c1d-7a30-9c91-1f6f3a48c001',
      href: '/supervisor/evaluations',
      createdAt: hoursAgo(18),
      sentAt: hoursAgo(18),
      readAt: null,
    },
  ],
};

const newId = () => crypto.randomUUID();

/** Notifications keyed by `${userId}` → list of notifications. Mutable in memory. */
const notificationsByUser = new Map<string, Notification[]>();

const seedFor = (userId: string, role: Role): Notification[] => {
  const existing = notificationsByUser.get(userId);
  if (existing) return existing;
  const seeded = SEED_BY_ROLE[role].map((n) => ({ ...n, id: newId() }));
  notificationsByUser.set(userId, seeded);
  return seeded;
};

export const listNotifications = (userId: string, role: Role, unreadOnly = false) => {
  const all = seedFor(userId, role);
  const data = unreadOnly ? all.filter((n) => n.status !== 'Read') : [...all];
  data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = all.filter((n) => n.status !== 'Read').length;
  return { data, unreadCount };
};

export const markNotificationRead = (
  userId: string,
  role: Role,
  notificationId: string,
): Notification | null => {
  const list = seedFor(userId, role);
  const idx = list.findIndex((n) => n.id === notificationId);
  if (idx < 0) return null;
  const current = list[idx];
  if (!current) return null;
  const next: Notification = {
    ...current,
    status: 'Read',
    readAt: new Date().toISOString(),
  };
  list[idx] = next;
  return next;
};
