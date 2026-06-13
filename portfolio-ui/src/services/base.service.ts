/**
 * Base Service Class
 * 
 * Generic service with common CRUD operations
 * Can be extended by resource-specific services
 */

import { httpClient } from '@/lib/http-client';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

export abstract class BaseService<T> {
  constructor(protected basePath: string) {}

  /**
   * Build query string from params
   */
  protected buildQueryString(params?: QueryParams): string {
    if (!params) return '';

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  /**
   * Get all resources with pagination
   */
  async getAll(params?: QueryParams): Promise<PaginatedResponse<T>> {
    const query = this.buildQueryString(params);
    return httpClient.get<PaginatedResponse<T>>(`${this.basePath}${query}`);
  }

  /**
   * Get single resource by ID
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    return httpClient.get<ApiResponse<T>>(`${this.basePath}/${id}`);
  }

  /**
   * Create new resource
   */
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    return httpClient.post<ApiResponse<T>>(this.basePath, data);
  }

  /**
   * Update existing resource
   */
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return httpClient.put<ApiResponse<T>>(`${this.basePath}/${id}`, data);
  }

  /**
   * Partially update resource
   */
  async patch(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return httpClient.patch<ApiResponse<T>>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete resource
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return httpClient.delete<ApiResponse<void>>(`${this.basePath}/${id}`);
  }
}
