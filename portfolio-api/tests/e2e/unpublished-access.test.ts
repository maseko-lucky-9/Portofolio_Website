import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp } from './helpers.js';
import { cache, cacheKeys } from '../../src/config/redis.js';

// Anonymous callers must never reach DRAFT or ARCHIVED content.
//
// This suite exists because of a regression this PR introduced and then fixed.
// The public detail routes never filtered on status -- getProjectBySlug and
// getArticleBySlug were plain `findUnique({ where: { slug } })`. That was
// invisible because a broken Fastify `response` schema (`200: {type:'object'}`,
// naming no properties) made fast-json-stringify discard the entire body, so
// the endpoints answered `200 {}`. Deleting those schemas to fix the empty
// responses removed the accidental mask and turned a latent access-control hole
// into a live disclosure of unannounced client work.
//
// ARCHIVED is covered as carefully as DRAFT, and not for symmetry:
// deleteProject/deleteArticle are SOFT deletes that set status = ARCHIVED, so
// ARCHIVED is how retracted content actually exists. A filter relaxed to
// `status: { not: 'DRAFT' }` would pass every DRAFT test while re-exposing
// everything an admin has ever deleted.
//
// The markers below appear on NO published row, so a response containing one is
// proof that unpublished content escaped -- much stronger than a status code,
// which stayed 200 throughout the original bug.

const MARKERS = ['UNPUBLISHED-ONLY-CONTENT-MARKER', 'UNPUBLISHED-ONLY-CLIENT-MARKER'];
const HIDDEN_SLUGS = [
  'unannounced-project',
  'unpublished-post',
  'retracted-project',
  'retracted-post',
];

function assertNoUnpublishedContent(body: string): void {
  for (const marker of MARKERS) expect(body).not.toContain(marker);
  for (const slug of HIDDEN_SLUGS) expect(body).not.toContain(slug);
}

describe('unpublished content is not readable anonymously', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['DRAFT project', '/api/v1/projects/unannounced-project'],
    ['DRAFT article', '/api/v1/articles/unpublished-post'],
    ['ARCHIVED project', '/api/v1/projects/retracted-project'],
    ['ARCHIVED article', '/api/v1/articles/retracted-post'],
  ])('404s a %s by slug', async (_label, url) => {
    const res = await app.inject({ method: 'GET', url });

    expect(res.statusCode).toBe(404);
    assertNoUnpublishedContent(res.body);
  });

  it('omits unpublished rows from the public project list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects?limit=100' });

    expect(res.statusCode).toBe(200);
    const items = res.json().data;
    // Proving the loop below actually runs. Against an empty result set the
    // marker check and the for-of are both trivially satisfied, so without this
    // the test would report green on a database where the seed never ran.
    expect(items.length).toBeGreaterThan(0);
    assertNoUnpublishedContent(res.body);
    for (const p of items) expect(p.status).toBe('PUBLISHED');
  });

  it('omits unpublished rows from the public article list', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/articles?limit=100' });

    expect(res.statusCode).toBe(200);
    const items = res.json().items;
    expect(items.length).toBeGreaterThan(0);
    assertNoUnpublishedContent(res.body);
    for (const a of items) expect(a.status).toBe('PUBLISHED');
  });

  it('cannot be coaxed into returning unpublished rows via ?status=', async () => {
    // `status` used to be an accepted query parameter passed straight into the
    // Prisma where clause, so this exact request returned every draft. It is no
    // longer declared on the public routes, and ajv's removeAdditional: 'all'
    // strips it before the handler; the service also hard-codes PUBLISHED, so
    // neither layer alone is load-bearing.
    for (const url of [
      '/api/v1/projects?status=DRAFT',
      '/api/v1/articles?status=DRAFT',
      '/api/v1/projects?status=ARCHIVED',
      '/api/v1/articles?status=ARCHIVED',
    ]) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode).toBe(200);
      assertNoUnpublishedContent(res.body);
    }
  });

  it.each([
    ['project', '/api/v1/projects/ghost-project'],
    ['article', '/api/v1/articles/ghost-article'],
  ])('does not serve an unpublished %s straight from the cache', async (kind, url) => {
    // The detail services read the cache and return BEFORE the status-filtered
    // query runs, so the filter alone is not enough -- proven with a slug that
    // has no database row at all: planting a DRAFT payload under its key made
    // the endpoint answer 200 with the draft body and an author email.
    //
    // This is not a theoretical entry. The previous code cached whatever
    // findUnique returned, drafts included, under a key shaped exactly like
    // this one and with a one-hour TTL that a deploy does not clear.
    const slug = kind === 'project' ? 'ghost-project' : 'ghost-article';
    const key = kind === 'project' ? cacheKeys.project(slug) : cacheKeys.article(slug);

    await cache.set(
      key,
      {
        id: 'cache-planted',
        slug,
        title: 'Ghost',
        status: 'DRAFT',
        content: 'UNPUBLISHED-ONLY-CONTENT-MARKER',
        author: { email: 'private@example.test' },
      },
      300
    );

    const res = await app.inject({ method: 'GET', url });

    expect(res.statusCode).toBe(404);
    assertNoUnpublishedContent(res.body);
    expect(res.body).not.toContain('private@example.test');

    // And the poisoned entry is evicted rather than left to be re-served.
    expect(await cache.get(key)).toBeNull();
  });

  it.each([
    ['projects', '/api/v1/projects?limit=999999'],
    ['articles', '/api/v1/articles?limit=999999'],
  ])('caps an oversized page-size request on %s', async (_label, url) => {
    // Unbounded `limit` reached Prisma as `take` and, once limit joined the
    // list cache key, minted one full-page redis entry per distinct value.
    // Both routes are asserted: they were clamped in the same commit, and
    // testing one leaves the other free to regress.
    const res = await app.inject({ method: 'GET', url });

    expect(res.statusCode).toBe(200);
    expect(res.json().meta.limit).toBe(100);
  });

  it.each([
    ['projects', '/api/v1/projects?page=99999999999999999999'],
    ['articles', '/api/v1/articles?page=99999999999999999999'],
  ])('does not 500 on an out-of-range page for %s', async (_label, url) => {
    // `(page - 1) * limit` is handed to Prisma as `skip`, whose Int is 32-bit.
    // This value parses to 1e20 -- a number, so a !isNaN guard passes it
    // through -- and used to surface as an unauthenticated 500.
    const res = await app.inject({ method: 'GET', url });

    expect(res.statusCode).toBe(200);
  });
});
