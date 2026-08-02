import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp } from './helpers.js';

// Anonymous callers must never reach DRAFT or ARCHIVED content.
//
// This suite exists because of a regression this very PR introduced and then
// fixed. The public detail routes never filtered on status -- getProjectBySlug
// and getArticleBySlug were plain `findUnique({ where: { slug } })`. That was
// invisible because a broken Fastify `response` schema (`200: {type:'object'}`,
// naming no properties) made fast-json-stringify discard the entire body, so
// the endpoints answered `200 {}`. Deleting those schemas to fix the empty
// responses removed the accidental mask and turned a latent access-control hole
// into a live disclosure of unannounced client work.
//
// Measured before the service-layer fix: /projects/:slug, /articles/:slug and
// the /articles list all returned DRAFT content to an unauthenticated caller.
// The /projects list was already leaking on main, because its array schema
// passed elements through untouched.
//
// The markers below are seeded ONLY on DRAFT rows (prisma/seed.ts), so a body
// containing one is proof that unpublished content escaped -- much stronger
// than asserting a status code, which stayed 200 throughout.

const DRAFT_MARKERS = ['DRAFT-ONLY-CONTENT-MARKER', 'DRAFT-ONLY-CLIENT-MARKER'];

function assertNoDraftContent(body: string): void {
  for (const marker of DRAFT_MARKERS) {
    expect(body).not.toContain(marker);
  }
  expect(body).not.toContain('unannounced-project');
  expect(body).not.toContain('unpublished-post');
}

describe('unpublished content is not readable anonymously', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('404s a DRAFT project by slug', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects/unannounced-project' });

    expect(res.statusCode).toBe(404);
    assertNoDraftContent(res.body);
  });

  it('404s a DRAFT article by slug', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/articles/unpublished-post' });

    expect(res.statusCode).toBe(404);
    assertNoDraftContent(res.body);
  });

  it('omits DRAFT rows from the public project list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects?limit=100' });

    expect(res.statusCode).toBe(200);
    assertNoDraftContent(res.body);
    for (const p of res.json().data) expect(p.status).toBe('PUBLISHED');
  });

  it('omits DRAFT rows from the public article list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/articles?limit=100' });

    expect(res.statusCode).toBe(200);
    assertNoDraftContent(res.body);
    for (const a of res.json().items) expect(a.status).toBe('PUBLISHED');
  });

  it('cannot be coaxed into returning drafts via ?status=DRAFT', async () => {
    // `status` used to be an accepted query parameter passed straight into the
    // Prisma where clause, so this exact request returned every draft. It is no
    // longer declared on the public routes, and ajv's removeAdditional: 'all'
    // strips it before the handler; the service also hard-codes PUBLISHED, so
    // neither layer alone is load-bearing.
    for (const url of [
      '/api/v1/projects?status=DRAFT',
      '/api/v1/articles?status=DRAFT',
      '/api/v1/projects?status=ARCHIVED',
    ]) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode).toBe(200);
      assertNoDraftContent(res.body);
    }
  });

  it('caps an oversized page-size request', async () => {
    // Unbounded `limit` reached Prisma as `take` and, once limit joined the
    // list cache key, minted one full-page redis entry per distinct value.
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects?limit=999999' });

    expect(res.statusCode).toBe(200);
    expect(res.json().meta.limit).toBe(100);
  });
});
