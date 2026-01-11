/**
 * MSW Request Handlers
 * 
 * Define mock API responses for development and testing
 */

import { http, HttpResponse, delay } from 'msw';
import { mockProjects, mockArticles, mockTags, mockUser } from './data';
import { env } from '@/config/env';

const API_URL = env.apiUrl;

export const handlers = [
  // Health check
  http.get(`${API_URL}/health`, async () => {
    await delay(100);
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: 'development',
    });
  }),

  // Projects
  http.get(`${API_URL}/v1/projects`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      success: true,
      data: mockProjects,
      pagination: {
        page,
        limit,
        total: mockProjects.length,
        totalPages: 1,
        hasMore: false,
      },
    });
  }),

  http.get(`${API_URL}/v1/projects/slug/:slug`, async ({ params }) => {
    await delay(200);
    const { slug } = params;
    const project = mockProjects.find((p) => p.slug === slug);

    if (!project) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      success: true,
      data: project,
    });
  }),

  http.get(`${API_URL}/v1/projects/featured`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: mockProjects.filter((p) => p.featured),
    });
  }),

  // Articles
  http.get(`${API_URL}/v1/articles`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      success: true,
      data: mockArticles,
      pagination: {
        page,
        limit,
        total: mockArticles.length,
        totalPages: 1,
        hasMore: false,
      },
    });
  }),

  http.get(`${API_URL}/v1/articles/slug/:slug`, async ({ params }) => {
    await delay(200);
    const { slug } = params;
    const article = mockArticles.find((a) => a.slug === slug);

    if (!article) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      success: true,
      data: article,
    });
  }),

  // Tags
  http.get(`${API_URL}/v1/tags`, async () => {
    await delay(150);
    return HttpResponse.json({
      success: true,
      data: mockTags,
    });
  }),

  // Contact
  http.post(`${API_URL}/v1/contact`, async ({ request }) => {
    await delay(500);
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        ...body,
        status: 'NEW',
        createdAt: new Date().toISOString(),
      },
      message: 'Contact form submitted successfully',
    });
  }),

  // Newsletter
  http.post(`${API_URL}/v1/newsletter/subscribe`, async ({ request }) => {
    await delay(500);
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        ...body,
        isConfirmed: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      message: 'Subscription successful. Please check your email.',
    });
  }),

  // Auth
  http.post(`${API_URL}/v1/auth/login`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'admin@example.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUser,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        },
      },
      { status: 401 }
    );
  }),

  http.get(`${API_URL}/v1/auth/me`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: mockUser,
    });
  }),
];
