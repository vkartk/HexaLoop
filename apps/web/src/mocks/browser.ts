import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export const startMocks = async (): Promise<void> => {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;
  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    onUnhandledRequest: 'bypass',
    quiet: false,
  });
};
