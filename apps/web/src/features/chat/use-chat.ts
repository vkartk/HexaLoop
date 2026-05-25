import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { problemMessage } from '@/lib/api/problem';
import { chatMessagesForApi, useChatStore } from '@/stores/chat-store';
import type { components } from '@/lib/api/schema.gen';

type ChatReply = components['schemas']['ChatReply'];

export const useSendChat = () => {
  const appendUser = useChatStore((s) => s.appendUser);
  const appendAssistant = useChatStore((s) => s.appendAssistant);
  const setPending = useChatStore((s) => s.setPending);
  const setError = useChatStore((s) => s.setError);

  return useMutation<ChatReply, Error, { content: string; route?: string | null }>({
    mutationFn: async ({ content, route }) => {
      setError(null);
      setPending(true);
      appendUser(content);
      const messages = chatMessagesForApi(useChatStore.getState());
      const { data, error } = await api.POST('/chat', {
        body: { messages, context: { route: route ?? null } },
      });
      if (error || !data) throw new Error(problemMessage(error, 'Chat failed'));
      return data;
    },
    onSuccess: (reply) => {
      appendAssistant(reply);
      setPending(false);
    },
    onError: (err) => {
      setError(err.message);
      setPending(false);
    },
  });
};
