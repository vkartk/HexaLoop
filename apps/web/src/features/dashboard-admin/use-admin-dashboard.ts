import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';

export type AdminDashboardWindow = '30d' | '90d' | 'all';

export const useAdminDashboard = (window: AdminDashboardWindow = '90d') =>
  useQuery({
    queryKey: ['dashboard', 'admin', window],
    queryFn: async () => {
      const { data, error } = await api.GET('/dashboard/admin', {
        params: { query: { window } },
      });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load dashboard'));
      return data;
    },
  });
