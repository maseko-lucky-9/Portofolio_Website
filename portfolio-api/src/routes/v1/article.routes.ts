import { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { articleService } from '../../services/article.service.js';

export async function articleRoutes(app: FastifyInstance): Promise<void> {
  // List articles
  app.get('/', {
    schema: {
      description: 'Get all articles with optional filters',
      tags: ['Articles'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          featured: { type: 'string' },
          tag: { type: 'string' },
          search: { type: 'string' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            meta: { type: 'object' },
          },
        },
      },
    },
  }, async (request) => {
    const query = request.query as any;
    const result = await articleService.listArticles({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      status: query.status,
      featured: query.featured === 'true' ? true : query.featured === 'false' ? false : undefined,
      tag: query.tag,
      search: query.search,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    });
    return result;
  });

  // Get article by slug
  app.get('/:slug', {
    schema: {
      description: 'Get a single article by slug',
      tags: ['Articles'],
      params: {
        type: 'object',
        required: ['slug'],
        properties: { slug: { type: 'string' } },
      },
      response: {
        200: { type: 'object' },
      },
    },
  }, async (request) => {
    const { slug } = request.params as { slug: string };
    const article = await articleService.getArticleBySlug(slug);
    return article;
  });

  // Create article (admin only)
  app.post('/', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Create a new article (admin only)',
      tags: ['Articles'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['slug', 'title', 'content'],
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          content: { type: 'string' },
          excerpt: { type: 'string' },
          coverImage: { type: 'string' },
          featured: { type: 'boolean' },
          sortOrder: { type: 'number' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          metaTitle: { type: 'string' },
          metaDescription: { type: 'string' },
          canonicalUrl: { type: 'string' },
          tagIds: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        201: { type: 'object' },
      },
    },
  }, async (request, reply) => {
    const data = request.body as any;
    const user = (request as any).user;
    const article = await articleService.createArticle(data, user.id);
    return reply.code(201).send(article);
  });

  // Update article (admin only)
  app.put('/:id', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Update an article (admin only)',
      tags: ['Articles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      body: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          content: { type: 'string' },
          excerpt: { type: 'string' },
          coverImage: { type: 'string' },
          featured: { type: 'boolean' },
          sortOrder: { type: 'number' },
          status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          metaTitle: { type: 'string' },
          metaDescription: { type: 'string' },
          canonicalUrl: { type: 'string' },
          tagIds: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        200: { type: 'object' },
      },
    },
  }, async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const article = await articleService.updateArticle(id, data);
    return article;
  });

  // Delete article (admin only)
  app.delete('/:id', {
    preHandler: [authenticate, requireRole('ADMIN')],
    schema: {
      description: 'Delete an article (admin only)',
      tags: ['Articles'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      response: {
        204: { type: 'null' },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await articleService.deleteArticle(id);
    return reply.code(204).send();
  });
}
