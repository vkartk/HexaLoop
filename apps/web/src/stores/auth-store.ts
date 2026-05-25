import { create } from 'zustand';
import type { components } from '@/lib/api/schema.gen';

type User = components['schemas']['User'];
type AuthSession = components['schemas']['AuthSession'];

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  status: 'unauthenticated' | 'authenticating' | 'authenticated';
  setSession: (session: AuthSession) => void;
  setUser: (user: User) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  status: 'unauthenticated',
  setSession: (session) => {
    const previousId = useAuthStore.getState().user?.id;
    set({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      status: 'authenticated',
    });
    if (previousId && previousId !== session.user.id) {
      // Different user signed in — drop any chat from the prior session.
      void import('./chat-store').then(({ useChatStore }) => {
        const s = useChatStore.getState();
        s.clear();
        s.setOpen(false);
      });
    }
  },
  setUser: (user) => set({ user, status: 'authenticated' }),
  clear: () => {
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: 'unauthenticated',
    });
    // Drop chat history so the next user doesn't inherit conversations.
    // Dynamic import avoids a static cycle with the chat store.
    void import('./chat-store').then(({ useChatStore }) => {
      const s = useChatStore.getState();
      s.clear();
      s.setOpen(false);
    });
  },
}));
