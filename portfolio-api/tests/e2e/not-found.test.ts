import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp } from './helpers.js';

// Pins the notFoundHandler envelope (error.middleware.ts:127-135) as served by
// the REAL app. error.middleware.test.ts covers the handler in isolation on a
// bare Fastify instance; this proves it is actually installed on the app the
// entrypoint builds -- a buildApp() that forgot setNotFoundHandler would pass
// the unit test and fail here.

describe('404 handling', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the standard error envelope for an unknown path', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/definitely-not-a-route' });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  it('404s an unknown method on a path that exists for another method', async () => {
    // /api/v1/health is GET-only. Fastify routes method mismatches to the
    // not-found handler rather than a 405, so this pins that behaviour too.
    const res = await app.inject({ method: 'DELETE', url: '/api/v1/health' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});
