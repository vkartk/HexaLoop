import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import type { components } from '@/lib/api/schema.gen';

type Role = components['schemas']['Role'];
type PersonStatus = components['schemas']['PersonStatus'];

export type PeopleListFilters = {
  role?: Role;
  status?: PersonStatus;
  q?: string;
  page?: number;
  pageSize?: number;
};

export const peopleKeys = {
  list: (filters: PeopleListFilters) => ['people', filters] as const,
};

export const usePeople = (filters: PeopleListFilters) =>
  useQuery({
    queryKey: peopleKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET('/people', { params: { query: filters } });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load people'));
      return data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
