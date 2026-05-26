import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';

export type HistoryFilters = {
  page?: number;
  pageSize?: number;
};

export const historyKeys = {
  list: (filters: HistoryFilters) => ['feedback-history', filters] as const,
};

export const useFeedbackHistory = (filters: HistoryFilters) =>
  useQuery({
    queryKey: historyKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET('/feedback/history', { params: { query: filters } });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load history'));
      return data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
