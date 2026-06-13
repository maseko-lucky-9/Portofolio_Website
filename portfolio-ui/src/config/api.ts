/**
 * API Client Configuration
 *
 * A configured fetch wrapper for making API requests to the backend.
 *
 * Usage:
 *   import { api } from '@/config/api';
 *
 *   // GET request
 *   const projects = await api.get('/projects');
 *
 *   // POST request with body
 *   const newProject = await api.post('/projects', { title: 'My Project' });
 */

import { env, apiUrl } from './env';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request options type
interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

// Response wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

/**
 * Make a fetch request to the API
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = apiUrl(endpoint);
  const { body, headers: customHeaders, ...restOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // Add auth token if available
  const token = localStorage.getItem('accessToken');
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...restOptions,
    headers,
    credentials: 'include', // Include cookies for CORS
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  if (env.debug) {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  }

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        data?.message || data?.error || `HTTP ${response.status}`,
        data
      );
    }

    if (env.debug) {
      console.log(`✅ API Response: ${response.status}`, data);
    }

    return {
      data: data as T,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other error
    console.error('API Error:', error);
    throw new ApiError(
      0,
      'Network Error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * API client with convenience methods
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
