import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { errorHandler, validate, notFoundHandler } from '../../src/middleware/error.middleware.js';
import { ApiError } from '../../src/utils/errors.js';

// src/index.ts builds its Fastify instance at module scope, so the real app
// cannot be injected until Phase 7 extracts a buildApp() factory. These tests
// register the REAL errorHandler and the REAL validate() on a locally
// constructed instance, which is enough to pin the response contract.

// Derived from fastify's own inject() rather than imported from
// light-my-request: that package is only a hoisted transitive of fastify and is
// declared in no package.json here, so importing it directly would break the
// day npm stops hoisting it or fastify stops depending on it.
type InjectResponse = Awaited<ReturnType<FastifyInstance['inject']>>;

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function buildTestApp() {
  const app = Fastify();
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);
  return app;
}

describe('errorHandler', () => {
  it('maps an ApiError to its own status, code and details', async () => {
    const app = buildTestApp();
    app.get('/boom', () => {
      throw ApiError.conflict('Already exists', { field: 'email' });
    });

    const res = await app.inject({ method: 'GET', url: '/boom' });

    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      success: false,
      error: { code: 'CONFLICT', message: 'Already exists', details: { field: 'email' } },
    });
    await app.close();
  });

  it('OMITS details entirely when the ApiError carries none', async () => {
    const app = buildTestApp();
    app.get('/boom', () => {
      throw ApiError.notFound('Widget');
    });

    const res = await app.inject({ method: 'GET', url: '/boom' });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Widget not found' },
    });
    expect(Object.keys(res.json().error)).not.toContain('details');
    await app.close();
  });

  it('OMITS details for a FALSY-but-defined details value', async () => {
    // Regression pin for the Phase 4 TS2698 fix, and the case that makes the
    // pin real. The spread is `...(error.details ? { details } : {})`. The
    // tempting `error.details !== undefined` variant is an EQUIVALENT mutant
    // against `details: undefined` -- both omit the key -- so the test above
    // cannot detect it. A null details value is what separates them: the
    // truthiness form still omits, the !== undefined form emits
    // `details: null` and changes the response shape.
    const app = buildTestApp();
    app.get('/boom', () => {
      throw new ApiError(400, 'Nope', 'BAD_REQUEST', null);
    });

    const res = await app.inject({ method: 'GET', url: '/boom' });

    expect(res.json()).toEqual({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Nope' },
    });
    expect(Object.keys(res.json().error)).not.toContain('details');
    await app.close();
  });

  it('maps a raw ZodError to 400 VALIDATION_ERROR with field paths', async () => {
    const app = buildTestApp();
    app.post('/parse', (request) => loginSchema.parse(request.body));

    const res = await app.inject({
      method: 'POST',
      url: '/parse',
      payload: { email: 'nope', password: 'short' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
    expect(res.json().error.details.errors).toEqual([
      { field: 'email', message: 'Invalid email address' },
      { field: 'password', message: 'Password must be at least 8 characters' },
    ]);
    await app.close();
  });

  it('does not leak internals for an unrecognised error', async () => {
    const app = buildTestApp();
    app.get('/boom', () => {
      throw new Error('internal detail SHOULD-NOT-REACH-CLIENT at db-host:5432');
    });

    const res = await app.inject({ method: 'GET', url: '/boom' });

    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
    expect(res.body).not.toContain('SHOULD-NOT-REACH-CLIENT');
    expect(res.body).not.toContain('db-host');
    await app.close();
  });
});

describe('validate() preHandler vs inline schema.parse()', () => {
  // This is the load-bearing assumption behind Phase 5's decision to parse
  // inline in handlers rather than route everything through validate(). If the
  // two paths ever diverge, every route converted in that phase silently
  // changed its error contract. Phase 5 verified it with a throwaway probe;
  // this makes it permanent.
  async function bothPaths(
    payload: Record<string, unknown>
  ): Promise<{ viaPreHandler: InjectResponse; viaInline: InjectResponse }> {
    const app = buildTestApp();
    app.post('/via-prehandler', { preHandler: [validate(loginSchema)] }, () => ({ ok: true }));
    app.post('/via-inline', (request) => {
      loginSchema.parse(request.body);
      return { ok: true };
    });

    const viaPreHandler = await app.inject({ method: 'POST', url: '/via-prehandler', payload });
    const viaInline = await app.inject({ method: 'POST', url: '/via-inline', payload });
    await app.close();
    return { viaPreHandler, viaInline };
  }

  it('produce byte-identical 400 bodies for the same invalid payload', async () => {
    const { viaPreHandler, viaInline } = await bothPaths({
      email: 'not-an-email',
      password: 'short',
    });

    expect(viaPreHandler.statusCode).toBe(400);
    expect(viaInline.statusCode).toBe(viaPreHandler.statusCode);
    expect(viaInline.body).toBe(viaPreHandler.body);
    expect(viaPreHandler.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('both let a valid payload through', async () => {
    const { viaPreHandler, viaInline } = await bothPaths({
      email: 'someone@example.com',
      password: 'longenough1',
    });

    expect(viaPreHandler.statusCode).toBe(200);
    expect(viaInline.statusCode).toBe(200);
  });
});

describe('validate()', () => {
  it('writes the PARSED body back onto the request, applying defaults', async () => {
    // This is what makes a following `request.body as XInput` a true statement
    // on the routes that use the preHandler form.
    const schema = z.object({ name: z.string(), role: z.string().default('viewer') });
    const app = buildTestApp();
    app.post('/x', { preHandler: [validate(schema)] }, (request) => request.body as object);

    const res = await app.inject({ method: 'POST', url: '/x', payload: { name: 'a' } });

    expect(res.json()).toEqual({ name: 'a', role: 'viewer' });
    await app.close();
  });

  it('does NOT write query results anywhere the handler reads', async () => {
    // Documented dead path: for source 'query' validate() assigns to
    // request.validatedQuery, which nothing in src/ reads. This is why Phase 5
    // parses query params inline instead. Pinned so that if someone wires up a
    // reader later, they find this test and update it deliberately.
    const schema = z.object({ page: z.string().default('1') });
    const app = buildTestApp();
    app.get('/x', { preHandler: [validate(schema, 'query')] }, (request) => ({
      query: request.query,
      validated: (request as { validatedQuery?: unknown }).validatedQuery,
    }));

    const res = await app.inject({ method: 'GET', url: '/x' });

    expect(res.json().query).toEqual({});
    expect(res.json().validated).toEqual({ page: '1' });
    await app.close();
  });
});

describe('notFoundHandler', () => {
  it('returns the standard 404 envelope', async () => {
    const app = buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/nothing-here' });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found' },
    });
    await app.close();
  });
});
