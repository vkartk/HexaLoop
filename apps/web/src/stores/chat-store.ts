import { create } from 'zustand';
import type { components } from '@/lib/api/schema.gen';

type ChatMessage = components['schemas']['ChatMessage'];
type ChatReply = components['schemas']['ChatReply'];

export type RenderedMessage =
  | { kind: 'user'; id: string; content: string }
  | { kind: 'assistant'; id: string; reply: ChatReply };

type ChatState = {
  open: boolean;
  messages: RenderedMessage[];
  pending: boolean;
  error: string | null;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  appendUser: (content: string) => RenderedMessage;
  appendAssistant: (reply: ChatReply) => void;
  setPending: (pending: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
};

const newId = () => crypto.randomUUID();

export const useChatStore = create<ChatState>((set, get) => ({
  open: false,
  messages: [],
  pending: false,
  error: null,
  toggle: () => set({ open: !get().open }),
  setOpen: (open) => set({ open }),
  appendUser: (content) => {
    const msg: RenderedMessage = { kind: 'user', id: newId(), content };
    set({ messages: [...get().messages, msg] });
    return msg;
  },
  appendAssistant: (reply) =>
    set({ messages: [...get().messages, { kind: 'assistant', id: reply.id, reply }] }),
  setPending: (pending) => set({ pending }),
  setError: (error) => set({ error }),
  clear: () => set({ messages: [], error: null }),
}));

export const chatMessagesForApi = (state: ChatState): ChatMessage[] =>
  state.messages.map((m) =>
    m.kind === 'user'
      ? { role: 'user', content: m.content }
      : { role: 'assistant', content: m.reply.message.content },
  );
