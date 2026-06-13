/**
 * Health Check Service
 * 
 * Monitors API health and status
 */

import { httpClient } from '@/lib/http-client';
import type { HealthCheck } from '@/types/api';

class HealthService {
  /**
   * Check API health
   */
  async check(): Promise<HealthCheck> {
    return httpClient.get<HealthCheck>('/health', {
      skipAuth: true,
      timeout: 5000,
    });
  }

  /**
   * Check if API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.check();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export const healthService = new HealthService();
export default healthService;
