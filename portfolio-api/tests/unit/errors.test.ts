import { describe, it, expect } from 'vitest';
import {
  ApiError,
  errorResponse,
  successResponse,
  paginate,
  getPaginationParams,
} from '../../src/utils/errors.js';

describe('ApiError factories', () => {
  it.each([
    ['badRequest', ApiError.badRequest('x'), 400, 'BAD_REQUEST'],
    ['unauthorized', ApiError.unauthorized(), 401, 'UNAUTHORIZED'],
    ['forbidden', ApiError.forbidden(), 403, 'FORBIDDEN'],
    ['notFound', ApiError.notFound(), 404, 'NOT_FOUND'],
    ['conflict', ApiError.conflict('x'), 409, 'CONFLICT'],
    ['unprocessableEntity', ApiError.unprocessableEntity('x'), 422, 'UNPROCESSABLE_ENTITY'],
    ['tooManyRequests', ApiError.tooManyRequests(), 429, 'TOO_MANY_REQUESTS'],
    ['internal', ApiError.internal(), 500, 'INTERNAL_ERROR'],
    ['serviceUnavailable', ApiError.serviceUnavailable(), 503, 'SERVICE_UNAVAILABLE'],
  ])('%s carries the right status and code', (_name, err, statusCode, code) => {
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(statusCode);
    expect(err.code).toBe(code);
  });

  it('marks internal errors as non-operational and everything else as operational', () => {
    // isOperational is how a future error reporter would separate "expected
    // rejection" from "we broke". internal() is the only factory that flips it.
    expect(ApiError.internal().isOperational).toBe(false);
    expect(ApiError.badRequest('x').isOperational).toBe(true);
    expect(ApiError.serviceUnavailable().isOperational).toBe(true);
  });

  it('builds notFound messages from the resource name', () => {
    expect(ApiError.notFound('Widget').message).toBe('Widget not found');
    expect(ApiError.notFound().message).toBe('Resource not found');
  });

  it('wraps field errors in a details.errors array', () => {
    const err = ApiError.validation([{ field: 'email', message: 'Invalid' }]);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ errors: [{ field: 'email', message: 'Invalid' }] });
  });
});

describe('errorResponse', () => {
  it('omits details when the error has none', () => {
    // Same TS2698-era contract the errorHandler relies on.
    expect(errorResponse(ApiError.notFound('Widget'))).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Widget not found' },
    });
  });

  it('omits details for a FALSY-but-defined details value', () => {
    // The case that distinguishes the truthiness spread from the
    // `!== undefined` variant -- see the equivalent-mutant note in
    // error.middleware.test.ts.
    const res = errorResponse(new ApiError(400, 'Nope', 'BAD_REQUEST', null));
    expect(res.error).toEqual({ code: 'BAD_REQUEST', message: 'Nope' });
    expect(Object.keys(res.error ?? {})).not.toContain('details');
  });

  it('includes details when present', () => {
    const res = errorResponse(ApiError.conflict('Taken', { field: 'email' }));
    expect(res.error?.details).toEqual({ field: 'email' });
  });
});

describe('successResponse', () => {
  it('omits meta when not supplied', () => {
    expect(successResponse({ id: 1 })).toEqual({ success: true, data: { id: 1 } });
  });

  it('includes meta when supplied', () => {
    expect(successResponse({ id: 1 }, { total: 5 })).toEqual({
      success: true,
      data: { id: 1 },
      meta: { total: 5 },
    });
  });
});

describe('paginate', () => {
  // Live code: article.service.ts:111 and project.service.ts:119 both call it.
  it('computes totalPages by rounding up', () => {
    expect(paginate([], 21, { page: 1, limit: 10 }).meta.totalPages).toBe(3);
    expect(paginate([], 20, { page: 1, limit: 10 }).meta.totalPages).toBe(2);
    expect(paginate([], 1, { page: 1, limit: 10 }).meta.totalPages).toBe(1);
  });

  it('reports zero pages for an empty result set', () => {
    expect(paginate([], 0, { page: 1, limit: 10 }).meta).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it('passes items through untouched', () => {
    // toEqual, not toBe: whether paginate returns the caller's array instance
    // or a copy is an implementation detail nothing depends on, and pinning it
    // would fail a harmless defensive-copy refactor.
    const items = [{ id: 'a' }, { id: 'b' }];
    expect(paginate(items, 2, { page: 1, limit: 10 }).items).toEqual(items);
  });
});

describe('getPaginationParams', () => {
  it('applies defaults for an empty query', () => {
    expect(getPaginationParams({})).toMatchObject({ page: 1, limit: 10, sortOrder: 'desc' });
  });

  it('clamps limit to maxLimit and floors page at 1', () => {
    expect(getPaginationParams({ limit: '9999' }).limit).toBe(100);
    expect(getPaginationParams({ page: '0' }).page).toBe(1);
    expect(getPaginationParams({ page: '-5' }).page).toBe(1);
    expect(getPaginationParams({ limit: '0' }).limit).toBe(1);
  });

  it('falls back to the default for a non-numeric value instead of NaN', () => {
    // Math.max(1, NaN) is NaN, so before the guard this returned page: NaN,
    // which would reach Prisma as `skip: NaN`.
    expect(getPaginationParams({ page: 'abc' }).page).toBe(1);
    expect(getPaginationParams({ limit: 'abc' }).limit).toBe(10);
    expect(Number.isNaN(getPaginationParams({ page: 'abc' }).page)).toBe(false);
  });

  it('rejects a value past MAX_SAFE_INTEGER, which is not NaN', () => {
    // '99999999999999999999' parses to 1e20 -- a number, so a !Number.isNaN
    // guard lets it through and Prisma receives skip: 1e20. Only an
    // isSafeInteger check catches it.
    expect(getPaginationParams({ page: '99999999999999999999' }).page).toBe(1);
    expect(getPaginationParams({ limit: '99999999999999999999' }).limit).toBe(10);
  });

  it('honours maxLimit and the floor even on the fallback branch', () => {
    // The clamps have to wrap the DEFAULTS too, not just the parsed value.
    // With the built-in defaults (limit 10 < maxLimit 100) a one-sided clamp is
    // indistinguishable, so this passes a caller-supplied defaults object --
    // the only shape that can tell the two apart.
    const overLimit = { page: 1, limit: 500, maxLimit: 100 };
    expect(getPaginationParams({ limit: 'abc' }, overLimit).limit).toBe(100);

    const underFloor = { page: 0, limit: 0, maxLimit: 100 };
    // limit 0 would reach paginate() as a divisor and give totalPages: Infinity.
    expect(getPaginationParams({ limit: 'abc' }, underFloor).limit).toBe(1);
    expect(getPaginationParams({ page: 'abc' }, underFloor).page).toBe(1);
  });

  it('only accepts asc for sortOrder and defaults everything else to desc', () => {
    expect(getPaginationParams({ sortOrder: 'asc' }).sortOrder).toBe('asc');
    expect(getPaginationParams({ sortOrder: 'ASC' }).sortOrder).toBe('desc');
    expect(getPaginationParams({ sortOrder: 'nonsense' }).sortOrder).toBe('desc');
  });
});
