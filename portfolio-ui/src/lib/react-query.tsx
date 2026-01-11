/**
 * React Query Configuration
 * 
 * Sets up TanStack Query (React Query) with proper defaults
 * and error handling
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'sonner';
import { ApiError } from '@/lib/http-client';
import { authService } from '@/services/auth.service';
import { queryKeys } from './query-keys';

export { queryKeys };

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

export default queryClient;
