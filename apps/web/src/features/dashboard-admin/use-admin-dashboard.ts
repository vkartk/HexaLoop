import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';

export const useAdminDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const { data, error } = await api.GET('/dashboard/admin');
      if (error || !data) throw new Error(problemMessage(error, 'Could not load dashboard'));
      return data;
    },
  });
