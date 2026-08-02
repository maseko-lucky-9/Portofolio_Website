import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { startTestApp, uniqueEmail } from './helpers.js';

// Covers the admin create/update routes, which carried four of the eight
// response schemas this change removed -- an admin creating a project got
// `201 {}` back and never saw the created row. Nothing else in the suite can
// reach them: the seeded ADMIN's password is random and discarded by design,
// and the auth spec registers a plain VIEWER.
//
// Both resources and both verbs are exercised. Fixing eight schemas while
// pinning only one of them leaves the other seven free to regress.
//
// This is also the only place requireRole('ADMIN') is tested.

const prisma = new PrismaClient();

// Every row this file creates uses this prefix, so cleanup is prefix-based and
// unconditional rather than dependent on bookkeeping that a failing assertion
// would skip. The 403/401 specs post real payloads too: if the guard they exist
// to test ever regresses, those rows ARE written, and they must be cleaned up
// on exactly the run where the test goes red.
const PREFIX = 'e2e-admin-';

describe('admin write routes', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let viewerToken: string;
  let viewerEmail: string;
  let adminEmail: string;

  beforeAll(async () => {
    app = await startTestApp();
    const password = 'e2e-test-password-123';

    // A plain user, left as VIEWER -- this is the 403 subject.
    viewerEmail = uniqueEmail('viewer');
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: viewerEmail, password },
    });
    viewerToken = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: viewerEmail, password },
      })
    ).json().data.accessToken;

    // A second user, promoted to ADMIN directly in the database. Promoting is
    // simpler and safer than teaching CI a SEED_ADMIN_PASSWORD: it keeps the
    // seeded admin's credential unusable, which is what makes a committed seed
    // safe in the first place. global-setup.ts refuses to run this suite
    // against anything but a disposable database.
    adminEmail = uniqueEmail('admin');
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: adminEmail, password },
    });
    await prisma.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } });
    adminToken = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: adminEmail, password },
      })
    ).json().data.accessToken;
  });

  afterAll(async () => {
    // try/finally: a throw in cleanup must not skip $disconnect and app.close,
    // or the rate-limit plugin's redis handle keeps the vitest fork alive.
    try {
      await prisma.projectTag.deleteMany({ where: { project: { slug: { startsWith: PREFIX } } } });
      await prisma.articleTag.deleteMany({ where: { article: { slug: { startsWith: PREFIX } } } });
      await prisma.project.deleteMany({ where: { slug: { startsWith: PREFIX } } });
      await prisma.article.deleteMany({ where: { slug: { startsWith: PREFIX } } });
      // The two accounts this file created, including the promoted ADMIN --
      // leaving a loginable admin behind would be worse than the rows.
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { in: [viewerEmail, adminEmail] } } },
      });
      await prisma.user.deleteMany({ where: { email: { in: [viewerEmail, adminEmail] } } });
    } finally {
      await prisma.$disconnect();
      await app.close();
    }
  });

  it('returns the created project in the 201 body', async () => {
    const slug = `${PREFIX}project-${Date.now()}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        slug,
        title: 'Created By E2E',
        description: 'Created by the integration suite.',
        content: '# Created\n\nBody.',
        tagIds: [],
      },
    });

    expect(res.statusCode).toBe(201);

    // The discriminating assertion. Pre-fix this route declared
    // `response: { 201: { type: 'object' } }`, so the status was 201 and the
    // body was `{}` -- an admin had no way to read back what they made.
    const body = res.json();
    const created = body.data ?? body;
    expect(created.slug).toBe(slug);
    expect(created.title).toBe('Created By E2E');
    // Pinning the default too: a silent flip to PUBLISHED would auto-publish
    // every admin create and stamp publishedAt.
    expect(created.status).toBe('DRAFT');
  });

  it('returns the created article in the 201 body', async () => {
    const slug = `${PREFIX}article-${Date.now()}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/articles',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        slug,
        title: 'Article By E2E',
        content: '# Created\n\nBody.',
        tagIds: [],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    const created = body.data ?? body;
    expect(created.slug).toBe(slug);
    expect(created.title).toBe('Article By E2E');
  });

  it('returns the updated project in the 200 body', async () => {
    const slug = `${PREFIX}update-${Date.now()}`;
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        slug,
        title: 'Before Update',
        description: 'Created by the integration suite.',
        content: '# Created\n\nBody.',
        tagIds: [],
      },
    });
    const createdBody = create.json();
    const id = (createdBody.data ?? createdBody).id;

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/projects/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { title: 'After Update' },
    });

    expect(res.statusCode).toBe(200);
    const updated = res.json().data ?? res.json();
    expect(updated.title).toBe('After Update');
  });

  it('returns the updated article in the 200 body', async () => {
    const slug = `${PREFIX}article-update-${Date.now()}`;
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/articles',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { slug, title: 'Before Update', content: '# Created\n\nBody.', tagIds: [] },
    });
    const createdBody = create.json();
    const id = (createdBody.data ?? createdBody).id;

    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/articles/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { title: 'After Update' },
    });

    expect(res.statusCode).toBe(200);
    const updated = res.json().data ?? res.json();
    expect(updated.title).toBe('After Update');
  });

  it('stops serving a project once it is unpublished', async () => {
    // The lifecycle the cache re-check exists for: publish, read it (which
    // populates the detail cache), unpublish, and it must disappear. Asserting
    // only the DRAFT-from-birth case would leave the invalidation path -- and
    // the cache-hit status check -- untested.
    const slug = `${PREFIX}lifecycle-${Date.now()}`;
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        slug,
        title: 'Temporarily Public',
        description: 'Created by the integration suite.',
        content: '# Public\n\nBody.',
        status: 'PUBLISHED',
        tagIds: [],
      },
    });
    const id = (create.json().data ?? create.json()).id;

    // Anonymous read while published -- this is what fills the cache.
    const whilePublic = await app.inject({ method: 'GET', url: `/api/v1/projects/${slug}` });
    expect(whilePublic.statusCode).toBe(200);

    await app.inject({
      method: 'PUT',
      url: `/api/v1/projects/${id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'DRAFT' },
    });

    const afterUnpublish = await app.inject({ method: 'GET', url: `/api/v1/projects/${slug}` });
    expect(afterUnpublish.statusCode).toBe(404);

    const list = await app.inject({ method: 'GET', url: '/api/v1/projects?limit=100' });
    expect(list.body).not.toContain(slug);
  });

  it('refuses project creation for a non-admin, and writes nothing', async () => {
    const slug = `${PREFIX}forbidden-${Date.now()}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${viewerToken}` },
      payload: {
        slug,
        title: 'Should Not Exist',
        description: 'Should not be created.',
        content: '# Nope',
        tagIds: [],
      },
    });

    expect(res.statusCode).toBe(403);
    // The status code alone would still pass if the handler created the row and
    // then threw, or if a preHandler ran out of order. A created row defaults to
    // DRAFT, so it would also be invisible to every list assertion in the suite.
    expect(await prisma.project.count({ where: { slug } })).toBe(0);
  });

  it('refuses project creation with no token at all, and writes nothing', async () => {
    const slug = `${PREFIX}anon-${Date.now()}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      payload: {
        slug,
        title: 'Should Not Exist',
        description: 'Should not be created.',
        content: '# Nope',
        tagIds: [],
      },
    });

    expect(res.statusCode).toBe(401);
    expect(await prisma.project.count({ where: { slug } })).toBe(0);
  });
});
