import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import type { components } from '@/lib/api/schema.gen';

type Bundle = components['schemas']['FeedbackFormBundle'];
type Draft = components['schemas']['FeedbackDraft'];
type Patch = components['schemas']['FeedbackDraftPatch'];

export const feedbackKeys = {
  bundle: (cycleId: string) => ['feedback', cycleId] as const,
};

export const useFeedbackBundle = (cycleId: string) =>
  useQuery({
    queryKey: feedbackKeys.bundle(cycleId),
    queryFn: async () => {
      const { data, error } = await api.GET('/feedback/{cycleId}', {
        params: { path: { cycleId } },
      });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load feedback'));
      return data;
    },
    staleTime: 60_000,
  });

export const useAutosaveFeedback = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation<Draft, Error, Patch>({
    mutationFn: async (patch) => {
      const { data, error } = await api.PUT('/feedback/{cycleId}', {
        params: { path: { cycleId } },
        body: patch,
      });
      if (error || !data) throw new Error(problemMessage(error, 'Save failed'));
      return data;
    },
    onSuccess: (saved) => {
      qc.setQueryData<Bundle | undefined>(feedbackKeys.bundle(cycleId), (prev) =>
        prev ? { ...prev, draft: saved } : prev,
      );
    },
  });
};

export const useSubmitFeedback = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation<
    Draft,
    Error,
    { overallRating: number; highlights: string; improvements: string }
  >({
    mutationFn: async (body) => {
      const { data, error } = await api.POST('/feedback/{cycleId}/submit', {
        params: { path: { cycleId } },
        body,
      });
      if (error || !data) throw new Error(problemMessage(error, 'Submission failed'));
      return data;
    },
    onSuccess: (saved) => {
      qc.setQueryData<Bundle | undefined>(feedbackKeys.bundle(cycleId), (prev) =>
        prev ? { ...prev, draft: saved } : prev,
      );
      qc.invalidateQueries({ queryKey: ['dashboard', 'maverick'] });
    },
  });
};
