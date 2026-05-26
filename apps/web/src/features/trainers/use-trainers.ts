import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import type { components } from '@/lib/api/schema.gen';

type TrainerEngagementType = components['schemas']['TrainerEngagementType'];

export type TrainerListFilters = {
  engagementType?: TrainerEngagementType;
  domain?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export const trainerKeys = {
  list: (filters: TrainerListFilters) => ['trainers', filters] as const,
  scorecard: (trainerId: string) => ['trainers', trainerId, 'scorecard'] as const,
};

export const useTrainers = (filters: TrainerListFilters) =>
  useQuery({
    queryKey: trainerKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET('/trainers', { params: { query: filters } });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load trainers'));
      return data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

export const useTrainerScorecard = (trainerId: string | null) =>
  useQuery({
    queryKey: trainerId ? trainerKeys.scorecard(trainerId) : ['trainers', 'scorecard', 'none'],
    enabled: !!trainerId,
    queryFn: async () => {
      if (!trainerId) throw new Error('No trainer');
      const { data, error } = await api.GET('/trainers/{trainerId}/scorecard', {
        params: { path: { trainerId } },
      });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load scorecard'));
      return data;
    },
  });
