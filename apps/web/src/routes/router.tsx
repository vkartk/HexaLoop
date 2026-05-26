import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { LoginPage } from '@/features/auth/login-page';
import { AdminDashboardPage } from '@/features/dashboard-admin/admin-dashboard-page';
import { MaverickDashboardPage } from '@/features/dashboard-maverick/maverick-dashboard-page';
import { FeedbackFormPage } from '@/features/feedback/feedback-form-page';
import { CyclesListPage } from '@/features/cycles/cycles-list-page';
import { EffectivenessQueuePage } from '@/features/effectiveness/effectiveness-queue-page';
import { EffectivenessFormPage } from '@/features/effectiveness/effectiveness-form-page';
import { NotificationsPage } from '@/features/notifications/notifications-page';
import { ReportsPage } from '@/features/reports/reports-page';
import { SupervisorDashboardPage } from '@/features/dashboard-supervisor/supervisor-dashboard-page';
import { TrainersListPage } from '@/features/trainers/trainers-list-page';
import { PeopleListPage } from '@/features/people/people-list-page';
import { HistoryPage } from '@/features/history/history-page';
import { RequireAuth } from './guards';
import { RoleRedirect } from './role-redirect';
import { PlaceholderPage } from './placeholder-page';

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <RoleRedirect /> },
      {
        path: 'admin',
        element: <RequireAuth roles={['Admin']}><AdminDashboardPage /></RequireAuth>,
      },
      {
        path: 'admin/cycles',
        element: <RequireAuth roles={['Admin']}><CyclesListPage /></RequireAuth>,
      },
      {
        path: 'admin/trainers',
        element: <RequireAuth roles={['Admin']}><TrainersListPage /></RequireAuth>,
      },
      {
        path: 'admin/people',
        element: <RequireAuth roles={['Admin']}><PeopleListPage /></RequireAuth>,
      },
      {
        path: 'admin/reports',
        element: <RequireAuth roles={['Admin']}><ReportsPage /></RequireAuth>,
      },
      {
        path: 'admin/notifications',
        element: <RequireAuth roles={['Admin']}><NotificationsPage /></RequireAuth>,
      },
      {
        path: 'admin/*',
        element: <RequireAuth roles={['Admin']}><PlaceholderPage title="Coming soon" /></RequireAuth>,
      },
      {
        path: 'maverick',
        element: <RequireAuth roles={['Maverick']}><MaverickDashboardPage /></RequireAuth>,
      },
      {
        path: 'maverick/history',
        element: <RequireAuth roles={['Maverick']}><HistoryPage /></RequireAuth>,
      },
      {
        path: 'maverick/notifications',
        element: <RequireAuth roles={['Maverick']}><NotificationsPage /></RequireAuth>,
      },
      {
        path: 'maverick/*',
        element: <RequireAuth roles={['Maverick']}><PlaceholderPage title="Coming soon" /></RequireAuth>,
      },
      {
        path: 'feedback/:cycleId',
        element: <RequireAuth roles={['Maverick']}><FeedbackFormPage /></RequireAuth>,
      },
      {
        path: 'supervisor',
        element: <RequireAuth roles={['Supervisor']}><SupervisorDashboardPage /></RequireAuth>,
      },
      {
        path: 'supervisor/evaluations',
        element: <RequireAuth roles={['Supervisor']}><EffectivenessQueuePage /></RequireAuth>,
      },
      {
        path: 'supervisor/effectiveness/:cycleId/:maverickId',
        element: <RequireAuth roles={['Supervisor']}><EffectivenessFormPage /></RequireAuth>,
      },
      {
        path: 'supervisor/notifications',
        element: <RequireAuth roles={['Supervisor']}><NotificationsPage /></RequireAuth>,
      },
      {
        path: 'supervisor/*',
        element: <RequireAuth roles={['Supervisor']}><PlaceholderPage title="Coming soon" /></RequireAuth>,
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
  },
});
