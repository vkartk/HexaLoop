import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  CalendarRange,
  BellRing,
  MessagesSquare,
  BarChart3,
  GraduationCap,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import { ChatPanel } from '@/features/chat/chat-panel';
import { useNotifications } from '@/features/notifications/use-notifications';
import { cn } from '@/lib/utils';
import type { components } from '@/lib/api/schema.gen';

type Role = components['schemas']['Role'];

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
};

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  Admin: [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
    { to: '/admin/cycles', label: 'Cycles', icon: <CalendarRange className="h-4 w-4" /> },
    { to: '/admin/trainers', label: 'Trainers', icon: <GraduationCap className="h-4 w-4" /> },
    { to: '/admin/people', label: 'People', icon: <Users className="h-4 w-4" /> },
    { to: '/admin/reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
    { to: '/admin/notifications', label: 'Notifications', icon: <BellRing className="h-4 w-4" /> },
  ],
  Maverick: [
    { to: '/maverick', label: 'My feedback', icon: <ClipboardCheck className="h-4 w-4" />, end: true },
    { to: '/maverick/history', label: 'History', icon: <CalendarRange className="h-4 w-4" /> },
    { to: '/maverick/notifications', label: 'Notifications', icon: <BellRing className="h-4 w-4" /> },
  ],
  Supervisor: [
    { to: '/supervisor', label: 'Team overview', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
    { to: '/supervisor/evaluations', label: 'Effectiveness forms', icon: <ClipboardCheck className="h-4 w-4" /> },
    { to: '/supervisor/notifications', label: 'Notifications', icon: <BellRing className="h-4 w-4" /> },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  Admin: 'Admin · L&D',
  Maverick: 'Maverick',
  Supervisor: 'Supervisor',
};

const initials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const AppShell = () => {
  const { user, clear } = useAuthStore();
  const toggleChat = useChatStore((s) => s.toggle);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const notifications = useNotifications(false);
  const unreadCount = notifications.data?.unreadCount ?? 0;

  if (!user) return null;

  const nav = NAV_BY_ROLE[user.role];

  return (
    <div className="min-h-dvh bg-surface-alt text-ink">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-hairline border-border bg-surface px-4 md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="focus-ring rounded p-2 text-ink-muted hover:bg-surface-alt"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand text-white text-[12px] font-medium">
            HL
          </div>
          <span className="text-sm font-medium">HexaLoop</span>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[12px] font-medium text-brand-700"
          aria-label={user.fullName}
        >
          {initials(user.fullName)}
        </div>
      </header>

      <div className="md:flex">
        {/* Side nav */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-20 w-64 transform border-r-hairline border-border bg-surface transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          <div className="hidden h-14 items-center gap-2 border-b-hairline border-border px-5 md:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-brand text-white text-[12px] font-medium">
              HL
            </div>
            <span className="text-sm font-medium">HexaLoop</span>
          </div>

          <nav aria-label="Primary" className="flex flex-col gap-0.5 p-3">
            {nav.map((item) => {
              const showUnread = item.label === 'Notifications' && unreadCount > 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium focus-ring',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-muted hover:bg-surface-alt hover:text-ink',
                    )
                  }
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {showUnread && (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-white">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={() => {
                toggleChat();
                setOpen(false);
              }}
              className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-medium text-ai-600/80 hover:bg-ai-50 hover:text-ai-600 focus-ring"
            >
              <MessagesSquare className="h-4 w-4" />
              Ask HexaLoop
            </button>
          </nav>

          <div className="absolute inset-x-0 bottom-0 border-t-hairline border-border p-3">
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[12px] font-medium text-brand-700">
                {initials(user.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{user.fullName}</p>
                <p className="truncate text-[11px] text-ink-subtle">{ROLE_LABEL[user.role]}</p>
              </div>
              <button
                type="button"
                onClick={clear}
                aria-label="Sign out"
                title="Sign out"
                className="focus-ring rounded p-1 text-ink-subtle hover:bg-surface-alt hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {open && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 bg-black/30 md:hidden"
          />
        )}

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      <ChatPanel />
    </div>
  );
};
