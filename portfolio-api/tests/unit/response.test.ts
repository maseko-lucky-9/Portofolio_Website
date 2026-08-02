import { describe, it, expect } from 'vitest';
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  calculatePaginationMeta,
  isValidApiResponse,
} from '../../src/utils/response.js';

// NOTE: utils/errors.ts ALSO exports a `successResponse` and an
// `errorResponse` with different shapes ({success, data} vs {data, meta}).
// Both are live. These tests cover the utils/response.ts pair, which
// project.routes.ts uses; the utils/errors.ts pair is covered in errors.test.ts.

describe('calculatePaginationMeta', () => {
  it('computes pages and the has-more flags for a middle page', () => {
    expect(calculatePaginationMeta(2, 10, 35)).toEqual({
      page: 2,
      limit: 10,
      total: 35,
      pages: 4,
      hasNext: true,
      hasPrev: true,
    });
  });

  it('clears hasPrev on the first page and hasNext on the last', () => {
    expect(calculatePaginationMeta(1, 10, 35)).toMatchObject({ hasPrev: false, hasNext: true });
    // Page 4 of 4: last page, so no next -- but pages 1-3 precede it, so
    // hasPrev is true.
    expect(calculatePaginationMeta(4, 10, 35)).toMatchObject({ hasPrev: true, hasNext: false });
  });

  it('reports zero pages when there is nothing to page through', () => {
    expect(calculatePaginationMeta(1, 10, 0)).toMatchObject({
      pages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });
});

describe('paginatedResponse', () => {
  const meta = calculatePaginationMeta(2, 10, 35);

  it('omits links entirely when no base URL is given', () => {
    const res = paginatedResponse([{ id: 1 }], meta);
    expect(res.data).toEqual([{ id: 1 }]);
    expect(res.links).toBeUndefined();
  });

  it('builds first/prev/next/last with the page query parameter set', () => {
    const res = paginatedResponse([], meta, 'https://api.example.com/v1/projects');
    expect(res.links?.first).toContain('page=1');
    expect(res.links?.prev).toContain('page=1');
    expect(res.links?.next).toContain('page=3');
    expect(res.links?.last).toContain('page=4');
  });

  it('omits prev on the first page and next on the last', () => {
    const first = paginatedResponse([], calculatePaginationMeta(1, 10, 35), 'https://x.example/y');
    expect(first.links?.prev).toBeUndefined();
    expect(first.links?.next).toContain('page=2');

    const last = paginatedResponse([], calculatePaginationMeta(4, 10, 35), 'https://x.example/y');
    expect(last.links?.next).toBeUndefined();
  });

  it('preserves existing query parameters when adding page', () => {
    const res = paginatedResponse([], meta, 'https://x.example/y?status=PUBLISHED');
    expect(res.links?.first).toContain('status=PUBLISHED');
    expect(res.links?.first).toContain('page=1');
  });

  it('does not let the shared URL object bleed one link into the next', () => {
    // buildPageUrl mutates the URL it is handed, and paginatedResponse hands it
    // the same instance four times. Each link is stringified immediately, so
    // they must still differ -- this pins that.
    //
    // Page 3 of 5 on purpose: it is the smallest case where all four links are
    // genuinely distinct. On page 2 of 4, `first` and `prev` are both page 1
    // and `next` and `last` would collide at the other end, so a dedup
    // assertion there would fail on correct code.
    const midMeta = calculatePaginationMeta(3, 10, 45);
    expect(midMeta.pages).toBe(5);

    const res = paginatedResponse([], midMeta, 'https://x.example/y');
    expect(res.links?.first).toContain('page=1');
    expect(res.links?.prev).toContain('page=2');
    expect(res.links?.next).toContain('page=4');
    expect(res.links?.last).toContain('page=5');

    const links = [res.links?.first, res.links?.prev, res.links?.next, res.links?.last];
    expect(new Set(links).size).toBe(links.length);
  });
});

describe('successResponse', () => {
  it('wraps data and stamps an ISO timestamp', () => {
    const res = successResponse({ id: 'a' });
    expect(res.data).toEqual({ id: 'a' });
    expect(res.meta?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  });

  it('lets caller meta merge over the defaults', () => {
    const res = successResponse({ id: 'a' }, { requestId: 'req-1' });
    expect(res.meta).toMatchObject({ requestId: 'req-1' });
    expect(res.meta?.timestamp).toBeDefined();
  });
});

describe('errorResponse', () => {
  it('omits details and requestId when not supplied', () => {
    const res = errorResponse(404, 'NOT_FOUND', 'Missing');
    expect(res.error).toEqual({ statusCode: 404, code: 'NOT_FOUND', message: 'Missing' });
    expect(res.meta).not.toHaveProperty('requestId');
  });

  it('includes details and requestId when supplied', () => {
    const res = errorResponse(400, 'BAD', 'Nope', { field: 'x' }, 'req-9');
    expect(res.error).toMatchObject({ details: { field: 'x' } });
    expect(res.meta).toMatchObject({ requestId: 'req-9' });
  });
});

describe('isValidApiResponse', () => {
  it('accepts an object carrying data, with or without meta', () => {
    expect(isValidApiResponse({ data: 1 })).toBe(true);
    expect(isValidApiResponse({ data: 1, meta: {} })).toBe(true);
  });

  it('rejects non-objects, null and objects with no data key', () => {
    expect(isValidApiResponse(null)).toBe(false);
    expect(isValidApiResponse('nope')).toBe(false);
    expect(isValidApiResponse({ meta: {} })).toBe(false);
  });

  it('rejects a non-object meta', () => {
    expect(isValidApiResponse({ data: 1, meta: 'nope' })).toBe(false);
  });
});
