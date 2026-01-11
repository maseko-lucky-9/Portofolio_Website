/**
 * Type Guards and Type Predicates
 * Runtime type checking utilities
 */

import type {
  ApiResponse,
  ErrorResponse,
  ValidationErrorDetails,
  AuthErrorDetails,
  PaginatedResponse,
} from './api';

// ==========================================
// Response Type Guards
// ==========================================

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value
  );
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ErrorResponse).error === 'object'
  );
}

export function isValidationError(
  error: unknown
): error is ValidationErrorDetails {
  return (
    isErrorResponse(error) &&
    error.error.code === 'VALIDATION_ERROR' &&
    typeof error.error.details === 'object' &&
    error.error.details !== null &&
    'fields' in error.error.details
  );
}

export function isAuthError(error: unknown): error is AuthErrorDetails {
  return (
    isErrorResponse(error) &&
    ['UNAUTHORIZED', 'FORBIDDEN', 'TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(
      error.error.code
    )
  );
}

export function isPaginatedResponse<T>(
  value: unknown
): value is PaginatedResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    Array.isArray((value as PaginatedResponse<T>).data) &&
    'meta' in value &&
    typeof (value as PaginatedResponse<T>).meta === 'object'
  );
}

// ==========================================
// Null/Undefined Guards
// ==========================================

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ==========================================
// Array Type Guards
// ==========================================

export function isArray<T>(
  value: unknown,
  itemGuard?: (item: unknown) => item is T
): value is T[] {
  if (!Array.isArray(value)) {
    return false;
  }
  
  if (itemGuard) {
    return value.every(itemGuard);
  }
  
  return true;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number');
}

// ==========================================
// Object Type Guards
// ==========================================

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ==========================================
// Utility Type Guards
// ==========================================

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

export function isUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isISODate(value: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return isoDateRegex.test(value);
}

export function isSlug(value: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(value);
}

export function isURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
