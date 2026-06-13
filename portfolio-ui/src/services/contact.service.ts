/**
 * Contact & Newsletter Services
 * 
 * Handles contact form submissions, newsletter signups, and demo requests
 */

import { httpClient } from '@/lib/http-client';
import type {
  ContactFormData,
  NewsletterSignupData,
  DemoRequestData,
  ApiResponse,
  ContactSubmission,
  NewsletterSubscriber,
  DemoRequest,
} from '@/types/api';

// ===========================================
// Contact Service
// ===========================================

class ContactService {
  private readonly basePath = '/contact/submit';

  /**
   * Submit contact form
   */
  async submit(data: ContactFormData): Promise<ApiResponse<ContactSubmission>> {
    return httpClient.post<ApiResponse<ContactSubmission>>(
      this.basePath,
      data,
      { skipAuth: true }
    );
  }
}

// ===========================================
// Newsletter Service
// ===========================================

class NewsletterService {
  private readonly basePath = '/newsletter';

  /**
   * Subscribe to newsletter
   */
  async subscribe(data: NewsletterSignupData): Promise<ApiResponse<NewsletterSubscriber>> {
    return httpClient.post<ApiResponse<NewsletterSubscriber>>(
      `${this.basePath}/subscribe`,
      data,
      { skipAuth: true }
    );
  }

  /**
   * Confirm newsletter subscription
   */
  async confirm(token: string): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      `${this.basePath}/confirm`,
      { token },
      { skipAuth: true }
    );
  }

  /**
   * Unsubscribe from newsletter
   */
  async unsubscribe(token: string): Promise<ApiResponse<void>> {
    return httpClient.post<ApiResponse<void>>(
      `${this.basePath}/unsubscribe`,
      { token },
      { skipAuth: true }
    );
  }
}

// ===========================================
// Demo Request Service
// ===========================================

class DemoService {
  private readonly basePath = '/demo';

  /**
   * Submit demo request
   */
  async requestDemo(data: DemoRequestData): Promise<ApiResponse<DemoRequest>> {
    return httpClient.post<ApiResponse<DemoRequest>>(
      this.basePath,
      data,
      { skipAuth: true }
    );
  }
}

export const contactService = new ContactService();
export const newsletterService = new NewsletterService();
export const demoService = new DemoService();

export default {
  contact: contactService,
  newsletter: newsletterService,
  demo: demoService,
};
