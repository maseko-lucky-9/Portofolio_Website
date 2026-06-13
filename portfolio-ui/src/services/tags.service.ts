/**
 * Tags Service
 * 
 * Handles tag operations
 */

import { BaseService } from './base.service';
import { httpClient } from '@/lib/http-client';
import type { Tag, ApiResponse } from '@/types/api';

class TagsService extends BaseService<Tag> {
  constructor() {
    super('/tags');
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<ApiResponse<Tag[]>> {
    return httpClient.get<ApiResponse<Tag[]>>(this.basePath);
  }

  /**
   * Get tag by slug
   */
  async getBySlug(slug: string): Promise<ApiResponse<Tag>> {
    return httpClient.get<ApiResponse<Tag>>(`${this.basePath}/slug/${slug}`);
  }

  /**
   * Get popular tags
   */
  async getPopular(limit: number = 10): Promise<ApiResponse<Tag[]>> {
    return httpClient.get<ApiResponse<Tag[]>>(
      `${this.basePath}/popular?limit=${limit}`
    );
  }
}

export const tagsService = new TagsService();
export default tagsService;
