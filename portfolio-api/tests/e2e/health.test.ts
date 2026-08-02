import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp } from './helpers.js';

// The load-bearing smoke test. GET /health queries postgres via
// checkDatabaseHealth() and PINGs redis (health.routes.ts:8-29), so a pass here
// proves migrations ran and BOTH service containers are reachable. If this
// fails, every other spec in the suite is noise.

describe('GET /api/v1/health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports healthy with both services up', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    // Asserted individually rather than as status === 'healthy' alone: the
    // route degrades to 'degraded' if EITHER service is down, so a single
    // assertion would not say which one, and a failing CI run would need a
    // second debugging round-trip to find out.
    expect(body.data.services.database).toBe('up');
    expect(body.data.services.redis).toBe('up');
    expect(body.data.status).toBe('healthy');
    expect(body.success).toBe(true);
  });

  it('applies the global onRequest hooks to routes', async () => {
    // Pins buildApp()'s registration ORDER, which is otherwise asserted by
    // nothing: Fastify only applies a hook to routes registered after it, so
    // swapping registerHooks(app) and registerRoutes(app) in app.ts silently
    // strips request logging, x-request-id and analytics context from the
    // entire API -- and every other test in this suite still passes.
    //
    // This header is a real discriminator. Fastify's own `requestIdHeader`
    // option only READS an inbound header; the response header is set solely by
    // addRequestIdHeader (request.middleware.ts:67-75), which returns early
    // unless requestLogger has already populated the context map. So a present
    // header proves both onRequest hooks ran, in order, on this route.
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });

    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('serves the liveness probe without touching either service', async () => {
    // /live is what a k8s livenessProbe hits. It must not depend on postgres or
    // redis, or a transient database blip would get the pod killed and
    // restarted -- which cannot possibly fix a database problem.
    const res = await app.inject({ method: 'GET', url: '/api/v1/health/live' });
    expect(res.statusCode).toBe(200);
  });
});
