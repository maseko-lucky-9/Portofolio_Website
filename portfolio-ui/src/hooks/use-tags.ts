/**
 * Tags Hooks
 * 
 * React Query hooks for tag operations
 */

import { useQuery } from '@tanstack/react-query';
import { tagsService } from '@/services/tags.service';
import { queryKeys } from '@/lib/react-query';

/**
 * Get all tags
 */
export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: () => tagsService.getTags(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get tag by slug
 */
export function useTag(slug: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.tags.all, slug],
    queryFn: () => tagsService.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Get popular tags
 */
export function usePopularTags(limit?: number) {
  return useQuery({
    queryKey: queryKeys.tags.popular(),
    queryFn: () => tagsService.getPopular(limit),
    staleTime: 30 * 60 * 1000,
  });
}
