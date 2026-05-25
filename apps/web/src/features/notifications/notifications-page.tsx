import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronRight,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/states';
import { useMarkRead, useNotifications } from './use-notifications';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Notification = components['schemas']['Notification'];

const CHANNEL_ICON: Record<Notification['channel'], typeof Mail> = {
  Email: Mail,
  SMS: MessageSquare,
  Portal: Bell,
};

const SEVERITY_TONE: Record<Notification['severity'], 'brand' | 'warn' | 'alert'> = {
  info: 'brand',
  warn: 'warn',
  alert: 'alert',
};

export const NotificationsPage = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const q = useNotifications(filter === 'unread');
  const markRead = useMarkRead();

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System reminders, alerts, and delivery confirmations."
        actions={
          <div role="tablist" aria-label="Filter notifications" className="flex gap-1">
            {(['all', 'unread'] as const).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-[12px] font-medium focus-ring',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-muted hover:bg-surface-alt hover:text-ink',
                  )}
                >
                  {f === 'all' ? 'All' : `Unread${q.data ? ` (${q.data.unreadCount})` : ''}`}
                </button>
              );
            })}
          </div>
        }
      />

      <Card>
        <CardContent className="px-0">
          {q.isLoading && <LoadingState label="Loading notifications…" />}
          {q.isError && (
            <ErrorState
              message={q.error instanceof Error ? q.error.message : 'Unknown error'}
              onRetry={() => q.refetch()}
            />
          )}
          {q.data && q.data.data.length === 0 && (
            <EmptyState
              icon={<CheckCheck className="h-5 w-5" />}
              title={filter === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
              description={
                filter === 'unread'
                  ? "You're caught up. New alerts and reminders will show here."
                  : 'Reminders, alerts, and confirmations will appear here.'
              }
            />
          )}
          {q.data && q.data.data.length > 0 && (
            <ul className="divide-y divide-border">
              {q.data.data.map((n) => (
                <Row
                  key={n.id}
                  notification={n}
                  onMarkRead={() => markRead.mutate(n.id)}
                  busy={markRead.isPending && markRead.variables === n.id}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({
  notification: n,
  onMarkRead,
  busy,
}: {
  notification: Notification;
  onMarkRead: () => void;
  busy: boolean;
}) => {
  const Icon = CHANNEL_ICON[n.channel];
  const unread = n.status !== 'Read';
  const content = (
    <div className="flex items-start gap-3 px-5 py-4">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
          n.severity === 'alert'
            ? 'bg-red-50 text-alert'
            : n.severity === 'warn'
              ? 'bg-amber-50 text-warn'
              : 'bg-brand-50 text-brand-700',
        )}
        aria-hidden
      >
        {n.severity === 'alert' ? <AlertTriangle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              'truncate text-[14px]',
              unread ? 'font-medium text-ink' : 'text-ink-muted',
            )}
          >
            {n.subject}
          </p>
          <Badge tone={SEVERITY_TONE[n.severity]}>{n.channel}</Badge>
          {unread && (
            <span aria-label="Unread" className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
          )}
        </div>
        {n.body && <p className="mt-1 text-[12px] text-ink-muted">{n.body}</p>}
        <p className="mt-1.5 text-[11px] text-ink-subtle">
          {formatRelativeTime(n.createdAt)}
          {n.status === 'Read' && n.readAt ? ` · read ${formatRelativeTime(n.readAt)}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {unread && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkRead();
            }}
            aria-label="Mark as read"
            title="Mark as read"
          >
            <CheckCheck className="h-4 w-4" aria-hidden />
          </Button>
        )}
        {n.href && <ChevronRight className="h-4 w-4 text-ink-subtle" aria-hidden />}
      </div>
    </div>
  );

  return (
    <li>
      {n.href ? (
        <Link
          to={n.href}
          className="block hover:bg-surface-alt focus-ring"
          onClick={() => unread && onMarkRead()}
        >
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}
    </li>
  );
};
