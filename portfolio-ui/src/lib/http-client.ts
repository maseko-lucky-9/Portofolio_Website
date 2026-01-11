/**
 * Enhanced HTTP Client with Interceptors
 * 
 * Extends the base API client with:
 * - Request/response interceptors
 * - Automatic token refresh
 * - Request retry with exponential backoff
 * - Request deduplication
 * - Abort controller support
 */

import { env, apiUrl } from './env';

// ============================================
// Types
// ============================================

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: unknown,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  isAuthError(): boolean {
    return this.status === 401;
  }

  isForbiddenError(): boolean {
    return this.status === 403;
  }

  isNotFoundError(): boolean {
    return this.status === 404;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network request failed') {
    super(0, 'Network Error', message);
    this.name = 'NetworkError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  retry?: number;
  retryDelay?: number;
  timeout?: number;
  skipAuth?: boolean;
  skipRetry?: boolean;
}

interface RequestInterceptor {
  onRequest?: (config: RequestInit & { url: string }) => RequestInit & { url: string } | Promise<RequestInit & { url: string }>;
  onRequestError?: (error: Error) => void;
}

interface ResponseInterceptor {
  onResponse?: (response: Response) => Response | Promise<Response>;
  onResponseError?: (error: ApiError) => void | Promise<void>;
}

// ============================================
// Token Management
// ============================================

class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, 'Unauthorized', 'No refresh token available');
    }

    try {
      const response = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        this.clearTokens();
        throw new ApiError(401, 'Unauthorized', 'Token refresh failed');
      }

      const data = await response.json();
      const newAccessToken = data.data.accessToken;
      
      this.accessToken = newAccessToken;
      localStorage.setItem('accessToken', newAccessToken);

      return newAccessToken;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }
}

// ============================================
// Request Deduplication
// ============================================

class RequestDeduplicator {
  private inFlightRequests = new Map<string, Promise<Response>>();

  getKey(url: string, options: RequestInit): string {
    return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || '')}`;
  }

  has(key: string): boolean {
    return this.inFlightRequests.has(key);
  }

  get(key: string): Promise<Response> | undefined {
    return this.inFlightRequests.get(key);
  }

  set(key: string, promise: Promise<Response>): void {
    this.inFlightRequests.set(key, promise);
    
    // Clean up after request completes
    promise.finally(() => {
      this.inFlightRequests.delete(key);
    });
  }
}

// ============================================
// HTTP Client
// ============================================

class HttpClient {
  private tokenManager = new TokenManager();
  private deduplicator = new RequestDeduplicator();
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      body,
      headers: customHeaders,
      retry = 3,
      retryDelay = 1000,
      timeout = 30000,
      skipAuth = false,
      skipRetry = false,
      ...restOptions
    } = options;

    let url = apiUrl(endpoint);
    let attempt = 0;

    while (attempt < (skipRetry ? 1 : retry)) {
      try {
        const response = await this.executeRequest<T>(
          url,
          {
            ...restOptions,
            body,
            headers: customHeaders,
            skipAuth,
          },
          timeout
        );

        return response;
      } catch (error) {
        attempt++;

        // Don't retry on client errors (400-499) except 401, 408, 429
        if (error instanceof ApiError) {
          const shouldRetry =
            !skipRetry &&
            attempt < retry &&
            (error.status === 0 || // Network error
              error.status === 401 || // Will try to refresh token
              error.status === 408 || // Request timeout
              error.status === 429 || // Rate limit
              error.status >= 500); // Server error

          if (!shouldRetry) {
            throw error;
          }

          // Special handling for 401 - try to refresh token
          if (error.status === 401 && !skipAuth && attempt === 1) {
            try {
              await this.tokenManager.refreshAccessToken();
              continue; // Retry with new token
            } catch {
              this.tokenManager.clearTokens();
              throw error;
            }
          }
        }

        // Last attempt failed
        if (attempt >= retry) {
          throw error;
        }

        // Wait before retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('Request failed after retries');
  }

  private async executeRequest<T>(
    url: string,
    options: RequestOptions,
    timeout: number
  ): Promise<T> {
    const { body, headers: customHeaders, skipAuth, ...restOptions } = options;

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // Add auth token
    if (!skipAuth) {
      const token = this.tokenManager.getAccessToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    // Build config
    let config: RequestInit & { url: string } = {
      ...restOptions,
      headers,
      credentials: 'include',
      url,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          config = await interceptor.onRequest(config);
        } catch (error) {
          if (interceptor.onRequestError) {
            interceptor.onRequestError(error as Error);
          }
          throw error;
        }
      }
    }

    // Check for duplicate in-flight requests
    const dedupeKey = this.deduplicator.getKey(config.url, config);
    const existingRequest = this.deduplicator.get(dedupeKey);
    if (existingRequest) {
      const response = await existingRequest.clone();
      return this.parseResponse<T>(response);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    config.signal = controller.signal;

    if (env.debug) {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${config.url}`);
    }

    try {
      // Execute request with deduplication
      const fetchPromise = fetch(config.url, config);
      this.deduplicator.set(dedupeKey, fetchPromise);
      
      let response = await fetchPromise;
      clearTimeout(timeoutId);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponse) {
          response = await interceptor.onResponse(response);
        }
      }

      return await this.parseResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      let apiError: ApiError;

      if (error instanceof ApiError) {
        apiError = error;
      } else if ((error as Error).name === 'AbortError') {
        apiError = new ApiError(0, 'Timeout', 'Request timeout');
      } else {
        apiError = new NetworkError(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      // Apply error interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onResponseError) {
          await interceptor.onResponseError(apiError);
        }
      }

      throw apiError;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        data?.error?.message || data?.message || `HTTP ${response.status}`,
        data,
        data?.error?.code
      );
    }

    if (env.debug) {
      console.log(`✅ API Response: ${response.status}`, data);
    }

    return data as T;
  }

  // Convenience methods
  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Token management methods
  setTokens(accessToken: string, refreshToken: string) {
    this.tokenManager.setTokens(accessToken, refreshToken);
  }

  clearTokens() {
    this.tokenManager.clearTokens();
  }

  getAccessToken() {
    return this.tokenManager.getAccessToken();
  }
}

// ============================================
// Export singleton instance
// ============================================

export const httpClient = new HttpClient();

// Add default logging interceptor in development
if (env.debug) {
  httpClient.addRequestInterceptor({
    onRequest: (config) => {
      console.log('📤 Request:', config.method, config.url);
      return config;
    },
  });

  httpClient.addResponseInterceptor({
    onResponseError: (error) => {
      console.error('📥 Response Error:', error);
    },
  });
}

export default httpClient;
