import { FastifyInstance } from 'fastify';
import { healthRoutes } from './v1/health.routes.js';
import { authRoutes } from './v1/auth.routes.js';
import { projectRoutes } from './v1/project.routes.js';
import { articleRoutes } from './v1/article.routes.js';
import { tagRoutes } from './v1/tag.routes.js';
import { contactRoutes } from './v1/contact.routes.js';
import { analyticsRoutes } from './v1/analytics.routes.js';
import { adminRoutes } from './v1/admin.routes.js';
import { config } from '../config/index.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Root endpoint
  app.get('/', async () => ({
    success: true,
    data: {
      name: config.appName,
      version: '1.0.0',
      environment: config.nodeEnv,
      docs: `${config.appUrl}/api-docs`,
    },
  }));

  // API version prefix
  await app.register(
    async (api) => {
      // Register route modules
      await api.register(healthRoutes, { prefix: '/health' });
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(projectRoutes, { prefix: '/projects' });
      await api.register(articleRoutes, { prefix: '/articles' });
      await api.register(tagRoutes, { prefix: '/tags' });
      await api.register(contactRoutes, { prefix: '/contact' });
      await api.register(analyticsRoutes, { prefix: '/analytics' });
      await api.register(adminRoutes, { prefix: '/admin' });
    },
    { prefix: `/api/${config.apiVersion}` }
  );
}
