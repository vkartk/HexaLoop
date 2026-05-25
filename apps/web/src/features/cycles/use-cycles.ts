import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import type { components } from '@/lib/api/schema.gen';

type CycleStatus = components['schemas']['CycleStatus'];
type CycleType = components['schemas']['CycleType'];
type Cycle = components['schemas']['Cycle'];
type ProblemBelowThreshold = components['schemas']['ProblemBelowThreshold'];

export type CycleListFilters = {
  status?: CycleStatus;
  type?: CycleType;
  q?: string;
  page?: number;
  pageSize?: number;
};

export const cycleKeys = {
  list: (filters: CycleListFilters) => ['cycles', filters] as const,
};

export const useCycles = (filters: CycleListFilters) =>
  useQuery({
    queryKey: cycleKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET('/cycles', { params: { query: filters } });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load cycles'));
      return data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

export type CloseError =
  | { kind: 'belowThreshold'; problem: ProblemBelowThreshold }
  | { kind: 'other'; message: string };

export const useCloseCycle = () => {
  const qc = useQueryClient();
  return useMutation<Cycle, CloseError, string>({
    mutationFn: async (cycleId) => {
      const { data, error } = await api.POST('/cycles/{cycleId}/close', {
        params: { path: { cycleId } },
      });
      if (data) return data;
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 409 &&
        'currentRate' in error &&
        'requiredRate' in error
      ) {
        throw { kind: 'belowThreshold', problem: error as ProblemBelowThreshold } satisfies CloseError;
      }
      throw { kind: 'other', message: problemMessage(error, 'Close failed') } satisfies CloseError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cycles'] }),
  });
};

export const useOverrideCloseCycle = () => {
  const qc = useQueryClient();
  return useMutation<Cycle, Error, { cycleId: string; reason: string }>({
    mutationFn: async ({ cycleId, reason }) => {
      const { data, error } = await api.POST('/cycles/{cycleId}/override-close', {
        params: { path: { cycleId } },
        body: { reason },
      });
      if (error || !data) throw new Error(problemMessage(error, 'Override-close failed'));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cycles'] }),
  });
};
