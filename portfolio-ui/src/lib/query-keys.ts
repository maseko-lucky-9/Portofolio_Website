/**
 * Query Key Factories
 * 
 * Provides consistent query keys across the application
 */

export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.projects.lists(), params] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.projects.details(), slug] as const,
    featured: () => [...queryKeys.projects.all, 'featured'] as const,
  },

  // Articles
  articles: {
    all: ['articles'] as const,
    lists: () => [...queryKeys.articles.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.articles.lists(), params] as const,
    details: () => [...queryKeys.articles.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.articles.details(), slug] as const,
    featured: () => [...queryKeys.articles.all, 'featured'] as const,
  },

  // Tags
  tags: {
    all: ['tags'] as const,
    popular: () => [...queryKeys.tags.all, 'popular'] as const,
  },

  // Auth
  auth: {
    user: () => ['auth', 'user'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    summary: (params?: Record<string, unknown>) =>
      [...queryKeys.analytics.all, 'summary', params] as const,
    overview: () => [...queryKeys.analytics.all, 'overview'] as const,
  },

  // Code Execution
  codeExecution: {
    languages: () => ['codeExecution', 'languages'] as const,
  },

  // Health
  health: {
    check: () => ['health', 'check'] as const,
  },
};
