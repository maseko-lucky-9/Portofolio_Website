import type { ErrorCode } from '@portfolio/shared/types';

// Custom API Error class
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode = 'INTERNAL_ERROR',
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common errors
  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
  }

  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  static unprocessableEntity(message: string, details?: unknown): ApiError {
    return new ApiError(422, message, 'UNPROCESSABLE_ENTITY', details);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, message, 'TOO_MANY_REQUESTS');
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, 'INTERNAL_ERROR', undefined, false);
  }

  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(503, message, 'SERVICE_UNAVAILABLE');
  }

  // Validation error helper
  static validation(errors: Array<{ field: string; message: string }>): ApiError {
    return new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', { errors });
  }
}

// Standard API response format
// Legacy exports for backward compatibility
// TODO: Migrate to shared types from @portfolio/shared
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

// Response helper functions (legacy - use @portfolio/shared response utils)
export const successResponse = <T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> => ({
  success: true,
  data,
  ...(meta ? { meta } : {}),
});

export const errorResponse = (error: ApiError): ApiResponse => ({
  success: false,
  error: {
    code: error.code,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  },
});

// Pagination helper
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const paginate = <T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> => ({
  items,
  meta: {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  },
});

export const getPaginationParams = (
  query: { page?: string; limit?: string; sortBy?: string; sortOrder?: string },
  defaults: { page: number; limit: number; maxLimit: number } = {
    page: 1,
    limit: 10,
    maxLimit: 100,
  }
): PaginationParams => {
  // Math.max(1, NaN) is NaN, not 1 -- so a non-numeric ?page=abc used to flow
  // straight through as NaN and reach Prisma as `skip: NaN`. Currently latent
  // (the routes parse with paginationSchema instead and nothing calls this),
  // but a queued follow-up wires this helper up for its maxLimit clamp, so it
  // must not be handed over broken.
  const parsedPage = parseInt(query.page ?? String(defaults.page), 10);
  const parsedLimit = parseInt(query.limit ?? String(defaults.limit), 10);

  // Number.isSafeInteger, not !Number.isNaN: '99999999999999999999' parses to
  // 1e20, which is not NaN and would reach Prisma as `skip: 1e20`.
  const page = Number.isSafeInteger(parsedPage) ? Math.max(1, parsedPage) : defaults.page;

  // The maxLimit clamp wraps BOTH branches. Putting it only on the parsed side
  // would let a caller-supplied `defaults.limit` above `maxLimit` through
  // unclamped on the fallback path -- harmless with the built-in defaults
  // (10 < 100), which is exactly why it would go unnoticed.
  const limit = Math.min(
    defaults.maxLimit,
    Number.isSafeInteger(parsedLimit) ? Math.max(1, parsedLimit) : defaults.limit
  );
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    sortBy: query.sortBy,
    sortOrder,
  };
};
