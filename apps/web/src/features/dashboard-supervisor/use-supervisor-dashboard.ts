import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';

export const useSupervisorDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'supervisor'],
    queryFn: async () => {
      const { data, error } = await api.GET('/dashboard/supervisor');
      if (error || !data) throw new Error(problemMessage(error, 'Could not load dashboard'));
      return data;
    },
  });
