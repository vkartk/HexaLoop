import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import type { components } from '@/lib/api/schema.gen';

type Notification = components['schemas']['Notification'];

export const notificationKeys = {
  list: (unreadOnly: boolean) => ['notifications', { unreadOnly }] as const,
};

export const useNotifications = (unreadOnly = false) =>
  useQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: async () => {
      const { data, error } = await api.GET('/notifications', {
        params: { query: { unreadOnly } },
      });
      if (error || !data) throw new Error(problemMessage(error, 'Could not load notifications'));
      return data;
    },
    staleTime: 30_000,
  });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation<Notification, Error, string>({
    mutationFn: async (notificationId) => {
      const { data, error } = await api.POST('/notifications/{notificationId}/read', {
        params: { path: { notificationId } },
      });
      if (error || !data) throw new Error(problemMessage(error, 'Could not mark as read'));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
