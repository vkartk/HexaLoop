import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import type { components } from '@/lib/api/schema.gen';

type Bundle = components['schemas']['EffectivenessFormBundle'];
type Draft = components['schemas']['EffectivenessDraft'];
type Patch = components['schemas']['EffectivenessDraftPatch'];

export const effectivenessKeys = {
  queue: ['effectiveness', 'queue'] as const,
  bundle: (cycleId: string, maverickId: string) =>
    ['effectiveness', cycleId, maverickId] as const,
};

export const useEffectivenessQueue = () =>
  useQuery({
    queryKey: effectivenessKeys.queue,
    queryFn: async () => {
      const { data, error } = await api.GET('/effectiveness/pending');
      if (error || !data) throw new Error(problemMessage(error, 'Could not load queue'));
      return data;
    },
  });

export const useEffectivenessBundle = (cycleId: string, maverickId: string) =>
  useQuery({
    queryKey: effectivenessKeys.bundle(cycleId, maverickId),
    queryFn: async () => {
      const { data, error } = await api.GET('/effectiveness/{cycleId}/{maverickId}', {
        params: { path: { cycleId, maverickId } },
      });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load evaluation'));
      return data;
    },
    staleTime: 60_000,
  });

export const useAutosaveEffectiveness = (cycleId: string, maverickId: string) => {
  const qc = useQueryClient();
  return useMutation<Draft, Error, Patch>({
    mutationFn: async (patch) => {
      const { data, error } = await api.PUT('/effectiveness/{cycleId}/{maverickId}', {
        params: { path: { cycleId, maverickId } },
        body: patch,
      });
      if (error || !data) throw new Error(problemMessage(error, 'Save failed'));
      return data;
    },
    onSuccess: (saved) => {
      qc.setQueryData<Bundle | undefined>(effectivenessKeys.bundle(cycleId, maverickId), (prev) =>
        prev ? { ...prev, draft: saved } : prev,
      );
    },
  });
};

export const useSubmitEffectiveness = (cycleId: string, maverickId: string) => {
  const qc = useQueryClient();
  return useMutation<
    Draft,
    Error,
    {
      technicalCompetency: number;
      softSkills: number;
      projectPerformance: number;
      overallReadiness: number;
      comments: string;
      futureTrainingRecommendations?: string | null;
    }
  >({
    mutationFn: async (body) => {
      const { data, error } = await api.POST('/effectiveness/{cycleId}/{maverickId}/submit', {
        params: { path: { cycleId, maverickId } },
        body,
      });
      if (error || !data) throw new Error(problemMessage(error, 'Submission failed'));
      return data;
    },
    onSuccess: (saved) => {
      qc.setQueryData<Bundle | undefined>(effectivenessKeys.bundle(cycleId, maverickId), (prev) =>
        prev ? { ...prev, draft: saved } : prev,
      );
      qc.invalidateQueries({ queryKey: ['effectiveness', 'queue'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'supervisor'] });
    },
  });
};
