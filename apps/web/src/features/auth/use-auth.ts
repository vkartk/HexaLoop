import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import { useAuthStore } from '@/stores/auth-store';
import type { components } from '@/lib/api/schema.gen';

type AuthSession = components['schemas']['AuthSession'];

export const useLogin = () => {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation<AuthSession, Error, { email: string; password: string }>({
    mutationFn: async (body) => {
      const { data, error } = await api.POST('/auth/login', { body });
      if (error || !data) throw new Error(problemMessage(error, 'Login failed'));
      return data;
    },
    onSuccess: (session) => setSession(session),
  });
};

export const useRefresh = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  return useMutation<AuthSession, Error, void>({
    mutationFn: async () => {
      if (!refreshToken) throw new Error('No refresh token');
      const { data, error } = await api.POST('/auth/refresh', { body: { refreshToken } });
      if (error || !data) throw new Error(problemMessage(error, 'Refresh failed'));
      return data;
    },
    onSuccess: (session) => setSession(session),
  });
};

export const useMe = (enabled: boolean) => {
  const setUser = useAuthStore((s) => s.setUser);
  const query = useQuery({
    queryKey: ['auth', 'me'],
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET('/auth/me');
      if (error || !data) throw new Error(problemMessage(error, 'Could not load user'));
      setUser(data);
      return data;
    },
  });
  return query;
};
