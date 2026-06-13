/**
 * API Response Types
 * Generic response wrappers for all API endpoints
 */

// ==========================================
// Generic API Response
// ==========================================

export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
  links?: ResponseLinks;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  version?: string;
}

export interface ResponseLinks {
  self?: string;
  related?: Record<string, string>;
}

// ==========================================
// Error Response
// ==========================================

export interface ErrorResponse {
  error: ErrorDetails;
  meta?: ResponseMeta;
}

export interface ErrorDetails {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

// Specific error types
export interface ValidationErrorDetails extends ErrorDetails {
  code: 'VALIDATION_ERROR';
  details: ValidationErrors;
}

export interface ValidationErrors {
  fields: Record<string, string[]>;
  invalidFields: string[];
  errorCount: number;
}

export interface AuthErrorDetails extends ErrorDetails {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'TOKEN_EXPIRED' | 'INVALID_TOKEN';
  details?: {
    reason?: string;
    redirectUrl?: string;
  };
}

// Error code enum for type safety
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN';

// ==========================================
// Paginated Response
// ==========================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: PaginationLinks;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationLinks {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

// Cursor-based pagination
export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
  links?: CursorPaginationLinks;
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  count: number;
}

export interface CursorPaginationLinks {
  next?: string;
  prev?: string;
}

// ==========================================
// File Upload Types
// ==========================================

export interface FileUploadResponse {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  hash?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  expiresAt: string;
  maxFileSize: number;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  estimatedTimeRemaining?: number;
}

// ==========================================
// Common Query Parameters
// ==========================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  q?: string;
  search?: string;
}

export interface FilterParams {
  status?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
}

export type QueryParams = PaginationParams & SearchParams & FilterParams;
