/**
 * Projects Service
 * 
 * Handles all project-related API operations
 */

import { BaseService } from './base.service';
import { httpClient } from '@/lib/http-client';
import type {
  Project,
  ProjectQueryParams,
  ApiResponse,
  PaginatedResponse,
  CreateProjectData,
  UpdateProjectData,
} from '@/types/api';

class ProjectsService extends BaseService<Project> {
  constructor() {
    super('/projects');
  }

  /**
   * Get projects with filtering and pagination
   */
  async getProjects(params?: ProjectQueryParams): Promise<PaginatedResponse<Project>> {
    return this.getAll(params);
  }

  /**
   * Get single project by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Project>> {
    return httpClient.get<ApiResponse<Project>>(`${this.basePath}/slug/${slug}`);
  }

  /**
   * Get featured projects
   */
  async getFeatured(limit: number = 6): Promise<ApiResponse<Project[]>> {
    return httpClient.get<ApiResponse<Project[]>>(
      `${this.basePath}?featured=true&limit=${limit}`
    );
  }

  /**
   * Increment project views
   */
  async incrementViews(slug: string): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      `${this.basePath}/slug/${slug}/views`,
      undefined,
      { skipAuth: true }
    );
  }

  /**
   * Toggle project like
   */
  async toggleLike(id: string): Promise<ApiResponse<{ likes: number }>> {
    return httpClient.post<ApiResponse<{ likes: number }>>(
      `${this.basePath}/${id}/like`
    );
  }

  /**
   * Create project (admin)
   */
  async createProject(data: CreateProjectData): Promise<ApiResponse<Project>> {
    return this.create(data);
  }

  /**
   * Update project (admin)
   */
  async updateProject(data: UpdateProjectData): Promise<ApiResponse<Project>> {
    return this.update(data.id, data);
  }

  /**
   * Delete project (admin)
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.delete(id);
  }

  /**
   * Get projects by tag
   */
  async getByTag(tagSlug: string, params?: ProjectQueryParams): Promise<PaginatedResponse<Project>> {
    const query = this.buildQueryString({ ...params, tag: tagSlug });
    return httpClient.get<PaginatedResponse<Project>>(`${this.basePath}${query}`);
  }

  /**
   * Get projects by category
   */
  async getByCategory(category: string, params?: ProjectQueryParams): Promise<PaginatedResponse<Project>> {
    const query = this.buildQueryString({ ...params, category });
    return httpClient.get<PaginatedResponse<Project>>(`${this.basePath}${query}`);
  }

  /**
   * Search projects
   */
  async search(searchQuery: string, params?: ProjectQueryParams): Promise<PaginatedResponse<Project>> {
    const query = this.buildQueryString({ ...params, search: searchQuery });
    return httpClient.get<PaginatedResponse<Project>>(`${this.basePath}${query}`);
  }
}

export const projectsService = new ProjectsService();
export default projectsService;
