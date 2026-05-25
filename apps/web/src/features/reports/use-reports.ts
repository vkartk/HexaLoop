import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import type { components } from '@/lib/api/schema.gen';

type Report = components['schemas']['Report'];
type ReportRequest = components['schemas']['ReportRequest'];

export const reportKeys = {
  list: ['reports'] as const,
};

export const useReports = () =>
  useQuery({
    queryKey: reportKeys.list,
    queryFn: async () => {
      const { data, error } = await api.GET('/reports');
      if (error || !data) throw new Error(problemMessage(error, 'Could not load reports'));
      return data;
    },
  });

export const useTriggerReport = () => {
  const qc = useQueryClient();
  return useMutation<Report, Error, ReportRequest>({
    mutationFn: async (body) => {
      const { data, error } = await api.POST('/reports', { body });
      if (error || !data) throw new Error(problemMessage(error, 'Could not generate report'));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.list }),
  });
};
