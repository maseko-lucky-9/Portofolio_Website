import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp } from './helpers.js';

// article.routes.ts carried the SAME response-serialisation defect as
// project.routes.ts -- `200: { type: 'object' }` on the detail route, which
// fast-json-stringify honours by emitting {} and discarding the whole payload.
// Both were fixed together; testing only the project side would leave the
// article side free to regress.
//
// NOTE ON SHAPE: articles and projects do NOT share a response envelope.
//   projects  -> { data, meta }  (wrapped by paginatedResponse/successResponse)
//   articles  -> { items, meta } for the list, and the RAW article for detail
// article.routes.ts returns the service result directly. That inconsistency is
// pinned here rather than papered over: changing it would break existing
// consumers, so it needs its own decision, not a drive-by edit.

describe('GET /api/v1/articles', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the seeded article', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/articles' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
  });

  it('returns populated pagination metadata that reflects the request', async () => {
    // Self-contained: both page sizes are requested here, so the cache-key pin
    // does not depend on a neighbouring test having primed the entry at a
    // different limit.
    const wide = await app.inject({ method: 'GET', url: '/api/v1/articles?page=1&limit=10' });
    const narrow = await app.inject({ method: 'GET', url: '/api/v1/articles?page=1&limit=1' });

    // Keys, not truthiness -- {} is truthy and would pass a toBeDefined().
    expect(Object.keys(wide.json().meta).length).toBeGreaterThan(0);
    expect(typeof wide.json().meta.total).toBe('number');
    expect(wide.json().meta.limit).toBe(10);
    expect(narrow.json().meta.limit).toBe(1);
  });

  it('honours the limit parameter in the returned page', async () => {
    // Two articles are published by the seed so exact counts can fail.
    const one = await app.inject({ method: 'GET', url: '/api/v1/articles?page=1&limit=1' });
    const many = await app.inject({ method: 'GET', url: '/api/v1/articles?page=1&limit=10' });

    expect(one.json().items.length).toBe(1);
    expect(many.json().items.length).toBeGreaterThanOrEqual(2);
  });

  it('serves a single article by slug with a non-empty body', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/articles/hello-world' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Pre-fix this endpoint answered `200 {}` for every article that exists, so
    // the status code alone proves nothing -- the payload is the discriminator.
    expect(body.slug).toBe('hello-world');
    expect(body.title).toBe('Hello World');
    expect(body.content).toBeTruthy();
  });

  it('404s an unknown slug', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/articles/no-such-article' });
    expect(res.statusCode).toBe(404);
  });
});
