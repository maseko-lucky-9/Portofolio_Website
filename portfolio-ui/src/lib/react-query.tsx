/**
 * React Query Configuration
 * 
 * Sets up TanStack Query (React Query) with proper defaults
 * and error handling
 */

import { QueryClient, QueryClientProvider, type QueryCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';
import { ApiError } from '@/lib/http-client';
import { authService } from '@/services/auth.service';

/**
 * Default query options
 */
const defaultQueryOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 4xx errors except 408, 429
      if (error instanceof ApiError) {
        if (error.status >= 400 && error.status < 500) {
          return error.status === 408 || error.status === 429;
        }
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false,
    onError: (error: unknown) => {
      // Global error handling for mutations
      if (error instanceof ApiError) {
        // Don't show toast for validation errors (handled in form)
        if (!error.isValidationError()) {
          toast.error(error.message || 'An error occurred');
        }

        // Logout on authentication errors
        if (error.isAuthError()) {
          authService.logout();
          window.location.href = '/login';
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    },
  },
};

/**
 * Create React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Query Client Provider with DevTools
 */
interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

/**
 * Query key factories
 * 
 * Provides consistent query keys across the application
 */
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.projects.lists(), params] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.projects.details(), slug] as const,
    featured: () => [...queryKeys.projects.all, 'featured'] as const,
  },

  // Articles
  articles: {
    all: ['articles'] as const,
    lists: () => [...queryKeys.articles.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.articles.lists(), params] as const,
    details: () => [...queryKeys.articles.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.articles.details(), slug] as const,
    featured: () => [...queryKeys.articles.all, 'featured'] as const,
  },

  // Tags
  tags: {
    all: ['tags'] as const,
    popular: () => [...queryKeys.tags.all, 'popular'] as const,
  },

  // Auth
  auth: {
    user: () => ['auth', 'user'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    summary: (params?: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'summary', params] as const,
    overview: () => [...queryKeys.analytics.all, 'overview'] as const,
  },

  // Code Execution
  codeExecution: {
    languages: () => ['codeExecution', 'languages'] as const,
  },

  // Health
  health: {
    check: () => ['health', 'check'] as const,
  },
};

export default queryClient;
