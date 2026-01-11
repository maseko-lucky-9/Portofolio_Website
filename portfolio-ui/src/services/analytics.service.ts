/**
 * Analytics Service
 * 
 * Handles analytics tracking and reporting
 */

import { httpClient } from '@/lib/http-client';
import type {
  EventType,
  AnalyticsQueryParams,
  AnalyticsSummary,
  ApiResponse,
} from '@/types/api';

interface TrackEventData {
  eventType: EventType;
  eventData?: Record<string, unknown>;
  projectId?: string;
  articleId?: string;
  path?: string;
  duration?: number;
}

class AnalyticsService {
  private readonly basePath = '/analytics';
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track event
   */
  async trackEvent(data: TrackEventData): Promise<void> {
    try {
      await httpClient.post<ApiResponse<void>>(
        `${this.basePath}/track`,
        {
          ...data,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        },
        { 
          skipAuth: true,
          skipRetry: true, // Don't retry analytics
        }
      );
    } catch (error) {
      // Silently fail analytics tracking
      if (import.meta.env.DEV) {
        console.warn('Analytics tracking failed:', error);
      }
    }
  }

  /**
   * Track page view
   */
  async trackPageView(path: string): Promise<void> {
    return this.trackEvent({
      eventType: 'PAGE_VIEW',
      path,
    });
  }

  /**
   * Track project view
   */
  async trackProjectView(projectId: string): Promise<void> {
    return this.trackEvent({
      eventType: 'PROJECT_VIEW',
      projectId,
    });
  }

  /**
   * Track article view
   */
  async trackArticleView(articleId: string): Promise<void> {
    return this.trackEvent({
      eventType: 'ARTICLE_VIEW',
      articleId,
    });
  }

  /**
   * Track resume download
   */
  async trackResumeDownload(): Promise<void> {
    return this.trackEvent({
      eventType: 'RESUME_DOWNLOAD',
    });
  }

  /**
   * Track external link click
   */
  async trackExternalLink(url: string): Promise<void> {
    return this.trackEvent({
      eventType: 'EXTERNAL_LINK',
      eventData: { url },
    });
  }

  /**
   * Track time on page
   */
  async trackTimeOnPage(path: string, duration: number): Promise<void> {
    return this.trackEvent({
      eventType: 'TIME_ON_PAGE',
      path,
      duration,
    });
  }

  /**
   * Get analytics summary
   */
  async getSummary(params?: AnalyticsQueryParams): Promise<ApiResponse<AnalyticsSummary[]>> {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    return httpClient.get<ApiResponse<AnalyticsSummary[]>>(
      `${this.basePath}/summary${query}`
    );
  }

  /**
   * Get analytics overview (admin)
   */
  async getOverview(): Promise<ApiResponse<{
    totalViews: number;
    uniqueVisitors: number;
    topProjects: Array<{ id: string; title: string; views: number }>;
    topArticles: Array<{ id: string; title: string; views: number }>;
  }>> {
    return httpClient.get<ApiResponse<any>>(`${this.basePath}/overview`);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
