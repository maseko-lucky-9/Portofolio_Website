/**
 * Articles Service
 * 
 * Handles all article/blog-related API operations
 */

import { BaseService } from './base.service';
import { httpClient } from '@/lib/http-client';
import type {
  Article,
  ArticleQueryParams,
  ApiResponse,
  PaginatedResponse,
  CreateArticleData,
  UpdateArticleData,
} from '@/types/api';

class ArticlesService extends BaseService<Article> {
  constructor() {
    super('/articles');
  }

  /**
   * Get articles with filtering and pagination
   */
  async getArticles(params?: ArticleQueryParams): Promise<PaginatedResponse<Article>> {
    return this.getAll(params);
  }

  /**
   * Get single article by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Article>> {
    return httpClient.get<ApiResponse<Article>>(`${this.basePath}/slug/${slug}`);
  }

  /**
   * Get featured articles
   */
  async getFeatured(limit: number = 6): Promise<ApiResponse<Article[]>> {
    return httpClient.get<ApiResponse<Article[]>>(
      `${this.basePath}?featured=true&limit=${limit}`
    );
  }

  /**
   * Increment article views
   */
  async incrementViews(slug: string): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      `${this.basePath}/slug/${slug}/views`,
      undefined,
      { skipAuth: true }
    );
  }

  /**
   * Toggle article like
   */
  async toggleLike(id: string): Promise<ApiResponse<{ likes: number }>> {
    return httpClient.post<ApiResponse<{ likes: number }>>(
      `${this.basePath}/${id}/like`
    );
  }

  /**
   * Create article (admin)
   */
  async createArticle(data: CreateArticleData): Promise<ApiResponse<Article>> {
    return this.create(data);
  }

  /**
   * Update article (admin)
   */
  async updateArticle(data: UpdateArticleData): Promise<ApiResponse<Article>> {
    return this.update(data.id, data);
  }

  /**
   * Delete article (admin)
   */
  async deleteArticle(id: string): Promise<ApiResponse<void>> {
    return this.delete(id);
  }

  /**
   * Get articles by tag
   */
  async getByTag(tagSlug: string, params?: ArticleQueryParams): Promise<PaginatedResponse<Article>> {
    const query = this.buildQueryString({ ...params, tag: tagSlug });
    return httpClient.get<PaginatedResponse<Article>>(`${this.basePath}${query}`);
  }

  /**
   * Search articles
   */
  async search(searchQuery: string, params?: ArticleQueryParams): Promise<PaginatedResponse<Article>> {
    const query = this.buildQueryString({ ...params, search: searchQuery });
    return httpClient.get<PaginatedResponse<Article>>(`${this.basePath}${query}`);
  }
}

export const articlesService = new ArticlesService();
export default articlesService;
