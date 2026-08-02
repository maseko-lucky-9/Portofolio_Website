import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startTestApp, uniqueEmail } from './helpers.js';

// Input validation on the one public write endpoint an unauthenticated stranger
// can reach.
//
// The rejection cases assert only `>= 400`, which DELIBERATELY admits the 500
// that these requests return today: errorHandler has no `error.validation`
// branch, so an ajv-level rejection falls through to the generic 500 path. The
// range is chosen so these keep passing when that is corrected to 400 -- the
// invariant they defend is "bad input is rejected, never accepted", not the
// specific code.
//
// The exact current code is pinned once, deliberately, by the characterisation
// test below. That is the one a fixer has to update.

describe('POST /api/v1/contact', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a well-formed submission and returns its id', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contact/submit',
      payload: {
        name: 'E2E Tester',
        email: uniqueEmail('contact'),
        subject: 'Integration test',
        message: 'Submitted by the e2e suite.',
      },
    });

    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.statusCode).toBeLessThan(300);
    // Asserting the payload, not just the status. This route keeps a response
    // schema naming { id, message } -- unlike the eight removed elsewhere, that
    // one is correct because it matches what the handler returns. Pinning `id`
    // means the suite notices if it ever starts discarding the body the way
    // the project and article routes did.
    expect(typeof res.json().id).toBe('string');
  });

  it.each([
    ['missing message', { name: 'A', email: 'a@example.test' }],
    ['missing email', { name: 'A', message: 'hello there' }],
    ['missing name', { email: 'a@example.test', message: 'hello there' }],
    ['malformed email', { name: 'A', email: 'not-an-email', message: 'hello there' }],
    ['empty body', {}],
  ])('rejects a submission with %s', async (_label, payload) => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/contact/submit', payload });

    // The invariant that actually matters: bad input is REJECTED, never
    // accepted. Deliberately not pinned to an exact code here so this keeps
    // passing when the status is corrected -- see the characterisation test
    // below, which is the one that has to be updated deliberately.
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('CURRENTLY answers 500 for invalid input (known defect, not desired)', async () => {
    // Characterisation test, not an endorsement.
    //
    // errorHandler has no `error.validation` branch, so an ajv-level rejection
    // falls through to the generic 500 path. A malformed contact form -- the
    // most exposed unauthenticated endpoint on the API -- therefore reports a
    // server fault, tells the caller nothing actionable, and pollutes error
    // rates with what is ordinary client input.
    //
    // Pinned so the fix is a deliberate act: whoever adds the validation branch
    // sees this fail and changes 500 -> 400 on purpose. Left out of THIS PR
    // because it changes the error contract of every route at once, which
    // deserves its own diff. Tracked as a spun-out follow-up.
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contact/submit',
      payload: { name: 'A', email: 'not-an-email', message: 'hello there' },
    });

    expect(res.statusCode).toBe(500);
  });

  it('does not reflect the submitted message back in the response', async () => {
    // The submission is rendered in an admin UI later. Echoing raw input to an
    // unauthenticated caller is the cheap half of an XSS chain, so pin that it
    // does not happen.
    const marker = '<script>alert(1)</script>';
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contact/submit',
      payload: {
        name: 'E2E Tester',
        email: uniqueEmail('contact-xss'),
        message: `hello ${marker}`,
      },
    });

    // The status assertion is not decoration. Without it this test passes on a
    // 429 from the shared rate-limit bucket or a 500 from a dropped connection
    // -- any error envelope trivially "does not contain <script>", so the test
    // would report success for a submission that was never processed.
    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.statusCode).toBeLessThan(300);
    expect(res.body).not.toContain('<script>');
  });
});
