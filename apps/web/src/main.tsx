import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

const bootstrap = async (): Promise<void> => {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { startMocks } = await import('./mocks/browser');
    await startMocks();
  }

  const host = document.getElementById('root');
  if (!host) throw new Error('Missing #root mount node');

  createRoot(host).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

void bootstrap();
