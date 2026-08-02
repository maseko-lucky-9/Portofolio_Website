import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

// Not named *.test.ts on purpose: vitest.e2e.config.ts collects
// tests/e2e/**/*.test.ts, so this file is importable but never collected.

/**
 * Build the real app and register teardown.
 *
 * Closing matters more here than in a unit test: the rate-limit plugin holds
 * the shared ioredis handle, and Prisma holds a connection pool. Leaking either
 * keeps the vitest process alive after the last assertion.
 */
export async function startTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  // Fastify resolves plugin registration lazily; without this the first
  // inject() would race the plugin tree and 404 on a route that does exist.
  await app.ready();
  return app;
}

/**
 * A unique email per call. The e2e database is NOT reset between local runs
 * (only CI gets a fresh container), so a fixed address would pass once and then
 * fail with a duplicate-email conflict on every subsequent run.
 */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}
