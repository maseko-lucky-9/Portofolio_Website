import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp, uniqueEmail } from './helpers.js';

// The only spec that exercises a write path end to end: bcrypt hashing, the
// user row, JWT signing, and the auth middleware verifying its own token.
// Nothing here reads the seeded admin -- its password is deliberately random
// and discarded (prisma/seed.ts), so this registers its own user.

describe('auth round-trip', () => {
  let app: FastifyInstance;
  const email = uniqueEmail('auth');
  const password = 'e2e-test-password-123';

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, logs in, and authenticates with the issued token', async () => {
    // --- register ---
    const registered = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email, password, firstName: 'E2E', lastName: 'Tester' },
    });

    expect(registered.statusCode).toBe(201);
    const registerBody = registered.json();
    expect(registerBody.success).toBe(true);
    expect(registerBody.data.accessToken).toBeTruthy();
    // The password must never come back out, in any form.
    expect(JSON.stringify(registerBody)).not.toContain(password);
    expect(JSON.stringify(registerBody)).not.toContain('passwordHash');

    // --- login ---
    const loggedIn = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password },
    });

    expect(loggedIn.statusCode).toBe(200);
    const token = loggedIn.json().data.accessToken;
    expect(token).toBeTruthy();

    // --- authenticated request ---
    const profile = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/profile',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(profile.statusCode).toBe(200);
    expect(profile.json().data.email).toBe(email);
  });

  it('rejects a login with the wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: 'not-the-right-password' },
    });

    expect(res.statusCode).toBe(401);
    // The failure must not disclose whether the ACCOUNT exists -- only that the
    // credentials did not match. A "user not found" here would turn the login
    // endpoint into an account-enumeration oracle.
    expect(res.body.toLowerCase()).not.toContain('not found');
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/profile' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects a structurally valid but unsigned token', async () => {
    // Three base64url segments, so it parses as a JWT and fails only at
    // signature verification. A bare 'garbage' string would be rejected by the
    // decoder and would not prove the signature is checked at all.
    const forged = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: 'attacker', role: 'ADMIN' })).toString('base64url'),
      'not-a-valid-signature',
    ].join('.');

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/profile',
      headers: { authorization: `Bearer ${forged}` },
    });

    expect(res.statusCode).toBe(401);
  });
});
