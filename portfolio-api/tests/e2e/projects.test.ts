import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp } from './helpers.js';

// Reads the project the seed creates (prisma/seed.ts) and never mutates it --
// db:verify runs after this suite and asserts that row still exists.
//
// This is the spec that fails when someone changes the querystring schema at
// project.routes.ts:22-34. The unit suite cannot catch that: error.middleware
// tests drive synthetic routes with locally-declared schemas, so a change to a
// real route's contract is invisible to them.

describe('GET /api/v1/projects', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the seeded project', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    // The seed guarantees at least one PUBLISHED project. An empty array here
    // means the seed step did not run, which would otherwise only surface two
    // steps later as a confusing db:verify failure.
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('honours the limit parameter', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects?page=1&limit=1' });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeLessThanOrEqual(1);
  });

  it('returns populated pagination metadata', async () => {
    // Regression pin. The route used to declare
    //   response: { 200: { properties: { data: {type:'array'}, meta: {type:'object'} } } }
    // and fast-json-stringify strips every key an object schema does not name,
    // so `meta` serialised as {} and no client could paginate. `data` survived
    // only because an array schema with no `items` is passed through.
    //
    // Asserting the KEYS, not just that meta is truthy: `{}` is truthy, so a
    // toBeDefined() here would have passed against the broken code.
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects?page=1&limit=1' });
    const meta = res.json().meta;

    expect(Object.keys(meta).length).toBeGreaterThan(0);
    expect(typeof meta.total).toBe('number');
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(1);
  });

  it('returns an empty page rather than an error for a page past the end', async () => {
    // Guards the getPaginationParams hardening from sweep 6: a huge page must
    // reach Prisma as a sane `skip`, not NaN and not 1e20.
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects?page=9999&limit=10' });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([]);
  });

  it('does not 500 on a non-numeric page', async () => {
    // `?page=abc` is coerced/defaulted rather than passed through. Before the
    // sweep-6 fix this produced skip: NaN and a Prisma error.
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects?page=abc' });

    expect(res.statusCode).toBeLessThan(500);
  });

  it('serves a single project by slug', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects/portfolio-website' });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.slug).toBe('portfolio-website');
  });

  it('404s an unknown slug instead of returning null data', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects/no-such-project-slug' });
    expect(res.statusCode).toBe(404);
  });
});
