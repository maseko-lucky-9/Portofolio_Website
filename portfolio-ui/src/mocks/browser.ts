/**
 * Mock Service Worker (MSW) Setup
 * 
 * Intercepts network requests for testing and development
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker for browser
export const worker = setupWorker(...handlers);

// Start worker in development
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
  worker.start({
    onUnhandledRequest: 'warn',
  });
}
