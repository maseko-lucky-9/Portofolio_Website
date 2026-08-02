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
// This also gives requireRole('ADMIN') its only 403 test. Without it, an authz
// regression that let any logged-in user create content would ship green.

const prisma = new PrismaClient();

describe('admin write routes', () => {
  let app: FastifyInstance;
  let adminToken: string;
  let viewerToken: string;
  const createdSlugs: string[] = [];

  beforeAll(async () => {
    app = await startTestApp();

    // A plain user, left as VIEWER -- this is the 403 subject.
    const viewerEmail = uniqueEmail('viewer');
    const password = 'e2e-test-password-123';
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
    // seeded admin's credential unusable, which is the property that makes a
    // committed seed safe in the first place.
    const adminEmail = uniqueEmail('admin');
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
    // Rows created here are removed so db:verify's project bounds and the
    // shared dataset stay exactly as the seed left them.
    if (createdSlugs.length > 0) {
      await prisma.projectTag.deleteMany({
        where: { project: { slug: { in: createdSlugs } } },
      });
      await prisma.project.deleteMany({ where: { slug: { in: createdSlugs } } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('returns the created project in the 201 body', async () => {
    const slug = `e2e-created-${Date.now()}`;
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
    createdSlugs.push(slug);

    // The discriminating assertion. Pre-fix this route declared
    // `response: { 201: { type: 'object' } }`, so the status was 201 and the
    // body was `{}` -- an admin had no way to read back what they had made.
    const body = res.json();
    const created = body.data ?? body;
    expect(created.slug).toBe(slug);
    expect(created.title).toBe('Created By E2E');
  });

  it('refuses project creation for a non-admin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${viewerToken}` },
      payload: {
        slug: `e2e-forbidden-${Date.now()}`,
        title: 'Should Not Exist',
        description: 'Should not be created.',
        content: '# Nope',
        tagIds: [],
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('refuses project creation with no token at all', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      payload: {
        slug: `e2e-anon-${Date.now()}`,
        title: 'Should Not Exist',
        description: 'Should not be created.',
        content: '# Nope',
        tagIds: [],
      },
    });

    expect(res.statusCode).toBe(401);
  });
});
