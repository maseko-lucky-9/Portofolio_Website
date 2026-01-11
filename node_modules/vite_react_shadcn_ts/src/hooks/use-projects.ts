/**
 * Projects Hooks
 * 
 * React Query hooks for project-related operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsService } from '@/services/projects.service';
import { queryKeys } from '@/lib/react-query';
import type {
  Project,
  ProjectQueryParams,
  CreateProjectData,
  UpdateProjectData,
} from '@/types/api';

/**
 * Get all projects with pagination
 */
export function useProjects(params?: ProjectQueryParams) {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => projectsService.getProjects(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Get single project by slug
 */
export function useProject(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(slug!),
    queryFn: () => projectsService.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get featured projects
 */
export function useFeaturedProjects(limit?: number) {
  return useQuery({
    queryKey: queryKeys.projects.featured(),
    queryFn: () => projectsService.getFeatured(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get projects by tag
 */
export function useProjectsByTag(tagSlug: string, params?: ProjectQueryParams) {
  return useQuery({
    queryKey: queryKeys.projects.list({ ...params, tag: tagSlug }),
    queryFn: () => projectsService.getByTag(tagSlug, params),
    enabled: !!tagSlug,
  });
}

/**
 * Search projects
 */
export function useProjectSearch(searchQuery: string, params?: ProjectQueryParams) {
  return useQuery({
    queryKey: queryKeys.projects.list({ ...params, search: searchQuery }),
    queryFn: () => projectsService.search(searchQuery, params),
    enabled: searchQuery.length > 2,
  });
}

/**
 * Increment project views
 */
export function useIncrementProjectViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => projectsService.incrementViews(slug),
    onSuccess: (_, slug) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        queryKeys.projects.detail(slug),
        (old: unknown) => {
          const oldData = old as { data?: Project };
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
 * Toggle project like
 */
export function useToggleProjectLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsService.toggleLike(id),
    onSuccess: (response, id) => {
      toast.success('Project liked!');
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

/**
 * Create project (admin)
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectsService.createProject(data),
    onSuccess: () => {
      toast.success('Project created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}

/**
 * Update project (admin)
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjectData) => projectsService.updateProject(data),
    onSuccess: (response, variables) => {
      toast.success('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projects.detail(response.data.slug) 
      });
    },
  });
}

/**
 * Delete project (admin)
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsService.deleteProject(id),
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
}
