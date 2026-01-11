/**
 * Articles Hooks
 * 
 * React Query hooks for article-related operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { articlesService } from '@/services/articles.service';
import { queryKeys } from '@/lib/react-query';
import type {
  Article,
  ArticleQueryParams,
  CreateArticleData,
  UpdateArticleData,
} from '@/types/api';

/**
 * Get all articles with pagination
 */
export function useArticles(params?: ArticleQueryParams) {
  return useQuery({
    queryKey: queryKeys.articles.list(params),
    queryFn: () => articlesService.getArticles(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get single article by slug
 */
export function useArticle(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.articles.detail(slug!),
    queryFn: () => articlesService.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get featured articles
 */
export function useFeaturedArticles(limit?: number) {
  return useQuery({
    queryKey: queryKeys.articles.featured(),
    queryFn: () => articlesService.getFeatured(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get articles by tag
 */
export function useArticlesByTag(tagSlug: string, params?: ArticleQueryParams) {
  return useQuery({
    queryKey: queryKeys.articles.list({ ...params, tag: tagSlug }),
    queryFn: () => articlesService.getByTag(tagSlug, params),
    enabled: !!tagSlug,
  });
}

/**
 * Search articles
 */
export function useArticleSearch(searchQuery: string, params?: ArticleQueryParams) {
  return useQuery({
    queryKey: queryKeys.articles.list({ ...params, search: searchQuery }),
    queryFn: () => articlesService.search(searchQuery, params),
    enabled: searchQuery.length > 2,
  });
}

/**
 * Increment article views
 */
export function useIncrementArticleViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => articlesService.incrementViews(slug),
    onSuccess: (_, slug) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        queryKeys.articles.detail(slug),
        (old: unknown) => {
          const oldData = old as { data?: Article };
          if (!oldData?.data) return old;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              views: (oldData.data.views || 0) + 1,
            },
          };
        }
      );
    },
  });
}

/**
 * Toggle article like
 */
export function useToggleArticleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesService.toggleLike(id),
    onSuccess: () => {
      toast.success('Article liked!');
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
    },
  });
}

/**
 * Create article (admin)
 */
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArticleData) => articlesService.createArticle(data),
    onSuccess: () => {
      toast.success('Article created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
    },
  });
}

/**
 * Update article (admin)
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateArticleData) => articlesService.updateArticle(data),
    onSuccess: (response) => {
      toast.success('Article updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.articles.detail(response.data.slug) 
      });
    },
  });
}

/**
 * Delete article (admin)
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => articlesService.deleteArticle(id),
    onSuccess: () => {
      toast.success('Article deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
    },
  });
}
