import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp } from './helpers.js';

// Deliberately duplicates what the `api-contract` job asserts.
//
// That job is needs-gated behind quality, test AND build, so for the whole life
// of this workflow it never executed and nobody noticed that it curled
// /api/v1/documentation/json while swagger-ui is mounted at /api-docs. Asserting
// it here too means a URL regression fails in a job that runs early, instead of
// hiding behind three other jobs.

describe('OpenAPI document', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('is served at /api-docs/json', async () => {
    const res = await app.inject({ method: 'GET', url: '/api-docs/json' });

    expect(res.statusCode).toBe(200);
    const doc = res.json();
    expect(doc.openapi).toBeTruthy();
    expect(doc.info.title).toBe('Portfolio API');
  });

  it('documents the routes the front end actually calls', async () => {
    // A document that parses but has an empty `paths` would satisfy a naive
    // "is it valid JSON" check while being useless. These three are the public
    // surface, so their absence means route registration silently broke.
    const res = await app.inject({ method: 'GET', url: '/api-docs/json' });
    const paths = Object.keys(res.json().paths as Record<string, unknown>);

    // Trailing slashes are not a typo. A route registered as '/' inside a
    // prefixed plugin is documented as '<prefix>/', so the collection endpoints
    // really are '/api/v1/projects/'. Asserting the unslashed form passes
    // nothing and only looks correct.
    expect(paths).toContain('/api/v1/health/');
    expect(paths).toContain('/api/v1/projects/');
    expect(paths).toContain('/api/v1/projects/{slug}');
    expect(paths).toContain('/api/v1/contact/submit');
  });

  it('is NOT served at the path the api-contract job originally used', async () => {
    // Pins the bug that made the fix necessary. If someone "helpfully" mounts
    // swagger at both prefixes, this fails and forces a deliberate decision.
    const res = await app.inject({ method: 'GET', url: '/api/v1/documentation/json' });
    expect(res.statusCode).toBe(404);
  });
});
