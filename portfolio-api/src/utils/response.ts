/**
 * Response Utilities
 * Helper functions for creating standardized API responses
 */

import type {
  ApiResponse,
  ErrorResponse,
  PaginatedResponse,
  PaginationMeta,
  ResponseMeta,
} from '@portfolio/shared/types';

// ==========================================
// Success Response Helpers
// ==========================================

export function successResponse<T>(
  data: T,
  meta?: Partial<ResponseMeta>
): ApiResponse<T> {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

// ==========================================
// Paginated Response Helper
// ==========================================

export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  baseUrl?: string
): PaginatedResponse<T> {
  const response: PaginatedResponse<T> = {
    data,
    meta,
  };

  // Add navigation links if base URL provided
  if (baseUrl) {
    const { page, pages } = meta;
    const url = new URL(baseUrl);

    response.links = {
      first: buildPageUrl(url, 1),
      ...(meta.hasPrev && { prev: buildPageUrl(url, page - 1) }),
      ...(meta.hasNext && { next: buildPageUrl(url, page + 1) }),
      last: buildPageUrl(url, pages),
    };
  }

  return response;
}

function buildPageUrl(baseUrl: URL, page: number): string {
  const url = new URL(baseUrl);
  url.searchParams.set('page', page.toString());
  return url.toString();
}

// ==========================================
// Error Response Helper
// ==========================================

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
  requestId?: string
): ErrorResponse {
  return {
    error: {
      statusCode,
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    },
  };
}

// ==========================================
// Pagination Metadata Calculator
// ==========================================

export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

// ==========================================
// Response Type Guards (for backend validation)
// ==========================================

export function isValidApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    (!('meta' in value) || typeof (value as any).meta === 'object')
  );
}
