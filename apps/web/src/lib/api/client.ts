import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema.gen';
import { useAuthStore } from '@/stores/auth-store';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      const path = new URL(response.url).pathname;
      if (!path.endsWith('/auth/login') && !path.endsWith('/auth/refresh')) {
        useAuthStore.getState().clear();
      }
    }
    return response;
  },
};

export const api = createClient<paths>({ baseUrl });
api.use(authMiddleware);

export type { paths, components } from './schema.gen';
